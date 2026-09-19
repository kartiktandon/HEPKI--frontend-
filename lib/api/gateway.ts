import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { record, text, unwrap } from './models';

// Only customer features and provider onboarding are exposed. Admin routes are never proxied.
const rules: [RegExp, string[]][] = [
  [/^auth\/user\/(?:email\/(?:signup|verify-otp|login|forgot-password|reset-password|resend-verification)|(?:signup|login)\/(?:send-otp|verify-otp)|refresh-token|logout)$/, ['POST']],
  [/^provider\/auth\/(?:(?:signup|login)\/(?:send-otp|verify-otp)|refresh-token|logout)$/, ['POST']],
  [/^provider\/auth\/onboarding\/status$/, ['GET']],
  [/^provider\/auth\/onboarding\/step-[1-5]$/, ['POST']],
  [/^api\/v1\/provider\/kyc\/status$/, ['GET']],
  [/^api\/v1\/provider\/kyc\/upload-(?:aadhaar-front|aadhaar-back|pan|selfie)$/, ['POST']],
  [/^api\/v1\/public\/(?:cities|config\/(?:pricing|service-area)|content\/[a-z-]+|places\/(?:autocomplete|details))$/, ['GET']],
  [/^api\/v1\/user\/services(?:\/(?:popular|categories(?:\/[a-zA-Z0-9_-]+(?:\/services)?)?|[a-zA-Z0-9_-]+))?$/, ['GET']],
  [/^api\/v1\/user\/profile$/, ['GET', 'PUT']],
  [/^api\/v1\/user\/addresses(?:\/[a-zA-Z0-9_-]+)?$/, ['GET', 'POST', 'PUT', 'DELETE']],
  [/^api\/v1\/user\/addresses\/[a-zA-Z0-9_-]+\/set-default$/, ['PATCH']],
  [/^api\/v1\/user\/bookings$/, ['GET', 'POST']],
  [/^api\/v1\/user\/bookings\/[a-zA-Z0-9_-]+$/, ['GET']],
  [/^api\/v1\/user\/bookings\/[a-zA-Z0-9_-]+\/(?:invoice|status|status-history|provider-location)$/, ['GET']],
  [/^api\/v1\/user\/bookings\/[a-zA-Z0-9_-]+\/(?:cancel|reschedule|cancel-search)$/, ['POST']],
  [/^api\/v1\/user\/buddies$/, ['GET']],
  [/^api\/v1\/user\/payment\/(?:create-order|verify)$/, ['POST']],
  [/^api\/v1\/user\/payment\/status\/[a-zA-Z0-9_-]+$/, ['GET']],
  [/^api\/v1\/user\/packages$/, ['GET', 'POST']],
  [/^api\/v1\/user\/packages\/[a-zA-Z0-9_-]+$/, ['GET']],
  [/^api\/v1\/user\/packages\/[a-zA-Z0-9_-]+\/(?:cancel|change-professional)$/, ['POST']],
  [/^api\/v1\/user\/disputes$/, ['GET', 'POST']],
  [/^api\/v1\/user\/disputes\/[a-zA-Z0-9_-]+$/, ['GET']],
  [/^api\/v1\/user\/disputes\/[a-zA-Z0-9_-]+\/reply$/, ['POST']],
  [/^api\/v1\/user\/ratings\/(?:provider|service)\/[a-zA-Z0-9_-]+$/, ['GET']],
  [/^api\/v1\/user\/ratings\/top$/, ['GET']],
];
export function allowed(path: string, method: string) { return rules.some(([pattern, methods]) => pattern.test(path) && methods.includes(method)); }
function cookieName(role: string, token: string) { return `hb_${role}_${token}`; }
function tokens(payload: unknown) {
  const value = record(unwrap(payload));
  const outer = record(payload);
  const nested = record(value.tokens ?? outer.tokens);
  return { access: text(value.accessToken ?? value.token ?? nested.accessToken ?? outer.accessToken ?? outer.token), refresh: text(value.refreshToken ?? nested.refreshToken ?? outer.refreshToken) };
}
const tokenKeys = new Set(['accessToken', 'refreshToken', 'token', 'tokens']);
function stripTokens(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripTokens);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(record(value)).filter(([key]) => !tokenKeys.has(key)).map(([key, child]) => [key, stripTokens(child)]));
}
const rotating = new Map<string, Promise<{ status: number; payload: unknown }>>();
function sessionCookies(response: NextResponse, role: string, values: { access: string; refresh: string }, clear = false) {
  for (const key of ['access', 'refresh'] as const) {
    if (values[key] || clear) response.cookies.set(cookieName(role, key), clear ? '' : values[key], {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: clear ? 0 : 60 * 60 * 24 * 30,
    });
  }
}
function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });
}
function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  // Next can normalize nextUrl's hostname (e.g. 127.0.0.1 to localhost).
  // Compare against actual HTTP Host, Forwarded Host, or nextUrl origin.
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  const protocol = request.headers.get('x-forwarded-proto') === 'https' ? 'https:' : request.nextUrl.protocol;
  return origin === `${protocol}//${host}` || origin === request.nextUrl.origin;
}
export async function gateway(request: NextRequest, path: string) {
  if (!allowed(path, request.method)) return json({ error: 'Route not available.' }, 404);
  if (request.method !== 'GET' && (!sameOrigin(request) || request.headers.get('sec-fetch-site') === 'cross-site')) {
    return json({ error: 'Request origin is not allowed.' }, 403);
  }
  const role = path.startsWith('provider/') || path.startsWith('api/v1/provider/') ? 'provider' : 'user';
  const authPath = path.startsWith('auth/user/') || /^provider\/auth\/(signup|login|logout|refresh-token)/.test(path);
  const refresh = path.endsWith('/refresh-token');
  const logout = path.endsWith('/logout');
  const accessToken = request.cookies.get(cookieName(role, 'access'))?.value;
  const refreshToken = request.cookies.get(cookieName(role, 'refresh'))?.value;
  const publicPath = /^api\/v1\/(public\/|user\/services(?:\/|$)|user\/ratings\/)/.test(path);
  if (!authPath && !publicPath && !accessToken) return json({ error: 'Please log in to continue.', code: 'SESSION_REQUIRED' }, 401);
  try {
    const base = new URL(process.env.HEPKI_API_BASE_URL || 'https://hepki.verdicto.co.in');
    if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password) throw new Error('Invalid API base URL');
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (accessToken && !publicPath && !authPath) headers.Authorization = `Bearer ${accessToken}`;
    let body: BodyInit | undefined;
    if (request.method !== 'GET') {
      if (refresh || logout) {
        if (!refreshToken) {
          const response = json(logout ? { success: true } : { error: 'Please log in again.' }, logout ? 200 : 401);
          sessionCookies(response, role, { access: '', refresh: '' }, true);
          return response;
        }
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ refreshToken });
      } else if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
        if (Number(request.headers.get('content-length')) > 20 * 1024 * 1024) return json({ error: 'Use a file smaller than 20 MB.' }, 413);
        const form = await request.formData();
        const file = form.get('file');
        if (!file || typeof file === 'string' || file.size >= 20 * 1024 * 1024) return json({ error: 'Choose a file smaller than 20 MB.' }, 400);
        body = form;
      } else {
        const contentLength = Number(request.headers.get('content-length') || 0);
        if (contentLength > 2 * 1024 * 1024) return json({ error: 'Request body is too large.' }, 413);
        let parsed: unknown;
        try {
          parsed = await request.json();
        } catch {
          return json({ error: 'Invalid JSON body provided.' }, 400);
        }
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(parsed);
      }
    }
    const execute = async () => {
      const upstream = await fetch(new URL('/' + path + request.nextUrl.search, base), {
        method: request.method, headers, body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(25000),
      });
      if (path.endsWith('/invoice') && upstream.ok && upstream.headers.get('content-type')?.includes('application/pdf')) {
        return { status: upstream.status, payload: await upstream.arrayBuffer() };
      }
      if (upstream.status === 204 || upstream.headers.get('content-length') === '0') {
        return { status: 204, payload: {} };
      }
      let payload: unknown;
      try { payload = await upstream.json(); }
      catch {
        if (upstream.ok) return { status: upstream.status, payload: {} };
        return { status: upstream.status, payload: { error: upstream.status === 413 ? 'Use a file smaller than 20 MB.' : 'The API returned an unreadable response.' } };
      }
      return { status: upstream.status, payload };
    };
    let result;
    if (refresh) {
      const key = createHash('sha256').update(role + refreshToken).digest('hex');
      if (!rotating.has(key)) {
        const promise = execute();
        rotating.set(key, promise);
        // Coalesce simultaneous requests from tabs. Never retry a rotated token.
        void promise.finally(() => { const timer = setTimeout(() => rotating.delete(key), 30000); timer.unref(); }).catch(() => {});
      }
      result = await rotating.get(key)!;
    } else result = await execute();
    if (result.payload instanceof ArrayBuffer) return new NextResponse(result.payload, { headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store', 'Content-Disposition': 'attachment; filename="invoice.pdf"' } });
    const success = result.status >= 200 && result.status < 300 && record(result.payload).success !== false;
    const tokenValues = authPath ? tokens(result.payload) : { access: '', refresh: '' };
    const requiresSession = refresh || /(?:email\/login|(?:signup|login)\/verify-otp)$/.test(path);
    if (authPath && success && requiresSession && (!tokenValues.access || !tokenValues.refresh)) {
      const response = json({ error: 'The API did not return a complete login session. Please contact support.' }, 502);
      sessionCookies(response, role, { access: '', refresh: '' }, true);
      return response;
    }
    const response = json(authPath ? stripTokens(result.payload) : result.payload, result.status === 204 ? 200 : result.status);
    if (authPath && success && tokenValues.access) sessionCookies(response, role, tokenValues);
    if (logout || (refresh && (!success || !tokenValues.access))) sessionCookies(response, role, { access: '', refresh: '' }, true);
    return response;
  } catch {
    const response = json({ error: 'Cannot reach the API right now. Please try again.', code: 'UPSTREAM_UNAVAILABLE' }, 502);
    if (refresh || logout) sessionCookies(response, role, { access: '', refresh: '' }, true);
    return response;
  }
}

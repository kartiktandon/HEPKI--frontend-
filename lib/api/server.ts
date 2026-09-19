import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { record, text, unwrap, type RecordData } from './models';

/** Server reads go directly to the fixed upstream, never through our HTTP proxy. */
export async function serverGet(path: string, accessToken?: string): Promise<unknown> {
  if (!path.startsWith('/api/v1/') || path.includes('..') || path.includes('\\')) throw new Error('Invalid API path.');
  const base = new URL(process.env.HEPKI_API_BASE_URL || 'https://hepki.verdicto.co.in');
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password) throw new Error('Invalid API base URL.');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let response: Response;
  try {
    response = await fetch(new URL(path, base), { headers, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) });
  } catch { throw new Error('Cannot reach the service. Please try again.'); }
  let payload: unknown;
  try { payload = await response.json(); }
  catch { throw new Error('The service returned an unexpected response. Please try again.'); }
  const body = record(payload);
  if (!response.ok || body.success === false) throw new Error(text(body.error ?? body.message, 'The request failed. Please try again.'));
  return payload;
}

export type InitialSession = { user: RecordData | null; provider: boolean };

// React cache deduplicates within one render request, not between users.
export const getInitialSession = cache(async (): Promise<InitialSession | undefined> => {
  const jar = cookies();
  const access = jar.get('hb_user_access')?.value;
  const provider = !!jar.get('hb_provider_access')?.value;
  if (!access) return { user: null, provider };
  try {
    const data = record(unwrap(await serverGet('/api/v1/user/profile', access)));
    const profile = record(data.user ?? data);
    // Only display fields enter the RSC response. Never serialize auth cookies/tokens.
    const user = Object.fromEntries(['_id', 'id', 'fullName', 'email', 'mobileNumber'].filter(key => typeof profile[key] === 'string').map(key => [key, profile[key]]));
    return { user, provider };
  } catch {
    // Server Components cannot rotate cookies. Preserve client refresh/retry on expiry.
    return undefined;
  }
});

export async function initialUserResource(path: string) {
  const session = await getInitialSession();
  if (!session?.user) return undefined;
  try { return { path, data: await serverGet(path, cookies().get('hb_user_access')?.value) }; }
  catch { return undefined; } // Existing client error/retry/refresh flow handles failures.
}

import { record, text } from './models';
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}
type Options = { method?: string; body?: unknown; signal?: AbortSignal; role?: 'user' | 'provider'; blob?: boolean };
const refreshes: Partial<Record<'user' | 'provider', Promise<void>>> = {};
async function parse(response: Response): Promise<unknown> {
  if (response.status === 204) return {};
  if (!response.headers.get('content-type')?.includes('json')) {
    throw new ApiError(response.status === 413 ? 'This file is too large. Use a file smaller than 20 MB.' : 'The service returned an unexpected response. Please try again.', response.status);
  }
  return response.json();
}
function failure(payload: unknown, status: number) {
  const data = record(payload);
  return new ApiError(text(data.error ?? data.message, 'The request failed. Please try again.'), status, text(data.code));
}
async function refresh(role: 'user' | 'provider') {
  if (!refreshes[role]) {
    refreshes[role] = (async () => {
      const response = await fetch('/api/backend/' + (role === 'user' ? 'auth/user' : 'provider/auth') + '/refresh-token', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      const data = await parse(response);
      if (!response.ok) {
        window.dispatchEvent(new Event('session-changed'));
        throw failure(data, response.status);
      }
    })().finally(() => { delete refreshes[role]; });
  }
  return refreshes[role];
}
export async function api<T = unknown>(path: string, options: Options = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = {};
  const form = options.body instanceof FormData;
  if (options.body !== undefined && !form) headers['Content-Type'] = 'application/json';
  let response: Response;
  try {
    response = await fetch('/api/backend' + path, { method: options.method ?? 'GET', headers,
      credentials: 'same-origin', cache: 'no-store', signal: options.signal,
      body: form ? options.body as FormData : options.body === undefined ? undefined : JSON.stringify(options.body) });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the service. Check your connection and try again.', 0);
  }
  if (options.blob && response.ok) return await response.blob() as T;
  const payload = await parse(response);
  const data = record(payload);
  // Auth attempts must never trigger refresh. Only protected resource requests retry once.
  if (response.status === 401 && data.code && !retried && (path.startsWith('/api/v1/') || path.startsWith('/provider/auth/onboarding/')) && options.role) {
    await refresh(options.role);
    return api<T>(path, options, true);
  }
  if (!response.ok || data.success === false) throw failure(payload, response.status);
  return payload as T;
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

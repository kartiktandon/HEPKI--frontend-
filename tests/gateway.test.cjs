require('./register.cjs');
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest } = require('next/server');
const { gateway, allowed } = require('../lib/api/gateway.ts');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
function request(path, options = {}) {
  return new NextRequest('http://localhost:3000/api/backend/' + path, { method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json', ...options.headers }, body: '{}', ...options, ...(options.headers ? { headers: { origin: 'http://localhost:3000', 'content-type': 'application/json', ...options.headers } } : {}) });
}
const json = (body, status = 200) => Response.json(body, { status });
test('gateway restricts admin, off-origin URLs and undocumented routes', () => {
  assert.equal(allowed('api/v1/admin/users', 'GET'), false);
  assert.equal(allowed('https://evil.example', 'GET'), false);
  assert.equal(allowed('api/v1/user/services/../../admin', 'GET'), false);
  assert.equal(allowed('api/v1/user/services', 'POST'), false);
  assert.equal(allowed('api/v1/user/bookings', 'POST'), true);
});
test('cross-origin mutations never reach upstream', async () => {
  global.fetch = () => { throw new Error('Must not run'); };
  const res = await gateway(request('auth/user/email/login', { headers: { origin: 'https://evil.example' } }), 'auth/user/email/login');
  assert.equal(res.status, 403);
});
test('login stores tokens only in HttpOnly cookies and redacts nested tokens', async () => {
  global.fetch = async () => json({ success: true, accessToken: 'access-secret', refreshToken: 'refresh-secret', data: { user: { fullName: 'Test' } } });
  const res = await gateway(request('auth/user/email/login'), 'auth/user/email/login');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(res.headers.get('set-cookie'), /SameSite=lax/i);
  assert.equal(res.cookies.get('hb_user_access').value, 'access-secret');
  assert.equal(JSON.stringify(await res.json()).includes('secret'), false);
});
test('incomplete successful login cannot masquerade as an established session', async () => {
  global.fetch = async () => json({ success: true, data: { user: {} } });
  const res = await gateway(request('auth/user/email/login'), 'auth/user/email/login');
  assert.equal(res.status, 502);
});
test('customer and provider tokens remain separate', async () => {
  let auth;
  global.fetch = async (_url, init) => { auth = init.headers.Authorization; return json({ success: true, data: {} }); };
  const req = new NextRequest('http://localhost:3000/api/backend/api/v1/user/profile', { headers: { cookie: 'hb_user_access=user-token; hb_provider_access=provider-token' } });
  await gateway(req, 'api/v1/user/profile'); assert.equal(auth, 'Bearer user-token');
  await gateway(req, 'provider/auth/onboarding/status'); assert.equal(auth, 'Bearer provider-token');
});
test('missing session never calls protected upstream', async () => {
  global.fetch = () => { throw new Error('Must not run'); };
  const req = new NextRequest('http://localhost:3000/api/backend/api/v1/user/bookings');
  const res = await gateway(req, 'api/v1/user/bookings');
  assert.equal(res.status, 401); assert.equal((await res.json()).code, 'SESSION_REQUIRED');
});
test('concurrent refreshes share one request and use cookie refresh token', async () => {
  let calls = 0;
  global.fetch = async (_url, init) => { calls++; assert.deepEqual(JSON.parse(init.body), { refreshToken: 'rotate-test' }); await new Promise(resolve => setTimeout(resolve, 20)); return json({ success: true, data: { accessToken: 'new-access', refreshToken: 'new-refresh' } }); };
  const results = await Promise.all(Array.from({ length: 5 }, () => gateway(request('auth/user/refresh-token', { headers: { cookie: 'hb_user_refresh=rotate-test' } }), 'auth/user/refresh-token')));
  assert.equal(calls, 1);
  for (const res of results) { assert.equal(res.status, 200); assert.equal(res.cookies.get('hb_user_refresh').value, 'new-refresh'); }
});
test('failed refresh clears cookies and is not retried', async () => {
  let calls = 0;
  global.fetch = async () => { calls++; return json({ error: 'Expired refresh token' }, 401); };
  const res = await gateway(request('auth/user/refresh-token', { headers: { cookie: 'hb_user_refresh=expired-test' } }), 'auth/user/refresh-token');
  assert.equal(calls, 1); assert.equal(res.status, 401); assert.equal(res.cookies.get('hb_user_access').value, '');
});
test('non-JSON errors and even HTML success responses become useful errors', async () => {
  global.fetch = async () => new Response('<html>too large</html>', { status: 413 });
  let res = await gateway(request('auth/user/email/login'), 'auth/user/email/login');
  assert.equal(res.status, 413); assert.match((await res.json()).error, /20 MB/);
  global.fetch = async () => new Response('<html>maintenance</html>');
  res = await gateway(request('auth/user/email/login'), 'auth/user/email/login'); assert.equal(res.status, 502);
});
test('JSON booking payload forwards the exact selected service and address', async () => {
  const payload = { serviceId: 'service-real-id', addressId: 'address-real-id', immediate: false, scheduledDate: '2027-01-02', timeSlot: '10:00', paymentMethod: 'online' };
  global.fetch = async (_url, init) => { assert.deepEqual(JSON.parse(init.body), payload); assert.equal(init.headers.Authorization, 'Bearer customer'); return json({ success: true, data: { _id: 'booking' } }, 201); };
  const res = await gateway(request('api/v1/user/bookings', { headers: { cookie: 'hb_user_access=customer' }, body: JSON.stringify(payload) }), 'api/v1/user/bookings');
  assert.equal(res.status, 201);
});
test('origin check accepts actual Host when Next normalizes the URL hostname', async () => {
  global.fetch = async () => json({ success: true, accessToken: 'access', refreshToken: 'refresh' });
  const req = request('auth/user/email/login', { headers: { host: '127.0.0.1:3001', origin: 'http://127.0.0.1:3001' } });
  const response = await gateway(req, 'auth/user/email/login'); assert.equal(response.status, 200);
});
test('recursive auth redaction preserves account data and removes tokens at every depth', async () => {
  global.fetch = async () => json({ success: true, data: {
    tokens: { accessToken: 'access-secret', refreshToken: 'refresh-secret' },
    user: { fullName: 'Customer', nested: [{ token: 'nested-secret', status: 'active' }] },
  } });
  const response = await gateway(request('auth/user/email/login'), 'auth/user/email/login');
  assert.equal(response.cookies.get('hb_user_access').value, 'access-secret');
  assert.deepEqual(await response.json(), { success: true, data: { user: { fullName: 'Customer', nested: [{ status: 'active' }] } } });
});
test('gateway rejects JSON bodies larger than 2 MB with 413', async () => {
  const req = request('auth/user/email/login', { headers: { 'content-length': String(3 * 1024 * 1024) } });
  const res = await gateway(req, 'auth/user/email/login');
  assert.equal(res.status, 413);
});
test('gateway cleanly returns 200/204 on empty upstream success without throwing 502', async () => {
  global.fetch = async () => new Response(null, { status: 204 });
  const req = request('api/v1/user/bookings/b1/cancel', { headers: { cookie: 'hb_user_access=token' } });
  const res = await gateway(req, 'api/v1/user/bookings/b1/cancel');
  assert.equal(res.status, 200);
});

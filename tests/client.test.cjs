require('./register.cjs');
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { api } = require('../lib/api/client.ts');
const originalFetch = global.fetch;
global.window = { dispatchEvent() {} };
afterEach(() => { global.fetch = originalFetch; });
test('concurrent expired requests refresh once and then retry', async () => {
  let refreshed = false, refreshCalls = 0, resourceCalls = 0;
  global.fetch = async url => {
    if (url.endsWith('refresh-token')) { refreshCalls++; await new Promise(resolve => setTimeout(resolve, 15)); refreshed = true; return Response.json({ success: true }); }
    resourceCalls++; return refreshed ? Response.json({ success: true, data: [] }) : Response.json({ error: 'Expired', code: 'TOKEN_EXPIRED' }, { status: 401 });
  };
  await Promise.all(Array.from({ length: 5 }, () => api('/api/v1/user/bookings', { role: 'user' })));
  assert.equal(refreshCalls, 1); assert.equal(resourceCalls, 10);
});
test('failed refresh is never retried and original write is not repeated', async () => {
  let refreshCalls = 0, writes = 0;
  global.fetch = async url => { if (url.endsWith('refresh-token')) { refreshCalls++; return Response.json({ error: 'Session expired' }, { status: 401 }); } writes++; return Response.json({ code: 'TOKEN_EXPIRED' }, { status: 401 }); };
  await assert.rejects(api('/api/v1/user/bookings', { role: 'user', method: 'POST', body: {} }), /Session expired/);
  assert.equal(refreshCalls, 1); assert.equal(writes, 1);
});
test('login failures do not refresh; rate limit messages survive', async () => {
  let calls = 0;
  global.fetch = async () => { calls++; return Response.json({ error: 'Wrong password', code: 'INVALID_LOGIN' }, { status: 401 }); };
  await assert.rejects(api('/auth/user/email/login', { method: 'POST', body: {} }), /Wrong password/); assert.equal(calls, 1);
  global.fetch = async () => Response.json({ success: false, message: 'Too many requests, please try again later' }, { status: 429 });
  await assert.rejects(api('/auth/user/login/send-otp', { method: 'POST', body: {} }), /Too many requests/);
});
test('provider onboarding uses provider refresh instead of customer refresh', async () => {
  let refreshed = false;
  global.fetch = async url => { if (url.includes('refresh-token')) { assert.match(url, /provider\/auth\/refresh-token$/); refreshed = true; return Response.json({ success: true }); } return refreshed ? Response.json({ success: true }) : Response.json({ code: 'EXPIRED' }, { status: 401 }); };
  await api('/provider/auth/onboarding/step-1', { role: 'provider', method: 'POST', body: {} });
});

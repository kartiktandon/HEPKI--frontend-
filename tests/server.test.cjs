require('./register.cjs');
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
// Replace Next's request context only for these isolated server transport tests.
let jar = {};
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (name === 'server-only') return {};
  if (name === 'next/headers') return { cookies: () => ({ get: name => jar[name] ? { value: jar[name] } : undefined }) };
  if (name === 'react') return { cache: fn => fn };
  return originalLoad.call(this, name, ...args);
};
const { serverGet, getInitialSession, initialUserResource } = require('../lib/api/server.ts');
Module._load = originalLoad;
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jar = {}; });

test('SSR reads use uncached GETs with server-only credentials and reject alternate origins', async () => {
  global.fetch = async (url, options) => {
    assert.equal(url.origin, 'https://hepki.verdicto.co.in');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer private-access');
    return Response.json({ data: { fullName: 'Customer' } });
  };
  await serverGet('/api/v1/user/profile', 'private-access');
  await assert.rejects(serverGet('https://example.test/api/v1/user/profile'), /Invalid API path/);
  await assert.rejects(serverGet('/api/v1/../auth'), /Invalid API path/);
});

test('anonymous SSR does not fetch private data', async () => {
  global.fetch = () => { throw new Error('Must not fetch'); };
  assert.deepEqual(await getInitialSession(), { user: null, provider: false });
  assert.equal(await initialUserResource('/api/v1/user/addresses'), undefined);
});

test('initial session serializes only display fields, never credentials', async () => {
  jar = { hb_user_access: 'private-access', hb_user_refresh: 'private-refresh' };
  global.fetch = async () => Response.json({ data: { fullName: 'Customer', email: 'customer@example.test', accessToken: 'secret', refreshToken: 'secret', passwordHash: 'secret' } });
  assert.deepEqual(await getInitialSession(), { user: { fullName: 'Customer', email: 'customer@example.test' }, provider: false });
});

test('expired SSR session falls back without rotating tokens or leaking backend errors', async () => {
  jar = { hb_user_access: 'expired', hb_user_refresh: 'refresh' };
  let calls = 0;
  global.fetch = async url => { calls++; assert.equal(url.pathname, '/api/v1/user/profile'); return Response.json({ error: 'Expired', code: 'TOKEN_EXPIRED' }, { status: 401 }); };
  assert.equal(await getInitialSession(), undefined);
  assert.equal(calls, 1);
});

test('server reads preserve upstream errors and handle non-JSON/network failures', async () => {
  global.fetch = async () => Response.json({ error: 'Not found' }, { status: 404 });
  await assert.rejects(serverGet('/api/v1/public/content/contact'), /Not found/);
  global.fetch = async () => new Response('<html>Down</html>', { status: 502 });
  await assert.rejects(serverGet('/api/v1/public/content/contact'), /unexpected response/);
  global.fetch = async () => { throw new Error('Network error'); };
  await assert.rejects(serverGet('/api/v1/public/content/contact'), /Cannot reach/);
});

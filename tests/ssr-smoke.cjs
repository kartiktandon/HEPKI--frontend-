// Run with tests/mock-backend.cjs and a Next instance pointed at that fixture on port 3002.
// Both URLs are deliberately fixed to loopback: this test must never write to production.
const assert = require('node:assert/strict');
const app = 'http://127.0.0.1:3002';
const token = 'local-qa-token';
function visibleMarkup(html) { return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''); }
async function page(path, authenticated = false) {
  const response = await fetch(app + path, { headers: authenticated ? { Cookie: `hb_user_access=${token}` } : {} });
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.ok(!html.includes(token), `${path} leaked an access token`);
  return { markup: visibleMarkup(html), headers: response.headers };
}
(async () => {
  const seed = await fetch('http://127.0.0.1:5009/api/v1/user/bookings', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceId: 'qa-service', addressId: 'qa-address', immediate: true, paymentMethod: 'cod' }),
  }).then(response => response.json());
  const bookingId = seed.data._id;
  for (const path of ['/', '/categories']) {
    const { markup } = await page(path);
    assert.ok(markup.includes('<h3>Test companionship</h3>'), `${path} omitted SSR category markup`);
  }
  const account = await page('/account', true);
  assert.ok(account.markup.includes('value="QA User"'), 'Profile missing from server HTML');
  assert.ok(account.markup.includes('Local test address'), 'Address missing from server HTML');
  assert.match(account.headers.get('cache-control'), /private|no-store/, 'Private HTML must not be shared-cached');
  assert.ok((await page('/bookings', true)).markup.includes(bookingId), 'Booking list missing from server HTML');
  assert.ok((await page('/bookings/' + bookingId, true)).markup.includes('Test companion visit'), 'Booking detail missing from server HTML');
  const guest = await page('/account');
  assert.ok(guest.markup.includes('Log in to continue'));
  assert.ok(!guest.markup.includes('QA User') && !guest.markup.includes('Local test address'), 'Private data leaked to guest');
  assert.ok((await page('/contact')).markup.includes('Contact information is currently unavailable.'), 'Error fallback absent');
  console.log('SSR smoke passed: catalog, account, addresses, bookings, details, guest isolation, no token serialization, error fallback.');
})().catch(error => { console.error(error); process.exitCode = 1; });

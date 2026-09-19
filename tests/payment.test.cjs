require('./register.cjs');
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { payBooking } = require('../lib/api/payment.ts');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
test('checkout uses server key and paise, then waits for server signature verification', async () => {
  const calls = []; let checkout;
  global.window = { Razorpay: class { constructor(options) { checkout = options; } on() {} open() { checkout.handler({ razorpay_order_id: 'order', razorpay_payment_id: 'payment', razorpay_signature: 'signature' }); } } };
  global.fetch = async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return Response.json(url.endsWith('create-order') ? { success: true, data: { keyId: 'server-key', orderId: 'order', amount: 17582, currency: 'INR' } } : { success: true }); };
  await payBooking('booking');
  assert.equal(checkout.key, 'server-key'); assert.equal(checkout.amount, 17582);
  assert.deepEqual(calls[1].body, { bookingId: 'booking', razorpayOrderId: 'order', razorpayPaymentId: 'payment', razorpaySignature: 'signature' });
});
test('a successful client callback cannot override a rejected signature', async () => {
  let checkout;
  global.window = { Razorpay: class { constructor(options) { checkout = options; } on() {} open() { checkout.handler({ razorpay_order_id: 'order', razorpay_payment_id: 'payment', razorpay_signature: 'bad' }); } } };
  global.fetch = async url => Response.json(url.endsWith('create-order') ? { data: { keyId: 'key', orderId: 'order', amount: 100, currency: 'INR' } } : { error: 'Invalid payment signature' }, { status: url.endsWith('create-order') ? 200 : 400 });
  await assert.rejects(payBooking('booking'), /Invalid payment signature/);
});
test('dismissed checkout never submits a payment verification', async () => {
  let checkout, calls = 0;
  global.window = { Razorpay: class { constructor(options) { checkout = options; } on() {} open() { checkout.modal.ondismiss(); } } };
  global.fetch = async () => { calls++; return Response.json({ data: { keyId: 'key', orderId: 'order', amount: 100 } }); };
  await assert.rejects(payBooking('booking'), /Checkout closed/); assert.equal(calls, 1);
});

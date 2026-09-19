require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { record, unwrap, list, id, money, dateLabel, label, category, servicePrice } = require('../lib/api/models.ts');

test('API readers preserve direct, wrapped and named-list response formats', () => {
  const items = [{ _id: 'one' }, { id: 'two' }];
  assert.deepEqual(list(items), items);
  assert.deepEqual(list({ success: true, data: items }), items);
  assert.deepEqual(list({ data: { services: items } }, 'services'), items);
  assert.deepEqual(list({ data: { items } }), items);
  assert.deepEqual(list(null), []);
  assert.deepEqual(record([]), {});
  assert.equal(unwrap({ data: 0 }), 0);
  assert.equal(id('one'), 'one');
  assert.equal(id({ _id: 'one', id: 'two' }), 'one');
  assert.equal(id({ id: 'two' }), 'two');
  assert.equal(id(null), '');
});

test('reused currency formatter preserves INR output and rejects missing/invalid totals', () => {
  for (const amount of [0, 1, 99.95, 1000000, -10]) {
    assert.equal(money(amount), new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount));
  }
  for (const value of [null, undefined, '100', NaN, Infinity]) assert.equal(money(value), 'Not available');
});

test('unknown statuses and unscheduled bookings retain their display behavior', () => {
  assert.equal(label('new_backend_status'), 'New Backend Status');
  assert.equal(label('cod'), 'Cash on delivery');
  assert.equal(dateLabel(undefined), 'Next available');
  assert.equal(dateLabel('2026-09-18T10:00:00Z'), '2026-09-18');
});

test('category mapping retains primary image, fallback and service-pricing precedence', () => {
  const result = category({ _id: 'category', categoryName: 'Care', hourlyRate: 149, images: [{ url: 'https://example.test/other.png' }, { url: 'https://example.test/primary.png', isPrimary: true }] });
  assert.equal(result.image, 'https://example.test/primary.png');
  assert.equal(result.rate, 149);
  assert.equal(category({}).image, '/assets/welcome-hero.png');
  assert.equal(servicePrice({ pricingType: 'hourly', hourlyRate: 0, pricing: { retailPrice: 200 } }), 0);
  assert.equal(servicePrice({ pricing: { finalPrice: 150, retailPrice: 200 } }), 150);
});

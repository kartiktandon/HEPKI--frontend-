require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { record, unwrap, list, id, money, dateLabel, label, category, servicePrice, bookingDisplayStatus, bookingSchedule } = require('../lib/api/models.ts');

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
  assert.equal(dateLabel(''), 'Next available');
  assert.equal(dateLabel('   ', 'Schedule not available'), 'Schedule not available');
  assert.equal(dateLabel('2026-09-18T10:00:00Z'), '2026-09-18');
});

test('unpaid online bookings are not presented as booked or confirmed', () => {
  assert.equal(bookingDisplayStatus({ bookingStatus: 'booked', paymentMethod: 'online' }), 'payment_pending');
  assert.equal(bookingDisplayStatus({ bookingStatus: 'confirmed', payment: { method: 'online', status: 'pending' } }), 'payment_pending');
  assert.equal(bookingDisplayStatus({ bookingStatus: 'confirmed', payment: { method: 'online' } }, { status: 'pending' }), 'payment_pending');
  assert.equal(bookingDisplayStatus({ bookingStatus: 'confirmed', paymentMethod: 'online' }, { status: 'failed', method: 'online' }), 'payment_failed');
  assert.equal(bookingDisplayStatus({ bookingStatus: 'confirmed', paymentMethod: 'online' }, { status: 'paid', method: 'online' }), 'confirmed');
  assert.equal(bookingDisplayStatus({ bookingStatus: 'confirmed', paymentMethod: 'cod', paymentStatus: 'pending' }), 'confirmed');
  assert.equal(bookingDisplayStatus({ bookingStatus: 'cancelled_by_user', paymentMethod: 'online', paymentStatus: 'pending' }), 'cancelled_by_user');
});

test('booking schedule reads the selected date from supported API response shapes', () => {
  assert.deepEqual(bookingSchedule({ scheduledDate: '2027-01-02', timeSlot: '10:00' }), { date: '2027-01-02', time: '10:00' });
  assert.deepEqual(bookingSchedule({ bookingDate: '2027-02-03', scheduledTime: '11:30' }), { date: '2027-02-03', time: '11:30' });
  assert.deepEqual(bookingSchedule({ schedule: { date: '2027-03-04', time: '12:45' } }), { date: '2027-03-04', time: '12:45' });
  assert.deepEqual(bookingSchedule({ scheduleDate: '2027-04-05', serviceTime: '13:15' }), { date: '2027-04-05', time: '13:15' });
  assert.deepEqual(bookingSchedule({ scheduleDetails: { scheduledDate: '2027-05-06', timeSlot: '14:30' } }), { date: '2027-05-06', time: '14:30' });
  assert.deepEqual(bookingSchedule({ scheduledAt: '2027-06-07T15:45:00.000Z' }), { date: '2027-06-07', time: '15:45' });
  assert.deepEqual(bookingSchedule({ bookingSchedule: { scheduledFor: '2027-07-08 16:00' } }), { date: '2027-07-08', time: '16:00' });
  assert.deepEqual(bookingSchedule({ scheduledDate: '', timeSlot: '', scheduleDetails: { scheduledDate: '2027-08-09', timeSlot: '17:15' } }), { date: '2027-08-09', time: '17:15' });
  assert.deepEqual(bookingSchedule({ scheduledDate: '2027-09-10', timeSlot: { startTime: '18:30', endTime: '19:30' } }), { date: '2027-09-10', time: '18:30' });
  assert.deepEqual(bookingSchedule({}), { date: '', time: '' });
});

test('category mapping retains primary image, fallback and service-pricing precedence', () => {
  const result = category({ _id: 'category', categoryName: 'Care', hourlyRate: 149, images: [{ url: 'https://example.test/other.png' }, { url: 'https://example.test/primary.png', isPrimary: true }] });
  assert.equal(result.image, 'https://example.test/primary.png');
  assert.equal(result.rate, 149);
  assert.equal(category({}).image, '/assets/welcome-hero.png');
  assert.equal(servicePrice({ pricingType: 'hourly', hourlyRate: 0, pricing: { retailPrice: 200 } }), 0);
  assert.equal(servicePrice({ pricing: { finalPrice: 150, retailPrice: 200 } }), 150);
});

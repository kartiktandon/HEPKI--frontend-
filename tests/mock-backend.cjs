// Local-only fixture API for browser QA. Never proxies or contacts a real backend.
const http = require('node:http');
const bookings = [];
const category = { _id: 'qa-category', categoryName: 'Test companionship', hourlyRate: 100 };
const service = { _id: 'qa-service', serviceName: 'Test companion visit', categoryId: category, description: 'Local test fixture — no real service.', pricingType: 'hourly', hourlyRate: 100, minDurationHours: 1, allowedBookingTypes: { onTheSpot: true, preBook: true, monthlyPackage: true } };
const addresses = [{ _id: 'qa-address', nickname: 'Test address', formattedAddress: 'Local test address', city: 'Test city', isDefault: true }];
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost'); const path = url.pathname;
  let raw = ''; for await (const chunk of req) raw += chunk;
  let body; try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
  const send = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  const ok = data => send({ success: true, data });
  console.log(req.method, path);
  if (path === '/auth/user/email/login') return ok({ accessToken: 'local-qa-token', refreshToken: 'local-qa-refresh', user: { fullName: 'QA User' } });
  if (path === '/auth/user/logout') return ok({});
  if (path === '/api/v1/user/services/categories') return ok([category]);
  if (path === '/api/v1/user/services/categories/qa-category/services') return ok({ category, services: [service] });
  if (path === '/api/v1/user/services/popular' || path === '/api/v1/user/services') return ok([service]);
  if (req.headers.authorization !== 'Bearer local-qa-token') return send({ error: 'Test authentication required' }, 401);
  if (path === '/api/v1/user/profile') return ok({ _id: 'qa-user', fullName: 'QA User', email: 'qa@example.test', mobileNumber: '0000000000' });
  if (path === '/api/v1/user/addresses') {
    if (req.method === 'POST') { const address = { _id: `qa-address-${addresses.length}`, ...body }; addresses.push(address); return ok(address); }
    return ok(addresses);
  }
  if (path === '/api/v1/user/packages') return ok([]);
  if (path === '/api/v1/user/bookings') {
    if (req.method === 'POST') {
      if (body.serviceId !== service._id || !addresses.some(a => a._id === body.addressId)) return send({ error: 'Wrong service or address' }, 400);
      const booking = { _id: `qa-booking-${bookings.length + 1}`, ...body, serviceId: service, addressId: addresses.find(a => a._id === body.addressId), bookingStatus: 'pending', payment: { method: body.paymentMethod, status: 'pending', amount: 118 }, totalAmount: 118 };
      bookings.push(booking); return ok(booking);
    }
    return send({ success: true, data: bookings, pagination: { page: 1, hasNext: false } });
  }
  if (path.startsWith('/api/v1/user/payment/status/')) return ok(bookings.find(b => b._id === path.split('/').pop())?.payment || {});
  if (path.startsWith('/api/v1/user/bookings/')) {
    const booking = bookings.find(b => b._id === path.split('/')[5]);
    if (!booking) return send({ error: 'Not found' }, 404);
    if (path.endsWith('/cancel')) booking.bookingStatus = 'cancelled_by_user';
    if (path.endsWith('/reschedule')) { booking.scheduledDate = body.scheduledDate; booking.timeSlot = body.timeSlot; }
    return ok(booking);
  }
  send({ error: 'No fixture for this endpoint' }, 404);
}).listen(5009, '127.0.0.1', () => console.log('Local fixture API on http://127.0.0.1:5009'));

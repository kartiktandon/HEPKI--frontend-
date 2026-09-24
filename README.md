# Hepki Web

Next.js customer website connected to the Hepki API documented in the September 18, 2026 API bundle.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3001. The default upstream is `https://hepki.verdicto.co.in`.
To change it, copy `.env.example` to `.env.local`, set `HEPKI_API_BASE_URL`, and restart Next.js.
This is a **server-only** setting. Never put access tokens, refresh tokens, Razorpay secrets or admin credentials in `NEXT_PUBLIC_*` variables.

The default API is production. Submitting forms can create real accounts, bookings, applications and payments. Development does not silently switch to mock data.

## Connected screens

- Home/categories: real category catalog, images and rates, with loading/error/empty states.
- Authentication: mobile OTP login/signup, resend cooldowns, logout and token refresh.
- Account: profile updates and saved address creation/listing.
- Booking: category services, server-supported instant/prebook/monthly options, service address, booking/package creation, promo code and cash/online payment choices. The server assigns the Buddy; there is no unsupported client-side Buddy selection.
- Payments: server-generated Razorpay key/order/paise amount, server signature verification, payment-status polling and payment recovery on saved booking details. Checkout dismissal never marks a booking as paid.
- My Bookings: paginated bookings/packages, booking details, 15-second detail/payment polling, cancellation, rescheduling, invoice download and booking support requests.
- Buddy profiles: public provider reviews from the API; no fabricated profiles or reviews.
- Become a Buddy: separate provider OTP session, onboarding steps, service selection, location/bank details, KYC uploads and application submission.
- Contact: public contact content when configured, with a link to booking-specific support. There is no documented general contact-message endpoint.

The website does not expose admin APIs, provider payouts or provider job-management APIs. These are separate applications/roles in the supplied docs.

## Sessions and deployment

Interactive browser requests call the same-origin `/api/backend/*` gateway. Initial page reads run directly on the server through `lib/api/server.ts`. The server forwards only allowlisted endpoint/method combinations and sends the appropriate user/provider Bearer token. Auth tokens are removed from JSON responses and stored in separate HttpOnly, SameSite=Lax cookies (Secure in production). Mutation requests require a matching Origin. API responses are not cached. No token is stored in localStorage.

Expired protected calls with a `401` code refresh once, then retry once. Concurrent refreshes are serialized in each browser runtime and coalesced on the server for 30 seconds, including failures. The server refresh cache is process-local: deployments with multiple instances must use sticky session routing or a shared refresh coordinator to guarantee single rotation across concurrent tabs/instances.

The server gateway means browser REST CORS allowlisting is not required for these requests. Next.js must be deployed with server/route-handler support and outbound access to the upstream API; a static export is not supported. If Socket.io is added later, its browser origin must still be allowlisted separately. Current live updates use REST polling, paused while the page is hidden.

## Verification

```bash
npm test
npm run typecheck
npm run build
```

Development uses `.next-dev`; production build/start use `.next`. This keeps builds from overwriting development assets. `npm run dev` explicitly uses port 3001 and fails if it is occupied instead of silently starting a second server. For another development instance, use a separate `NEXT_DIST_DIR` as shown in the isolated QA commands below.

Automated tests cover endpoint allowlisting, CSRF checks, HttpOnly token handling/redaction, role isolation, incomplete sessions, rotating-token concurrency/failures, payload forwarding, non-JSON errors, and payment verification/dismissal.

For isolated browser QA (no production requests), use two terminals:

```bash
node tests/mock-backend.cjs
```

```bash
HEPKI_API_BASE_URL=http://127.0.0.1:5009 NEXT_DIST_DIR=.next-test npm run dev -- --port 3002
```

Open **http://127.0.0.1:3002** (separate hostname from the production-connected localhost session). Use `qa@example.test` and any nonempty password. The fixture accepts that session locally and supplies a test category, service and address; create a cash booking, inspect details, reschedule/cancel, and log out. The fixture has no external network access and no Razorpay checkout. Stop both test processes afterward. Mock tests validate our implementation, not undocumented backend schemas.

## Backend contract gaps and remaining live checks

The bundle lists field names but does not provide request types, required fields, response examples for authenticated resources, or controller source. No test account or staging API was supplied. Public categories and category services were checked against the live API. Authenticated writes, actual OTP delivery, KYC and real payments still require an account-driven live acceptance test.

The following mappings are isolated in the UI/API modules and need confirmation against actual authenticated responses:

- Address `location`: GeoJSON `{ type: 'Point', coordinates: [longitude, latitude] }`; address types `home`, `work`, `other`.
- Prebook `scheduledDate`: `YYYY-MM-DD`; `timeSlot`: `HH:mm`. Single-service bookings send the documented `serviceId`; no undocumented top-level duration field is sent.
- Monthly `month`: `YYYY-MM`; `recurringDays`: numeric weekdays (Sunday = 0); `sessionTime`: `HH:mm`. Packages are requested by category with `sessionDurationHours` and `genderPreference: 'any'`. The docs do not describe package payment verification; the UI shows saved package status and does not claim a monthly package was paid.
- Onboarding `servicesOffered`: array of service IDs. Provider-type onboarding has no documented body and is not guessed; if the server requires that step, its contract is needed. The server decides whether all requirements are satisfied before final submission.
- Booking support `category`: supplied by the user; the documentation does not give an enum.
- Public content key `contact` currently returns 404 on production; configure that content or provide the actual key to show contact details.
- Token extraction accepts `accessToken`/`token` and `refreshToken` at the response root, inside `data`, or in `tokens`. A login that does not return a complete token pair fails visibly rather than pretending the user is signed in.
- Booking detail/pricing, provider review and onboarding status response fields need authenticated/example-response confirmation. Unknown statuses render neutrally; missing monetary values are never presented as a made-up total.

No production account, booking, payment, support ticket or provider application was created during implementation.

## Server rendering

Initial catalog, contact and Buddy review content is rendered by Server Components. Home and category catalogs use Suspense to stream their content. Account details, saved addresses, booking lists and booking details are fetched on the server and supplied to interactive components as initial data. Booking categories are also supplied from the server. Existing forms, pagination, OTP flows, Razorpay checkout and status polling remain client-side.

The root layout reads the session server-side. Only selected profile display fields are serialized; access/refresh cookies never become component props. All upstream reads use `cache: 'no-store'`, including private resources. React `cache` deduplicates the profile lookup within a render request only. An expired/unavailable server session falls back to the existing browser refresh flow because Server Components cannot rotate cookies. Successfully seeded resources skip the immediate hydration fetch; explicit retry, navigation to another resource and polling still fetch fresh data.

Pages are rendered on demand; deploying this application requires a Next.js server. SSR removes the browser-only initial data-fetch waterfall, but upstream response time still affects rendering. No end-to-end speed benchmark has been claimed.

With the isolated fixture backend and frontend on port 3002 running (commands above), run:

```bash
node tests/ssr-smoke.cjs
```

This verifies actual HTML without executing browser JavaScript: categories, account fields, addresses, booking list/details, guest isolation, token exclusion and error fallback. Its only write is to the fixed loopback fixture API. `npm test` also covers the server request/session helpers.

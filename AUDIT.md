# Hepki code review — September 18, 2026

Scope: review the existing frontend/API integration and make behavior-preserving cleanup. This is a source review, regression check and dependency scan, not a penetration test or certification of the backend. Existing UI flows, CSS, API routes/payloads, cookies, payment verification and dependency versions are preserved.

## Open findings, in priority order

### 1. High priority: vulnerable framework dependencies

The npm registry audit reports **2 affected packages: 1 critical (`next`) and 1 high (`postcss`)**. `package.json:17` pins Next.js 14.2.15. These are package-level findings, not proof every listed vulnerability is exploitable in this application.

The registry proposes Next.js 16.3.5 as a major-version remediation. Do not run `npm audit fix --force` blindly: this project uses Next 14 route/page signatures and React 18. Remediation requires a framework migration and regression testing of authentication, route handlers, assets and payment flows. No dependency update was applied in this behavior-preserving pass.

Evidence: [dependency audit snapshot](docs/dependency-audit.json), including advisory URLs and the exact command. Prioritize a compatible patched framework upgrade before production release.

### 2. High priority for multi-instance deployments: refresh coordination is process-local

Location: `lib/api/gateway.ts:118` and the module-level `rotating` map.

Two instances receiving the same rotating refresh token can each call the upstream refresh endpoint. The backend may invalidate the session on token reuse. The browser-level promise and server-local map help on one instance but cannot coordinate a distributed deployment.

Recommendation: a shared atomic refresh coordinator/server-side session store, or verified sticky routing as a deployment constraint. This is an architectural change and was not folded into cleanup.

### 3. Medium priority: overlapping session reloads can restore stale UI state

Location: `components/SessionProvider.tsx:14`.

`reload()` has neither a request generation check nor cancellation. An earlier profile fetch can finish after a newer logged-out session check and call `setUser` with the older profile. This can display stale account state; it is not proof that the backend authorizes logged-out requests.

Recommendation: make only the most recent session request eligible to update state, and explicitly invalidate outstanding work at logout. Add a delayed-response regression test before changing this behavior. Static finding; no production logout race was exercised.

### 4. Medium priority: request body limits are incomplete at the frontend gateway

Location: `lib/api/gateway.ts:94` and `lib/api/gateway.ts:102`.

Multipart requests are checked against Content-Length when present, then parsed in full before validating the file size. A chunked request without that header can consume memory before rejection. JSON parsing also has no application-level byte limit. Upstream nginx's limit does not protect the Next.js process that parses the body first. Actual exposure also depends on the hosting ingress limits.

Recommendation: enforce request limits at the hosting ingress and bound body consumption in the gateway. Preserve the existing upload field and API contract. Not changed because new request limits and status behavior need a separate validation pass.

### 5. Medium priority: successful empty upstream responses become errors

Location: `lib/api/gateway.ts:112`.

The gateway always calls `upstream.json()` except for PDF invoices. An upstream `204 No Content` enters the parse-error branch and becomes a 502. The later 204-to-200 conversion cannot correct this. Current UI actions were not observed receiving a 204; the exposed DELETE routes are a potential trigger.

Recommendation: handle 204/empty success explicitly and test response/cookie behavior. Deferred because this changes an observable response contract, beyond removal of redundant code.

### 6. Medium priority: authenticated API schemas remain unverified

Locations: `components/BookingWizard.tsx:40`, `components/AddressManager.tsx:17`, `app/become-a-buddy/page.tsx:24`, and the contract-gap section of `README.md`.

The supplied API docs name fields without defining all types or required fields. Address GeoJSON, date/time formats, weekday numbers and provider service arrays remain assumptions. Monthly package creation has no documented package-payment verification workflow. Mock responses are implementation fixtures, not independent evidence of those contracts.

Recommendation: obtain request/response examples or controller source, then exercise dedicated test-account scenarios. Keep the existing mappings until confirmed; silently changing them during cleanup could break currently working requests.

### 7. Low priority: linting is not configured

`package.json` has `next lint`, but no ESLint dependency/configuration was found. A successful build/typecheck is not an ESLint audit. The stricter unused-local/parameter TypeScript check passed in this review. Configure a compatible noninteractive lint setup in a tooling change.

## Cleanup completed

- Removed the unused `getData` wrapper and its unused `unwrap` import from the client.
- Replaced Catalog's duplicate fetch/state/effect implementation with the existing `useResource` hook. Loading, error/retry, empty state and rendered cards are retained; requests now inherit the hook's unmount cancellation.
- Category normalization now happens only for displayed cards when a limit is supplied.
- Extracted the identical customer/provider OTP countdown into `lib/hooks/useCooldown.ts`; countdown duration and resend behavior are unchanged.
- Reused one INR formatter instead of constructing it for every price render.
- Avoided duplicate object conversion in `id()`.
- Avoided registering no-op focus handlers for non-polling resources; polling intervals and focus refresh behavior are unchanged.
- Reused a token-key Set during recursive token redaction, limited token extraction to auth responses, and made the gateway-only cookie-name helper private.
- Kept defensive auth/payment checks, the gateway allowlist, mock backend and tests. These are operational safeguards or verification tools, not dead code. No public assets were deleted based only on a text-reference search.

No new production dependencies were introduced. No CSS or product markup was redesigned. This reduces duplicate logic and repeated work; it is not a measured page-speed or bundle-size improvement claim.

## Verification

- Before cleanup: original 18 tests and strict unused-local/parameter check passed.
- After cleanup: **23 tests passed**, including new model-format compatibility and recursive token-redaction regression coverage.
- `tsc --noEmit --incremental false --noUnusedLocals --noUnusedParameters`: passed.
- `NEXT_DIST_DIR=.next-build npm run build`: passed. Separate build output avoids disrupting the running development server's assets.
- Browser: `/categories` renders live API categories with Hepki branding, images, links and CSS intact after the catalog refactor.
- Dependency audit completed successfully as a scan; exit status 1 indicates the reported vulnerabilities, not a successful security clearance.

No production bookings, payments, account updates, OTP sends or uploads were performed. Authenticated end-to-end flows and timing races were not exhaustively exercised in this pass. Test/build success limits regression risk but does not establish complete functional equivalence or production readiness.

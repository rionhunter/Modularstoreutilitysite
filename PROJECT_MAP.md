
# Project Map - Backend Accounts, Monthly Plans, and Feature Entitlements

Date: 2026-06-08
Scope: Django backend implementation assessment + required work map

## Current State Map

| Area | Current Implementation | Status | Gaps / Risks |
|---|---|---|---|
| User accounts | Session-based signup/signin/signout/me API in accounts app | Partial | Frontend auth still uses browser localStorage/sessionStorage and does not call backend auth API |
| Account data model | Default Django User only | Partial | No profile, tenant/workspace ownership, billing identity, or account lifecycle fields |
| Monthly payment plans | No plan/subscription/payment models | Missing | Cannot represent plans, billing cycles, invoices, or payment state |
| Feature access control | Frontend-only feature flags in admin config | Missing (backend-enforced) | No server-side entitlements by plan or account; bypass risk |
| Store data persistence | Per-user StoreData JSON endpoints | Implemented (basic) | No quota limits, no plan-level storage policy, no audit trail |
| API security | Session auth + CSRF middleware in place | Partial | Production hardening settings incomplete by deploy checks |
| API docs and launch docs alignment | Multiple docs exist | At risk | Route names and stack assumptions in docs do not match real backend routes/implementation |

## Evidence Collected

1. Frontend tests passed: 161/161 (Vitest).
2. Frontend coverage run completed: overall statements about 22.13 percent, with many critical UI/modules at 0 percent coverage.
3. Frontend production build passed; main chunk about 1 MB minified warning.
4. Backend tests passed: 12/12 when run from backend directory.
5. Running manage.py test from repository root as backend/manage.py returned 0 tests due working-directory/path behavior.
6. Django deploy check reported six security warnings (DEBUG, SECRET_KEY quality, secure cookie/SSL/HSTS settings).
7. npm audit (production deps) reported vulnerabilities in lodash (high) and dompurify (moderate).
8. Backend currently has no billing/subscription/entitlement domain model.

## Required Backend Implementation (Django)

## 1. Account and Tenant Foundation (P0)

Deliverables:
- Add an account profile model tied to User (or migrate to a custom user model if required before production).
- Add workspace/organization model if multiple stores/users per account are needed.
- Add lifecycle fields: status (active/suspended/canceled), created_at, updated_at, trial_end_at.

Acceptance tests:
- Account/profile created on signup.
- Suspended account blocked from protected APIs.
- Organization membership and ownership permissions validated.

## 2. Monthly Plan and Subscription Domain (P0)

Deliverables:
- Models:
  - Plan (code, monthly_price, billing_interval, feature_set, active)
  - Subscription (account, plan, status, current_period_start/end, cancel_at_period_end)
  - Invoice (subscription, amount, period_start/end, status)
  - PaymentAttempt (invoice, provider_ref, status, failure_reason)
- Add service layer for subscription lifecycle transitions.
- Add management command or scheduled job entry point for monthly renewal processing.

Acceptance tests:
- New account assigned trial or default plan.
- Subscription renews monthly and creates invoice records.
- Failed payment transitions account/subscription to grace period and then restricted status.

## 3. Payment Provider Integration Boundary (P0)

Deliverables:
- Create billing provider interface abstraction (so implementation can be Stripe now, replaceable later).
- Add webhook endpoint with signature validation.
- Persist provider customer/subscription IDs.

Acceptance tests:
- Webhook updates invoice and subscription state idempotently.
- Duplicate webhook delivery does not create duplicate invoices/payments.

## 4. Server-Side Entitlements and Feature Gating (P0)

Deliverables:
- Define entitlement policy per plan (JSON schema or normalized model).
- Add reusable permission checks for feature access at API layer.
- Add endpoint for frontend to fetch effective entitlements for current user/account.

Acceptance tests:
- Restricted-plan user receives 403 for gated endpoints.
- Plan upgrade/downgrade updates entitlements without restart.

## 5. Frontend-Backend Auth Integration (P1)

Deliverables:
- Replace localStorage password auth in frontend with backend session auth endpoints.
- Add CSRF bootstrap call and credentialed requests in frontend API client.
- Remove plaintext credential storage from browser.

Acceptance tests:
- End-to-end signup/signin/signout works against Django API.
- Session survives refresh and honors logout.

## 6. Operational Security Hardening (P1)

Deliverables:
- Configure production security settings:
  - SECURE_SSL_REDIRECT
  - SESSION_COOKIE_SECURE
  - CSRF_COOKIE_SECURE
  - SECURE_HSTS_SECONDS (+ includeSubDomains/preload where appropriate)
- Enforce strong SECRET_KEY via environment only in production.

Acceptance tests:
- manage.py check --deploy returns no high-priority warnings for deployment profile.

## 7. Documentation and Command Consistency (P1)

Deliverables:
- Align launch/deployment docs to actual route names and architecture status.
- Document correct backend test command context (run from backend folder or configure script).
- Add scripts or Makefile/Taskfile for one-command test execution.

Acceptance tests:
- Documentation command paths reproduce expected results on clean clone.

## 8. Testing Expansion (P1)

Deliverables:
- Add backend tests for plans/subscriptions/entitlements and webhook idempotency.
- Add API integration tests for all guarded endpoints.
- Raise frontend coverage on Auth, Admin, module rendering, and entitlement-driven navigation.

Acceptance tests:
- Backend billing/entitlement flows covered with deterministic fixtures.
- Frontend coverage for core user journeys above agreed threshold.

## Emergent Issues Added to Project Map

- Test-discovery command hazard: running Django tests from repository root path can report 0 tests.
- Security config warnings in deployment profile.
- Production dependency vulnerabilities (lodash high, dompurify moderate).
- Frontend coverage is too low for confidence outside currently tested areas.
- Backend billing and entitlement implementation is not present yet.
- Documentation mismatch with real API route names and implementation status.

## Suggested Delivery Sequence

1. P0 account/plan/subscription model + migrations.
2. P0 provider boundary + webhook endpoint + idempotency.
3. P0 entitlement enforcement middleware/decorators + entitlement API.
4. P1 frontend auth and entitlement integration.
5. P1 security hardening and docs/scripts alignment.
6. P1 expanded automated tests and coverage thresholds.

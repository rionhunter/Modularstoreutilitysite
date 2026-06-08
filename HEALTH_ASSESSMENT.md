# Project Health Assessment - Modular Store Utility Site

Date: 2026-06-08
Assessed By: GitHub Copilot (GPT-5.3-Codex)

## Executive Summary

The project has a working frontend with broad unit/integration test count, and a basic Django backend for session authentication and per-user JSON persistence. The highest-risk gap for business requirements is that backend billing and entitlement capabilities are not implemented yet: there are no monthly payment plan, subscription, invoice, payment-attempt, or server-side feature-gating models/services.

Health is currently mixed:
- Reliability signal is positive for existing covered features (tests pass).
- Security and release readiness need work (deploy check warnings, dependency vulnerabilities, large bundle warning, and major untested frontend areas).
- Documentation has drift from actual implementation in routes/stack details.

## What Was Run

Frontend:
1. npm ci
2. npm test
3. npm run test:coverage
4. npm run build
5. npm audit --omit=dev

Backend:
1. python -m pip install -r backend/requirements.txt
2. python manage.py test (from backend directory)
3. python manage.py check --deploy
4. python manage.py makemigrations --check --dry-run
5. python -m pip check

## Test and Build Results

### Frontend

- Test files: 7 passed
- Tests: 161 passed, 0 failed
- Coverage run: completed
- Global coverage: statements around 22.13 percent
- Build: succeeded
- Build warning: one large chunk around 1,022 kB minified

### Backend

- Tests discovered and passed: 12 passed (when run from backend folder)
- No pending migrations
- Python package integrity: no broken requirements
- Deploy checks: six security warnings

## Critical and High Findings

## 1. Billing and monthly plan backend is missing (Critical)

There are no Django models/services for:
- plan catalog
- subscription lifecycle
- invoices
- payment attempts/provider events
- server-side entitlements by plan

Impact:
- Monthly platform payment plans cannot be implemented or enforced server-side.
- Feature access is not tied to paid status.

## 2. Feature access control is not enforced on backend (High)

Feature toggles are currently frontend/admin-config driven. There is no backend authorization layer that gates API access by subscription entitlement.

Impact:
- Entitlement bypass risk.
- No trustworthy paid-feature enforcement.

## 3. Production dependency vulnerabilities (High/Moderate)

npm audit --omit=dev reports:
- lodash vulnerability (high)
- dompurify vulnerabilities (moderate)

Impact:
- Elevated risk in production dependency chain unless patched/upgraded.

## Medium Findings

## 4. Deploy hardening settings are incomplete

Django check --deploy warnings include:
- SECURE_HSTS_SECONDS not set
- SECURE_SSL_REDIRECT not true
- SESSION_COOKIE_SECURE not true
- CSRF_COOKIE_SECURE not true
- DEBUG true in deploy profile
- SECRET_KEY quality warning

Impact:
- Insecure production baseline if deployed as-is.

## 5. Frontend coverage depth is still low

Despite 161 passing tests, total statements coverage is around 22 percent and many major components/modules report 0 percent coverage.

Impact:
- Regressions in untested UI and module paths are likely to slip through.

## 6. Documentation drift and command inconsistency

Observed mismatches:
- Launch document references DRF stack and route names that differ from current backend implementation.
- Running backend tests via backend/manage.py from repository root returned 0 tests; running from backend directory discovers/passes all tests.

Impact:
- Onboarding friction and false confidence from incorrect command context.

## Positive Signals

- Core Django account APIs exist (signup/signin/signout/me + CSRF endpoint).
- Store data API is authenticated and tested for core CRUD behavior.
- Frontend and backend existing suites pass in correct execution context.
- Build pipeline currently succeeds.

## Recommendation Snapshot

Immediate priorities:
1. Implement Django billing/subscription/entitlement domain (models + services + tests).
2. Enforce server-side feature permissions from entitlement state.
3. Patch npm vulnerabilities and re-run audit.
4. Apply production Django security settings and verify with check --deploy.
5. Align docs and scripts so backend tests run consistently from a single documented command.

A detailed action plan has been compiled in PROJECT_MAP.md.

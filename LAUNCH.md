# Launch Document — Modular Store Utility Site

This document covers everything required to take this project from a local development setup to a live, publicly accessible website.

---

## Architecture overview

| Layer | Technology | Location |
|---|---|---|
| Frontend | React + Vite (SPA) | repo root |
| Backend (API & auth) | Django + DRF | `backend/` |
| Database | SQLite (dev) / PostgreSQL (prod) | managed by Django |
| Static assets | Served by CDN / static host | `build/` after `npm run build` |

> **Important:** The frontend currently runs as a fully self-contained SPA using `localStorage`/`sessionStorage` for auth and data. The Django backend exists and provides API endpoints for accounts (`/api/accounts/`) and store data (`/api/store/`), but the frontend does not yet integrate with them. You can launch the **frontend-only** path immediately with zero backend infra.

---

## Option A — Frontend-only (fastest path to live)

The SPA stores all data in the browser and needs no server. This is suitable for a single-user or trusted-team setup.

### Requirements

- Node.js 18+ (or 20 LTS)
- A static hosting service (Vercel, Netlify, Cloudflare Pages, or GitHub Pages)

### Steps

```bash
npm ci
npm test          # all tests must pass before deploying
npm run build     # outputs to build/
```

Deploy the `build/` directory to your chosen host. All routes must fall back to `index.html` — configure a rewrite rule:

| Host | Rewrite rule |
|---|---|
| Vercel | Automatic (zero config) |
| Netlify | Add `_redirects`: `/* /index.html 200` |
| Cloudflare Pages | Add `_redirects`: `/* /index.html 200` |
| GitHub Pages | Copy `index.html` → `404.html` in the `build/` dir |

### Environment variables

None required for the frontend-only path.

---

## Option B — Full-stack (frontend + Django backend)

Use this path when you need multi-user auth, server-side data persistence, or API integrations.

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18+ |
| Python | 3.11+ |
| PostgreSQL | 14+ (recommended for production) |

---

### 1. Prepare the Django backend

#### Environment variables

Create a `.env` file in `backend/` (never commit it) or set these in your hosting provider's dashboard:

```
DJANGO_SECRET_KEY=<long random string — use `python -c "import secrets; print(secrets.token_hex(50))"` to generate>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-backend-domain.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.com
DATABASE_URL=postgres://user:pass@host:5432/dbname   # optional; falls back to SQLite
```

> **Never** deploy with `DJANGO_DEBUG=True` or a weak `SECRET_KEY`.

#### Install and migrate

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py test              # all backend tests must pass
```

#### Run with Gunicorn

```bash
gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 2
```

#### Recommended backend hosts

- **Render** (Web Service + managed PostgreSQL) — free tier available
- **Railway** — simple PostgreSQL add-on
- **Fly.io** — good for Docker-based deploys
- **DigitalOcean App Platform** — managed infra

---

### 2. Deploy the frontend

```bash
npm ci
npm test
npm run build
```

Point the API base URL in the frontend to your backend's domain before building (once the frontend integrates with the backend API).

Deploy the `build/` directory as described in Option A.

---

### 3. Connect frontend to backend

Once the frontend is updated to call the Django API:

1. The backend exposes:
   - `GET /api/accounts/csrf/` — Bootstrap CSRF token
   - `POST /api/accounts/login/`
   - `POST /api/accounts/logout/`
   - `POST /api/accounts/register/`
   - `GET/POST /api/store/` — Store data endpoints

2. For cross-origin requests, every mutating request (`POST`, `PUT`, `PATCH`, `DELETE`) must:
   - First call `GET /api/accounts/csrf/` to receive the CSRF cookie
   - Include the `X-CSRFToken` header (read from the cookie)
   - Include `credentials: 'include'` so the session cookie travels with each request

3. Ensure `DJANGO_CSRF_TRUSTED_ORIGINS` includes the exact frontend origin (with scheme, e.g. `https://app.example.com`).

---

## Pre-launch checklist

### Security

- [ ] `DJANGO_DEBUG=False` in production
- [ ] Strong, unique `DJANGO_SECRET_KEY`
- [ ] `DJANGO_ALLOWED_HOSTS` restricted to your domain(s)
- [ ] HTTPS enforced end-to-end (TLS via host or reverse proxy)
- [ ] CSRF trusted origins match your actual frontend URL
- [ ] No secrets committed to the repository (check with `git log --all -- '*.env'`)
- [ ] Database is NOT publicly accessible (use a private network / VPC)

### Functionality

- [ ] `npm test` — all frontend tests pass
- [ ] `python manage.py test` — all backend tests pass
- [ ] `npm run build` — production build succeeds with no errors
- [ ] SPA fallback rewrite rule is configured on the static host
- [ ] Auth flow works end-to-end (sign up → sign in → logout)
- [ ] Admin portal feature flags work as expected
- [ ] All enabled modules render correctly on first load

### Performance

- [ ] Confirm the Vite build chunk-size warning is acceptable, or configure `build.rollupOptions.output.manualChunks` to split the main bundle (currently ~1 MB uncompressed)
- [ ] Enable gzip / Brotli compression on your static host
- [ ] Set `Cache-Control` headers for static assets (most CDN hosts do this automatically)

### Operational

- [ ] Set up error monitoring (e.g. Sentry) for both frontend and backend
- [ ] Configure health-check endpoint for the backend (`/api/accounts/csrf/` returns 200 and is safe to ping)
- [ ] Set up automated database backups (if using the Django backend)
- [ ] Document the deployment process for your team (or this document serves that purpose)

---

## Running tests locally

```bash
# Frontend
npm ci
npm test

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py test
```

---

## Useful commands reference

| Task | Command |
|---|---|
| Start dev server | `npm run dev` |
| Production build | `npm run build` |
| Run frontend tests | `npm test` |
| Run frontend tests with coverage | `npm run test:coverage` |
| Start Django dev server | `cd backend && python manage.py runserver` |
| Run Django migrations | `cd backend && python manage.py migrate` |
| Run backend tests | `cd backend && python manage.py test` |
| Generate Django secret key | `python -c "import secrets; print(secrets.token_hex(50))"` |

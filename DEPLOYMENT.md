# Deployment Guide

This project has:
- A React frontend (Vite) at the repository root
- A Django backend in `/backend`

## 1) Deploy the Django backend

### Environment variables
Set these in your hosting provider:
- `DJANGO_SECRET_KEY` (required, secure random string)
- `DJANGO_DEBUG` (`False` in production)
- `DJANGO_ALLOWED_HOSTS` (comma-separated hostnames)
- `DJANGO_CSRF_TRUSTED_ORIGINS` (comma-separated frontend origins, e.g. `https://app.example.com`)

### Install and run
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py test
python manage.py collectstatic --noinput
```

Use Gunicorn (or your platform process manager):
```bash
gunicorn backend.wsgi:application --bind 0.0.0.0:8000
```

Recommended platforms:
- Render (Web Service)
- Railway
- Fly.io
- DigitalOcean App Platform

## 2) Deploy the frontend

From the repository root:
```bash
npm ci
npm run build
```

Deploy the generated `build/` folder to:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages (static hosting)

## 3) Connect frontend to backend

Point frontend API calls to your backend URL, for example:
- `https://your-backend-domain/api/accounts/...`
- `https://your-backend-domain/api/store/...`

If frontend and backend are on different domains:
- Add CORS handling in Django
- Configure secure cookie/session settings
- Configure CSRF trusted origins (for example, `DJANGO_CSRF_TRUSTED_ORIGINS=https://your-frontend-domain`)
- For Django session auth, fetch `GET /api/accounts/csrf/`, then send `X-CSRFToken` + `credentials: 'include'` on `POST`, `PUT`, `PATCH`, and `DELETE` requests

## 4) Production checklist

- Set `DEBUG=False`
- Set strong `SECRET_KEY`
- Restrict `ALLOWED_HOSTS`
- Use HTTPS only
- Run database migrations
- Run tests before deploy (`python manage.py test`, `npm test`)
- Monitor logs and error reporting

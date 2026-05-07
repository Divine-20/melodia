# Melodia — Music Marketplace

A small full-stack music marketplace:

- **Backend** — FastAPI + SQLAlchemy (async) + PostgreSQL → `backend/`
- **Frontend** — React + Vite + TanStack Query + Tailwind → `melodia-frontend/`
- **Database** — PostgreSQL 16

## One command to run everything

```bash
docker compose up --build
```

That brings up three services on a private Docker network:

| Service     | URL / port                                | Notes                                           |
|-------------|-------------------------------------------|-------------------------------------------------|
| Frontend    | http://localhost:8080                     | nginx serves the SPA and proxies `/api`/`health` to the backend |
| Backend API | http://localhost:8000                     | FastAPI; Swagger UI at http://localhost:8000/docs |
| PostgreSQL  | `localhost:5432` (db `melodia`, user `melodia`, password `melodia`) | Data persists in the named volume `melodia_pg`  |

The frontend container is configured with an empty `VITE_API_BASE_URL`, so the SPA makes **same-origin requests** to `/api/*`. nginx inside that container forwards them to the `backend` service over the compose network — there is no CORS configuration to worry about in the browser.

### Stop / reset

```bash
docker compose down            # stop containers, keep data
docker compose down -v         # also drop the Postgres volume (fresh seed on next start)
```

## Seeded credentials

The first time the backend starts against an empty database, it creates demo users (and a small artist/album catalog) so the app is ready to click around in:

| Role     | Email                  | Password   |
|----------|------------------------|------------|
| Admin    | `admin@example.com`    | `admin123` |
| Listener | `listener@example.com` | `user123`  |

## Local development without Docker

- Backend: see [`backend/README.md`](backend/README.md) — `uvicorn app.main:app --reload`
- Frontend: `cd melodia-frontend && npm install && npm run dev`
  - The dev server reads `VITE_API_BASE_URL` from `melodia-frontend/.env` (defaults to `http://localhost:8000` when running locally outside Docker).

## Files added/changed for the Docker setup

- `docker-compose.yml` — single command to run db + backend + frontend
- `melodia-frontend/Dockerfile` — Node build → nginx static server
- `melodia-frontend/deploy/nginx.conf` — SPA fallback + `/api` and `/health` proxy
- `melodia-frontend/.dockerignore`

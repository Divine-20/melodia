# Melodia — Music Marketplace

React + FastAPI implementation of the hiring exercise: admins manage artists and albums; guests browse and search; authenticated listeners purchase albums once, rate owned albums, and browse a personal library. Business rules are enforced on the server.

## Quick start (Docker Compose)

Requires Docker with Compose v2.

```bash
docker compose up --build
```

- **Frontend:** http://localhost:8080 (nginx serves the SPA and proxies `/api` to the API)
- **API:** http://localhost:8000 (direct) · health: http://localhost:8000/health
- **PostgreSQL:** localhost `5432`, database `melodia`, user/password `melodia` / `melodia`

### Seeded credentials

After the API starts, the database is migrated automatically and seed data runs once:

| Role   | Email               | Password   |
|--------|---------------------|------------|
| Admin  | `admin@example.com` | `admin123` |
| Listener | `listener@example.com` | `user123` |

Email domains use RFC-friendly addresses so `email-validator` accepts them in all environments.

## Local development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL=postgresql+asyncpg://melodia:melodia@localhost:5432/melodia
export JWT_SECRET_KEY=$(openssl rand -hex 32)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

With PostgreSQL running locally (or adjust `DATABASE_URL`). Tables are created on startup; seed runs when the `users` table is empty.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` and `/health` to `http://127.0.0.1:8000` (see `vite.config.ts`). Open http://localhost:5173.

Optional: `VITE_API_BASE=http://localhost:8000 npm run dev` if you prefer absolute API URLs.

### Tests

```bash
cd backend
TESTING=1 JWT_SECRET_KEY=test-secret-key-for-ci-only-32chars! pytest
```

Uses an isolated SQLite database (`TESTING=1` switches the API database module to an in-memory SQLite pool).

## Architecture (short)

- **Backend:** FastAPI routers under `/api/v1`, async SQLAlchemy 2.x, Pydantic v2 schemas. JWT access tokens plus refresh tokens (`POST /api/v1/auth/refresh`). Authorization enforced in dependencies (`require_admin`, `get_current_user`).
- **Domain:** `Artist` → `Album` (many-to-one); `Purchase` unique per `(user, album)`; `Rating` unique per `(user, album)` with averages computed from `Rating.score`. Album list/detail exposes `average_rating` and `rating_count`.
- **Frontend:** React 18, TanStack Query for server state, React Router, Framer Motion for motion design. Guest flows require no token; purchase/rate/library require auth.

## What is included / omitted

**Included:** PostgreSQL in Compose, pagination + sorting on core lists, JWT refresh flow, animated marketplace UI, admin CRUD for artists/albums, automated tests for purchase/rating rules, README and single Compose command.

**Intentionally light:** No real payments (purchase is a stubbed transaction), no full cart/checkout, no production-grade deployment hardening (TLS, secrets rotation, Alembic migrations — schema is created via SQLAlchemy metadata on startup for reviewer simplicity).

## Project layout

```
Melodia/
├── backend/app          # FastAPI application code
├── backend/tests        # Pytest suite
├── frontend/src         # React application
├── docker-compose.yml
└── README.md
```

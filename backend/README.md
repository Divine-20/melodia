# Melodia API (FastAPI backend)

This folder is a **web API**: programs (like a website or mobile app) send HTTP requests to it; it reads and writes data in **PostgreSQL** and returns JSON responses.

If you have never used **FastAPI**, this README walks you through the ideas, setup, daily workflow, and where to click in Swagger.

---

## What is FastAPI? (Very short)

- **FastAPI** is a Python library for building APIs with **minimal boilerplate**.
- You define **routes** (“when someone sends `POST /api/v1/auth/login`, run this function”) and FastAPI validates input/output using **Pydantic** models.
- FastAPI generates **automatic interactive documentation** (Swagger UI) from your code so you can try endpoints in the browser without writing a frontend.

Official docs (worth bookmarking): [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)

---

## Words you’ll see everywhere

| Term | Meaning |
|------|---------|
| **API** | A program that exposes operations over HTTP (URLs + methods like GET/POST). |
| **REST** | A common style of API: resources as URLs (`/api/v1/artists`), HTTP verbs, JSON bodies. |
| **JSON** | Text format for data in requests/responses (`{"email": "a@b.com"}`). |
| **Endpoint / route** | One URL + method (e.g. `GET /health`). |
| **Request / response** | Client sends request; server sends response (often JSON). |
| **JWT** | Signed token proving who you are. After login you send `Authorization: Bearer <token>`. |
| **PostgreSQL** | The relational database used by this project. |
| **SQLAlchemy** | Python library used here to talk to the database asynchronously. |
| **Async** | Concurrent I/O-friendly style (`async def` routes and DB calls). |

---

## What’s in this project (mental map)

| Path | Role |
|------|------|
| `app/main.py` | Creates the FastAPI app, CORS, lifespan (DB startup/seed), `/health`. |
| `app/config.py` | Settings loaded from `.env` / environment variables. |
| `app/database.py` | PostgreSQL async engine and `get_db` session dependency. |
| `app/api/v1/router.py` | Wires URL prefixes (`/api/v1/...`) to endpoint modules. |
| `app/api/v1/endpoints/` | Actual route handlers (`auth.py`, `albums.py`, …). |
| `app/models/` | SQLAlchemy table definitions (maps to DB tables). |
| `app/schemas/` | Pydantic models for validating API input/output. |
| `app/dependencies.py` | Shared deps (e.g. current user via JWT bearer). |
| `tests/` | Automated API tests (`pytest`). |

API base path for version 1 routes: **`/api/v1`**.

---

## Prerequisites

1. **Python 3.11+** (the project ships with conventions that match modern Python).
2. **PostgreSQL** running locally or reachable over the network.
3. A **database** created for the app (name can match what you put in the connection URL).

Example (command-line, if `psql` is available):

```bash
createdb melodia
```

Use a username/password/host that matches your `DATABASE_URL` (see below).

---

## Setup

### 1. Virtual environment

From this `backend/` directory:

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment variables (` .env`)

The app reads `app/config.py` via **pydantic-settings**. You can copy values into a file named `.env` in `backend/` (same folder as this README).

Common variables:

| Variable | Purpose | Default in code |
|----------|---------|-----------------|
| `DATABASE_URL` | Async PostgreSQL URL for SQLAlchemy + asyncpg | `postgresql+asyncpg://postgres:postgres@localhost:5432/melodia` |
| `JWT_SECRET_KEY` | Secret used to sign tokens — **must be strong in production** | Dev placeholder |
| `JWT_ALGORITHM` | Algorithm for JWTs | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `DEBUG` | If true, logs SQL echoes (noisy but useful while learning) | `false` |
| `CORS_ORIGINS` | Comma-separated frontend origins allowed by CORS | `http://localhost:5173,...` |

**Connection URL shape:**  
`postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DATABASE`

`asyncpg` is the async driver FastAPI/SQLAlchemy use here (`+asyncpg` in the URL).

### 3. Run the server

From `backend/` with the venv active:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

What this means:

- `app.main:app` — import path to the FastAPI instance named `app` inside `app/main.py`.
- `--reload` — restart on code changes (handy while learning).
- The server listens on **port 8000** by default below.

Try a quick check:

```bash
curl http://127.0.0.1:8000/health
```

You should see JSON like `{"status":"ok"}`.

---

## Interactive docs (Swagger) — easiest way to learn this API

After the server starts:

| URL | What it does |
|-----|----------------|
| [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | **Swagger UI** — try requests, fill forms, execute. |
| [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) | **ReDoc** — readable reference layout. |
| [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json) | Raw **OpenAPI** schema for tools and codegen. |

**Typical Swagger flow:**

1. Open **`/docs`**.
2. Expand **`POST /api/v1/auth/login`**, click **Try it out**, send credentials (see seeded users below).
3. Copy **`access_token`** from the response.
4. Click **Authorize** at the top, paste the token (Swagger adds the **Bearer** scheme).
5. Call protected routes (e.g. ratings, library).

If a route does not appear with a lock icon, Swagger may still send the header after you authorize—it depends how dependencies are modeled for that endpoint.

---

## First startup: database tables and demo data

On startup, `main.py`:

1. **Creates tables** from SQLAlchemy models if they do not exist (`create_all`).
2. When **not** in test mode, **seeds** demo users/albums/artists if the `users` table is empty.

**Seeded login examples** (unless you changed passwords in code):

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123` | admin |
| `listener@example.com` | `user123` | user |

Treat these as **local development only**.

---

## Main route groups

All are under **`/api/v1`** unless noted:

- **`/auth`** — register, login, refresh tokens, `/me`.
- **`/artists`** — artist catalog (see Swagger for verbs and payloads).
- **`/albums`** — albums (including purchase flows where implemented).
- **`PUT /albums/{album_id}/rating`** — rate an album (**requires JWT**).
- **`/me/...`** — authenticated user library (see `library` endpoints in Swagger).

Exact paths and bodies are authoritative in **`/docs`**.

---

## Running tests

Tests use **`pytest`** and **`httpx.AsyncClient`** against the real FastAPI app.

**Important:** the test harness sets **`DATABASE_URL`** to a **separate** database (`melodia_test` by default) and **drops/recreates tables**—do not point tests at production or your personal dev data.

```bash
# Optional: Postgres must exist. Default URL in tests:
# postgresql+asyncpg://melodia:melodia@localhost:5432/melodia_test

pytest
```

Override the test DB when needed:

```bash
export TEST_DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/my_test_db"
pytest
```

Notes:

- `TESTING=1` is set in `tests/conftest.py` — seeding logic in production startup is skipped in the way `main.py` is written for tests.
- `JWT_SECRET_KEY` is overwritten for deterministic tests.

---

## Troubleshooting

| Problem | What to try |
|---------|--------------|
| `connection refused` to Postgres | PostgreSQL running? Host/port/user/password correct in `DATABASE_URL`? |
| `database "melodia" does not exist` | Create the DB with `createdb` or equivalent. |
| `ModuleNotFoundError` | Activate `.venv`, run `pip install -r requirements.txt`. |
| CORS errors from a frontend | Add your frontend origin to `CORS_ORIGINS` (comma-separated). |
| Swagger 401 on protected routes | Authorize with a fresh access token from `/auth/login`. |
| pytest destroys data | Confirm `DATABASE_URL` during tests targets **`melodia_test`**, not your main DB. |

---

## Secure-by-default reminders (production)

- Set a **`JWT_SECRET_KEY`** from a cryptographic random source (never commit real secrets).
- Use TLS (HTTPS), lock down database credentials, and restrict **`CORS_ORIGINS`** to real frontends only.
- Prefer migrations (e.g. Alembic) over relying solely on **`create_all`** for production schema changes.

---

## Next steps while learning FastAPI

1. Open **`/docs`** and trace one request path by reading its handler in `app/api/v1/endpoints/`.
2. Compare **schemas** (`app/schemas`) to the JSON Swagger shows—they should match by design.
3. Read FastAPI’s “First Steps” and “Depends” tutorials:  
   [https://fastapi.tiangolo.com/tutorial/](https://fastapi.tiangolo.com/tutorial/)

You do not need to memorize everything—the interactive docs plus this repo’s folders are enough to navigate with confidence once the server runs.

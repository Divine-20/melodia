import os
from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.router import api_router
from app.config import get_settings
from app.core.security import hash_password
from app.database import AsyncSessionLocal, engine
from app.database_base import Base
from app.models.album import Album
from app.models.artist import Artist
from app.models.user import User, UserRole

# OpenAPI tag descriptions appear as section headers in Swagger UI (/docs) and ReDoc (/redoc).
OPENAPI_TAGS: list[dict[str, str]] = [
    {
        "name": "auth",
        "description": "Register, log in, and refresh JWTs. Use the access token for protected routes.",
    },
    {"name": "artists", "description": "Artists in the catalog."},
    {"name": "albums", "description": "Albums, pricing, and purchases."},
    {"name": "ratings", "description": "User ratings for albums."},
    {"name": "library", "description": "The signed-in user's library (/me/...)."},
    {"name": "health", "description": "Service health checks."},
]


async def init_db_schema() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Keep simple additive schema evolution without Alembic.
        await conn.execute(text("ALTER TABLE albums ADD COLUMN IF NOT EXISTS photo_url VARCHAR(2048)"))
        await conn.execute(text("ALTER TABLE artists ADD COLUMN IF NOT EXISTS picture_url VARCHAR(2048)"))


async def seed_if_empty(session: AsyncSession) -> None:
    cnt = await session.execute(select(func.count()).select_from(User))
    if int(cnt.scalar_one()) > 0:
        return

    admin = User(
        email="admin@example.com",
        hashed_password=hash_password("admin123"),
        role=UserRole.ADMIN,
    )
    demo = User(
        email="listener@example.com",
        hashed_password=hash_password("user123"),
        role=UserRole.USER,
    )
    session.add_all([admin, demo])

    artists = [
        Artist(
            real_name="Claire Nouveau",
            date_of_birth=date(1988, 4, 12),
            performing_name="NOIR LUNE",
            bio="Electronic composer blending analog warmth with digital precision.",
        ),
        Artist(
            real_name="Marcus Hale",
            date_of_birth=date(1992, 11, 3),
            performing_name="HALESTORM KEYS",
            bio="Neo-soul keys player turned cinematic soundtrack producer.",
        ),
        Artist(
            real_name="Yuki Taneda",
            date_of_birth=date(1995, 7, 21),
            performing_name="TOKYO STATIC",
            bio="Glitch-pop vocalist exploring midnight cityscapes.",
        ),
    ]
    session.add_all(artists)
    await session.flush()

    albums_data = [
        ("Midnight Signals", "24.99", artists[0].id),
        ("Analog Dreams", "19.50", artists[0].id),
        ("Glass Rivers", "29.00", artists[1].id),
        ("Velvet Corners", "14.99", artists[1].id),
        ("Neon Drift", "22.00", artists[2].id),
        ("Static Bloom EP", "9.99", artists[2].id),
    ]
    for name, price, aid in albums_data:
        session.add(
            Album(
                name=name,
                price=price,
                artist_id=aid,
                description="Seeded catalog entry for reviewers.",
            )
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_schema()
    if os.getenv("TESTING") != "1":
        async with AsyncSessionLocal() as session:
            try:
                await seed_if_empty(session)
                await session.commit()
            except Exception:
                await session.rollback()
                raise
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        description=(
            "REST API for Melodia. Interactive documentation: "
            "**[Swagger UI](/docs)** (try requests in the browser) and **[ReDoc](/redoc)** (readable reference). "
            "Machine-readable schema: **[OpenAPI JSON](/openapi.json)**.\n\n"
            "**JWT:** call `POST /api/v1/auth/login`, copy `access_token`, then in Swagger click **Authorize** "
            "and paste the token (Swagger sends it as HTTP Bearer)."
        ),
        version="1.0.0",
        lifespan=lifespan,
        openapi_tags=OPENAPI_TAGS,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )
    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)

    @app.get("/health", tags=["health"], summary="Health check")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()

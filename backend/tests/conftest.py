import os

os.environ["TESTING"] = "1"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-ci-only-32chars!"

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import get_settings


@pytest.fixture
async def client():
    get_settings.cache_clear()
    from app.database import engine
    from app.database_base import Base
    from app.models import Album, Artist, Purchase, Rating, User  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    get_settings.cache_clear()


@pytest.fixture
async def admin_headers(client: AsyncClient):
    from app.database import AsyncSessionLocal
    from app.core.security import hash_password
    from app.models.user import User, UserRole

    async with AsyncSessionLocal() as s:
        s.add(
            User(
                email="admin@example.com",
                hashed_password=hash_password("password12345"),
                role=UserRole.ADMIN,
            )
        )
        await s.commit()
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "password12345"},
    )
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def user_headers(client: AsyncClient):
    from app.database import AsyncSessionLocal
    from app.core.security import hash_password
    from app.models.user import User, UserRole

    async with AsyncSessionLocal() as s:
        s.add(
            User(
                email="user@example.com",
                hashed_password=hash_password("password12345"),
                role=UserRole.USER,
            )
        )
        await s.commit()
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "password12345"},
    )
    assert r.status_code == 200
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def catalog(client: AsyncClient, admin_headers):
    from datetime import date

    from app.database import AsyncSessionLocal
    from app.models.album import Album
    from app.models.artist import Artist

    async with AsyncSessionLocal() as s:
        artist = Artist(
            real_name="Test Artist",
            date_of_birth=date(1990, 1, 1),
            performing_name="TA PERFORM",
            bio=None,
        )
        s.add(artist)
        await s.flush()
        s.add(
            Album(
                name="Test Album",
                price="12.34",
                artist_id=artist.id,
                description=None,
            )
        )
        await s.commit()

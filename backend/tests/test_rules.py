import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cannot_repurchase(client: AsyncClient, catalog, user_headers):
    r = await client.get("/api/v1/albums", params={"page_size": 10})
    album_id = r.json()["items"][0]["id"]
    p1 = await client.post(f"/api/v1/albums/{album_id}/purchase", headers=user_headers)
    assert p1.status_code == 201
    p2 = await client.post(f"/api/v1/albums/{album_id}/purchase", headers=user_headers)
    assert p2.status_code == 400


@pytest.mark.asyncio
async def test_cannot_rate_without_purchase(client: AsyncClient, catalog, user_headers):
    r = await client.get("/api/v1/albums", params={"page_size": 10})
    album_id = r.json()["items"][0]["id"]
    resp = await client.put(
        f"/api/v1/albums/{album_id}/rating",
        headers=user_headers,
        json={"score": 5},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_rate_after_purchase_updates_average(
    client: AsyncClient, catalog, user_headers
):
    r = await client.get("/api/v1/albums", params={"page_size": 10})
    album_id = r.json()["items"][0]["id"]
    await client.post(f"/api/v1/albums/{album_id}/purchase", headers=user_headers)
    r1 = await client.put(
        f"/api/v1/albums/{album_id}/rating",
        headers=user_headers,
        json={"score": 4},
    )
    assert r1.status_code == 200
    detail = await client.get(f"/api/v1/albums/{album_id}")
    assert detail.json()["average_rating"] == 4.0

    r2 = await client.put(
        f"/api/v1/albums/{album_id}/rating",
        headers=user_headers,
        json={"score": 5},
    )
    assert r2.status_code == 200
    detail2 = await client.get(f"/api/v1/albums/{album_id}")
    assert detail2.json()["average_rating"] == 5.0


@pytest.mark.asyncio
async def test_guest_can_list_albums(client: AsyncClient, catalog):
    r = await client.get("/api/v1/albums")
    assert r.status_code == 200
    assert len(r.json()["items"]) >= 1


@pytest.mark.asyncio
async def test_admin_can_crud_artist(client: AsyncClient, admin_headers):
    create = await client.post(
        "/api/v1/artists",
        headers=admin_headers,
        json={
            "real_name": "RN",
            "date_of_birth": "1980-05-05",
            "performing_name": "PERF",
            "bio": "bio",
        },
    )
    assert create.status_code == 201
    aid = create.json()["id"]
    upd = await client.patch(
        f"/api/v1/artists/{aid}",
        headers=admin_headers,
        json={"performing_name": "PERF2"},
    )
    assert upd.status_code == 200
    assert upd.json()["performing_name"] == "PERF2"

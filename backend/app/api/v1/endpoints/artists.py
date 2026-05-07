from math import ceil
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import AdminUser
from app.models.album import Album
from app.models.artist import Artist
from app.schemas.artist import ArtistCreate, ArtistRead, ArtistUpdate
from app.schemas.common import PaginatedMeta
from app.schemas.pagination import Paginated

router = APIRouter()


@router.get("", response_model=Paginated[ArtistRead])
async def list_artists(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str | None = Query(None, description="Search performing or real name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = Query("performing_name", pattern="^(performing_name|real_name|created_at)$"),
    order: str = Query("asc", pattern="^(asc|desc)$"),
) -> Paginated[ArtistRead]:
    base = select(Artist)
    count_stmt = select(func.count()).select_from(Artist)
    if q:
        pattern = f"%{q}%"
        filt = or_(Artist.performing_name.ilike(pattern), Artist.real_name.ilike(pattern))
        base = base.where(filt)
        count_stmt = count_stmt.where(filt)

    total_result = await db.execute(count_stmt)
    total = int(total_result.scalar_one())

    sort_col = getattr(Artist, sort)
    if order == "desc":
        sort_col = sort_col.desc()
    base = base.order_by(sort_col).offset((page - 1) * page_size).limit(page_size)
    rows = await db.execute(base)
    items = list(rows.scalars().all())
    pages = max(1, ceil(total / page_size)) if total else 1
    meta = PaginatedMeta(total=total, page=page, page_size=page_size, pages=pages)
    return Paginated(items=items, meta=meta)


@router.get("/{artist_id}", response_model=ArtistRead)
async def get_artist(
    artist_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Artist:
    result = await db.execute(select(Artist).where(Artist.id == artist_id))
    artist = result.scalar_one_or_none()
    if artist is None:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist


@router.post("", response_model=ArtistRead, status_code=status.HTTP_201_CREATED)
async def create_artist(
    body: ArtistCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
) -> Artist:
    artist = Artist(
        real_name=body.real_name,
        date_of_birth=body.date_of_birth,
        performing_name=body.performing_name,
        bio=body.bio,
        picture_url=str(body.picture_url) if body.picture_url else None,
    )
    db.add(artist)
    await db.flush()
    await db.refresh(artist)
    return artist


@router.patch("/{artist_id}", response_model=ArtistRead)
async def update_artist(
    artist_id: int,
    body: ArtistUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
) -> Artist:
    result = await db.execute(select(Artist).where(Artist.id == artist_id))
    artist = result.scalar_one_or_none()
    if artist is None:
        raise HTTPException(status_code=404, detail="Artist not found")
    data = body.model_dump(exclude_unset=True)
    if "picture_url" in data and data["picture_url"] is not None:
        data["picture_url"] = str(data["picture_url"])
    for k, v in data.items():
        setattr(artist, k, v)
    await db.flush()
    await db.refresh(artist)
    return artist


@router.delete("/{artist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_artist(
    artist_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
) -> None:
    result = await db.execute(select(Artist).where(Artist.id == artist_id))
    artist = result.scalar_one_or_none()
    if artist is None:
        raise HTTPException(status_code=404, detail="Artist not found")
    await db.execute(delete(Artist).where(Artist.id == artist_id))

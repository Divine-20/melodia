from math import ceil
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import AdminUser, CurrentUser
from app.models.album import Album
from app.models.artist import Artist
from app.models.purchase import Purchase
from app.models.rating import Rating
from app.models.user import User
from app.schemas.album import AlbumCreate, AlbumRead, AlbumReadWithArtist, AlbumUpdate
from app.schemas.common import PaginatedMeta
from app.schemas.pagination import Paginated
from app.services.album_stats import average_ratings_for_albums

router = APIRouter()


def _album_to_read(row: Album, stats: dict[int, tuple[float | None, int]]) -> AlbumRead:
    avg, cnt = stats.get(row.id, (None, 0))
    return AlbumRead(
        id=row.id,
        name=row.name,
        price=row.price,
        description=row.description,
        artist_id=row.artist_id,
        average_rating=avg,
        rating_count=cnt,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _album_to_read_with_artist(
    row: Album, stats: dict[int, tuple[float | None, int]], performing: str | None
) -> AlbumReadWithArtist:
    base = _album_to_read(row, stats)
    data = base.model_dump()
    data["artist_performing_name"] = performing
    return AlbumReadWithArtist(**data)


@router.get("", response_model=Paginated[AlbumReadWithArtist])
async def list_albums(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str | None = Query(None, description="Search album or artist performing name"),
    artist_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = Query("name", pattern="^(name|price|created_at|average_rating)$"),
    order: str = Query("asc", pattern="^(asc|desc)$"),
) -> Paginated[AlbumReadWithArtist]:
    stmt = select(Album).join(Artist, Album.artist_id == Artist.id)
    count_stmt = select(func.count()).select_from(Album).join(Artist, Album.artist_id == Artist.id)

    if artist_id is not None:
        stmt = stmt.where(Album.artist_id == artist_id)
        count_stmt = count_stmt.where(Album.artist_id == artist_id)

    if q:
        pattern = f"%{q}%"
        filt = or_(Album.name.ilike(pattern), Artist.performing_name.ilike(pattern))
        stmt = stmt.where(filt)
        count_stmt = count_stmt.where(filt)

    total_result = await db.execute(count_stmt)
    total = int(total_result.scalar_one())

    # For sorting by average_rating we need a subquery — simplified: fetch ids sorted in Python for that case only
    if sort == "average_rating":
        all_rows = (await db.execute(stmt.options(selectinload(Album.artist)))).scalars().all()
        ids = [a.id for a in all_rows]
        stats = await average_ratings_for_albums(db, ids)
        def avg_key(a: Album) -> float:
            av, _ = stats.get(a.id, (None, 0))
            return av if av is not None else -1.0

        reverse = order == "desc"
        all_rows = sorted(all_rows, key=avg_key, reverse=reverse)
        pages = max(1, ceil(total / page_size)) if total else 1
        chunk = all_rows[(page - 1) * page_size : (page - 1) * page_size + page_size]
        stats_full = await average_ratings_for_albums(db, [a.id for a in chunk])
        items = [
            _album_to_read_with_artist(
                a, stats_full, a.artist.performing_name if a.artist else None
            )
            for a in chunk
        ]
        meta = PaginatedMeta(total=total, page=page, page_size=page_size, pages=pages)
        return Paginated(items=items, meta=meta)

    sort_col: Any
    if sort == "name":
        sort_col = Album.name
    elif sort == "price":
        sort_col = Album.price
    else:
        sort_col = Album.created_at

    if order == "desc":
        sort_col = sort_col.desc()
    stmt = stmt.order_by(sort_col).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt.options(selectinload(Album.artist)))).scalars().all()

    ids = [a.id for a in rows]
    stats = await average_ratings_for_albums(db, ids)
    items = [
        _album_to_read_with_artist(a, stats, a.artist.performing_name if a.artist else None)
        for a in rows
    ]
    pages = max(1, ceil(total / page_size)) if total else 1
    meta = PaginatedMeta(total=total, page=page, page_size=page_size, pages=pages)
    return Paginated(items=items, meta=meta)


@router.get("/{album_id}", response_model=AlbumReadWithArtist)
async def get_album(
    album_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AlbumReadWithArtist:
    result = await db.execute(
        select(Album).options(selectinload(Album.artist)).where(Album.id == album_id)
    )
    album = result.scalar_one_or_none()
    if album is None:
        raise HTTPException(status_code=404, detail="Album not found")
    stats = await average_ratings_for_albums(db, [album.id])
    return _album_to_read_with_artist(
        album, stats, album.artist.performing_name if album.artist else None
    )


@router.post("", response_model=AlbumRead, status_code=status.HTTP_201_CREATED)
async def create_album(
    body: AlbumCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
) -> AlbumRead:
    a_check = await db.execute(select(Artist).where(Artist.id == body.artist_id))
    if a_check.scalar_one_or_none() is None:
        raise HTTPException(status_code=400, detail="Artist does not exist")

    album = Album(
        name=body.name,
        price=body.price,
        description=body.description,
        artist_id=body.artist_id,
    )
    db.add(album)
    await db.flush()
    await db.refresh(album)
    stats = await average_ratings_for_albums(db, [album.id])
    return _album_to_read(album, stats)


@router.patch("/{album_id}", response_model=AlbumRead)
async def update_album(
    album_id: int,
    body: AlbumUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
) -> AlbumRead:
    result = await db.execute(select(Album).where(Album.id == album_id))
    album = result.scalar_one_or_none()
    if album is None:
        raise HTTPException(status_code=404, detail="Album not found")
    data = body.model_dump(exclude_unset=True)
    if "artist_id" in data and data["artist_id"] is not None:
        a_check = await db.execute(select(Artist).where(Artist.id == data["artist_id"]))
        if a_check.scalar_one_or_none() is None:
            raise HTTPException(status_code=400, detail="Artist does not exist")
    for k, v in data.items():
        setattr(album, k, v)
    await db.flush()
    await db.refresh(album)
    stats = await average_ratings_for_albums(db, [album.id])
    return _album_to_read(album, stats)


@router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_album(
    album_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
) -> None:
    result = await db.execute(select(Album).where(Album.id == album_id))
    album = result.scalar_one_or_none()
    if album is None:
        raise HTTPException(status_code=404, detail="Album not found")
    await db.execute(delete(Album).where(Album.id == album_id))


@router.post("/{album_id}/purchase", status_code=status.HTTP_201_CREATED)
async def purchase_album(
    album_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
) -> dict[str, str]:
    album = (await db.execute(select(Album).where(Album.id == album_id))).scalar_one_or_none()
    if album is None:
        raise HTTPException(status_code=404, detail="Album not found")
    existing = (
        await db.execute(
            select(Purchase).where(
                Purchase.user_id == user.id,
                Purchase.album_id == album_id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Already purchased")
    db.add(Purchase(user_id=user.id, album_id=album_id))
    return {"detail": "Purchase complete", "album": album.name}

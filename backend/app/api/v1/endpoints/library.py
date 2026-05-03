from math import ceil
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.album import Album
from app.models.purchase import Purchase
from app.models.rating import Rating
from app.schemas.common import PaginatedMeta
from app.schemas.library import LibraryItem
from app.schemas.pagination import Paginated
from app.services.album_stats import average_ratings_for_albums

router = APIRouter()


@router.get("/library", response_model=Paginated[LibraryItem])
async def my_library(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = Query("purchased_at", pattern="^(purchased_at|album_name|price)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
) -> Paginated[LibraryItem]:
    stmt = (
        select(Purchase)
        .where(Purchase.user_id == user.id)
        .join(Album, Purchase.album_id == Album.id)
        .options(selectinload(Purchase.album).selectinload(Album.artist))
    )
    count_stmt = select(func.count()).select_from(Purchase).where(Purchase.user_id == user.id)

    total = int((await db.execute(count_stmt)).scalar_one())

    if sort == "purchased_at":
        order_col = Purchase.purchased_at
    elif sort == "album_name":
        order_col = Album.name
    else:
        order_col = Album.price

    if order == "desc":
        order_col = order_col.desc()
    stmt = stmt.order_by(order_col).offset((page - 1) * page_size).limit(page_size)

    rows = (await db.execute(stmt)).scalars().all()
    album_ids = [p.album_id for p in rows]
    stats = await average_ratings_for_albums(db, album_ids)

    ratings_rows = (
        (
            await db.execute(
                select(Rating).where(Rating.user_id == user.id, Rating.album_id.in_(album_ids))
            )
        )
        .scalars()
        .all()
    )
    rating_map = {r.album_id: r.score for r in ratings_rows}

    items: list[LibraryItem] = []
    for p in rows:
        al = p.album
        if al is None:
            continue
        artist_name = al.artist.performing_name if al.artist else ""
        avg, _ = stats.get(al.id, (None, 0))
        items.append(
            LibraryItem(
                purchase_id=p.id,
                purchased_at=p.purchased_at,
                album_id=al.id,
                album_name=al.name,
                price=al.price,
                artist_performing_name=artist_name,
                average_rating=avg,
                user_rating=rating_map.get(al.id),
            )
        )

    pages = max(1, ceil(total / page_size)) if total else 1
    meta = PaginatedMeta(total=total, page=page, page_size=page_size, pages=pages)
    return Paginated(items=items, meta=meta)

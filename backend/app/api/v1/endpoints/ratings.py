from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.album import Album
from app.models.purchase import Purchase
from app.models.rating import Rating
from app.schemas.rating import RatingCreate, RatingRead
from app.services.album_stats import average_ratings_for_albums

router = APIRouter()


@router.put("/albums/{album_id}/rating", response_model=RatingRead)
async def upsert_rating(
    album_id: int,
    body: RatingCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
) -> RatingRead:
    album = (await db.execute(select(Album).where(Album.id == album_id))).scalar_one_or_none()
    if album is None:
        raise HTTPException(status_code=404, detail="Album not found")

    owned = (
        await db.execute(
            select(Purchase).where(Purchase.user_id == user.id, Purchase.album_id == album_id)
        )
    ).scalar_one_or_none()
    if owned is None:
        raise HTTPException(status_code=403, detail="Purchase required before rating")

    existing = (
        await db.execute(
            select(Rating).where(Rating.user_id == user.id, Rating.album_id == album_id)
        )
    ).scalar_one_or_none()

    if existing:
        existing.score = body.score
    else:
        db.add(Rating(user_id=user.id, album_id=album_id, score=body.score))

    await db.flush()
    # Average for response freshness
    stats = await average_ratings_for_albums(db, [album_id])
    _, _ = stats.get(album_id, (None, 0))
    return RatingRead(album_id=album_id, score=body.score, user_has_rated=True)

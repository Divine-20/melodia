from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rating import Rating


async def average_ratings_for_albums(
    db: AsyncSession, album_ids: list[int]
) -> dict[int, tuple[float | None, int]]:
    if not album_ids:
        return {}
    stmt = (
        select(Rating.album_id, func.avg(Rating.score).label("avg"), func.count(Rating.id).label("cnt"))
        .where(Rating.album_id.in_(album_ids))
        .group_by(Rating.album_id)
    )
    result = await db.execute(stmt)
    out: dict[int, tuple[float | None, int]] = {}
    for row in result.all():
        avg_val = float(row.avg) if row.avg is not None else None
        out[row.album_id] = (avg_val, int(row.cnt))
    return out

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class LibraryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    purchase_id: int
    purchased_at: datetime
    album_id: int
    album_name: str
    album_photo_url: str | None = None
    price: Decimal
    artist_performing_name: str
    artist_picture_url: str | None = None
    average_rating: float | None
    user_rating: int | None

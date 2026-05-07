from datetime import datetime
from decimal import Decimal

from pydantic import AnyUrl, BaseModel, ConfigDict, Field


class AlbumBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    price: Decimal = Field(gt=Decimal("0"), max_digits=10, decimal_places=2)
    description: str | None = None
    photo_url: AnyUrl | None = None
    artist_id: int


class AlbumCreate(AlbumBase):
    pass


class AlbumUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    price: Decimal | None = Field(default=None, gt=Decimal("0"), max_digits=10, decimal_places=2)
    description: str | None = None
    photo_url: AnyUrl | None = None
    artist_id: int | None = None


class AlbumRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price: Decimal
    description: str | None
    photo_url: str | None
    artist_id: int
    average_rating: float | None = None
    rating_count: int = 0
    created_at: datetime
    updated_at: datetime


class AlbumReadWithArtist(AlbumRead):
    artist_performing_name: str | None = None
    artist_picture_url: str | None = None

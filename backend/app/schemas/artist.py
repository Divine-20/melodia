from datetime import date, datetime

from pydantic import AnyUrl, BaseModel, ConfigDict, Field


class ArtistBase(BaseModel):
    real_name: str = Field(min_length=1, max_length=255)
    date_of_birth: date
    performing_name: str = Field(min_length=1, max_length=255)
    bio: str | None = None
    picture_url: AnyUrl | None = None


class ArtistCreate(ArtistBase):
    pass


class ArtistUpdate(BaseModel):
    real_name: str | None = Field(default=None, min_length=1, max_length=255)
    date_of_birth: date | None = None
    performing_name: str | None = Field(default=None, min_length=1, max_length=255)
    bio: str | None = None
    picture_url: AnyUrl | None = None


class ArtistRead(ArtistBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime

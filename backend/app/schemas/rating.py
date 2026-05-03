from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    score: int = Field(ge=1, le=5)


class RatingRead(BaseModel):
    album_id: int
    score: int
    user_has_rated: bool = True

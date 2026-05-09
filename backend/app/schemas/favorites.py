from pydantic import BaseModel


class FavoriteAlbumIds(BaseModel):
    album_ids: list[int]

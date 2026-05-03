from typing import Generic, TypeVar

from pydantic import BaseModel

from app.schemas.common import PaginatedMeta

T = TypeVar("T")


class Paginated(BaseModel, Generic[T]):
    items: list[T]
    meta: PaginatedMeta

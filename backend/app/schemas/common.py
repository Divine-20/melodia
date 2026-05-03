from pydantic import BaseModel


class Message(BaseModel):
    detail: str


class PaginatedMeta(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int

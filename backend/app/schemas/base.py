from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    meta: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    success: bool = False
    data: None = None
    error: ErrorDetail


class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: list[T]
    meta: PaginationMeta

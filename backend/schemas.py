from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class VideoCreate(BaseModel):
    url: str
    title: str | None = None
    tags: list[str] = []


class VideoUpdate(BaseModel):
    title: str | None = None
    tags: list[str] | None = None
    category: str | None = None


class VideoResponse(BaseModel):
    id: str
    url: str
    platform: str
    title: str | None
    tags: list[str]
    transcript: str | None
    status: str
    language: str | None
    duration_seconds: float | None
    error_message: str | None
    category: str | None
    created_at: datetime
    transcribed_at: datetime | None

    model_config = {"from_attributes": True}

    @field_validator("id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v


class TagCount(BaseModel):
    tag: str
    count: int


class PaginatedVideos(BaseModel):
    items: list[VideoResponse]
    total: int
    page: int
    pages: int

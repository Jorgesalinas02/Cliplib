from __future__ import annotations

import math
import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status

from background import run_transcription
from database import get_pool
from schemas import PaginatedVideos, TagCount, VideoCreate, VideoResponse, VideoUpdate
from services.platform import validate_url
from services.categorization import CATEGORIES

router = APIRouter()


def _row_to_video(row) -> VideoResponse:
    data = dict(row)
    data["id"] = str(data["id"])
    return VideoResponse(**data)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=VideoResponse)
async def create_video(
    payload: VideoCreate,
    background_tasks: BackgroundTasks,
    pool=Depends(get_pool),
):
    is_valid, platform = validate_url(payload.url)
    if not is_valid:
        raise HTTPException(status_code=400, detail="URL no soportada. Solo se aceptan TikTok e Instagram.")

    async with pool.acquire() as db:
        existing = await db.fetchrow("SELECT id FROM videos WHERE url=$1", payload.url)
        if existing:
            raise HTTPException(status_code=409, detail="Este video ya fue guardado anteriormente.")

        video_id = str(uuid.uuid4())
        row = await db.fetchrow(
            """
            INSERT INTO videos (id, url, platform, title, tags, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *
            """,
            video_id,
            payload.url,
            platform,
            payload.title,
            payload.tags,
        )

    background_tasks.add_task(run_transcription, video_id, payload.url, pool)
    return _row_to_video(row)


@router.get("", response_model=PaginatedVideos)
async def list_videos(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, le=100),
    tags: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    q: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    saved: Optional[bool] = Query(default=None),
    pool=Depends(get_pool),
):
    offset = (page - 1) * limit
    conditions = []
    params: list = []
    idx = 1

    if q:
        conditions.append(f"search_vector @@ plainto_tsquery('spanish', ${idx})")
        params.append(q)
        idx += 1

    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            conditions.append(f"tags && ${idx}::text[]")
            params.append(tag_list)
            idx += 1

    if status_filter:
        conditions.append(f"status = ${idx}")
        params.append(status_filter)
        idx += 1

    if category:
        conditions.append(f"category = ${idx}")
        params.append(category)
        idx += 1

    if saved is not None:
        conditions.append(f"saved = ${idx}")
        params.append(saved)
        idx += 1

    where_clause = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    async with pool.acquire() as db:
        total_row = await db.fetchrow(
            f"SELECT COUNT(*) as count FROM videos {where_clause}", *params
        )
        total = total_row["count"]

        rows = await db.fetch(
            f"""
            SELECT * FROM videos
            {where_clause}
            ORDER BY created_at DESC
            LIMIT ${idx} OFFSET ${idx + 1}
            """,
            *params,
            limit,
            offset,
        )

    pages = math.ceil(total / limit) if total > 0 else 1
    items = [_row_to_video(r) for r in rows]
    return PaginatedVideos(items=items, total=total, page=page, pages=pages)


@router.get("/categories", response_model=list[str])
async def list_categories():
    return CATEGORIES


@router.get("/tags", response_model=list[TagCount])
async def list_tags(pool=Depends(get_pool)):
    async with pool.acquire() as db:
        rows = await db.fetch(
            "SELECT unnest(tags) as tag, COUNT(*) as count FROM videos GROUP BY tag ORDER BY count DESC"
        )
    return [TagCount(tag=r["tag"], count=r["count"]) for r in rows]


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(video_id: str, pool=Depends(get_pool)):
    async with pool.acquire() as db:
        row = await db.fetchrow("SELECT * FROM videos WHERE id=$1", video_id)
    if not row:
        raise HTTPException(status_code=404, detail="Video no encontrado.")
    return _row_to_video(row)


@router.patch("/{video_id}", response_model=VideoResponse)
async def update_video(video_id: str, payload: VideoUpdate, pool=Depends(get_pool)):
    async with pool.acquire() as db:
        row = await db.fetchrow("SELECT * FROM videos WHERE id=$1", video_id)
        if not row:
            raise HTTPException(status_code=404, detail="Video no encontrado.")

        updates = []
        params: list = []
        idx = 1

        if payload.title is not None:
            updates.append(f"title = ${idx}")
            params.append(payload.title)
            idx += 1

        if payload.tags is not None:
            updates.append(f"tags = ${idx}")
            params.append(payload.tags)
            idx += 1

        if payload.category is not None:
            updates.append(f"category = ${idx}")
            params.append(payload.category if payload.category != "" else None)
            idx += 1

        if payload.saved is not None:
            updates.append(f"saved = ${idx}")
            params.append(payload.saved)
            idx += 1

        if not updates:
            return _row_to_video(row)

        params.append(video_id)
        updated = await db.fetchrow(
            f"UPDATE videos SET {', '.join(updates)} WHERE id=${idx} RETURNING *",
            *params,
        )

    return _row_to_video(updated)


@router.post("/{video_id}/retry", response_model=VideoResponse)
async def retry_transcription(
    video_id: str,
    background_tasks: BackgroundTasks,
    pool=Depends(get_pool),
):
    async with pool.acquire() as db:
        row = await db.fetchrow("SELECT * FROM videos WHERE id=$1", video_id)
        if not row:
            raise HTTPException(status_code=404, detail="Video no encontrado.")

        updated = await db.fetchrow(
            "UPDATE videos SET status='pending', error_message=NULL WHERE id=$1 RETURNING *",
            video_id,
        )

    background_tasks.add_task(run_transcription, video_id, row["url"], pool)
    return _row_to_video(updated)


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(video_id: str, pool=Depends(get_pool)):
    async with pool.acquire() as db:
        result = await db.execute("DELETE FROM videos WHERE id=$1", video_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Video no encontrado.")

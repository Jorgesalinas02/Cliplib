from __future__ import annotations

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import close_db, init_db
from routers.videos import router as videos_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Cliplib API",
    description="Personal video library — save and transcribe TikTok/Instagram clips.",
    version="1.0.0",
    lifespan=lifespan,
)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
allowed_origins = list({frontend_url, "http://localhost:3000", "http://localhost:3001"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos_router, prefix="/videos", tags=["videos"])


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}

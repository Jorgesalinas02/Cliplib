import asyncpg
import os
from contextlib import asynccontextmanager

pool = None


async def get_pool():
    return pool


async def init_db():
    global pool
    pool = await asyncpg.create_pool(
        os.environ["DATABASE_URL"],
        min_size=2,
        max_size=10,
        ssl="require",
    )


async def close_db():
    global pool
    if pool:
        await pool.close()

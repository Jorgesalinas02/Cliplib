import asyncio
import glob
import os

import yt_dlp
from groq import Groq
from services.categorization import auto_categorize

GROQ_CLIENT = None


def get_groq_client() -> Groq:
    global GROQ_CLIENT
    if GROQ_CLIENT is None:
        GROQ_CLIENT = Groq(api_key=os.environ["GROQ_API_KEY"])
    return GROQ_CLIENT


async def transcribe_video(video_id: str, url: str, pool):
    async with pool.acquire() as db:
        await db.execute("UPDATE videos SET status='processing' WHERE id=$1", video_id)

    tmp_base = f"/tmp/{video_id}"
    tmp_audio = None

    try:
        # 1. Extract metadata (views, likes, description) — no download
        loop = asyncio.get_event_loop()
        info = {}
        try:
            meta_opts = {"quiet": True, "no_warnings": True, "skip_download": True, "socket_timeout": 30}
            info = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: _extract_info(meta_opts, url)),
                timeout=30
            ) or {}
        except Exception:
            pass  # metadata is optional, don't fail the whole pipeline

        view_count  = info.get("view_count")
        like_count  = info.get("like_count")
        description = (info.get("description") or "")[:1000] or None

        async with pool.acquire() as db:
            await db.execute(
                "UPDATE videos SET view_count=$1, like_count=$2, description=$3 WHERE id=$4",
                view_count, like_count, description, video_id
            )

        # 2. Download audio-only stream (no ffmpeg needed)
        ydl_opts = {
            "format": (
                "bestaudio[acodec!=none][vcodec=none]"
                "/bestaudio[acodec!=none]"
                "/best[acodec!=none][height<=480]"
                "/best"
            ),
            "outtmpl": f"{tmp_base}.%(ext)s",
            "quiet": True,
            "no_warnings": True,
            "socket_timeout": 60,
            "retries": 3,
        }

        loop = asyncio.get_event_loop()
        await asyncio.wait_for(
            loop.run_in_executor(None, lambda: _download(ydl_opts, url)),
            timeout=120
        )

        # Find ANY file downloaded with this video_id prefix
        all_files = glob.glob(f"{tmp_base}*")
        audio_files = [f for f in all_files if not f.endswith(".part") and os.path.isfile(f)]

        if not audio_files:
            raise Exception("No se pudo descargar el audio del video.")

        tmp_audio = audio_files[0]
        ext = os.path.splitext(tmp_audio)[1].lstrip(".") or "mp4"

        file_size = os.path.getsize(tmp_audio)
        if file_size > 25 * 1024 * 1024:
            raise Exception("Este video supera el límite de tamaño.")

        transcription = await _transcribe_with_retry(tmp_audio, video_id, ext)

        category = await auto_categorize(transcription.text)

        async with pool.acquire() as db:
            await db.execute(
                """
                UPDATE videos
                SET status='done', transcript=$1, language=$2, transcribed_at=NOW(), category=$3
                WHERE id=$4
                """,
                transcription.text,
                transcription.language,
                category,
                video_id,
            )

    except Exception as e:
        error_msg = str(e)
        # Videos with no speech (music-only, silent) → done with placeholder + Formato Rápido
        if "no audio track" in error_msg.lower() or "no speech" in error_msg.lower():
            async with pool.acquire() as db:
                await db.execute(
                    """
                    UPDATE videos
                    SET status='done', transcript=$1, transcribed_at=NOW(), category='Formato Rápido'
                    WHERE id=$2
                    """,
                    "No hay texto para transcribir.",
                    video_id,
                )
        else:
            async with pool.acquire() as db:
                await db.execute(
                    "UPDATE videos SET status='failed', error_message=$1 WHERE id=$2",
                    error_msg,
                    video_id,
                )
    finally:
        for f in glob.glob(f"{tmp_base}*"):
            try:
                os.remove(f)
            except Exception:
                pass


def _extract_info(opts: dict, url: str) -> dict:
    with yt_dlp.YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=False) or {}


def _download(opts: dict, url: str):
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])


async def _transcribe_with_retry(audio_path: str, video_id: str, ext: str):
    delays = [5, 15, 45]
    last_error = None
    filename = f"{video_id}.{ext}"

    for i, delay in enumerate([0] + delays):
        if delay > 0:
            await asyncio.sleep(delay)
        try:
            client = get_groq_client()
            with open(audio_path, "rb") as f:
                return client.audio.transcriptions.create(
                    file=(filename, f),
                    model="whisper-large-v3",
                    response_format="verbose_json",
                    temperature=0.0,
                )
        except Exception as e:
            last_error = e
            if i == len(delays):
                break

    raise last_error

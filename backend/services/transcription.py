import asyncio
import glob
import os

import imageio_ffmpeg
import yt_dlp
from groq import Groq
from services.categorization import auto_categorize

# Use bundled ffmpeg binary (works on Render without root)
FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()

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
    tmp_audio = f"{tmp_base}.wav"

    try:
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": f"{tmp_base}.%(ext)s",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "wav",
                }
            ],
            "ffmpeg_location": FFMPEG_PATH,
            "quiet": True,
            "no_warnings": True,
            "socket_timeout": 30,
        }

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: _download(ydl_opts, url))

        wav_files = glob.glob(f"{tmp_base}*.wav")
        if not wav_files:
            raise Exception("Audio download failed — no WAV file produced")
        tmp_audio = wav_files[0]

        file_size = os.path.getsize(tmp_audio)
        if file_size > 25 * 1024 * 1024:
            raise Exception("Este video supera el límite de 10 minutos.")

        transcription = await _transcribe_with_retry(tmp_audio, video_id)

        # Auto-categorize from transcript (non-blocking — failure is OK)
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
        async with pool.acquire() as db:
            await db.execute(
                "UPDATE videos SET status='failed', error_message=$1 WHERE id=$2",
                str(e),
                video_id,
            )
    finally:
        for f in glob.glob(f"{tmp_base}*"):
            try:
                os.remove(f)
            except Exception:
                pass


def _download(opts: dict, url: str):
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])


async def _transcribe_with_retry(audio_path: str, video_id: str):
    delays = [5, 15, 45]
    last_error = None

    for i, delay in enumerate([0] + delays):
        if delay > 0:
            await asyncio.sleep(delay)
        try:
            client = get_groq_client()
            with open(audio_path, "rb") as f:
                return client.audio.transcriptions.create(
                    file=(f"{video_id}.wav", f),
                    model="whisper-large-v3",
                    response_format="verbose_json",
                    temperature=0.0,
                )
        except Exception as e:
            last_error = e
            if i == len(delays):
                break

    raise last_error

from services.transcription import transcribe_video


async def run_transcription(video_id: str, url: str, pool):
    await transcribe_video(video_id, url, pool)

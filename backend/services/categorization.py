from __future__ import annotations

import os
import asyncio
from groq import Groq

CATEGORIES = [
    "Deportes",
    "Marketing",
    "Tecnología",
    "Crecimiento personal",
    "Negocios",
    "Formato Rápido",
]

_client: Groq | None = None

def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _client


FORMATO_RAPIDO_THRESHOLD = 100  # words

async def auto_categorize(transcript: str) -> str | None:
    """Use Groq to pick a category for the given transcript. Returns one of CATEGORIES or None."""
    if not transcript or len(transcript.strip()) < 5:
        return None

    # Short videos → Formato Rápido automatically (no API call needed)
    word_count = len(transcript.split())
    if word_count < FORMATO_RAPIDO_THRESHOLD:
        return "Formato Rápido"

    categories_list = "\n".join(f"- {c}" for c in CATEGORIES)
    prompt = (
        f"Categorize the following transcript into EXACTLY ONE of these categories:\n"
        f"{categories_list}\n\n"
        f"Reply with ONLY the category name, nothing else.\n\n"
        f"Transcript:\n{transcript[:3000]}"
    )

    loop = asyncio.get_event_loop()
    try:
        response = await loop.run_in_executor(
            None,
            lambda: get_client().chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=15,
                temperature=0.1,
            ),
        )
        raw = response.choices[0].message.content.strip()
        # Match against known categories (case-insensitive)
        for cat in CATEGORIES:
            if cat.lower() in raw.lower():
                return cat
    except Exception:
        pass

    return None

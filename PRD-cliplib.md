# PRD — Cliplib
## Video Library with AI Transcription

**Version:** 1.0  
**Date:** 2026-05-31  
**Stack:** Next.js 14 (Vercel) · FastAPI (Render) · Neon (PostgreSQL) · Groq Whisper API

---

## 1. Overview

Cliplib is a personal web tool that allows the user to save, classify, and automatically transcribe videos from TikTok and Instagram. The user pastes a URL, the app saves the video reference as a card, and then processes it in the background — extracting only the audio and transcribing it using Groq's Whisper Large v3 API. All transcriptions are stored and searchable.

### Core problem it solves
When consuming content on TikTok or Instagram, valuable information (tutorials, pitches, strategies, frameworks) gets lost in the feed. Cliplib acts as a personal knowledge base where every saved video becomes a searchable, readable document.

---

## 2. Goals

- Save any TikTok or Instagram video URL in under 5 seconds
- Automatically transcribe the video with high accuracy (Whisper Large v3)
- Classify videos with custom tags
- Search across all saved transcriptions
- Zero friction — no accounts, no extensions, just paste and save

---

## 3. Non-goals (out of scope for v1)

- Downloading or storing the actual video file
- Summarizing transcriptions with AI (v2 feature)
- Multi-user support
- Mobile app
- Browser extension
- Support for YouTube, Twitter/X or other platforms

---

## 4. User Stories

### Core flow
- **US-01:** As a user, I want to paste a TikTok or Instagram URL and have it saved as a card immediately, so I can come back to it later.
- **US-02:** As a user, I want the transcription to start automatically after saving the video, without any extra steps from me.
- **US-03:** As a user, I want to see the transcription inside the video card once it's ready, without having to reload the page.
- **US-04:** As a user, I want to add tags to a video card to classify it by topic (marketing, sales, education, etc.).
- **US-05:** As a user, I want to filter my video library by tag, so I can find relevant content quickly.
- **US-06:** As a user, I want to search across all transcriptions by keyword, so I can find what someone said in any video.

### Card management
- **US-07:** As a user, I want to give a video a custom title, so I can identify it without remembering the URL.
- **US-08:** As a user, I want to copy the full transcription to clipboard with one click.
- **US-09:** As a user, I want to open the original video URL from the card.
- **US-10:** As a user, I want to delete a video card from my library.
- **US-11:** As a user, I want to manually trigger a re-transcription if the original failed.

---

## 5. Functional Requirements

### 5.1 Video Card

Each saved video is represented as a card containing:

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `url` | TEXT | Original video URL |
| `platform` | ENUM | `tiktok` or `instagram` |
| `title` | TEXT | Auto-generated or user-edited |
| `tags` | TEXT[] | Array of tag strings |
| `transcript` | TEXT | Full transcription text |
| `status` | ENUM | `pending`, `processing`, `done`, `failed` |
| `language` | TEXT | Detected language of the audio |
| `duration_seconds` | INT | Estimated audio duration |
| `created_at` | TIMESTAMP | Creation date |
| `transcribed_at` | TIMESTAMP | When transcription completed |

### 5.2 URL Validation

- Accepted domains: `tiktok.com`, `vm.tiktok.com`, `instagram.com`, `instagr.am`
- If URL is not from a supported platform, show inline error with clear message
- Auto-detect platform from the URL and display the correct badge on the card

### 5.3 Transcription Pipeline

The transcription flow must be reliable and handle failures gracefully:

```
1. User submits URL
2. Backend validates URL format and platform
3. Record created in DB with status = "pending"
4. Frontend immediately shows card with "Pending" status
5. Background task starts:
   a. yt-dlp downloads audio-only stream to /tmp (max 50MB)
   b. Audio converted to 16kHz mono WAV (required by Whisper)
   c. File sent to Groq API (whisper-large-v3 model)
   d. Transcript saved to DB, status = "done"
   e. Temp files deleted
6. Frontend polls GET /videos/{id} every 5 seconds until status = "done"
7. Transcription appears in card without page reload
```

**Error handling:**
- If yt-dlp fails (private video, geo-block, deleted): status = `failed`, error message stored
- If Groq API fails: retry up to 3 times with exponential backoff (5s, 15s, 45s)
- If audio exceeds 25MB Groq limit: split into chunks and concatenate transcriptions
- Failed cards show a "Retry" button that re-triggers the pipeline

### 5.4 Search

- Full-text search across `title` and `transcript` fields
- Implemented via PostgreSQL `tsvector` and `tsquery` (native full-text search in Neon)
- Search input in the top bar, results filter in real time (debounced 300ms)
- Matching keywords highlighted in the transcript preview

### 5.5 Tag System

- Tags are free-form strings, stored as `TEXT[]` in PostgreSQL
- User can add/remove tags inline on any card
- Filter sidebar or chip row shows all unique tags used across the library
- Clicking a tag filters the library to only cards with that tag
- Multiple tags can be active simultaneously (AND logic)

---

## 6. Technical Architecture

### 6.1 Project Structure

```
cliplib/
├── frontend/                  # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx            # Main library view
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── VideoCard.tsx       # Individual card component
│   │   ├── AddVideoBar.tsx     # URL input bar at the top
│   │   ├── FilterChips.tsx     # Tag filter chips
│   │   ├── SearchBar.tsx       # Full-text search input
│   │   └── TranscriptModal.tsx # Full transcript viewer
│   ├── hooks/
│   │   ├── useVideos.ts        # SWR hook for video list
│   │   └── usePolling.ts       # Polls pending/processing cards
│   └── lib/
│       └── api.ts              # API client (fetch wrapper)
│
├── backend/                   # FastAPI
│   ├── main.py                 # App entrypoint, CORS, routers
│   ├── routers/
│   │   └── videos.py           # All /videos endpoints
│   ├── services/
│   │   ├── transcription.py    # yt-dlp + Groq pipeline
│   │   └── platform.py         # URL validation & platform detection
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── database.py             # Neon connection via asyncpg
│   ├── background.py           # Background task runner
│   └── requirements.txt
│
└── README.md
```

### 6.2 Database Schema (Neon / PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE TYPE platform_enum AS ENUM ('tiktok', 'instagram');
CREATE TYPE status_enum AS ENUM ('pending', 'processing', 'done', 'failed');

CREATE TABLE videos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url               TEXT NOT NULL UNIQUE,
  platform          platform_enum NOT NULL,
  title             TEXT,
  tags              TEXT[] DEFAULT '{}',
  transcript        TEXT,
  error_message     TEXT,
  language          TEXT,
  duration_seconds  INTEGER,
  status            status_enum NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transcribed_at    TIMESTAMPTZ,
  search_vector     TSVECTOR
);

-- Full-text search index
CREATE INDEX idx_videos_search ON videos USING GIN (search_vector);
CREATE INDEX idx_videos_status ON videos (status);
CREATE INDEX idx_videos_tags ON videos USING GIN (tags);
CREATE INDEX idx_videos_created ON videos (created_at DESC);

-- Auto-update search vector on insert/update
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('spanish',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.transcript, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER videos_search_vector_update
  BEFORE INSERT OR UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();
```

### 6.3 API Endpoints

#### `POST /videos`
Creates a new video record and triggers background transcription.

**Request body:**
```json
{
  "url": "https://www.tiktok.com/@user/video/123456789",
  "title": "Optional custom title",
  "tags": ["marketing", "contenido"]
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "url": "...",
  "platform": "tiktok",
  "title": "...",
  "tags": [...],
  "status": "pending",
  "created_at": "..."
}
```

**Error `400`:** Invalid URL or unsupported platform  
**Error `409`:** URL already saved

---

#### `GET /videos`
Returns paginated list of all videos.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20, max: 50) |
| `tags` | string | Comma-separated tag filter |
| `status` | string | Filter by status |
| `q` | string | Full-text search query |

**Response `200`:**
```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "pages": 3
}
```

---

#### `GET /videos/{id}`
Returns a single video with full transcript.

---

#### `PATCH /videos/{id}`
Updates title and/or tags.

**Request body:**
```json
{
  "title": "New title",
  "tags": ["tag1", "tag2"]
}
```

---

#### `POST /videos/{id}/retry`
Re-triggers transcription for a failed video.

---

#### `DELETE /videos/{id}`
Deletes a video card and its transcript.

---

#### `GET /tags`
Returns all unique tags used across the library with usage count.

```json
[
  { "tag": "marketing", "count": 8 },
  { "tag": "ventas", "count": 5 }
]
```

### 6.4 Transcription Service

```python
# services/transcription.py

import yt_dlp
import subprocess
from groq import Groq
import os

GROQ_CLIENT = Groq(api_key=os.environ["GROQ_API_KEY"])

async def transcribe_video(video_id: str, url: str, db):
    # 1. Update status to processing
    await db.execute(
        "UPDATE videos SET status='processing' WHERE id=$1", video_id
    )

    tmp_audio = f"/tmp/{video_id}.wav"

    try:
        # 2. Download audio only with yt-dlp
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": f"/tmp/{video_id}.%(ext)s",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
                "preferredquality": "16000",  # 16kHz for Whisper
            }],
            "quiet": True,
            "no_warnings": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # 3. Send to Groq Whisper
        with open(tmp_audio, "rb") as f:
            transcription = GROQ_CLIENT.audio.transcriptions.create(
                file=(f"{video_id}.wav", f),
                model="whisper-large-v3",
                response_format="verbose_json",  # includes language detection
                temperature=0.0,
            )

        # 4. Save result
        await db.execute("""
            UPDATE videos
            SET status='done',
                transcript=$1,
                language=$2,
                transcribed_at=NOW()
            WHERE id=$3
        """, transcription.text, transcription.language, video_id)

    except Exception as e:
        await db.execute("""
            UPDATE videos
            SET status='failed', error_message=$1
            WHERE id=$2
        """, str(e), video_id)

    finally:
        # Always clean up temp files
        if os.path.exists(tmp_audio):
            os.remove(tmp_audio)
```

### 6.5 Environment Variables

**Backend (Render):**
```env
DATABASE_URL=postgresql://...neon.tech/cliplib
GROQ_API_KEY=gsk_...
FRONTEND_URL=https://cliplib.vercel.app
ENVIRONMENT=production
```

**Frontend (Vercel):**
```env
NEXT_PUBLIC_API_URL=https://cliplib-api.onrender.com
```

---

## 7. Frontend UI Specification

### 7.1 Layout

```
┌─────────────────────────────────────────────────┐
│  TOPBAR: Logo + Stats summary                   │
├─────────────────────────────────────────────────┤
│  ADD VIDEO BAR: URL input + Submit button        │
├─────────────────────────────────────────────────┤
│  FILTERS: Tag chips + Search bar                 │
├─────────────────────────────────────────────────┤
│  GRID: Video cards (responsive, 1-3 columns)     │
│                                                  │
│  [Card] [Card] [Card]                           │
│  [Card] [Card] [Card]                           │
└─────────────────────────────────────────────────┘
```

### 7.2 Video Card States

**Pending state:**
- Platform badge (TikTok / Instagram)
- URL (truncated) + date saved
- Tags (editable inline)
- Message: "En cola para transcribir..."
- Status pill: gray "Pendiente"

**Processing state:**
- Animated progress bar (indeterminate)
- Message: "Extrayendo audio y transcribiendo..."
- Estimated time remaining (based on average processing time)
- Status pill: amber "Transcribiendo" with pulsing dot

**Done state:**
- Status pill: green "Transcrito"
- Transcript preview (3 lines, truncated)
- Action buttons: Copy transcript · Open URL · Edit tags
- "Ver completo →" expands to full transcript modal

**Failed state:**
- Status pill: red "Error"
- Error message (human-readable)
- "Reintentar" button
- Action: Open URL (so user can check if video is still available)

### 7.3 Full Transcript Modal

- Opens on "Ver completo →" click
- Displays full transcript text with proper line breaks
- Copy to clipboard button (top right)
- Tags shown and editable
- Original URL with platform icon
- Date saved and date transcribed
- Language detected badge (e.g., "Español", "English")
- Close button and ESC key support

### 7.4 Real-time Status Updates

- Frontend polls `GET /videos/{id}` every 5 seconds for cards with status `pending` or `processing`
- Uses SWR with `refreshInterval` conditional on status
- When status changes to `done`, card animates into the transcribed state (no full page reload)
- Stop polling when all cards reach terminal state (`done` or `failed`)

---

## 8. Non-functional Requirements

### Performance
- Initial page load < 2 seconds
- Video save (POST) response < 500ms (transcription runs in background)
- Search results appear < 300ms after debounce
- Polling interval: 5 seconds (not configurable in v1)

### Reliability
- Transcription retries: 3 attempts with exponential backoff
- Temp file cleanup: guaranteed via `finally` block regardless of success/failure
- Database connection pooling: min 2, max 10 connections (Neon serverless handles this)

### Security
- CORS: only allow requests from `FRONTEND_URL` env variable
- No authentication in v1 (personal tool, assume trusted environment)
- URL validation before any processing (prevent SSRF)
- No user-provided filenames used in filesystem paths

### Scalability (v1 limits)
- Max video audio duration: 10 minutes (Groq handles longer, but set practical limit)
- Max tags per video: 10
- Library size: no hard limit (PostgreSQL + Neon handles this)

---

## 9. Error Messages (User-facing)

| Scenario | Message |
|---|---|
| Invalid URL | "La URL no es válida. Asegúrate de pegar un enlace de TikTok o Instagram." |
| Unsupported platform | "Solo se admiten videos de TikTok e Instagram por ahora." |
| URL already saved | "Este video ya está en tu biblioteca." |
| Video private/deleted | "No se pudo acceder al video. Puede ser privado o haber sido eliminado." |
| Groq API error | "Error al transcribir. Haz clic en Reintentar para intentarlo de nuevo." |
| Audio too long | "Este video supera el límite de 10 minutos." |
| Network error | "Sin conexión. Verifica tu internet e intenta de nuevo." |

---

## 10. Dependencies

### Backend
```
fastapi>=0.111.0
uvicorn>=0.30.0
asyncpg>=0.29.0
yt-dlp>=2024.5.0
groq>=0.9.0
python-multipart>=0.0.9
httpx>=0.27.0
pydantic>=2.7.0
pydantic-settings>=2.3.0
```

### Frontend
```
next: 14.x
react: 18.x
swr: 2.x
typescript: 5.x
tailwindcss: 3.x
```

---

## 11. Deployment

### Backend (Render)

1. Create a new **Web Service** on Render
2. Connect GitHub repo, set root directory to `/backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Set environment variables (see section 6.5)
6. Instance type: **Free** (sufficient for personal use; note ~30s cold start)

### Frontend (Vercel)

1. Import GitHub repo to Vercel
2. Set root directory to `/frontend`
3. Framework preset: Next.js (auto-detected)
4. Set `NEXT_PUBLIC_API_URL` environment variable
5. Deploy

### Database (Neon)

Run the SQL schema from section 6.2 in your existing Neon project. Create a new database named `cliplib` or use an existing one with a new schema.

---

## 12. Implementation Order (Recommended for Claude Code)

Build in this sequence to always have a working state:

1. **Database** — Run schema migrations on Neon
2. **Backend skeleton** — FastAPI app with health check endpoint, CORS, DB connection
3. **POST /videos** — Save URL to DB, return card data (no transcription yet)
4. **GET /videos** — List all saved videos
5. **Frontend skeleton** — Next.js app, URL input bar, basic card grid
6. **Frontend ↔ Backend integration** — Cards render from real API data
7. **Transcription pipeline** — yt-dlp + Groq in background task
8. **Polling** — Frontend polls until transcription completes
9. **PATCH /videos** — Edit title and tags
10. **DELETE /videos** — Delete cards
11. **Full-text search** — Search endpoint + frontend search bar
12. **Tag filtering** — Filter chips + GET /tags endpoint
13. **Transcript modal** — Full transcript viewer
14. **Error handling** — Failed state, retry button, user-facing error messages
15. **Polish** — Animations, loading states, empty states, responsive layout

---

## 13. Future Improvements (v2)

- **AI summaries** — After transcription, generate a 3-bullet summary using Claude API
- **Smart tagging** — Auto-suggest tags based on transcript content
- **Collections** — Group cards into named collections beyond simple tags
- **Export** — Export transcription as PDF or TXT
- **Search highlights** — Show matching keyword in context within search results
- **Browser extension** — Save videos directly from TikTok/Instagram with one click
- **Webhook** — Notify via email or Slack when transcription completes
- **YouTube support** — Extend yt-dlp support to YouTube videos

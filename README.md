# Cliplib

Biblioteca personal de videos de TikTok e Instagram con transcripción automática via Groq Whisper.

## Stack

- **Frontend**: Next.js 14 · TypeScript · Tailwind CSS · SWR → Vercel
- **Backend**: FastAPI · asyncpg · yt-dlp · Groq Whisper Large v3 → Render
- **Base de datos**: PostgreSQL en Neon

---

## Setup rápido

### 1. Base de datos (Neon)

En tu proyecto Neon, ejecuta el schema:

```bash
psql $DATABASE_URL -f database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edita .env con tu DATABASE_URL y GROQ_API_KEY

pip install -r requirements.txt
uvicorn main:app --reload
```

El backend corre en `http://localhost:8000`. Verifica con `GET /health`.

Asegúrate de tener **ffmpeg** instalado (lo usa yt-dlp para extraer audio):
```bash
brew install ffmpeg   # macOS
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

npm install
npm run dev
```

El frontend corre en `http://localhost:3000`.

---

## Variables de entorno

**Backend** (`backend/.env`):
| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a Neon PostgreSQL |
| `GROQ_API_KEY` | API key de Groq (console.groq.com) |
| `FRONTEND_URL` | URL del frontend para CORS |
| `ENVIRONMENT` | `development` o `production` |

**Frontend** (`frontend/.env.local`):
| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend FastAPI |

---

## Despliegue

### Render (Backend)
1. New Web Service → conectar repo, root dir: `/backend`
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Agregar variables de entorno

### Vercel (Frontend)
1. Importar repo → root dir: `/frontend`
2. Framework: Next.js (auto-detectado)
3. Agregar `NEXT_PUBLIC_API_URL` apuntando al backend de Render

---

## Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/videos` | Guardar video + iniciar transcripción |
| `GET` | `/videos` | Lista paginada (filtros: tags, status, q) |
| `GET` | `/videos/{id}` | Video con transcripción completa |
| `PATCH` | `/videos/{id}` | Editar título y/o tags |
| `POST` | `/videos/{id}/retry` | Reintentar transcripción fallida |
| `DELETE` | `/videos/{id}` | Eliminar video |
| `GET` | `/videos/tags` | Todos los tags con conteo |

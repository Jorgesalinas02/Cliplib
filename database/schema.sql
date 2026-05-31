-- Run this in your Neon project (cliplib database)

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

CREATE INDEX idx_videos_search  ON videos USING GIN (search_vector);
CREATE INDEX idx_videos_status  ON videos (status);
CREATE INDEX idx_videos_tags    ON videos USING GIN (tags);
CREATE INDEX idx_videos_created ON videos (created_at DESC);

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

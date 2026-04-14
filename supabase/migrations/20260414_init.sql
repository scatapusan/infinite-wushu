-- WuXue (武学) — Phase 1 initial schema
-- Run this in the Supabase SQL editor.

-- ─── Modules ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
  id           TEXT PRIMARY KEY,
  title_zh     TEXT NOT NULL,
  title_pinyin TEXT NOT NULL,
  title_en     TEXT NOT NULL,
  description  TEXT,
  sort_order   INT  NOT NULL DEFAULT 0,
  category     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Lessons ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id             TEXT PRIMARY KEY,
  module_id      TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title_zh       TEXT NOT NULL,
  title_pinyin   TEXT NOT NULL,
  title_en       TEXT NOT NULL,
  description    TEXT,
  sort_order     INT  NOT NULL DEFAULT 0,
  chinese_level  INT  NOT NULL DEFAULT 0 CHECK (chinese_level BETWEEN 0 AND 3),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lessons_module_sort ON lessons (module_id, sort_order);

-- ─── Techniques ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS techniques (
  id                TEXT PRIMARY KEY,
  lesson_id         TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  chinese           TEXT NOT NULL,
  pinyin            TEXT NOT NULL,
  english           TEXT NOT NULL,
  description       TEXT,
  key_points        JSONB NOT NULL DEFAULT '[]'::jsonb,
  common_mistakes   JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order        INT  NOT NULL DEFAULT 0,
  video_url         TEXT,
  reference_angles  JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS techniques_lesson_sort ON techniques (lesson_id, sort_order);

-- ─── Quiz questions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id      TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  question       TEXT NOT NULL,
  options        JSONB NOT NULL,          -- array of strings
  correct_index  INT  NOT NULL,
  explanation    TEXT,
  sort_order     INT  NOT NULL DEFAULT 0,
  stable_key     TEXT UNIQUE,             -- used for idempotent seeding
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_questions_lesson_sort ON quiz_questions (lesson_id, sort_order);

-- ─── Lesson status enum + user_progress ───────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_status') THEN
    CREATE TYPE lesson_status AS ENUM ('locked','available','in_progress','completed');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS user_progress (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id      TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status         lesson_status NOT NULL DEFAULT 'in_progress',
  quiz_score     NUMERIC(4,3),
  quiz_attempts  INT NOT NULL DEFAULT 0,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS user_progress_user ON user_progress (user_id);

-- ─── Row level security ───────────────────────────────────────────────────
-- Public content tables: enable RLS AND add a public-read SELECT policy.
-- (Enabling RLS without a SELECT policy silently returns zero rows.)
ALTER TABLE modules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE techniques      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules public read" ON modules;
CREATE POLICY "modules public read" ON modules
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "lessons public read" ON lessons;
CREATE POLICY "lessons public read" ON lessons
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "techniques public read" ON techniques;
CREATE POLICY "techniques public read" ON techniques
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "quiz_questions public read" ON quiz_questions;
CREATE POLICY "quiz_questions public read" ON quiz_questions
  FOR SELECT USING (true);

-- User-scoped progress: only the authed user can touch their own rows.
DROP POLICY IF EXISTS "user_progress own select" ON user_progress;
CREATE POLICY "user_progress own select" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_progress own insert" ON user_progress;
CREATE POLICY "user_progress own insert" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_progress own update" ON user_progress;
CREATE POLICY "user_progress own update" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- No DELETE policy — users cannot wipe progress.

-- ─── Keep updated_at fresh ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_progress_updated_at ON user_progress;
CREATE TRIGGER user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

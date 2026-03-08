-- ============================================================
-- Zetamaxx — Supabase Schema
-- Run this in Supabase → SQL Editor
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
-- gen_random_uuid() is available by default in Supabase.

-- ── Profiles ──────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: own select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles: own insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Game sessions ─────────────────────────────────────────────────────────────
CREATE TABLE public.game_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at         TIMESTAMPTZ NOT NULL,
  duration_seconds   INT NOT NULL,
  settings           JSONB NOT NULL DEFAULT '{}',
  total_correct      INT NOT NULL DEFAULT 0,
  total_attempted    INT NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX idx_game_sessions_started_at ON public.game_sessions(user_id, started_at);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_sessions: own select"
  ON public.game_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "game_sessions: own insert"
  ON public.game_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── Problem attempts ──────────────────────────────────────────────────────────
CREATE TABLE public.problem_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation       TEXT NOT NULL CHECK (operation IN ('addition','subtraction','multiplication','division')),
  operand1        INT NOT NULL,
  operand2        INT NOT NULL,
  correct_answer  INT NOT NULL,
  user_answer     INT,
  is_correct      BOOLEAN NOT NULL,
  time_taken_ms   INT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_problem_attempts_user_id ON public.problem_attempts(user_id);
CREATE INDEX idx_problem_attempts_session_id ON public.problem_attempts(session_id);

ALTER TABLE public.problem_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "problem_attempts: own select"
  ON public.problem_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "problem_attempts: own insert"
  ON public.problem_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── Auto-create profile on signup ─────────────────────────────────────────────
-- This trigger fires when a new auth user is created. It reads the username
-- from raw_user_metadata that we pass during signUp in the client.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

import { createClient } from "@supabase/supabase-js";
import type { GameResult, DbProblemAttempt } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "[Zetamaxx] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.\n" +
      "Check your .env file has both values from your Supabase project dashboard.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  username: string,
) {
  const trimmedUsername = username.trim().toLowerCase();

  // Check username uniqueness before creating auth user
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", trimmedUsername)
    .maybeSingle();

  if (existing) {
    return { data: null, error: new Error("Username already taken") };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { data: { username: trimmedUsername } },
  });

  if (error || !data.user) return { data, error };

  // Create profile — use upsert in case trigger already ran
  await supabase.from("profiles").upsert({
    id: data.user.id,
    username: trimmedUsername,
  });

  return { data, error };
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

// ─── Game persistence ─────────────────────────────────────────────────────────

export async function saveGameResult(result: GameResult, userId: string) {
  // 1. Insert session
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .insert({
      user_id: userId,
      started_at: result.startedAt,
      duration_seconds: result.durationSeconds,
      settings: result.settings,
      total_correct: result.totalCorrect,
      total_attempted: result.totalAttempted,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error("Failed to save session:", sessionError);
    return { error: sessionError };
  }

  // 2. Bulk insert problem attempts
  const attempts: DbProblemAttempt[] = result.attempts.map((a) => ({
    session_id: session.id,
    user_id: userId,
    operation: a.operation,
    operand1: a.operand1,
    operand2: a.operand2,
    correct_answer: a.correctAnswer,
    user_answer: a.userAnswer,
    is_correct: a.isCorrect,
    time_taken_ms: a.timeTakenMs,
  }));

  if (attempts.length > 0) {
    const { error: attemptsError } = await supabase
      .from("problem_attempts")
      .insert(attempts);

    if (attemptsError) {
      console.error("Failed to save attempts:", attemptsError);
    }
  }

  return { sessionId: session.id, error: null };
}

// ─── Insights queries ─────────────────────────────────────────────────────────

export async function fetchAllSessions(userId: string) {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: true });
  return { data, error };
}

export async function fetchAllAttempts(userId: string) {
  const { data, error } = await supabase
    .from("problem_attempts")
    .select("*")
    .eq("user_id", userId);
  return { data, error };
}

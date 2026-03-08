import type {
  GameSession,
  DbProblemAttempt,
  Operation,
  InsightsData,
  OperationStat,
  TimeOfDayStat,
  WeakArea,
  DayOfWeekStat,
  SlowestProblem,
  MultHeatmapCell,
  OperationVolume,
  ImprovementTrend,
} from "../types";

const opSymbols: Record<Operation, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
};

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

export function computeInsights(
  sessions: GameSession[],
  attempts: DbProblemAttempt[],
): InsightsData {
  const totalSessions = sessions.length;
  const totalProblems = attempts.filter((a) => a.is_correct).length;
  const bestScore = sessions.reduce(
    (best, s) => Math.max(best, s.total_correct),
    0,
  );

  const sortedSessions = [...sessions].sort(
    (a, b) =>
      new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  );

  // ── Settings fingerprint (enabled ops + duration) ──────────────────────────
  const settingsKey = (s: GameSession): string => {
    const allOps: Operation[] = [
      "addition",
      "subtraction",
      "multiplication",
      "division",
    ];
    const enabled = allOps.filter(
      (op) => s.settings?.operations?.[op]?.enabled ?? false,
    );
    return `${enabled.join("+")}@${s.duration_seconds}`;
  };
  const ppm = (s: GameSession) =>
    s.duration_seconds > 0
      ? (s.total_correct / s.duration_seconds) * 60
      : s.total_correct;

  // Sessions that share the same settings as the most recent one
  const latestKey =
    sortedSessions.length > 0
      ? settingsKey(sortedSessions[sortedSessions.length - 1])
      : "";
  const matchingSessions = sortedSessions.filter(
    (s) => settingsKey(s) === latestKey,
  );
  // Use matching-settings sessions for score comparisons if we have enough,
  // otherwise fall back to all sessions (still using ppm for normalization).
  const comparableSessions =
    matchingSessions.length >= 5 ? matchingSessions : sortedSessions;
  const sameSettingsOnly = matchingSessions.length >= 5;

  // ── Score trend (last 30 sessions) ─────────────────────────────────────────
  const scoreTrend = sortedSessions.slice(-30).map((s) => ({
    date: new Date(s.started_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: s.total_correct,
    sessionId: s.id,
  }));

  // ── Improvement trend (last 5 vs previous 5, same settings, ppm) ────────────
  const avgPpm = (arr: GameSession[]) =>
    arr.reduce((s, x) => s + ppm(x), 0) / arr.length;
  let improvementTrend: ImprovementTrend = {
    recent5Avg: 0,
    prev5Avg: 0,
    changePct: null,
    sameSettingsOnly,
  };
  if (comparableSessions.length >= 5) {
    const recent5 = comparableSessions.slice(-5);
    const prev5 = comparableSessions.slice(-10, -5);
    const recent5Avg = Math.round(avgPpm(recent5) * 10) / 10;
    const prev5Avg =
      prev5.length > 0 ? Math.round(avgPpm(prev5) * 10) / 10 : null;
    const changePct =
      prev5Avg != null && prev5Avg > 0
        ? Math.round(((recent5Avg - prev5Avg) / prev5Avg) * 1000) / 10
        : null;
    improvementTrend = {
      recent5Avg,
      prev5Avg: prev5Avg ?? 0,
      changePct,
      sameSettingsOnly,
    };
  }

  // ── Consistency (std dev of last 10 ppm values, same settings) ───────────────
  const last10Ppm = comparableSessions.slice(-10).map((s) => ppm(s));
  const consistencyScore =
    last10Ppm.length >= 3
      ? stdDev(last10Ppm.map((v) => Math.round(v * 10) / 10))
      : null;

  // ── Per-operation stats ────────────────────────────────────────────────────
  const ops: Operation[] = [
    "addition",
    "subtraction",
    "multiplication",
    "division",
  ];
  const operationStats: OperationStat[] = ops.map((op) => {
    const opAttempts = attempts.filter((a) => a.operation === op);
    const correct = opAttempts.filter((a) => a.is_correct).length;
    const avgTimeSec =
      opAttempts.length > 0
        ? opAttempts.reduce((sum, a) => sum + a.time_taken_ms, 0) /
          opAttempts.length /
          1000
        : 0;
    return {
      operation: op,
      totalAttempts: opAttempts.length,
      correctAttempts: correct,
      accuracy: 0,
      avgTimeSec: Math.round(avgTimeSec * 10) / 10,
    };
  });

  // ── Operation volume ───────────────────────────────────────────────────────
  const totalAttempts = attempts.length;
  const operationVolume: OperationVolume[] = ops
    .map((op) => {
      const count = attempts.filter((a) => a.operation === op).length;
      return {
        operation: op,
        count,
        pct: totalAttempts > 0 ? Math.round((count / totalAttempts) * 100) : 0,
      };
    })
    .filter((v) => v.count > 0);

  // ── Time of day (avg raw score) ──────────────────────────────────────────
  const hourBuckets = new Array(24)
    .fill(null)
    .map(() => ({ totalScore: 0, count: 0 }));
  for (const s of sessions) {
    const hour = new Date(s.started_at).getHours();
    hourBuckets[hour].totalScore += s.total_correct;
    hourBuckets[hour].count += 1;
  }
  const timeOfDay: TimeOfDayStat[] = hourBuckets.map((b, hour) => ({
    hour,
    avgScore: b.count > 0 ? Math.round((b.totalScore / b.count) * 10) / 10 : 0,
    sessionCount: b.count,
  }));

  // ── Day of week (avg raw score) ─────────────────────────────────────────────
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayBuckets = new Array(7)
    .fill(null)
    .map(() => ({ totalScore: 0, count: 0 }));
  for (const s of sessions) {
    const day = new Date(s.started_at).getDay();
    dayBuckets[day].totalScore += s.total_correct;
    dayBuckets[day].count += 1;
  }
  const dayOfWeek: DayOfWeekStat[] = dayBuckets.map((b, day) => ({
    day,
    label: dayLabels[day],
    avgScore: b.count > 0 ? Math.round((b.totalScore / b.count) * 10) / 10 : 0,
    sessionCount: b.count,
  }));

  // ── Per-problem map (shared by weak areas, slowest, heatmap) ───────────────
  const problemMap = new Map<
    string,
    {
      op: Operation;
      a: number;
      b: number;
      attempts: number;
      correct: number;
      totalTimeMs: number;
    }
  >();
  for (const a of attempts) {
    const key = `${a.operation}:${a.operand1}:${a.operand2}`;
    const existing = problemMap.get(key);
    if (existing) {
      existing.attempts++;
      if (a.is_correct) existing.correct++;
      existing.totalTimeMs += a.time_taken_ms;
    } else {
      problemMap.set(key, {
        op: a.operation,
        a: a.operand1,
        b: a.operand2,
        attempts: 1,
        correct: a.is_correct ? 1 : 0,
        totalTimeMs: a.time_taken_ms,
      });
    }
  }

  // ── Weak areas (most frequently missed problems) ───────────────────────────
  const weakAreas: WeakArea[] = Array.from(problemMap.values())
    .filter((p) => p.attempts >= 3 && p.correct < p.attempts)
    .map((p) => {
      const avgTimeSec =
        Math.round((p.totalTimeMs / p.attempts / 1000) * 10) / 10;
      return {
        operation: p.op,
        operand1: p.a,
        operand2: p.b,
        displayStr: `${p.a} ${opSymbols[p.op]} ${p.b}`,
        attempts: p.attempts,
        accuracy: p.correct / p.attempts,
        avgTimeSec,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy || b.avgTimeSec - a.avgTimeSec)
    .slice(0, 15);

  // ── Slowest problems (by avg response time, ≥3 attempts) ──────────────────
  const slowestProblems: SlowestProblem[] = Array.from(problemMap.values())
    .filter((p) => p.attempts >= 3)
    .map((p) => ({
      operation: p.op,
      operand1: p.a,
      operand2: p.b,
      displayStr: `${p.a} ${opSymbols[p.op]} ${p.b}`,
      avgTimeSec: Math.round((p.totalTimeMs / p.attempts / 1000) * 10) / 10,
      attempts: p.attempts,
    }))
    .sort((a, b) => b.avgTimeSec - a.avgTimeSec)
    .slice(0, 15);

  // ── Multiplication table heatmap (2–12 × 2–12) ────────────────────────────
  const multHeatmap: MultHeatmapCell[] = [];
  for (let a = 2; a <= 12; a++) {
    for (let b = 2; b <= 12; b++) {
      // Check both orderings (commutative)
      const keyAB = `multiplication:${a * b}:${a}`;
      const keyBA = `multiplication:${a * b}:${b}`;
      const entryAB = problemMap.get(keyAB);
      const entryBA = problemMap.get(keyBA);
      const combined = [entryAB, entryBA].filter(Boolean);
      if (combined.length === 0) {
        multHeatmap.push({ a, b, avgTimeSec: null, attempts: 0 });
      } else {
        const totalMs = combined.reduce((s, e) => s + e!.totalTimeMs, 0);
        const totalAtt = combined.reduce((s, e) => s + e!.attempts, 0);
        multHeatmap.push({
          a,
          b,
          avgTimeSec: Math.round((totalMs / totalAtt / 1000) * 10) / 10,
          attempts: totalAtt,
        });
      }
    }
  }

  // ── Operation time trend (avg response time per op per session, last 30) ───
  const operationTimeTrend = sortedSessions.slice(-30).map((s) => {
    const sa = attempts.filter((a) => a.session_id === s.id);
    const date = new Date(s.started_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const getAvg = (op: Operation): number | null => {
      const oa = sa.filter((a) => a.operation === op);
      if (oa.length === 0) return null;
      return (
        Math.round(
          (oa.reduce((sum, a) => sum + a.time_taken_ms, 0) / oa.length / 1000) *
            10,
        ) / 10
      );
    };
    return {
      date,
      sessionId: s.id,
      addition: getAvg("addition"),
      subtraction: getAvg("subtraction"),
      multiplication: getAvg("multiplication"),
      division: getAvg("division"),
    };
  });

  // ── Streak ─────────────────────────────────────────────────────────────────
  const playedDays = new Set(
    sessions.map((s) => new Date(s.started_at).toISOString().split("T")[0]),
  );
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (playedDays.has(key)) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    scoreTrend,
    operationTimeTrend,
    operationStats,
    timeOfDay,
    dayOfWeek,
    weakAreas,
    slowestProblems,
    multHeatmap,
    operationVolume,
    improvementTrend,
    totalSessions,
    totalProblems,
    overallAccuracy: 0,
    bestScore,
    currentStreak,
    consistencyScore,
  };
}

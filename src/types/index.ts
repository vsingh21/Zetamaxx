export type Operation =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division";

export interface OperationConfig {
  enabled: boolean;
  min1: number;
  max1: number;
  min2: number;
  max2: number;
}

export interface GameSettings {
  duration: number; // seconds
  showTimerBar: boolean;
  preset: string; // preset id, or "custom"
  operations: Record<Operation, OperationConfig>;
}

export interface Problem {
  operation: Operation;
  operand1: number;
  operand2: number;
  answer: number;
  displayStr: string; // e.g. "12 + 34"
}

export interface ProblemAttempt {
  operation: Operation;
  operand1: number;
  operand2: number;
  correctAnswer: number;
  userAnswer: number | null;
  isCorrect: boolean;
  timeTakenMs: number;
}

export interface GameResult {
  settings: GameSettings;
  attempts: ProblemAttempt[];
  totalCorrect: number;
  totalAttempted: number;
  startedAt: string; // ISO
  durationSeconds: number;
}

export interface Profile {
  id: string;
  username: string;
  created_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  started_at: string;
  duration_seconds: number;
  settings: GameSettings;
  total_correct: number;
  total_attempted: number;
}

export interface DbProblemAttempt {
  id?: string;
  session_id: string;
  user_id: string;
  operation: Operation;
  operand1: number;
  operand2: number;
  correct_answer: number;
  user_answer: number | null;
  is_correct: boolean;
  time_taken_ms: number;
  created_at?: string;
}

// Insights
export interface OperationStat {
  operation: Operation;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  avgTimeSec: number;
}

export interface TimeOfDayStat {
  hour: number;
  avgScore: number;
  sessionCount: number;
}

export interface WeakArea {
  operation: Operation;
  operand1: number;
  operand2: number;
  displayStr: string;
  attempts: number;
  accuracy: number;
  avgTimeSec: number;
}

export interface DayOfWeekStat {
  day: number; // 0 = Sun, 6 = Sat
  label: string;
  avgScore: number;
  sessionCount: number;
}

export interface SlowestProblem {
  operation: Operation;
  operand1: number;
  operand2: number;
  displayStr: string;
  avgTimeSec: number;
  attempts: number;
}

export interface MultHeatmapCell {
  a: number;
  b: number;
  avgTimeSec: number | null; // null = no data
  attempts: number;
}

export interface OperationVolume {
  operation: Operation;
  count: number;
  pct: number;
}

export interface ImprovementTrend {
  recent5Avg: number; // ppm units
  prev5Avg: number; // ppm units
  changePct: number | null; // null if not enough data
  sameSettingsOnly: boolean; // true = only compared sessions with identical settings
}

export interface InsightsData {
  scoreTrend: { date: string; score: number; sessionId: string }[];
  operationTimeTrend: {
    date: string;
    sessionId: string;
    addition: number | null;
    subtraction: number | null;
    multiplication: number | null;
    division: number | null;
  }[];
  operationStats: OperationStat[];
  timeOfDay: TimeOfDayStat[];
  dayOfWeek: DayOfWeekStat[];
  weakAreas: WeakArea[];
  slowestProblems: SlowestProblem[];
  multHeatmap: MultHeatmapCell[];
  operationVolume: OperationVolume[];
  improvementTrend: ImprovementTrend;
  totalSessions: number;
  totalProblems: number;
  overallAccuracy: number;
  bestScore: number;
  currentStreak: number;
  consistencyScore: number | null; // std dev of last 10 scores, null if < 3
}

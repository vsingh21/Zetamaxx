import type { GameSettings, Operation, Problem } from "../types";

export const DEFAULT_SETTINGS: GameSettings = {
  duration: 120,
  operations: {
    addition: { enabled: true, min1: 2, max1: 100, min2: 2, max2: 100 },
    subtraction: { enabled: true, min1: 2, max1: 100, min2: 2, max2: 100 },
    multiplication: { enabled: true, min1: 2, max1: 12, min2: 2, max2: 100 },
    division: { enabled: true, min1: 2, max1: 12, min2: 2, max2: 100 },
  },
};

export const DURATION_OPTIONS = [
  { label: "30 seconds", value: 30 },
  { label: "60 seconds", value: 60 },
  { label: "90 seconds", value: 90 },
  { label: "120 seconds", value: 120 },
  { label: "180 seconds", value: 180 },
  { label: "300 seconds", value: 300 },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const OPERATION_SYMBOLS: Record<Operation, string> = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
};

export function generateProblem(settings: GameSettings): Problem {
  const enabledOps = (
    Object.entries(settings.operations) as [
      Operation,
      (typeof settings.operations)[Operation],
    ][]
  )
    .filter(([, cfg]) => cfg.enabled)
    .map(([op]) => op);

  if (enabledOps.length === 0) throw new Error("No operations enabled");

  const operation = enabledOps[Math.floor(Math.random() * enabledOps.length)];
  const cfg = settings.operations[operation];

  if (operation === "addition") {
    const a = randInt(cfg.min1, cfg.max1);
    const b = randInt(cfg.min2, cfg.max2);
    return {
      operation,
      operand1: a,
      operand2: b,
      answer: a + b,
      displayStr: `${a} + ${b}`,
    };
  }

  if (operation === "subtraction") {
    // Use addition ranges, ask a+b - b (answer is always a)
    const a = randInt(cfg.min1, cfg.max1);
    const b = randInt(cfg.min2, cfg.max2);
    const sum = a + b;
    return {
      operation,
      operand1: sum,
      operand2: b,
      answer: a,
      displayStr: `${sum} ${OPERATION_SYMBOLS.subtraction} ${b}`,
    };
  }

  if (operation === "multiplication") {
    const a = randInt(cfg.min1, cfg.max1);
    const b = randInt(cfg.min2, cfg.max2);
    return {
      operation,
      operand1: a,
      operand2: b,
      answer: a * b,
      displayStr: `${a} ${OPERATION_SYMBOLS.multiplication} ${b}`,
    };
  }

  // division — both factors drawn from min1/max1 (same as multiplication's first range)
  // e.g. with range (2–12): 6 × 7 = 42 → 42 ÷ 6 = 7
  const a = randInt(cfg.min1, cfg.max1);
  const b = randInt(cfg.min1, cfg.max1);
  const product = a * b;
  return {
    operation,
    operand1: product,
    operand2: a,
    answer: b,
    displayStr: `${product} ${OPERATION_SYMBOLS.division} ${a}`,
  };
}

export function operationLabel(op: Operation): string {
  const labels: Record<Operation, string> = {
    addition: "Addition",
    subtraction: "Subtraction",
    multiplication: "Multiplication",
    division: "Division",
  };
  return labels[op];
}

export function operationColor(op: Operation): string {
  const colors: Record<Operation, string> = {
    addition: "#3b82f6",
    subtraction: "#8b5cf6",
    multiplication: "#10b981",
    division: "#f59e0b",
  };
  return colors[op];
}

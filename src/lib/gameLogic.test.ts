import { describe, it, expect } from "vitest";
import {
  generateProblem,
  operationLabel,
  operationColor,
  DEFAULT_SETTINGS,
} from "./gameLogic";
import type { GameSettings } from "../types";

// ── generateProblem ──────────────────────────────────────────────────────────

describe("generateProblem", () => {
  it("throws when no operations are enabled", () => {
    const settings: GameSettings = {
      ...DEFAULT_SETTINGS,
      operations: {
        addition: { ...DEFAULT_SETTINGS.operations.addition, enabled: false },
        subtraction: {
          ...DEFAULT_SETTINGS.operations.subtraction,
          enabled: false,
        },
        multiplication: {
          ...DEFAULT_SETTINGS.operations.multiplication,
          enabled: false,
        },
        division: {
          ...DEFAULT_SETTINGS.operations.division,
          enabled: false,
        },
      },
    };
    expect(() => generateProblem(settings)).toThrow("No operations enabled");
  });

  it("addition: answer equals operand1 + operand2", () => {
    const settings: GameSettings = {
      ...DEFAULT_SETTINGS,
      operations: {
        ...DEFAULT_SETTINGS.operations,
        subtraction: {
          ...DEFAULT_SETTINGS.operations.subtraction,
          enabled: false,
        },
        multiplication: {
          ...DEFAULT_SETTINGS.operations.multiplication,
          enabled: false,
        },
        division: {
          ...DEFAULT_SETTINGS.operations.division,
          enabled: false,
        },
      },
    };

    for (let i = 0; i < 20; i++) {
      const p = generateProblem(settings);
      expect(p.operation).toBe("addition");
      expect(p.answer).toBe(p.operand1 + p.operand2);
    }
  });

  it("subtraction: answer is non-negative and operand1 - operand2 === answer", () => {
    const settings: GameSettings = {
      ...DEFAULT_SETTINGS,
      operations: {
        ...DEFAULT_SETTINGS.operations,
        addition: {
          ...DEFAULT_SETTINGS.operations.addition,
          enabled: false,
        },
        multiplication: {
          ...DEFAULT_SETTINGS.operations.multiplication,
          enabled: false,
        },
        division: {
          ...DEFAULT_SETTINGS.operations.division,
          enabled: false,
        },
      },
    };

    for (let i = 0; i < 20; i++) {
      const p = generateProblem(settings);
      expect(p.operation).toBe("subtraction");
      expect(p.operand1 - p.operand2).toBe(p.answer);
      expect(p.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("multiplication: answer equals operand1 * operand2", () => {
    const settings: GameSettings = {
      ...DEFAULT_SETTINGS,
      operations: {
        ...DEFAULT_SETTINGS.operations,
        addition: {
          ...DEFAULT_SETTINGS.operations.addition,
          enabled: false,
        },
        subtraction: {
          ...DEFAULT_SETTINGS.operations.subtraction,
          enabled: false,
        },
        division: {
          ...DEFAULT_SETTINGS.operations.division,
          enabled: false,
        },
      },
    };

    for (let i = 0; i < 20; i++) {
      const p = generateProblem(settings);
      expect(p.operation).toBe("multiplication");
      expect(p.answer).toBe(p.operand1 * p.operand2);
    }
  });

  it("division: operand1 / operand2 === answer with no remainder", () => {
    const settings: GameSettings = {
      ...DEFAULT_SETTINGS,
      operations: {
        ...DEFAULT_SETTINGS.operations,
        addition: {
          ...DEFAULT_SETTINGS.operations.addition,
          enabled: false,
        },
        subtraction: {
          ...DEFAULT_SETTINGS.operations.subtraction,
          enabled: false,
        },
        multiplication: {
          ...DEFAULT_SETTINGS.operations.multiplication,
          enabled: false,
        },
      },
    };

    for (let i = 0; i < 20; i++) {
      const p = generateProblem(settings);
      expect(p.operation).toBe("division");
      expect(p.operand1 % p.operand2).toBe(0);
      expect(p.operand1 / p.operand2).toBe(p.answer);
    }
  });

  it("operands respect configured min/max ranges", () => {
    const settings: GameSettings = {
      duration: 60,
      showTimerBar: true,
      preset: "custom",
      operations: {
        addition: { enabled: true, min1: 5, max1: 10, min2: 3, max2: 7 },
        subtraction: {
          ...DEFAULT_SETTINGS.operations.subtraction,
          enabled: false,
        },
        multiplication: {
          ...DEFAULT_SETTINGS.operations.multiplication,
          enabled: false,
        },
        division: {
          ...DEFAULT_SETTINGS.operations.division,
          enabled: false,
        },
      },
    };

    for (let i = 0; i < 50; i++) {
      const p = generateProblem(settings);
      expect(p.operand1).toBeGreaterThanOrEqual(5);
      expect(p.operand1).toBeLessThanOrEqual(10);
      expect(p.operand2).toBeGreaterThanOrEqual(3);
      expect(p.operand2).toBeLessThanOrEqual(7);
    }
  });
});

// ── operationLabel ───────────────────────────────────────────────────────────

describe("operationLabel", () => {
  it.each([
    ["addition", "Addition"],
    ["subtraction", "Subtraction"],
    ["multiplication", "Multiplication"],
    ["division", "Division"],
  ] as const)("%s → %s", (op, expected) => {
    expect(operationLabel(op)).toBe(expected);
  });
});

// ── operationColor ───────────────────────────────────────────────────────────

describe("operationColor", () => {
  it("returns a hex colour string for each operation", () => {
    const ops = [
      "addition",
      "subtraction",
      "multiplication",
      "division",
    ] as const;
    for (const op of ops) {
      expect(operationColor(op)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

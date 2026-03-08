import { create } from "zustand";
import type { GameSettings, ProblemAttempt } from "../types";
import { DEFAULT_SETTINGS } from "../lib/gameLogic";

interface GameStore {
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  // Result passed from game → results page
  lastAttempts: ProblemAttempt[];
  lastScore: number;
  lastStartedAt: string;
  setLastResult: (
    attempts: ProblemAttempt[],
    score: number,
    startedAt: string,
  ) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  setSettings: (s) => set({ settings: s }),
  lastAttempts: [],
  lastScore: 0,
  lastStartedAt: "",
  setLastResult: (attempts, score, startedAt) =>
    set({ lastAttempts: attempts, lastScore: score, lastStartedAt: startedAt }),
}));

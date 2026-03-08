import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GameSettings, Operation } from "../../types";
import {
  DEFAULT_SETTINGS,
  DURATION_OPTIONS,
  PRESETS,
} from "../../lib/gameLogic";
import { useGameStore } from "../../hooks/useGameStore";
import OperationRow from "./OperationRow";

const ALL_OPS: Operation[] = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
];

function resolvePreset(s: GameSettings): string {
  for (const p of PRESETS) {
    if (p.settings.duration !== s.duration) continue;
    const match = ALL_OPS.every((op) => {
      const pc = p.settings.operations[op];
      const sc = s.operations[op];
      return (
        pc.enabled === sc.enabled &&
        pc.min1 === sc.min1 &&
        pc.max1 === sc.max1 &&
        pc.min2 === sc.min2 &&
        pc.max2 === sc.max2
      );
    });
    if (match) return p.id;
  }
  return "custom";
}

export default function SettingsForm() {
  const navigate = useNavigate();
  const { settings: stored, setSettings } = useGameStore();
  const [settings, setLocal] = useState<GameSettings>(stored);

  function handleOperationChange(
    op: Operation,
    cfg: (typeof settings.operations)[Operation],
  ) {
    // Subtraction mirrors addition ranges, division mirrors multiplication ranges
    const next = {
      ...settings,
      operations: { ...settings.operations, [op]: cfg },
    };

    if (op === "addition") {
      next.operations.subtraction = {
        ...next.operations.subtraction,
        min1: cfg.min1,
        max1: cfg.max1,
        min2: cfg.min2,
        max2: cfg.max2,
      };
    }
    if (op === "multiplication") {
      next.operations.division = {
        ...next.operations.division,
        min1: cfg.min1,
        max1: cfg.max1,
        min2: cfg.min2,
        max2: cfg.max2,
      };
    }
    setLocal({ ...next, preset: resolvePreset(next) });
  }

  function handleStart() {
    const anyEnabled = Object.values(settings.operations).some(
      (c) => c.enabled,
    );
    if (!anyEnabled) return;
    setSettings(settings);
    navigate("/game");
  }

  function handleReset() {
    setLocal(DEFAULT_SETTINGS);
  }

  const anyEnabled = Object.values(settings.operations).some((c) => c.enabled);

  return (
    <div className="card max-w-lg w-full mx-auto">
      {/* Preset selector */}
      <div className="mb-5 pb-5 border-b border-gray-800">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Preset
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.description}
              onClick={() =>
                setLocal({ ...p.settings, showTimerBar: settings.showTimerBar })
              }
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                settings.preset === p.id
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            disabled={settings.preset !== "custom"}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
              settings.preset === "custom"
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-gray-800 border-gray-700 text-gray-600 cursor-default"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-800">
        <OperationRow
          operation="addition"
          config={settings.operations.addition}
          onChange={handleOperationChange}
        />
        <OperationRow
          operation="subtraction"
          config={settings.operations.subtraction}
          onChange={handleOperationChange}
        />
        <OperationRow
          operation="multiplication"
          config={settings.operations.multiplication}
          onChange={handleOperationChange}
        />
        <OperationRow
          operation="division"
          config={settings.operations.division}
          onChange={handleOperationChange}
        />
      </div>

      <div className="mt-5 flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm font-medium text-gray-400">Timer bar</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.showTimerBar}
            onClick={() =>
              setLocal({ ...settings, showTimerBar: !settings.showTimerBar })
            }
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              settings.showTimerBar ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                settings.showTimerBar ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
          Duration:
        </label>
        <select
          className="bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={settings.duration}
          onChange={(e) => {
            const next = { ...settings, duration: Number(e.target.value) };
            setLocal({ ...next, preset: resolvePreset(next) });
          }}
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          className="btn-primary px-10"
          onClick={handleStart}
          disabled={!anyEnabled}
        >
          Start
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GameSettings, Operation } from "../../types";
import { DEFAULT_SETTINGS, DURATION_OPTIONS } from "../../lib/gameLogic";
import { useGameStore } from "../../hooks/useGameStore";
import OperationRow from "./OperationRow";

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
    setLocal(next);
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

      <div className="mt-5 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
          Duration:
        </label>
        <select
          className="bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={settings.duration}
          onChange={(e) =>
            setLocal({ ...settings, duration: Number(e.target.value) })
          }
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

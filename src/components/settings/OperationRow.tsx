import type { Operation } from "../../types";
import type { OperationConfig } from "../../types";

const OPERATION_LABELS: Record<Operation, string> = {
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
};

const OPERATION_NOTES: Partial<Record<Operation, string>> = {
  subtraction: "Addition problems in reverse.",
  division: "Multiplication problems in reverse.",
};

interface Props {
  operation: Operation;
  config: OperationConfig;
  onChange: (op: Operation, config: OperationConfig) => void;
}

export default function OperationRow({ operation, config, onChange }: Props) {
  function handleToggle() {
    onChange(operation, { ...config, enabled: !config.enabled });
  }

  function handleRange(field: keyof OperationConfig, raw: string) {
    const value = parseInt(raw, 10);
    if (isNaN(value)) return;
    onChange(operation, { ...config, [field]: Math.max(0, value) });
  }

  const note = OPERATION_NOTES[operation];

  return (
    <div className="py-3 border-b border-gray-800 last:border-0">
      <div className="flex items-start gap-3">
        <label className="flex items-center gap-2 cursor-pointer mt-0.5">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={config.enabled}
              onChange={handleToggle}
            />
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                config.enabled
                  ? "bg-blue-600 border-blue-600"
                  : "bg-transparent border-gray-600 hover:border-gray-400"
              }`}
            >
              {config.enabled && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
          <span
            className={`font-medium ${config.enabled ? "text-gray-100" : "text-gray-500"}`}
          >
            {OPERATION_LABELS[operation]}
          </span>
        </label>
      </div>
      {note ? (
        <p className="text-xs text-gray-500 ml-7 mt-1">{note}</p>
      ) : (
        <div
          className={`ml-7 mt-2 flex items-center gap-2 text-sm text-gray-400 transition-opacity ${config.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}
        >
          <span className="shrink-0">Range:</span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-gray-500">(</span>
            <RangeInput
              value={config.min1}
              onChange={(v) => handleRange("min1", v)}
            />
            <span>to</span>
            <RangeInput
              value={config.max1}
              onChange={(v) => handleRange("max1", v)}
            />
            <span className="text-gray-500">)</span>
          </span>
          <span className="text-gray-500">
            {operation === "addition" ? "+" : "×"}
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-gray-500">(</span>
            <RangeInput
              value={config.min2}
              onChange={(v) => handleRange("min2", v)}
            />
            <span>to</span>
            <RangeInput
              value={config.max2}
              onChange={(v) => handleRange("max2", v)}
            />
            <span className="text-gray-500">)</span>
          </span>
        </div>
      )}
    </div>
  );
}

function RangeInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      className="w-16 bg-gray-800 border border-gray-700 text-gray-100 text-center rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      value={value}
      min={0}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

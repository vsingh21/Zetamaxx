import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import type {
  InsightsData,
  Operation,
  WeakArea,
  SlowestProblem,
  MultHeatmapCell,
} from "../../types";
import { operationLabel, operationColor } from "../../lib/gameLogic";

const TOOLTIP_STYLE = {
  backgroundColor: "#111827",
  border: "1px solid #374151",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e5e7eb",
};
const TOOLTIP_ITEM_STYLE = { color: "#e5e7eb" };
const TOOLTIP_LABEL_STYLE = { color: "#9ca3af" };

// ─── Score Trend ─────────────────────────────────────────────────────────────

export function ScoreTrendChart({
  data,
}: {
  data: InsightsData["scoreTrend"];
}) {
  if (data.length < 2)
    return <EmptyChart label="Play at least 2 sessions to see your trend" />;
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Score trend
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        Raw score and problems/min (normalised for duration)
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
          <YAxis yAxisId="score" tick={{ fill: "#6b7280", fontSize: 11 }} />
          <YAxis
            yAxisId="ppm"
            orientation="right"
            tick={{ fill: "#6b7280", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
          />
          <Line
            yAxisId="score"
            type="monotone"
            dataKey="score"
            name="Score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: "#3b82f6" }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="ppm"
            type="monotone"
            dataKey="ppm"
            name="Per min"
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-5 mt-2 pl-1">
        <LegendDot color="#3b82f6" label="Score" />
        <LegendDot color="#10b981" label="Per min" dashed />
      </div>
    </div>
  );
}

// ─── Time of Day ─────────────────────────────────────────────────────────────

const HOUR_LABELS = (h: number) => {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
};

export function TimeOfDayChart({ data }: { data: InsightsData["timeOfDay"] }) {
  const active = data.filter((d) => d.sessionCount > 0);
  if (active.length === 0)
    return <EmptyChart label="No time-of-day data yet" />;

  const peak = active.reduce((a, b) => (a.avgScore > b.avgScore ? a : b));
  const chartData = data.map((d) => ({ ...d, label: HOUR_LABELS(d.hour) }));

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
            Best time to play
          </h3>
          <p className="text-xs text-gray-600">Avg score by hour of day</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Peak hour</div>
          <div className="font-mono font-bold text-indigo-400">
            {HOUR_LABELS(peak.hour)}
          </div>
          <div className="text-xs text-gray-600">{peak.avgScore}/min avg</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#6b7280", fontSize: 10 }}
            interval={2}
          />
          <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(v, _n, props) => [
              `${v}/min avg (${props.payload.sessionCount} session${props.payload.sessionCount !== 1 ? "s" : ""})`,
              "Problems/min",
            ]}
          />
          <Bar dataKey="avgScore" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.hour === peak.hour
                    ? "#a78bfa"
                    : entry.sessionCount === 0
                      ? "#1f2937"
                      : "#6366f1"
                }
                opacity={entry.sessionCount === 0 ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Day of Week ─────────────────────────────────────────────────────────────

export function DayOfWeekChart({ data }: { data: InsightsData["dayOfWeek"] }) {
  const active = data.filter((d) => d.sessionCount > 0);
  if (active.length === 0)
    return <EmptyChart label="No day-of-week data yet" />;

  const best = active.reduce((a, b) => (a.avgScore > b.avgScore ? a : b));

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
            Best day to play
          </h3>
          <p className="text-xs text-gray-600">Avg score by day of week</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Best day</div>
          <div className="font-mono font-bold text-indigo-400">
            {best.label}
          </div>
          <div className="text-xs text-gray-600">{best.avgScore}/min avg</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} />
          <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(v, _n, props) => [
              `${v}/min avg (${props.payload.sessionCount} session${props.payload.sessionCount !== 1 ? "s" : ""})`,
              "Problems/min",
            ]}
          />
          <Bar dataKey="avgScore" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.day === best.day
                    ? "#a78bfa"
                    : entry.sessionCount === 0
                      ? "#1f2937"
                      : "#6366f1"
                }
                opacity={entry.sessionCount === 0 ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Improvement Trend card ───────────────────────────────────────────────────

export function ImprovementCard({
  data,
  consistency,
}: {
  data: InsightsData["improvementTrend"];
  consistency: InsightsData["consistencyScore"];
}) {
  const { recent5Avg, prev5Avg, changePct } = data;
  const up = changePct != null && changePct > 0;
  const down = changePct != null && changePct < 0;

  return (
    <div className="card flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Recent improvement
        </h3>
        {changePct == null ? (
          <p className="text-xs text-gray-600">
            Play at least {data.sameSettingsOnly ? "10" : "5"} sessions
            {data.sameSettingsOnly ? " with the same settings" : ""} to see
            improvement.
          </p>
        ) : (
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <div className="text-2xl font-mono font-bold tabular-nums text-gray-100">
                {recent5Avg}
              </div>
              <div className="text-xs text-gray-500">Last 5 avg/min</div>
            </div>
            <div className="text-gray-700 text-sm pb-4">vs</div>
            <div>
              <div className="text-2xl font-mono font-bold tabular-nums text-gray-500">
                {prev5Avg}
              </div>
              <div className="text-xs text-gray-600">Prev 5 avg/min</div>
            </div>
            <div className="ml-auto text-right">
              <div
                className={`text-2xl font-mono font-bold tabular-nums ${
                  up
                    ? "text-green-400"
                    : down
                      ? "text-red-400"
                      : "text-gray-400"
                }`}
              >
                {up ? "▲" : down ? "▼" : "─"} {up ? "+" : ""}
                {changePct}%
              </div>
              <div className="text-xs text-gray-600">
                {up ? "Improving" : down ? "Declining" : "Stable"}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="text-xs text-gray-700 mt-1">
        {data.sameSettingsOnly
          ? "Comparing sessions with matching settings only"
          : "Mixed settings detected — using problems/min for comparison"}
      </div>

      {consistency != null && (
        <div className="border-t border-gray-800 pt-3 flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">
              Consistency (last 10 matching sessions)
            </div>
            <div className="text-xs text-gray-600">
              Std deviation of ppm — lower is more consistent
            </div>
          </div>
          <div className="text-right ml-4 shrink-0">
            <div
              className={`text-xl font-mono font-bold tabular-nums ${
                consistency <= 3
                  ? "text-green-400"
                  : consistency <= 7
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              ±{consistency}
            </div>
            <div className="text-xs text-gray-600">
              {consistency <= 3
                ? "Very consistent"
                : consistency <= 7
                  ? "Moderate"
                  : "Inconsistent"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Avg time per operation ───────────────────────────────────────────────────

const OP_COLORS: Record<string, string> = {
  addition: "#3b82f6",
  subtraction: "#a855f7",
  multiplication: "#10b981",
  division: "#f59e0b",
};

export function AvgTimeChart({
  data,
  trendData,
}: {
  data: InsightsData["operationStats"];
  trendData: InsightsData["operationTimeTrend"];
}) {
  const [showTrend, setShowTrend] = useState(false);
  const active = data.filter((d) => d.totalAttempts > 0);
  if (active.length === 0) return null;

  const barData = active.map((d) => ({
    name: operationLabel(d.operation),
    avgTime: d.avgTimeSec,
    fill: operationColor(d.operation),
  }));

  // Only show trend lines for ops that have at least one data point
  const activeOps = (
    ["addition", "subtraction", "multiplication", "division"] as const
  ).filter((op) => trendData.some((d) => d[op] != null));
  const hasTrendData = trendData.length >= 2;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
            Avg response time
          </h3>
          <p className="text-xs text-gray-600">
            {showTrend
              ? "Response time per operation over last 30 sessions"
              : "Overall avg seconds per operation type"}
          </p>
        </div>
        {hasTrendData && (
          <div className="flex rounded-md overflow-hidden border border-gray-700 text-xs shrink-0 ml-4">
            <button
              onClick={() => setShowTrend(false)}
              className={`px-3 py-1 transition-colors ${
                !showTrend
                  ? "bg-gray-700 text-gray-100"
                  : "bg-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => setShowTrend(true)}
              className={`px-3 py-1 transition-colors ${
                showTrend
                  ? "bg-gray-700 text-gray-100"
                  : "bg-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              Over time
            </button>
          </div>
        )}
      </div>

      <div className="mt-4">
        {!showTrend ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={barData}
              layout="vertical"
              margin={{ top: 0, right: 12, bottom: 0, left: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1f2937"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                unit="s"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                width={60}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                formatter={(v) => [`${v}s`, "Avg time"]}
              />
              <Bar dataKey="avgTime" radius={[0, 3, 3, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={trendData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  unit="s"
                  width={40}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  formatter={(v, name) => [
                    `${v}s`,
                    operationLabel(name as Operation),
                  ]}
                />
                {activeOps.map((op) => (
                  <Line
                    key={op}
                    type="monotone"
                    dataKey={op}
                    name={op}
                    stroke={OP_COLORS[op]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-4 mt-2 pl-1">
              {activeOps.map((op) => (
                <LegendDot
                  key={op}
                  color={OP_COLORS[op]}
                  label={operationLabel(op)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Operation Volume ─────────────────────────────────────────────────────────

export function OperationVolumeChart({
  data,
}: {
  data: InsightsData["operationVolume"];
}) {
  if (data.length === 0) return null;
  const chartData = data.map((d) => ({
    name: operationLabel(d.operation),
    count: d.count,
    pct: d.pct,
    fill: operationColor(d.operation),
  }));
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Practice distribution
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        How your problem volume is split across operations
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 40, bottom: 0, left: 60 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1f2937"
            horizontal={false}
          />
          <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            width={60}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(v, _n, props) => [
              `${v} problems (${props.payload.pct}%)`,
              "Volume",
            ]}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Multiplication Table Heatmap ─────────────────────────────────────────────

export function MultTableHeatmap({ data }: { data: MultHeatmapCell[] }) {
  if (data.length === 0) return null;

  const withData = data.filter((c) => c.avgTimeSec != null);
  if (withData.length === 0)
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Multiplication table heatmap
        </h3>
        <p className="text-sm text-gray-600">
          Practice multiplication to populate the heatmap.
        </p>
      </div>
    );

  const maxTime = Math.max(...withData.map((c) => c.avgTimeSec!));
  const minTime = Math.min(...withData.map((c) => c.avgTimeSec!));

  function cellColor(cell: MultHeatmapCell): string {
    if (cell.avgTimeSec == null || cell.attempts === 0)
      return "rgba(31,41,55,0.6)";
    const norm =
      maxTime === minTime
        ? 0
        : (cell.avgTimeSec - minTime) / (maxTime - minTime);
    if (norm < 0.5) {
      const t = norm * 2;
      const r = Math.round(34 + (234 - 34) * t);
      const g = Math.round(197 + (179 - 197) * t);
      return `rgb(${r},${g},34)`;
    } else {
      const t = (norm - 0.5) * 2;
      const r = Math.round(234 + (239 - 234) * t);
      const g = Math.round(179 + (68 - 179) * t);
      const b = Math.round(8 * (1 - t));
      return `rgb(${r},${g},${b})`;
    }
  }

  const cols = Array.from({ length: 11 }, (_, i) => i + 2);

  return (
    <div className="card overflow-x-auto">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Multiplication table heatmap
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        Avg response time per pair — green = fast, red = slow, grey = unseen
      </p>
      <div className="inline-block min-w-full">
        <div className="flex">
          <div className="w-8 h-7 shrink-0" />
          {cols.map((b) => (
            <div
              key={b}
              className="w-9 h-7 flex items-center justify-center text-xs font-mono text-gray-500 font-semibold shrink-0"
            >
              {b}
            </div>
          ))}
        </div>
        {cols.map((a) => (
          <div key={a} className="flex">
            <div className="w-8 h-9 flex items-center justify-center text-xs font-mono text-gray-500 font-semibold shrink-0">
              {a}
            </div>
            {cols.map((b) => {
              const cell = data.find((c) => c.a === a && c.b === b);
              const bg = cell ? cellColor(cell) : "rgba(31,41,55,0.6)";
              const label =
                cell?.avgTimeSec != null ? `${cell.avgTimeSec}s` : "";
              return (
                <div
                  key={b}
                  title={
                    cell?.avgTimeSec != null
                      ? `${a}×${b}: ${cell.avgTimeSec}s avg (${cell.attempts} attempts)`
                      : `${a}×${b}: no data yet`
                  }
                  className="w-9 h-9 flex items-center justify-center text-[9px] font-mono rounded-sm m-px cursor-default shrink-0"
                  style={{ backgroundColor: bg, color: "rgba(0,0,0,0.65)" }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-3">
          <div className="text-xs text-gray-600">Fast</div>
          <div className="flex h-2 flex-1 rounded overflow-hidden">
            {Array.from({ length: 20 }, (_, i) => {
              const norm = i / 19;
              let bg: string;
              if (norm < 0.5) {
                const t = norm * 2;
                const r = Math.round(34 + (234 - 34) * t);
                const g = Math.round(197 + (179 - 197) * t);
                bg = `rgb(${r},${g},34)`;
              } else {
                const t = (norm - 0.5) * 2;
                const r = Math.round(234 + (239 - 234) * t);
                const g = Math.round(179 + (68 - 179) * t);
                const bv = Math.round(8 * (1 - t));
                bg = `rgb(${r},${g},${bv})`;
              }
              return (
                <div
                  key={i}
                  className="flex-1"
                  style={{ backgroundColor: bg }}
                />
              );
            })}
          </div>
          <div className="text-xs text-gray-600">Slow</div>
        </div>
      </div>
    </div>
  );
}

// ─── Weak areas table ─────────────────────────────────────────────────────────

const OP_BADGE_COLOR: Record<Operation, string> = {
  addition: "bg-blue-900/40 text-blue-300",
  subtraction: "bg-purple-900/40 text-purple-300",
  multiplication: "bg-emerald-900/40 text-emerald-300",
  division: "bg-amber-900/40 text-amber-300",
};

export function WeakAreasTable({ data }: { data: WeakArea[] }) {
  if (data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Weak areas
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          No weak areas yet — every problem with ≥3 attempts is being answered
          correctly. Keep it up!
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Weak areas
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        Problems answered incorrectly at least once (≥3 total attempts)
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-600 border-b border-gray-800">
              <th className="text-left pb-2 font-medium">Problem</th>
              <th className="text-left pb-2 font-medium pl-4">Type</th>
              <th className="text-right pb-2 font-medium pl-4">Avg time</th>
              <th className="text-right pb-2 font-medium pl-4">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {data.map((w, i) => (
              <tr
                key={i}
                className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors"
              >
                <td className="py-2 font-mono font-semibold text-gray-200">
                  {w.displayStr}
                </td>
                <td className="py-2 pl-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${OP_BADGE_COLOR[w.operation]}`}
                  >
                    {operationLabel(w.operation)}
                  </span>
                </td>
                <td className="py-2 text-right pl-4 font-mono text-yellow-400 text-xs">
                  {w.avgTimeSec}s
                </td>
                <td className="py-2 text-right pl-4 text-gray-500 font-mono">
                  {w.attempts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Slowest problems table ────────────────────────────────────────────────────

export function SlowestProblemsTable({ data }: { data: SlowestProblem[] }) {
  if (data.length === 0) return null;
  return (
    <div className="card overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Slowest problems
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        Where you spend the most time — regardless of correctness
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-600 border-b border-gray-800">
              <th className="text-left pb-2 font-medium">Problem</th>
              <th className="text-left pb-2 font-medium pl-4">Type</th>
              <th className="text-right pb-2 font-medium pl-4">Avg time</th>
              <th className="text-right pb-2 font-medium pl-4">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr
                key={i}
                className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors"
              >
                <td className="py-2 font-mono font-semibold text-gray-200">
                  {p.displayStr}
                </td>
                <td className="py-2 pl-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${OP_BADGE_COLOR[p.operation]}`}
                  >
                    {operationLabel(p.operation)}
                  </span>
                </td>
                <td className="py-2 text-right pl-4 font-mono text-red-400 text-xs font-semibold">
                  {p.avgTimeSec}s
                </td>
                <td className="py-2 text-right pl-4 text-gray-500 font-mono">
                  {p.attempts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Stat cards ───────────────────────────────────────────────────────────────

export function InsightStatCards({ data }: { data: InsightsData }) {
  const stats = [
    { label: "Best score", value: data.bestScore },
    { label: "Total sessions", value: data.totalSessions },
    { label: "Total correct", value: data.totalProblems.toLocaleString() },
    { label: "Current streak", value: `${data.currentStreak}d` },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="stat-card text-center">
          <div className="font-mono text-2xl font-bold text-gray-100 tabular-nums">
            {s.value}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="card flex items-center justify-center h-40">
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-0.5 w-5 rounded"
        style={{
          backgroundImage: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 6px)`
            : undefined,
          backgroundColor: dashed ? "transparent" : color,
        }}
      />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

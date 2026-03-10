import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAllSessions, fetchAllAttempts } from "../lib/supabase";
import { computeInsights } from "../lib/insights";
import { PRESETS } from "../lib/gameLogic";
import type { InsightsData, GameSession, DbProblemAttempt } from "../types";
import Navbar from "../components/common/Navbar";
import {
  InsightStatCards,
  ScoreTrendChart,
  TimeOfDayChart,
  DayOfWeekChart,
  AvgTimeChart,
  OperationVolumeChart,
  WeakAreasTable,
  SlowestProblemsTable,
  MultTableHeatmap,
  ImprovementCard,
} from "../components/insights/Charts";

export default function InsightsPage() {
  const { user } = useAuth();
  const [allSessions, setAllSessions] = useState<GameSession[]>([]);
  const [allAttempts, setAllAttempts] = useState<DbProblemAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("all");

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      const [sessionsRes, attemptsRes] = await Promise.all([
        fetchAllSessions(user!.id),
        fetchAllAttempts(user!.id),
      ]);

      if (sessionsRes.error || attemptsRes.error) {
        setError("Failed to load insights. Check your Supabase connection.");
        setLoading(false);
        return;
      }

      setAllSessions(sessionsRes.data ?? []);
      setAllAttempts(attemptsRes.data ?? []);
      setLoading(false);
    }

    load();
  }, [user]);

  // Derive which presets have sessions
  const presentPresetIds = useMemo(() => {
    const ids = new Set(allSessions.map((s) => s.settings?.preset ?? "custom"));
    return ids;
  }, [allSessions]);

  const insights = useMemo(() => {
    if (allSessions.length === 0) return null;
    let sessions = allSessions;
    let attempts = allAttempts;
    if (selectedPreset !== "all") {
      sessions = allSessions.filter(
        (s) => (s.settings?.preset ?? "custom") === selectedPreset,
      );
      const sessionIds = new Set(sessions.map((s) => s.id));
      attempts = allAttempts.filter((a) => sessionIds.has(a.session_id));
    }
    return computeInsights(sessions, attempts);
  }, [allSessions, allAttempts, selectedPreset]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-1">Insights</h1>
            <p className="text-sm text-gray-500">
              Analyse your performance patterns and track improvement
            </p>
          </div>
          {!loading && allSessions.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">
                Preset:
              </label>
              <select
                className="bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
              >
                <option value="all">All</option>
                {PRESETS.filter((p) => presentPresetIds.has(p.id)).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
                {presentPresetIds.has("custom") && (
                  <option value="custom">Custom</option>
                )}
              </select>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="card text-red-400 text-sm">{error}</div>
        )}

        {!loading && insights && insights.totalSessions === 0 && (
          <div className="card text-center py-16">
            <p className="text-gray-400 text-lg font-medium mb-2">
              No sessions yet
            </p>
            <p className="text-gray-600 text-sm">
              Complete a drill to start seeing insights.
            </p>
          </div>
        )}

        {!loading && insights && insights.totalSessions > 0 && (
          <div className="space-y-6 animate-fade-in">
            <InsightStatCards data={insights} />

            <ImprovementCard
              data={insights.improvementTrend}
              consistency={insights.consistencyScore}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ScoreTrendChart data={insights.scoreTrend} />
              <DayOfWeekChart data={insights.dayOfWeek} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimeOfDayChart data={insights.timeOfDay} />
              <OperationVolumeChart data={insights.operationVolume} />
            </div>

            <AvgTimeChart
              data={insights.operationStats}
              trendData={insights.operationTimeTrend}
            />

            {insights.multHeatmap.length > 0 && (
              <MultTableHeatmap data={insights.multHeatmap} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeakAreasTable data={insights.weakAreas} />
              <SlowestProblemsTable data={insights.slowestProblems} />
            </div>

            <RecentSessions data={insights.scoreTrend} />
          </div>
        )}
      </main>
    </div>
  );
}

function RecentSessions({ data }: { data: InsightsData["scoreTrend"] }) {
  const recent = [...data].reverse().slice(0, 30);
  if (recent.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Recent sessions
      </h3>
      <div
        className="overflow-y-auto"
        style={{ maxHeight: "calc(5 * 2.5rem)" }}
      >
        <div className="space-y-0">
          {recent.map((s, i) => {
            const dt = new Date(s.timestamp);
            const dateStr = dt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const timeStr = dt.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });
            return (
              <div
                key={i}
                className="flex items-center justify-between text-sm border-b border-gray-800/50 last:border-0 py-2"
              >
                <span className="text-gray-400">
                  {dateStr}{" "}
                  <span className="text-gray-600 text-xs">{timeStr}</span>
                </span>
                <span className="font-mono font-semibold text-gray-200 tabular-nums">
                  {s.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

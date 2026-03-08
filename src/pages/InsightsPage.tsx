import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAllSessions, fetchAllAttempts } from "../lib/supabase";
import { computeInsights } from "../lib/insights";
import type { InsightsData } from "../types";
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
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      const computed = computeInsights(
        sessionsRes.data ?? [],
        attemptsRes.data ?? [],
      );
      setInsights(computed);
      setLoading(false);
    }

    load();
  }, [user]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-100 mb-1">Insights</h1>
          <p className="text-sm text-gray-500">
            Analyse your performance patterns and track improvement
          </p>
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
  const recent = [...data].reverse().slice(0, 10);
  if (recent.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Recent sessions
      </h3>
      <div className="space-y-2">
        {recent.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-sm border-b border-gray-800/50 last:border-0 pb-2 last:pb-0"
          >
            <span className="text-gray-400">{s.date}</span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600">{s.ppm}/min</span>
              <span className="font-mono font-semibold text-gray-200 tabular-nums">
                {s.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../hooks/useGameStore";
import { useAuth } from "../context/AuthContext";
import { saveGameResult } from "../lib/supabase";
import { operationLabel, operationColor } from "../lib/gameLogic";
import type { Operation, ProblemAttempt } from "../types";
import Navbar from "../components/common/Navbar";

export default function ResultsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, lastAttempts, lastScore, lastStartedAt } = useGameStore();
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const hasSaved = useRef(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        (e.key === "s" || e.key === "S") &&
        !(e.target instanceof HTMLInputElement)
      ) {
        navigate("/game");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  const totalAttempted = lastAttempts.length;
  const ppm =
    settings.duration > 0
      ? Math.round((lastScore / settings.duration) * 60 * 10) / 10
      : 0;

  // Avg response time per correct answer
  const correctAttempts = lastAttempts.filter(
    (a: ProblemAttempt) => a.isCorrect,
  );
  const avgTimeSec =
    correctAttempts.length > 0
      ? Math.round(
          (correctAttempts.reduce(
            (s: number, a: ProblemAttempt) => s + a.timeTakenMs,
            0,
          ) /
            correctAttempts.length /
            1000) *
            10,
        ) / 10
      : 0;

  // Per-operation breakdown
  const ops: Operation[] = [
    "addition",
    "subtraction",
    "multiplication",
    "division",
  ];
  const opStats = ops
    .map((op) => {
      const opCorrect = lastAttempts.filter(
        (a: ProblemAttempt) => a.operation === op && a.isCorrect,
      );
      const opAvgMs =
        opCorrect.length > 0
          ? opCorrect.reduce(
              (s: number, a: ProblemAttempt) => s + a.timeTakenMs,
              0,
            ) / opCorrect.length
          : 0;
      return {
        op,
        total: opCorrect.length,
        avgTimeSec: Math.round((opAvgMs / 1000) * 10) / 10,
      };
    })
    .filter((s) => s.total > 0);

  // Best / worst op by avg time
  const fastestOp =
    opStats.length > 1
      ? opStats.reduce((a, b) => (a.avgTimeSec < b.avgTimeSec ? a : b))
      : null;
  const slowestOp =
    opStats.length > 1
      ? opStats.reduce((a, b) => (a.avgTimeSec > b.avgTimeSec ? a : b))
      : null;

  useEffect(() => {
    if (!user || hasSaved.current || lastAttempts.length === 0) return;
    hasSaved.current = true;
    setSaved("saving");
    saveGameResult(
      {
        settings,
        attempts: lastAttempts,
        totalCorrect: lastScore,
        totalAttempted,
        startedAt: lastStartedAt,
        durationSeconds: settings.duration,
      },
      user.id,
    ).then(({ error }) => {
      setSaved(error ? "error" : "saved");
    });
  }, [user, lastAttempts, lastScore, settings, lastStartedAt, totalAttempted]);

  if (lastAttempts.length === 0) {
    navigate("/home", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10 animate-fade-in">
        <h1 className="text-2xl font-bold mb-8 text-center">Results</h1>

        {/* Main stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard label="Score" value={lastScore} big />
          <StatCard label="Per minute" value={ppm} big />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard label="Avg time / answer" value={`${avgTimeSec}s`} />
          <StatCard label="Duration" value={`${settings.duration}s`} />
        </div>

        {/* Per-operation */}
        {opStats.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
              By operation
            </h2>
            <div className="space-y-3">
              {(() => {
                const maxAvg = Math.max(...opStats.map((s) => s.avgTimeSec), 0);
                return opStats.map(({ op, total, avgTimeSec: opAvg }) => (
                  <div key={op} className="flex items-center gap-3">
                    <div className="text-sm text-gray-300 w-28 shrink-0">
                      {operationLabel(op)}
                    </div>
                    {/* bar — width proportional to avg response time */}
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width:
                            maxAvg > 0
                              ? `${Math.round((opAvg / maxAvg) * 100)}%`
                              : "0%",
                          backgroundColor: operationColor(op),
                        }}
                      />
                    </div>
                    <div
                      className="font-mono text-sm font-semibold tabular-nums w-6 text-right"
                      style={{ color: operationColor(op) }}
                    >
                      {total}
                    </div>
                    <div className="text-xs text-gray-600 font-mono tabular-nums w-12 text-right">
                      {opAvg}s
                    </div>
                  </div>
                ));
              })()}
            </div>
            {(fastestOp || slowestOp) && (
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-800">
                {fastestOp && (
                  <div className="flex-1 text-center">
                    <div className="text-xs text-gray-600 mb-0.5">Fastest</div>
                    <div className="text-sm font-semibold text-green-400">
                      {operationLabel(fastestOp.op)}
                    </div>
                    <div className="text-xs font-mono text-gray-500">
                      {fastestOp.avgTimeSec}s avg
                    </div>
                  </div>
                )}
                {slowestOp && (
                  <div className="flex-1 text-center">
                    <div className="text-xs text-gray-600 mb-0.5">Slowest</div>
                    <div className="text-sm font-semibold text-red-400">
                      {operationLabel(slowestOp.op)}
                    </div>
                    <div className="text-xs font-mono text-gray-500">
                      {slowestOp.avgTimeSec}s avg
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Save status */}
        <div className="text-center text-xs text-gray-600 mb-6">
          {saved === "saving" && "Saving result…"}
          {saved === "saved" && "✓ Result saved"}
          {saved === "error" && "⚠ Could not save result"}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            className="btn-primary px-8"
            onClick={() => navigate("/game")}
          >
            Play again
          </button>
          <button
            className="btn-secondary px-6"
            onClick={() => navigate("/home")}
          >
            Settings
          </button>
          <button
            className="btn-secondary px-6"
            onClick={() => navigate("/insights")}
          >
            Insights
          </button>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  big,
}: {
  label: string;
  value: string | number;
  big?: boolean;
}) {
  return (
    <div className="stat-card text-center">
      <div
        className={`font-mono font-bold tabular-nums ${big ? "text-4xl" : "text-2xl"} text-gray-100`}
      >
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProblemAttempt, Problem } from "../../types";
import { generateProblem } from "../../lib/gameLogic";
import { useGameStore } from "../../hooks/useGameStore";

export default function GameScreen() {
  const navigate = useNavigate();
  const { settings, setLastResult } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(settings.duration);
  const [score, setScore] = useState(0);
  const [problem, setProblem] = useState<Problem>(() =>
    generateProblem(settings),
  );
  const [inputValue, setInputValue] = useState("");
  const [shake, setShake] = useState(false);
  const [flashGreen, setFlashGreen] = useState(false);

  // Use refs for mutable game data — avoids stale closures in timer callbacks
  const attemptsRef = useRef<ProblemAttempt[]>([]);
  const scoreRef = useRef(0);
  const problemStartTime = useRef<number>(Date.now());
  const gameStartedAt = useRef<string>(new Date().toISOString());
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameOver = useRef(false);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  // End game when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !gameOver.current) {
      gameOver.current = true;
      setLastResult(
        attemptsRef.current,
        scoreRef.current,
        gameStartedAt.current,
      );
      navigate("/results");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function advanceProblem(wasCorrect: boolean, userAnswer: number | null) {
    const timeTaken = Date.now() - problemStartTime.current;
    const attempt: ProblemAttempt = {
      operation: problem.operation,
      operand1: problem.operand1,
      operand2: problem.operand2,
      correctAnswer: problem.answer,
      userAnswer,
      isCorrect: wasCorrect,
      timeTakenMs: timeTaken,
    };

    attemptsRef.current.push(attempt);

    if (wasCorrect) {
      scoreRef.current += 1;
      setScore((s) => s + 1);
      setFlashGreen(true);
      setTimeout(() => setFlashGreen(false), 200);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 350);
    }

    if (wasCorrect) {
      const next = generateProblem(settings);
      setProblem(next);
      problemStartTime.current = Date.now();
      setInputValue("");
    } else {
      setInputValue("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Allow: digits, backspace, delete, arrows, tab, minus (for negative), home/end
    const allowed = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Home",
      "End",
      "-",
    ];
    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const parsed = parseInt(inputValue, 10);
      if (isNaN(parsed) || inputValue.trim() === "") return;
      const correct = parsed === problem.answer;
      advanceProblem(correct, parsed);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Strip any non-numeric characters except leading minus
    const raw = e.target.value.replace(/[^0-9\-]/g, "").replace(/(?!^)-/g, "");
    setInputValue(raw);

    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && raw !== "" && raw !== "-") {
      if (parsed === problem.answer) {
        advanceProblem(true, parsed);
      }
    }
  }

  const timerPct = timeLeft / settings.duration;
  const timerColor =
    timerPct > 0.4
      ? "text-gray-100"
      : timerPct > 0.15
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Timer bar */}
      <div className="fixed top-0 left-0 right-0 h-1">
        <div
          className={`h-full transition-all duration-1000 ${timerPct > 0.4 ? "bg-blue-500" : timerPct > 0.15 ? "bg-yellow-400" : "bg-red-500"}`}
          style={{ width: `${timerPct * 100}%` }}
        />
      </div>

      {/* Header row */}
      <div className="absolute top-6 left-0 right-0 flex justify-between items-center max-w-xl mx-auto px-6">
        <div
          className={`font-mono text-5xl font-bold tabular-nums ${timerColor}`}
        >
          {timeLeft}
        </div>
        <div className="text-right">
          <div
            className={`font-mono text-5xl font-bold tabular-nums transition-colors ${flashGreen ? "text-green-400" : "text-gray-100"}`}
          >
            {score}
          </div>
          <div className="text-xs text-gray-600 mt-0.5">score</div>
        </div>
      </div>

      {/* Problem + input */}
      <div className="flex flex-col items-center gap-8 mt-10">
        <div
          className={`font-mono text-7xl sm:text-8xl font-bold text-gray-100 tabular-nums tracking-tight animate-fade-in ${shake ? "animate-shake" : ""}`}
          key={`${problem.operand1}-${problem.operand2}-${problem.operation}`}
        >
          {problem.displayStr}
        </div>

        <div className="flex items-center">
          <input
            ref={inputRef}
            type="number"
            className={`font-mono text-5xl sm:text-6xl font-bold text-center bg-transparent border-0 border-b-4 w-48 text-gray-100 focus:outline-none tabular-nums caret-blue-400 transition-colors ${
              shake ? "border-red-500" : "border-gray-600 focus:border-blue-500"
            }`}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoFocus
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <p className="text-xs text-gray-700">Type the answer</p>
      </div>
    </div>
  );
}

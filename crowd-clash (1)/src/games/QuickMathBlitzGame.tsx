import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Check, Flame, X, Zap } from 'lucide-react';
import type { MiniGameProps } from '../types/game';

interface MathProblem {
  expression: string;
  answer: number;
  options: number[];
}

function generateProblem(streak: number): MathProblem {
  const roll = Math.random();
  let a = 0;
  let b = 0;
  let answer = 0;
  let expression = '';

  if (roll < 0.42) {
    // Addition
    const cap = 16 + Math.min(streak * 3, 24);
    a = 4 + Math.floor(Math.random() * cap);
    b = 3 + Math.floor(Math.random() * 19);
    answer = a + b;
    expression = `${a} + ${b}`;
  } else if (roll < 0.76) {
    // Subtraction (always positive)
    a = 14 + Math.floor(Math.random() * (24 + Math.min(streak * 3, 24)));
    b = 3 + Math.floor(Math.random() * (a - 3));
    answer = a - b;
    expression = `${a} − ${b}`;
  } else {
    // Simple multiplication
    a = 2 + Math.floor(Math.random() * 10);
    b = 2 + Math.floor(Math.random() * 8);
    answer = a * b;
    expression = `${a} × ${b}`;
  }

  const distractors = new Set<number>([answer]);
  const offsets = [-10, -5, -3, -2, -1, 1, 2, 3, 5, 10];
  while (distractors.size < 4) {
    const off = offsets[Math.floor(Math.random() * offsets.length)];
    const candidate = answer + off;
    if (candidate > 0) {
      distractors.add(candidate);
    }
  }

  const options = Array.from(distractors).sort(() => Math.random() - 0.5);
  return { expression, answer, options };
}

export function QuickMathBlitzGame({ onScore, isActive }: MiniGameProps) {
  const [streak, setStreak] = useState(0);
  const [problem, setProblem] = useState<MathProblem>(() => generateProblem(0));
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    label: string;
    token: number;
  } | null>(null);

  const shownAtRef = useRef<number>(0);
  const tokenRef = useRef<number>(1);
  const clearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    shownAtRef.current = Date.now();
    return () => {
      if (clearTimerRef.current !== null) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const flashFeedback = useCallback((ok: boolean, label: string) => {
    if (clearTimerRef.current !== null) {
      clearTimeout(clearTimerRef.current);
    }
    setFeedback({ ok, label, token: ++tokenRef.current });
    clearTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      clearTimerRef.current = null;
    }, 340);
  }, []);

  const handleSelect = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, value: number) => {
      e.preventDefault();
      if (!isActive) return;

      const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : 3000;
      let nextStreak = 0;

      if (value === problem.answer) {
        nextStreak = streak + 1;
        const speedBonus = elapsed < 1400 ? 10 : elapsed < 2400 ? 5 : 0;
        const streakBonus = Math.min(nextStreak - 1, 4) * 5;
        const pts = 10 + speedBonus + streakBonus;

        onScore(pts);
        flashFeedback(
          true,
          speedBonus >= 10
            ? `+${pts} LIGHTNING!`
            : speedBonus > 0
              ? `+${pts} FAST!`
              : `+${pts}`
        );
      } else {
        nextStreak = 0;
        onScore(-5);
        flashFeedback(false, '-5 WRONG');
      }

      setStreak(nextStreak);
      setProblem(generateProblem(nextStreak));
      shownAtRef.current = Date.now();
    },
    [flashFeedback, isActive, onScore, problem.answer, streak]
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-3.5 py-1 select-none">
      {/* Dark Arcade Top Bar */}
      <div className="flex w-full max-w-md items-center justify-between rounded-2xl border border-white/10 bg-[#121620] px-4 py-2.5 text-white shadow-lg">
        <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.14em] text-slate-200 uppercase">
          <Zap className="h-4 w-4 text-amber-400" />
          <span>Speed + Streak Bonus</span>
        </div>
        <div
          className={`font-mono-num inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
            streak >= 3
              ? 'bg-amber-400 text-slate-950'
              : streak >= 1
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-white/8 text-slate-400'
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>Streak {streak}</span>
        </div>
      </div>

      {/* Equation Card */}
      <div
        key={feedback && !feedback.ok ? `miss-${feedback.token}` : 'math-card'}
        className={`relative flex w-full max-w-md flex-1 flex-col items-center justify-center rounded-3xl border-2 bg-[#0E1118] p-6 text-white shadow-2xl transition-colors duration-150 ${
          feedback?.ok
            ? 'border-emerald-400 bg-emerald-950/30'
            : feedback && !feedback.ok
              ? 'animate-shake border-rose-500 bg-rose-950/35'
              : 'border-white/12'
        }`}
      >
        <span className="text-[11px] font-extrabold tracking-[0.22em] text-slate-400 uppercase">
          Solve Fast
        </span>
        <div className="font-mono-num mt-2 text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
          {problem.expression}
        </div>

        {feedback && (
          <div
            key={feedback.token}
            className={`animate-chip-pop pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-extrabold shadow-lg ${
              feedback.ok ? 'bg-emerald-400 text-slate-950' : 'bg-rose-500 text-white'
            }`}
          >
            {feedback.ok ? (
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            ) : (
              <X className="h-3.5 w-3.5 stroke-[3]" />
            )}
            <span className="font-mono-num">{feedback.label}</span>
          </div>
        )}
      </div>

      {/* 4 Giant Tap Answer Buttons */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {problem.options.map((opt, idx) => (
          <button
            key={`${opt}-${idx}`}
            id={`math-blitz-opt-${idx}`}
            type="button"
            disabled={!isActive}
            onPointerDown={(e) => handleSelect(e, opt)}
            className="font-mono-num rounded-2xl border-2 border-white/12 border-b-4 border-b-slate-950 bg-[#1B2232] py-6 text-4xl font-extrabold text-white shadow-lg transition-transform duration-75 hover:border-amber-400/50 hover:bg-[#232C40] active:translate-y-0.5 active:scale-[0.96] disabled:opacity-50"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

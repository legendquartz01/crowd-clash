import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X, Zap } from 'lucide-react';
import type { MiniGameProps } from '../types/game';

interface MathQuestion {
  prompt: string;
  answer: number;
  choices: number[];
}

function generateQuestion(streak: number): MathQuestion {
  const ops = streak >= 4 ? ['+', '-', '×'] : ['+', '-'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a = 0;
  let b = 0;
  let answer = 0;

  if (op === '+') {
    a = 6 + Math.floor(Math.random() * (18 + Math.min(streak * 2, 20)));
    b = 4 + Math.floor(Math.random() * 19);
    answer = a + b;
  } else if (op === '-') {
    a = 15 + Math.floor(Math.random() * 35);
    b = 4 + Math.floor(Math.random() * (a - 3));
    answer = a - b;
  } else {
    a = 3 + Math.floor(Math.random() * 9);
    b = 3 + Math.floor(Math.random() * 8);
    answer = a * b;
  }

  const choiceSet = new Set<number>([answer]);
  const offsets = [-10, -4, -3, -2, -1, 1, 2, 3, 4, 10];
  while (choiceSet.size < 4) {
    const delta = offsets[Math.floor(Math.random() * offsets.length)];
    const candidate = answer + delta;
    if (candidate > 0) {
      choiceSet.add(candidate);
    }
  }

  const choices = Array.from(choiceSet).sort(() => Math.random() - 0.5);
  return {
    prompt: `${a} ${op} ${b}`,
    answer,
    choices,
  };
}

export function QuickMathGame({ onScore, team, isActive }: MiniGameProps) {
  const [streak, setStreak] = useState(0);
  const [question, setQuestion] = useState<MathQuestion>(() => generateQuestion(0));
  const [feedback, setFeedback] = useState<{ ok: boolean; label: string; key: number } | null>(null);
  const shownAtRef = useRef<number>(0);

  useEffect(() => {
    shownAtRef.current = Date.now();
  }, []);

  const handleSelect = useCallback(
    (choice: number) => {
      if (!isActive) return;

      const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : 3000;
      let nextStreak = 0;

      if (choice === question.answer) {
        nextStreak = streak + 1;
        const speedBonus = elapsed < 2200 ? 5 : 0;
        const pts = 10 + speedBonus;
        onScore(pts);
        setFeedback({
          ok: true,
          label: speedBonus > 0 ? `+${pts} FAST!` : `+${pts}`,
          key: Date.now(),
        });
      } else {
        nextStreak = 0;
        onScore(-5);
        setFeedback({ ok: false, label: '-5', key: Date.now() });
      }

      setStreak(nextStreak);
      setQuestion(generateQuestion(nextStreak));
      shownAtRef.current = Date.now();
    },
    [isActive, onScore, question.answer, streak]
  );

  const isRed = team === 'red';

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-4 py-1 select-none">
      {/* Header */}
      <div className="flex w-full max-w-md items-center justify-between">
        <span
          className={`text-xs font-bold tracking-[0.14em] uppercase ${
            isRed ? 'text-rose-100' : 'text-slate-600'
          }`}
        >
          Solve Fast for Bonus
        </span>
        <span
          className={`font-mono-num flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
            streak >= 3
              ? 'bg-amber-400 text-slate-950'
              : isRed
                ? 'bg-black/25 text-white'
                : 'bg-slate-200 text-slate-800'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          Streak {streak}
        </span>
      </div>

      {/* Equation Card */}
      <div
        key={feedback && !feedback.ok ? feedback.key : 'eq'}
        className={`flex w-full max-w-md flex-1 flex-col items-center justify-center rounded-3xl bg-white p-6 text-slate-900 shadow-xl ${
          feedback && !feedback.ok ? 'animate-shake' : ''
        }`}
      >
        <div className="font-mono-num text-5xl font-extrabold tracking-tight sm:text-6xl">
          {question.prompt}
        </div>
        {feedback && (
          <div
            key={feedback.key}
            className={`animate-chip-pop mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
              feedback.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {feedback.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            {feedback.label}
          </div>
        )}
      </div>

      {/* Answer Choices */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {question.choices.map((choice, idx) => (
          <button
            key={`${choice}-${idx}`}
            id={`math-choice-${idx}`}
            type="button"
            disabled={!isActive}
            onPointerDown={(e) => {
              e.preventDefault();
              handleSelect(choice);
            }}
            className={`font-mono-num rounded-2xl border-b-4 py-5 text-3xl font-extrabold shadow-md transition-transform active:translate-y-0.5 active:scale-[0.97] disabled:opacity-50 ${
              isRed
                ? 'border-rose-200 bg-white text-slate-900 hover:bg-rose-50'
                : 'border-slate-950 bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}

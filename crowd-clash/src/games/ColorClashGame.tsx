import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Check, Flame, Palette, X } from 'lucide-react';
import type { MiniGameProps } from '../types/game';

interface ColorChoice {
  id: string;
  label: string;
  hex: string;
  btnClass: string;
}

const COLORS: readonly ColorChoice[] = [
  {
    id: 'red',
    label: 'RED',
    hex: '#FF3B4E',
    btnClass: 'bg-[#E63946] border-[#A61B29] text-white hover:bg-[#F04452]',
  },
  {
    id: 'blue',
    label: 'BLUE',
    hex: '#3B82F6',
    btnClass: 'bg-[#2563EB] border-[#1D4ED8] text-white hover:bg-[#3B82F6]',
  },
  {
    id: 'green',
    label: 'GREEN',
    hex: '#10B981',
    btnClass: 'bg-[#10B981] border-[#047857] text-slate-950 hover:bg-[#34D399]',
  },
  {
    id: 'yellow',
    label: 'YELLOW',
    hex: '#FACC15',
    btnClass: 'bg-[#FACC15] border-[#CA8A04] text-slate-950 hover:bg-[#FDE047]',
  },
];

interface StroopPrompt {
  word: ColorChoice;
  ink: ColorChoice;
}

function nextStroopPrompt(prevInkId?: string): StroopPrompt {
  const inkPool = COLORS.filter((c) => c.id !== prevInkId);
  const ink = inkPool[Math.floor(Math.random() * inkPool.length)];
  // Always mismatch ink & word so Stroop interference stays sharp
  const wordPool = COLORS.filter((c) => c.id !== ink.id);
  const word = wordPool[Math.floor(Math.random() * wordPool.length)];
  return { word, ink };
}

export function ColorClashGame({ onScore, isActive }: MiniGameProps) {
  const [prompt, setPrompt] = useState<StroopPrompt>(() => nextStroopPrompt());
  const [streak, setStreak] = useState(0);
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
    }, 320);
  }, []);

  const handleTap = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, choice: ColorChoice) => {
      e.preventDefault();
      if (!isActive) return;

      const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : 2500;

      if (choice.id === prompt.ink.id) {
        const nextStreak = streak + 1;
        const speedBonus = elapsed < 1400 ? 5 : 0;
        const streakBonus = Math.min(nextStreak - 1, 4) * 5;
        const pts = 10 + speedBonus + streakBonus;

        setStreak(nextStreak);
        onScore(pts);
        flashFeedback(
          true,
          nextStreak >= 3 ? `+${pts} · ${nextStreak}🔥` : speedBonus > 0 ? `+${pts} FAST` : `+${pts}`
        );
      } else {
        setStreak(0);
        onScore(-5);
        flashFeedback(false, '-5 MISS');
      }

      setPrompt((curr) => nextStroopPrompt(curr.ink.id));
      shownAtRef.current = Date.now();
    },
    [flashFeedback, isActive, onScore, prompt.ink.id, streak]
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-3.5 py-1 select-none">
      {/* Dark Arcade Top Bar */}
      <div className="flex w-full max-w-md items-center justify-between rounded-2xl border border-white/10 bg-[#121620] px-4 py-2.5 text-white shadow-lg">
        <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.14em] text-slate-200 uppercase">
          <Palette className="h-4 w-4 text-sky-400" />
          <span>Tap the INK Color</span>
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

      {/* Stroop Word Stage Card */}
      <div
        key={feedback && !feedback.ok ? `miss-${feedback.token}` : 'stroop-card'}
        className={`relative flex w-full max-w-md flex-1 flex-col items-center justify-center rounded-3xl border-2 bg-[#0E1118] p-6 shadow-2xl transition-colors duration-150 ${
          feedback?.ok
            ? 'border-emerald-400 bg-emerald-950/30'
            : feedback && !feedback.ok
              ? 'animate-shake border-rose-500 bg-rose-950/35'
              : 'border-white/12'
        }`}
      >
        <span className="text-[11px] font-extrabold tracking-[0.22em] text-slate-400 uppercase">
          Ignore the Word · Match the Ink
        </span>
        <div
          className="font-display mt-3 text-6xl font-bold tracking-tight sm:text-7xl"
          style={{ color: prompt.ink.hex }}
        >
          {prompt.word.label}
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

      {/* 2x2 Giant Color Tap Buttons */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {COLORS.map((color) => (
          <button
            key={color.id}
            id={`color-clash-btn-${color.id}`}
            type="button"
            disabled={!isActive}
            onPointerDown={(e) => handleTap(e, color)}
            className={`font-display rounded-2xl border-b-4 py-6 text-2xl font-bold tracking-wide shadow-lg transition-transform duration-75 active:translate-y-0.5 active:scale-[0.96] disabled:opacity-50 ${color.btnClass}`}
          >
            {color.label}
          </button>
        ))}
      </div>
    </div>
  );
}

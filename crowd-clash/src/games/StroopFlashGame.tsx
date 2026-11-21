import { useCallback, useState } from 'react';
import { Check, Flame, X } from 'lucide-react';
import type { MiniGameProps } from '../types/game';

interface ColorOption {
  id: string;
  label: string;
  hex: string;
  btnClass: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { id: 'crimson', label: 'RED', hex: '#E63946', btnClass: 'bg-[#E63946] text-white border-[#B91C2B]' },
  { id: 'cobalt', label: 'BLUE', hex: '#2563EB', btnClass: 'bg-[#2563EB] text-white border-[#1D4ED8]' },
  { id: 'emerald', label: 'GREEN', hex: '#10B981', btnClass: 'bg-[#10B981] text-white border-[#059669]' },
  { id: 'amber', label: 'YELLOW', hex: '#F59E0B', btnClass: 'bg-[#F59E0B] text-slate-950 border-[#D97706]' },
];

interface PromptRound {
  word: ColorOption;
  ink: ColorOption;
}

function nextPrompt(prevInkId?: string): PromptRound {
  const inkChoices = COLOR_OPTIONS.filter((c) => c.id !== prevInkId);
  const ink = inkChoices[Math.floor(Math.random() * inkChoices.length)];
  // 80% mismatch so Stroop interference stays intense
  const mismatch = Math.random() < 0.8;
  const wordPool = mismatch ? COLOR_OPTIONS.filter((c) => c.id !== ink.id) : COLOR_OPTIONS;
  const word = wordPool[Math.floor(Math.random() * wordPool.length)];
  return { word, ink };
}

export function StroopFlashGame({ onScore, team, isActive }: MiniGameProps) {
  const [prompt, setPrompt] = useState<PromptRound>(() => nextPrompt());
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: 'hit' | 'miss'; text: string; key: number } | null>(null);

  const handleChoice = useCallback(
    (option: ColorOption) => {
      if (!isActive) return;

      if (option.id === prompt.ink.id) {
        const nextStreak = streak + 1;
        const pts = nextStreak >= 3 ? 15 : 10;
        setStreak(nextStreak);
        onScore(pts);
        setFeedback({ kind: 'hit', text: nextStreak >= 3 ? `+${pts} STREAK!` : `+${pts}`, key: Date.now() });
      } else {
        setStreak(0);
        onScore(-5);
        setFeedback({ kind: 'miss', text: '-5 MISS', key: Date.now() });
      }

      setPrompt((curr) => nextPrompt(curr.ink.id));
    },
    [isActive, onScore, prompt.ink.id, streak]
  );

  const isRed = team === 'red';

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-4 py-1 select-none">
      {/* Instruction & Streak Strip */}
      <div className="flex w-full max-w-md items-center justify-between">
        <span
          className={`text-xs font-bold tracking-[0.14em] uppercase ${
            isRed ? 'text-rose-100' : 'text-slate-600'
          }`}
        >
          Tap the INK Color
        </span>
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
            streak >= 3
              ? 'bg-amber-400 text-slate-950'
              : isRed
                ? 'bg-black/25 text-white'
                : 'bg-slate-200 text-slate-800'
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span className="font-mono-num">Streak {streak}</span>
        </div>
      </div>

      {/* Prompt Card */}
      <div
        key={feedback?.kind === 'miss' ? feedback.key : 'card'}
        className={`relative flex w-full max-w-md flex-1 flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-xl ${
          feedback?.kind === 'miss' ? 'animate-shake' : ''
        }`}
      >
        <span className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
          Match the Ink, Not the Word
        </span>
        <div
          className="font-display mt-3 text-6xl font-bold tracking-tight sm:text-7xl"
          style={{ color: prompt.ink.hex }}
        >
          {prompt.word.label}
        </div>

        {/* Transient Hit / Miss Pill */}
        {feedback && (
          <div
            key={feedback.key}
            className={`animate-chip-pop mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
              feedback.kind === 'hit'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {feedback.kind === 'hit' ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            {feedback.text}
          </div>
        )}
      </div>

      {/* 2x2 Color Answer Grid */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {COLOR_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            id={`stroop-btn-${opt.id}`}
            type="button"
            disabled={!isActive}
            onPointerDown={(e) => {
              e.preventDefault();
              handleChoice(opt);
            }}
            className={`font-display rounded-2xl border-b-4 py-5 text-xl font-bold tracking-wide shadow-md transition-transform active:translate-y-0.5 active:scale-[0.97] disabled:opacity-50 ${opt.btnClass}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

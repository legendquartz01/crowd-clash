import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Check, Eye, Flame, Sparkles, X } from 'lucide-react';
import type { MiniGameProps } from '../types/game';

const EMOJI_POOL: readonly string[] = [
  '🚀', '🔥', '⚡', '💎', '🎯', '👑',
  '🦊', '🐙', '🦄', '🐸', '🍕', '🍩',
  '🎸', '🎮', '🌈', '⭐', '🧠', '🏆',
];

const MEMORIZE_MS = 2000;

interface FlashRound {
  id: number;
  sequence: string[]; // 3 or 4 unique emojis in target order
  grid: string[];     // 6 unique emojis (sequence + distractors, shuffled)
}

function generateFlashRound(id: number, solvedCount: number): FlashRound {
  const seqLength = solvedCount >= 2 ? 4 : 3;
  const shuffled = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
  const picked6 = shuffled.slice(0, 6);
  const sequence = picked6.slice(0, seqLength);
  const grid = [...picked6].sort(() => Math.random() - 0.5);
  return { id, sequence, grid };
}

export function EmojiFlashGame({ onScore, isActive }: MiniGameProps) {
  const [solvedCount, setSolvedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState<FlashRound>(() => generateFlashRound(1, 0));
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize');
  const [entered, setEntered] = useState<string[]>([]);
  const [progressPct, setProgressPct] = useState(100);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    label: string;
    token: number;
  } | null>(null);

  const nextIdRef = useRef(2);
  const feedbackTokenRef = useRef(1);
  const clearFeedbackRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clearFeedbackRef.current !== null) {
        clearTimeout(clearFeedbackRef.current);
      }
    };
  }, []);

  // Run the 2-second memorize reveal timer cleanly for each round while active
  useEffect(() => {
    if (!isActive || phase !== 'memorize') return;

    const startedAt = Date.now();
    const tickInterval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.max(0, 100 - (elapsed / MEMORIZE_MS) * 100);
      setProgressPct(pct);
    }, 50);

    const hideTimer = window.setTimeout(() => {
      clearInterval(tickInterval);
      setProgressPct(0);
      setPhase('recall');
    }, MEMORIZE_MS);

    return () => {
      clearInterval(tickInterval);
      clearTimeout(hideTimer);
    };
  }, [isActive, phase, round.id]);

  const showToast = useCallback((ok: boolean, label: string) => {
    if (clearFeedbackRef.current !== null) {
      clearTimeout(clearFeedbackRef.current);
    }
    setFeedback({ ok, label, token: ++feedbackTokenRef.current });
    clearFeedbackRef.current = window.setTimeout(() => {
      setFeedback(null);
      clearFeedbackRef.current = null;
    }, 450);
  }, []);

  const startNextRound = useCallback((nextSolved: number) => {
    const fresh = generateFlashRound(nextIdRef.current++, nextSolved);
    setRound(fresh);
    setEntered([]);
    setProgressPct(100);
    setPhase('memorize');
  }, []);

  const handleGridTap = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, emoji: string) => {
      e.preventDefault();
      if (!isActive || phase !== 'recall') return;

      const expected = round.sequence[entered.length];
      if (emoji === expected) {
        const nextEntered = [...entered, emoji];
        setEntered(nextEntered);

        if (nextEntered.length === round.sequence.length) {
          // Completed full sequence!
          const nextStreak = streak + 1;
          const nextSolved = solvedCount + 1;
          const bonus = round.sequence.length === 4 ? 25 : 20;
          const streakBonus = Math.min(nextStreak - 1, 4) * 5;
          const pts = bonus + streakBonus;

          setStreak(nextStreak);
          setSolvedCount(nextSolved);
          onScore(pts);
          showToast(true, `+${pts} PERFECT!`);
          startNextRound(nextSolved);
        } else {
          // Step reward
          onScore(5);
        }
      } else {
        setStreak(0);
        onScore(-5);
        showToast(false, '-5 WRONG ORDER');
        startNextRound(solvedCount);
      }
    },
    [entered, isActive, onScore, phase, round.sequence, showToast, solvedCount, startNextRound, streak]
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-3.5 py-1 select-none">
      {/* Dark Arcade Top Bar */}
      <div className="flex w-full max-w-md items-center justify-between rounded-2xl border border-white/10 bg-[#121620] px-4 py-2.5 text-white shadow-lg">
        <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.14em] text-slate-200 uppercase">
          {phase === 'memorize' ? (
            <>
              <Eye className="h-4 w-4 text-amber-400" />
              <span>Memorize Order ({round.sequence.length})</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Tap Back in Order!</span>
            </>
          )}
        </div>
        <div
          className={`font-mono-num inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
            streak >= 2
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

      {/* Main Sequence Display / Slot Bar */}
      <div
        key={feedback && !feedback.ok ? `miss-${feedback.token}` : 'flash-panel'}
        className={`relative flex w-full max-w-md flex-col items-center justify-center rounded-3xl border-2 bg-[#0E1118] px-5 py-6 text-white shadow-2xl transition-colors duration-150 ${
          feedback?.ok
            ? 'border-emerald-400 bg-emerald-950/30'
            : feedback && !feedback.ok
              ? 'animate-shake border-rose-500 bg-rose-950/35'
              : phase === 'memorize'
                ? 'border-amber-400/50'
                : 'border-white/12'
        }`}
      >
        <span className="text-[11px] font-extrabold tracking-[0.22em] text-slate-400 uppercase">
          {phase === 'memorize' ? 'Watch Closely — 2 Seconds' : `Step ${entered.length + 1} of ${round.sequence.length}`}
        </span>

        {/* Sequence Slots */}
        <div className="mt-4 flex items-center justify-center gap-3">
          {round.sequence.map((emoji, idx) => {
            const revealed = phase === 'memorize' || idx < entered.length;
            const isNextSlot = phase === 'recall' && idx === entered.length;
            return (
              <div
                key={`${round.id}-slot-${idx}`}
                className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-4xl transition-all sm:h-18 sm:w-18 ${
                  phase === 'memorize'
                    ? 'animate-target-pop border-amber-400/60 bg-[#1B2232]'
                    : idx < entered.length
                      ? 'border-emerald-400 bg-emerald-500/20'
                      : isNextSlot
                        ? 'border-sky-400 bg-sky-500/15'
                        : 'border-white/10 bg-white/5'
                }`}
              >
                {revealed ? (
                  <span aria-hidden="true">{phase === 'memorize' ? emoji : entered[idx]}</span>
                ) : (
                  <span className="font-mono-num text-lg font-extrabold text-slate-500">
                    {idx + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 2-Second Memorize Progress Bar */}
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              phase === 'memorize' ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{
              width:
                phase === 'memorize'
                  ? `${progressPct}%`
                  : `${(entered.length / round.sequence.length) * 100}%`,
            }}
          />
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

      {/* 6-Emoji Recall Grid (3x2) */}
      <div className="grid w-full max-w-md flex-1 grid-cols-3 gap-3">
        {round.grid.map((emoji, idx) => {
          const alreadyPicked = entered.includes(emoji);
          const disabled = !isActive || phase === 'memorize' || alreadyPicked;

          return (
            <button
              key={`${round.id}-grid-${idx}`}
              id={`emoji-flash-tile-${idx}`}
              type="button"
              disabled={disabled}
              onPointerDown={(e) => handleGridTap(e, emoji)}
              className={`flex items-center justify-center rounded-2xl border-2 text-4xl shadow-lg transition-all duration-75 sm:text-5xl ${
                phase === 'memorize'
                  ? 'border-white/5 bg-[#121620] opacity-25'
                  : alreadyPicked
                    ? 'border-emerald-400/50 bg-emerald-500/15 opacity-45'
                    : 'border-white/12 border-b-4 border-b-slate-950 bg-[#1B2232] hover:border-sky-400/50 hover:bg-[#232C40] active:translate-y-0.5 active:scale-95'
              }`}
            >
              <span aria-hidden="true">{phase === 'memorize' ? '•' : emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

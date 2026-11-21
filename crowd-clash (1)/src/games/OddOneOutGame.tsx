import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Check, Eye, Flame, Palette, X } from 'lucide-react';
import type { MiniGameProps } from '../types/game';

type RoundKind = 'emoji' | 'shade';

// 30 subtle, universally supported lookalike emoji pairs
const EMOJI_PAIRS: readonly [string, string][] = [
  ['😀', '😃'],
  ['🍎', '🍅'],
  ['🦊', '🐱'],
  ['⚽', '🏀'],
  ['🌙', '🍌'],
  ['💎', '🔷'],
  ['🔒', '🔓'],
  ['🕒', '🕘'],
  ['😄', '😁'],
  ['😊', '😉'],
  ['🐶', '🐺'],
  ['🐼', '🐨'],
  ['🐸', '🐢'],
  ['🍋', '🍐'],
  ['🍓', '🍒'],
  ['🍕', '🌮'],
  ['⭐', '🌟'],
  ['🔥', '💥'],
  ['❤️', '🧡'],
  ['💜', '💙'],
  ['🎵', '🎶'],
  ['⚡', '✨'],
  ['👑', '🎩'],
  ['🚀', '✈️'],
  ['🎯', '🎱'],
  ['🔔', '🔕'],
  ['☀️', '🌻'],
  ['🍀', '🌿'],
  ['❄️', '💧'],
  ['😎', '🤓'],
];

// Curated vibrant hues with strong contrast against dark tile surfaces
const VIBRANT_HUES: readonly number[] = [
  354, // crimson
  14,  // vermilion
  32,  // amber-orange
  148, // emerald
  172, // teal
  198, // sky
  218, // cobalt
  248, // indigo
  286, // orchid
  328, // magenta-rose
];

interface PuzzleState {
  id: number;
  kind: RoundKind;
  gridSize: 3 | 4 | 5;
  oddIndex: number;
  // Emoji round fields
  baseEmoji?: string;
  oddEmoji?: string;
  pairIndex?: number;
  // Color shade round fields
  baseColor?: string;
  oddColor?: string;
  hueIndex?: number;
}

function getGridSize(correctCount: number): 3 | 4 | 5 {
  if (correctCount >= 7) return 5;
  if (correctCount >= 3) return 4;
  return 3;
}

function generatePuzzle(
  puzzleId: number,
  correctCount: number,
  prevPairIndex: number,
  prevHueIndex: number
): PuzzleState {
  const gridSize = getGridSize(correctCount);
  const totalTiles = gridSize * gridSize;
  const oddIndex = Math.floor(Math.random() * totalTiles);
  // Alternate cleanly between Lookalike Emojis (even rounds) and Color Shade Spotter (odd rounds)
  const kind: RoundKind = correctCount % 2 === 0 ? 'emoji' : 'shade';

  if (kind === 'emoji') {
    let pairIndex = Math.floor(Math.random() * EMOJI_PAIRS.length);
    if (pairIndex === prevPairIndex) {
      pairIndex = (pairIndex + 1) % EMOJI_PAIRS.length;
    }
    const pair = EMOJI_PAIRS[pairIndex];
    const flip = Math.random() < 0.5;
    return {
      id: puzzleId,
      kind,
      gridSize,
      oddIndex,
      baseEmoji: flip ? pair[0] : pair[1],
      oddEmoji: flip ? pair[1] : pair[0],
      pairIndex,
    };
  }

  let hueIndex = Math.floor(Math.random() * VIBRANT_HUES.length);
  if (hueIndex === prevHueIndex) {
    hueIndex = (hueIndex + 1) % VIBRANT_HUES.length;
  }
  const hue = VIBRANT_HUES[hueIndex];
  const sat = 74 + Math.floor(Math.random() * 12); // 74% - 85%
  const baseLight = 45 + Math.floor(Math.random() * 10); // 45% - 54%
  // Scale shade subtlety with difficulty while staying fair on mobile screens
  const delta = gridSize === 3 ? 15 : gridSize === 4 ? 11 : 9;
  const lighter = Math.random() < 0.5;
  const oddLight = lighter ? Math.min(76, baseLight + delta) : Math.max(24, baseLight - delta);

  return {
    id: puzzleId,
    kind,
    gridSize,
    oddIndex,
    baseColor: `hsl(${hue} ${sat}% ${baseLight}%)`,
    oddColor: `hsl(${hue} ${sat}% ${oddLight}%)`,
    hueIndex,
  };
}

export function OddOneOutGame({ onScore, team, timeLeft, isActive }: MiniGameProps) {
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [puzzle, setPuzzle] = useState<PuzzleState>(() => generatePuzzle(1, 0, -1, -1));
  const [feedback, setFeedback] = useState<{
    kind: 'hit' | 'miss';
    label: string;
    wrongIdx: number | null;
    token: number;
  } | null>(null);

  const lastPairRef = useRef<number>(puzzle.pairIndex ?? -1);
  const lastHueRef = useRef<number>(puzzle.hueIndex ?? -1);
  const nextIdRef = useRef<number>(2);
  const clearFeedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clearFeedbackTimerRef.current !== null) {
        clearTimeout(clearFeedbackTimerRef.current);
      }
    };
  }, []);

  const scheduleFeedbackClear = useCallback((durationMs: number) => {
    if (clearFeedbackTimerRef.current !== null) {
      clearTimeout(clearFeedbackTimerRef.current);
    }
    clearFeedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      clearFeedbackTimerRef.current = null;
    }, durationMs);
  }, []);

  const handleTileTap = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, tileIndex: number) => {
      e.preventDefault();
      if (!isActive) return;

      if (tileIndex === puzzle.oddIndex) {
        const nextStreak = streak + 1;
        const nextCorrect = correctCount + 1;
        // Base 10 pts + streak multiplier bonus (+5 per streak step, up to 5x)
        const multiplier = Math.min(nextStreak, 5);
        const points = 10 + (multiplier - 1) * 5;

        setStreak(nextStreak);
        setCorrectCount(nextCorrect);
        onScore(points);

        setFeedback({
          kind: 'hit',
          label: nextStreak >= 2 ? `+${points} · ${multiplier}x` : `+${points}`,
          wrongIdx: null,
          token: nextIdRef.current,
        });
        scheduleFeedbackClear(260);

        // Load next grid immediately with zero delay
        const nextPuzzle = generatePuzzle(
          nextIdRef.current++,
          nextCorrect,
          lastPairRef.current,
          lastHueRef.current
        );
        if (nextPuzzle.pairIndex !== undefined) {
          lastPairRef.current = nextPuzzle.pairIndex;
        }
        if (nextPuzzle.hueIndex !== undefined) {
          lastHueRef.current = nextPuzzle.hueIndex;
        }
        setPuzzle(nextPuzzle);
      } else {
        setStreak(0);
        onScore(-5);
        setFeedback({
          kind: 'miss',
          label: '-5',
          wrongIdx: tileIndex,
          token: nextIdRef.current++,
        });
        scheduleFeedbackClear(340);
      }
    },
    [correctCount, isActive, onScore, puzzle.oddIndex, scheduleFeedbackClear, streak]
  );

  const isPreCountdown = !isActive && timeLeft > 0;
  const totalTiles = puzzle.gridSize * puzzle.gridSize;
  const gridColsClass =
    puzzle.gridSize === 3
      ? 'grid-cols-3 gap-2.5 sm:gap-3'
      : puzzle.gridSize === 4
        ? 'grid-cols-4 gap-2 sm:gap-2.5'
        : 'grid-cols-5 gap-1.5 sm:gap-2';

  const emojiSizeClass =
    puzzle.gridSize === 3
      ? 'text-4xl sm:text-5xl'
      : puzzle.gridSize === 4
        ? 'text-3xl sm:text-4xl'
        : 'text-2xl sm:text-3xl';

  const tileRadiusClass =
    puzzle.gridSize === 5 ? 'rounded-xl' : 'rounded-2xl';

  const isHitFlash = feedback?.kind === 'hit';
  const isMissFlash = feedback?.kind === 'miss';
  const multiplier = Math.min(Math.max(1, streak), 5);

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-3 py-1 select-none">
      {/* Dark Arena Header Strip */}
      <div className="flex w-full max-w-md items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#121620] px-3.5 py-2.5 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              puzzle.kind === 'emoji'
                ? 'bg-amber-400/15 text-amber-300'
                : 'bg-sky-400/15 text-sky-300'
            }`}
          >
            {puzzle.kind === 'emoji' ? (
              <Eye className="h-4 w-4" />
            ) : (
              <Palette className="h-4 w-4" />
            )}
          </span>
          <div className="leading-tight">
            <div className="text-xs font-extrabold tracking-wide text-white uppercase">
              {puzzle.kind === 'emoji' ? 'Spot the Odd Emoji' : 'Spot the Odd Shade'}
            </div>
            <div className="font-mono-num text-[11px] font-semibold text-slate-400">
              Grid {puzzle.gridSize}×{puzzle.gridSize} · Found {correctCount}
            </div>
          </div>
        </div>

        {/* Live Streak / Multiplier Pill */}
        <div
          className={`font-mono-num inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold transition-colors ${
            streak >= 3
              ? 'bg-amber-400 text-slate-950'
              : streak >= 1
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-white/8 text-slate-400'
          }`}
        >
          <Flame className="h-3.5 w-3.5" />
          <span>{streak > 0 ? `${streak} (${multiplier}x)` : '0'}</span>
        </div>
      </div>

      {/* Main Dark Square Grid Board */}
      <div
        key={isMissFlash ? `miss-${feedback.token}` : 'board'}
        className={`relative flex aspect-square w-full max-w-[360px] items-center justify-center rounded-3xl border-2 bg-[#0E1118] p-3 shadow-2xl transition-colors duration-150 sm:p-3.5 ${
          isHitFlash
            ? 'border-emerald-400 bg-emerald-950/35'
            : isMissFlash
              ? 'animate-shake border-rose-500 bg-rose-950/35'
              : team === 'red'
                ? 'border-white/15'
                : 'border-slate-800/80'
        }`}
      >
        <div className={`grid h-full w-full ${gridColsClass}`}>
          {Array.from({ length: totalTiles }, (_, idx) => {
            const isOdd = idx === puzzle.oddIndex;
            const isWrongTapped = isMissFlash && feedback.wrongIdx === idx;

            if (isPreCountdown) {
              return (
                <div
                  key={`lock-${idx}`}
                  className={`flex items-center justify-center border border-white/10 bg-[#1A202D] opacity-60 ${tileRadiusClass}`}
                />
              );
            }

            if (puzzle.kind === 'emoji') {
              return (
                <button
                  key={`${puzzle.id}-${idx}`}
                  id={`odd-tile-${idx}`}
                  type="button"
                  disabled={!isActive}
                  onPointerDown={(e) => handleTileTap(e, idx)}
                  className={`flex items-center justify-center border transition-transform duration-75 active:scale-92 focus:outline-none disabled:opacity-50 ${tileRadiusClass} ${
                    isWrongTapped
                      ? 'border-rose-400 bg-rose-500/35'
                      : 'border-white/10 bg-[#1A202D] hover:border-white/20 hover:bg-[#222A3B]'
                  }`}
                >
                  <span className={`leading-none ${emojiSizeClass}`} aria-hidden="true">
                    {isOdd ? puzzle.oddEmoji : puzzle.baseEmoji}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={`${puzzle.id}-${idx}`}
                id={`odd-tile-${idx}`}
                type="button"
                disabled={!isActive}
                onPointerDown={(e) => handleTileTap(e, idx)}
                aria-label={`Color tile ${idx + 1}`}
                style={{
                  backgroundColor: isOdd ? puzzle.oddColor : puzzle.baseColor,
                }}
                className={`relative border-2 transition-transform duration-75 active:scale-92 focus:outline-none disabled:opacity-50 ${tileRadiusClass} ${
                  isWrongTapped
                    ? 'border-rose-300 ring-2 ring-rose-500'
                    : 'border-black/20 hover:brightness-105'
                }`}
              />
            );
          })}
        </div>

        {/* Transient Hit / Miss Toast Pill (non-blocking pointer-events-none) */}
        {feedback && (
          <div
            key={feedback.token}
            className={`animate-chip-pop pointer-events-none absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-extrabold shadow-lg ${
              feedback.kind === 'hit'
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-rose-500 text-white'
            }`}
          >
            {feedback.kind === 'hit' ? (
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            ) : (
              <X className="h-3.5 w-3.5 stroke-[3]" />
            )}
            <span className="font-mono-num">{feedback.label}</span>
          </div>
        )}
      </div>

      {/* Bottom Progress Strip (Shows scaling milestones 3x3 -> 4x4 -> 5x5) */}
      <div className="flex w-full max-w-md items-center justify-between rounded-2xl border border-white/10 bg-[#121620] px-4 py-2.5 text-xs font-bold text-slate-300">
        <span>
          {correctCount < 3
            ? `${3 - correctCount} more to unlock 4×4`
            : correctCount < 7
              ? `${7 - correctCount} more to unlock 5×5`
              : 'Max Grid 5×5 — Keep the streak alive!'}
        </span>
        <span className="font-mono-num text-emerald-400">
          Next: +{10 + Math.min(streak, 4) * 5}
        </span>
      </div>
    </div>
  );
}

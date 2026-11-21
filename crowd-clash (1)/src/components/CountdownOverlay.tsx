import { useEffect, useState } from 'react';
import { Lock, Shield } from 'lucide-react';
import type { MiniGameDefinition, TeamId } from '../types/game';
import { GameIcon } from './GameIcon';

interface CountdownOverlayProps {
  countdownEndsAt: number | null;
  game: MiniGameDefinition;
  roundNumber: number;
  totalRounds: number;
  variant: 'host' | 'player';
  team?: TeamId;
}

type CountdownStep = '3' | '2' | '1' | 'GO!';

function computeStep(endsAt: number | null): CountdownStep {
  if (!endsAt) return 'GO!';
  const remainingMs = endsAt - Date.now();
  if (remainingMs > 2500) return '3';
  if (remainingMs > 1500) return '2';
  if (remainingMs > 500) return '1';
  return 'GO!';
}

/**
 * Synchronized 3 - 2 - 1 - GO! pre-round countdown overlay shared by Host Stage and Player phones.
 * Computed locally from `countdownEndsAt` so all connected screens stay tightly synchronized.
 */
export function CountdownOverlay({
  countdownEndsAt,
  game,
  roundNumber,
  totalRounds,
  variant,
  team,
}: CountdownOverlayProps) {
  const [step, setStep] = useState<CountdownStep>(() => computeStep(countdownEndsAt));

  useEffect(() => {
    if (!countdownEndsAt) return;
    const tick = () => {
      setStep(computeStep(countdownEndsAt));
    };
    const immediate = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 50);
    return () => {
      clearTimeout(immediate);
      clearInterval(interval);
    };
  }, [countdownEndsAt]);

  const isGo = step === 'GO!';
  const isHost = variant === 'host';

  const stepColorClass = isGo
    ? 'text-emerald-400'
    : step === '1'
      ? 'text-[#E63946]'
      : step === '2'
        ? 'text-amber-400'
        : 'text-white';

  const ringColorClass = isGo
    ? 'border-emerald-400/50 bg-emerald-500/15 shadow-[0_0_80px_rgba(16,185,129,0.28)]'
    : step === '1'
      ? 'border-rose-500/50 bg-rose-500/15 shadow-[0_0_80px_rgba(230,57,70,0.28)]'
      : step === '2'
        ? 'border-amber-400/50 bg-amber-400/15 shadow-[0_0_70px_rgba(245,158,11,0.22)]'
        : 'border-white/25 bg-white/8 shadow-[0_0_60px_rgba(255,255,255,0.12)]';

  return (
    <div
      id={`${variant}-countdown-overlay`}
      className={`flex w-full flex-col items-center justify-between text-center select-none ${
        isHost
          ? 'mx-auto max-w-4xl py-4'
          : 'min-h-dvh bg-[#0B0E14] px-5 py-8 text-white'
      }`}
    >
      {/* Top Meta Strip */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-extrabold tracking-[0.2em] text-amber-300 uppercase">
          Round {roundNumber} of {totalRounds}
        </span>

        {!isHost && team && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold tracking-wider uppercase ${
              team === 'red'
                ? 'bg-[#E63946] text-white'
                : 'bg-[#F8F9FB] text-slate-950'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            {team === 'red' ? 'Team Red' : 'Team White'}
          </span>
        )}
      </div>

      {/* Center Game Title + Giant Animated Countdown Ring */}
      <div className="my-6 flex w-full flex-col items-center">
        <div className="inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
          <GameIcon icon={game.icon} className="h-5 w-5 text-white" />
          <span className="font-display text-lg font-bold text-white sm:text-2xl">
            {game.title}
          </span>
        </div>

        {/* Animated 3 - 2 - 1 - GO! Circle */}
        <div
          key={step}
          className={`animate-countdown-pop mt-7 flex items-center justify-center rounded-full border-4 transition-colors ${ringColorClass} ${
            isHost ? 'h-56 w-56 sm:h-64 sm:w-64' : 'h-48 w-48 sm:h-56 sm:w-56'
          }`}
        >
          <span
            className={`font-display font-bold tracking-tight ${stepColorClass} ${
              isGo
                ? isHost
                  ? 'text-7xl sm:text-8xl'
                  : 'text-6xl sm:text-7xl'
                : isHost
                  ? 'text-9xl'
                  : 'text-8xl'
            }`}
          >
            {step}
          </span>
        </div>

        {/* 1-Line How to Play Instruction */}
        <div className="mt-7 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#141822] px-5 py-4 shadow-xl">
          <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-400 uppercase">
            How to Play
          </div>
          <p
            className={`mt-1.5 font-semibold text-slate-100 ${
              isHost ? 'text-lg sm:text-2xl' : 'text-sm sm:text-base'
            }`}
          >
            {game.rules}
          </p>
        </div>
      </div>

      {/* Input Lock Notice */}
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">
        <Lock className="h-3.5 w-3.5 text-amber-400" />
        <span>
          {isGo
            ? 'Go! Round Starting…'
            : isHost
              ? 'Player inputs locked until GO!'
              : 'Inputs locked — hands ready!'}
        </span>
      </div>
    </div>
  );
}

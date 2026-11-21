import { Clock, Minus, Play, Plus } from 'lucide-react';
import type { MiniGameDefinition } from '../../types/game';
import { GameIcon } from '../GameIcon';

interface HostGameIntroViewProps {
  game: MiniGameDefinition;
  roundNumber: number;
  totalRounds: number;
  durationSec: number;
  onChangeDuration: (sec: number) => void;
  onStartRound: () => void;
}

export function HostGameIntroView({
  game,
  roundNumber,
  totalRounds,
  durationSec,
  onChangeDuration,
  onStartRound,
}: HostGameIntroViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
      <div className="host-panel w-full rounded-[2rem] p-8 sm:p-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-amber-300 uppercase">
          Round {roundNumber} of {totalRounds}
        </div>

        <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-950 shadow-2xl">
          <GameIcon icon={game.icon} className="h-10 w-10" />
        </div>

        <h1 className="font-display mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
          {game.title}
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed font-medium text-slate-300 sm:text-2xl">
          {game.rules}
        </p>

        {/* Duration Adjuster */}
        <div className="mt-8 inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-black/35 px-5 py-3">
          <Clock className="h-5 w-5 text-slate-400" />
          <span className="text-xs font-bold tracking-[0.16em] text-slate-400 uppercase">
            Round Duration
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeDuration(durationSec - 5)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Decrease round duration by 5 seconds"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="font-mono-num min-w-[4.5rem] text-center text-xl font-extrabold text-white">
              {durationSec}s
            </span>
            <button
              type="button"
              onClick={() => onChangeDuration(durationSec + 5)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Increase round duration by 5 seconds"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Start Round CTA */}
        <div className="mt-9">
          <button
            id="host-start-round-btn"
            type="button"
            onClick={onStartRound}
            className="font-display inline-flex items-center gap-3 rounded-2xl bg-[#E63946] px-10 py-5 text-2xl font-bold text-white shadow-2xl shadow-rose-950/60 transition hover:bg-[#F04452] active:scale-[0.98]"
          >
            <Play className="h-7 w-7 fill-white" />
            <span>Start Round</span>
          </button>
        </div>
      </div>
    </div>
  );
}

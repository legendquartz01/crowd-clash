import { Shield } from 'lucide-react';
import type { MiniGameDefinition, TeamId } from '../../types/game';
import { GameIcon } from '../GameIcon';

interface PlayerGameIntroViewProps {
  game: MiniGameDefinition;
  team: TeamId;
  roundNumber: number;
  totalRounds: number;
}

export function PlayerGameIntroView({
  game,
  team,
  roundNumber,
  totalRounds,
}: PlayerGameIntroViewProps) {
  const isRed = team === 'red';

  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-between px-5 py-8 ${
        isRed ? 'player-surface-red text-white' : 'player-surface-white text-slate-950'
      }`}
    >
      {/* Team Banner */}
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold tracking-[0.18em] uppercase ${
          isRed ? 'bg-black/25 text-white' : 'bg-slate-900 text-white'
        }`}
      >
        <Shield className="h-4 w-4" />
        <span>{isRed ? 'Team Red' : 'Team White'}</span>
      </div>

      {/* Get Ready Card */}
      <main className="my-6 w-full max-w-md text-center">
        <p
          className={`text-xs font-extrabold tracking-[0.24em] uppercase ${
            isRed ? 'text-amber-300' : 'text-[#E63946]'
          }`}
        >
          Round {roundNumber} of {totalRounds} · Get Ready!
        </p>

        <div
          className={`mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-xl ${
            isRed ? 'bg-white text-rose-700' : 'bg-slate-950 text-white'
          }`}
        >
          <GameIcon icon={game.icon} className="h-10 w-10" />
        </div>

        <h1 className="font-display mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          {game.title}
        </h1>

        <p
          className={`mx-auto mt-4 max-w-sm rounded-2xl p-4 text-base leading-relaxed font-semibold ${
            isRed ? 'bg-black/20 text-rose-50' : 'bg-slate-900/5 text-slate-700'
          }`}
        >
          {game.rules}
        </p>
      </main>

      <p className={`text-xs font-bold tracking-[0.16em] uppercase ${isRed ? 'text-rose-100/80' : 'text-slate-500'}`}>
        Eyes on the Host — starting any second…
      </p>
    </div>
  );
}

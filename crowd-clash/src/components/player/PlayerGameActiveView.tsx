import { Shield, Timer } from 'lucide-react';
import type { MiniGameDefinition, TeamId } from '../../types/game';

interface PlayerGameActiveViewProps {
  game: MiniGameDefinition;
  team: TeamId;
  timeLeft: number;
  roundScore: number;
  onScore: (points: number) => void;
}

export function PlayerGameActiveView({
  game,
  team,
  timeLeft,
  roundScore,
  onScore,
}: PlayerGameActiveViewProps) {
  const GameComponent = game.component;
  const isRed = team === 'red';
  const isUrgent = timeLeft <= 5 && timeLeft > 0;

  return (
    <div
      className={`flex h-dvh flex-col overflow-hidden px-4 py-4 ${
        isRed ? 'player-surface-red text-white' : 'player-surface-white text-slate-950'
      }`}
    >
      {/* Compact Game HUD */}
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-2 pb-3">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold uppercase ${
            isRed ? 'bg-black/25 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>{isRed ? 'Red' : 'White'}</span>
        </div>

        <div
          id="player-round-timer"
          className={`font-mono-num inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-base font-extrabold ${
            isUrgent
              ? 'animate-urgency bg-amber-400 text-slate-950'
              : isRed
                ? 'bg-white text-rose-700'
                : 'bg-slate-950 text-white'
          }`}
        >
          <Timer className="h-4 w-4" />
          <span>{timeLeft}s</span>
        </div>

        <div
          id="player-round-score"
          className={`font-mono-num rounded-full px-3.5 py-1.5 text-sm font-extrabold ${
            isRed ? 'bg-black/25 text-amber-300' : 'bg-slate-200 text-slate-900'
          }`}
        >
          +{roundScore}
        </div>
      </header>

      {/* Active Mini-Game Mounted from Modular Registry */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden">
        <GameComponent
          onScore={onScore}
          team={team}
          timeLeft={timeLeft}
          isActive={timeLeft > 0}
        />
      </main>
    </div>
  );
}

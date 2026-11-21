import { Check, Shield } from 'lucide-react';
import type { TeamId } from '../../types/game';

interface PlayerTeamSelectViewProps {
  playerName: string;
  selectedTeam: TeamId | null;
  redCount: number;
  whiteCount: number;
  onPickTeam: (team: TeamId) => void;
}

export function PlayerTeamSelectView({
  playerName,
  selectedTeam,
  redCount,
  whiteCount,
  onPickTeam,
}: PlayerTeamSelectViewProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#11141B] px-5 py-7 text-white">
      <header className="mx-auto w-full max-w-md text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-amber-400 uppercase">
          Choose Your Side · {playerName}
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-tight">Pick Your Team</h1>
        <p className="mt-1 text-sm text-slate-400">
          You can switch anytime until the Host locks teams.
        </p>
      </header>

      <main className="mx-auto my-6 flex w-full max-w-md flex-1 flex-col gap-4">
        {/* Team Red Giant Touch Button */}
        <button
          id="pick-team-red-btn"
          type="button"
          onClick={() => onPickTeam('red')}
          className={`relative flex flex-1 flex-col items-center justify-center rounded-3xl border-4 p-6 text-center transition-all active:scale-[0.98] ${
            selectedTeam === 'red'
              ? 'border-amber-300 bg-[#E63946] text-white shadow-2xl shadow-rose-900/60'
              : 'border-rose-400/30 bg-[#C82333] text-white/95 hover:bg-[#D62839]'
          }`}
        >
          {selectedTeam === 'red' && (
            <span className="animate-chip-pop absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-amber-300 px-3 py-1 text-xs font-extrabold text-slate-950">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              JOINED
            </span>
          )}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/20">
            <Shield className="h-9 w-9" />
          </div>
          <span className="font-display mt-3 text-4xl font-bold tracking-tight">TEAM RED</span>
          <span className="font-mono-num mt-1.5 rounded-full bg-black/20 px-3.5 py-1 text-xs font-bold text-rose-100">
            {redCount} {redCount === 1 ? 'player' : 'players'}
          </span>
        </button>

        {/* Team White Giant Touch Button */}
        <button
          id="pick-team-white-btn"
          type="button"
          onClick={() => onPickTeam('white')}
          className={`relative flex flex-1 flex-col items-center justify-center rounded-3xl border-4 p-6 text-center transition-all active:scale-[0.98] ${
            selectedTeam === 'white'
              ? 'border-amber-400 bg-white text-slate-950 shadow-2xl shadow-white/20'
              : 'border-slate-300 bg-[#EEF1F5] text-slate-900 hover:bg-white'
          }`}
        >
          {selectedTeam === 'white' && (
            <span className="animate-chip-pop absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-extrabold text-amber-300">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              JOINED
            </span>
          )}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900/10">
            <Shield className="h-9 w-9 text-slate-900" />
          </div>
          <span className="font-display mt-3 text-4xl font-bold tracking-tight">TEAM WHITE</span>
          <span className="font-mono-num mt-1.5 rounded-full bg-slate-900/10 px-3.5 py-1 text-xs font-bold text-slate-700">
            {whiteCount} {whiteCount === 1 ? 'player' : 'players'}
          </span>
        </button>
      </main>
    </div>
  );
}

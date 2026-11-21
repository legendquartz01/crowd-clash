import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, LogOut, Trophy } from 'lucide-react';
import type { PlayerRecord, TeamId, TeamsState } from '../../types/game';

interface PlayerFinalWinnerViewProps {
  me: PlayerRecord;
  team: TeamId;
  teams: TeamsState;
  allPlayers: PlayerRecord[];
  onLeave: () => void;
}

export function PlayerFinalWinnerView({
  me,
  team,
  teams,
  allPlayers,
  onLeave,
}: PlayerFinalWinnerViewProps) {
  const winner =
    teams.red.totalScore > teams.white.totalScore
      ? 'red'
      : teams.white.totalScore > teams.red.totalScore
        ? 'white'
        : 'tie';

  const didWin = winner === team;
  const isTie = winner === 'tie';

  const overallRank =
    Math.max(
      1,
      [...allPlayers]
        .sort((a, b) => b.totalScore - a.totalScore)
        .findIndex((p) => p.id === me.id) + 1
    );

  useEffect(() => {
    if (!didWin && !isTie) return;
    void confetti({
      particleCount: 65,
      spread: 75,
      origin: { y: 0.6 },
      colors: team === 'red' ? ['#E63946', '#FBBF24', '#FFFFFF'] : ['#FFFFFF', '#FBBF24', '#94A3B8'],
    });
  }, [didWin, isTie, team]);

  const isRed = team === 'red';

  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-between px-5 py-8 ${
        isRed ? 'player-surface-red text-white' : 'player-surface-white text-slate-950'
      }`}
    >
      <div className="text-xs font-extrabold tracking-[0.22em] uppercase opacity-75">
        Match Complete
      </div>

      <main className="my-6 w-full max-w-md space-y-5 text-center">
        <div
          className={`rounded-3xl p-7 shadow-2xl ${
            isRed ? 'bg-black/25 text-white' : 'border border-slate-200 bg-white text-slate-950'
          }`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg">
            <Trophy className="h-9 w-9" />
          </div>

          <h1 className="font-display mt-5 text-4xl font-bold tracking-tight">
            {isTie ? "IT'S A TIE!" : didWin ? 'YOUR TEAM WON!' : 'GOOD GAME!'}
          </h1>

          <p className="mt-2 text-sm font-medium opacity-80">
            {isTie
              ? 'Both teams finished with the exact same score!'
              : didWin
                ? `Way to carry ${isRed ? 'Team Red' : 'Team White'}, ${me.name}!`
                : `Great hustle out there, ${me.name}. Ready for a rematch?`}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className={`rounded-2xl p-4 ${isRed ? 'bg-black/25' : 'bg-slate-100'}`}>
              <div className="text-[11px] font-bold tracking-wider uppercase opacity-70">
                Final Score
              </div>
              <div className="font-mono-num mt-1 text-3xl font-extrabold">
                {me.totalScore.toLocaleString()}
              </div>
            </div>

            <div className={`rounded-2xl p-4 ${isRed ? 'bg-black/25' : 'bg-slate-100'}`}>
              <div className="text-[11px] font-bold tracking-wider uppercase opacity-70">
                Overall Rank
              </div>
              <div className="font-mono-num mt-1 flex items-center justify-center gap-1 text-3xl font-extrabold">
                <Award className="h-6 w-6 text-amber-400" />#{overallRank}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold bg-black/15">
            <span>Red: {teams.red.totalScore.toLocaleString()}</span>
            <span>White: {teams.white.totalScore.toLocaleString()}</span>
          </div>
        </div>
      </main>

      <div className="flex w-full max-w-md flex-col items-center gap-3 text-center">
        <p className="text-xs font-bold tracking-wide opacity-80">
          Stay on this screen — if the Host taps Play Again, you&apos;ll stay in this room automatically!
        </p>
        <button
          id="player-join-new-room-btn"
          type="button"
          onClick={onLeave}
          className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold shadow-md transition active:scale-[0.98] ${
            isRed
              ? 'bg-white/95 text-rose-700 hover:bg-white'
              : 'bg-slate-950 text-white hover:bg-slate-800'
          }`}
        >
          <LogOut className="h-4 w-4" />
          <span>Switch / Leave Room</span>
        </button>
      </div>
    </div>
  );
}

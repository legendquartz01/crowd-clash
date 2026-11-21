import { Award, Shield } from 'lucide-react';
import type { PlayerRecord, TeamId, TeamsState } from '../../types/game';

interface PlayerRoundEndViewProps {
  me: PlayerRecord;
  team: TeamId;
  teams: TeamsState;
  allPlayers: PlayerRecord[];
  gameTitle: string;
}

export function PlayerRoundEndView({
  me,
  team,
  teams,
  allPlayers,
  gameTitle,
}: PlayerRoundEndViewProps) {
  const isRed = team === 'red';
  const sortedByRound = [...allPlayers].sort(
    (a, b) => b.roundScore - a.roundScore || b.totalScore - a.totalScore
  );
  const myRank = Math.max(1, sortedByRound.findIndex((p) => p.id === me.id) + 1);

  const myTeamTotal = teams[team].totalScore;
  const oppTeamTotal = teams[isRed ? 'white' : 'red'].totalScore;
  const teamStatus =
    myTeamTotal > oppTeamTotal
      ? 'Your team is in the lead!'
      : myTeamTotal < oppTeamTotal
        ? 'Your team is trailing — comeback time!'
        : 'Teams are dead even!';

  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-between px-5 py-8 ${
        isRed ? 'player-surface-red text-white' : 'player-surface-white text-slate-950'
      }`}
    >
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold tracking-[0.18em] uppercase ${
          isRed ? 'bg-black/25 text-white' : 'bg-slate-900 text-white'
        }`}
      >
        <Shield className="h-3.5 w-3.5" />
        <span>{isRed ? 'Team Red' : 'Team White'}</span>
      </div>

      <main className="my-6 w-full max-w-md space-y-4">
        <div
          className={`rounded-3xl p-6 text-center shadow-xl ${
            isRed ? 'bg-black/25 text-white' : 'border border-slate-200 bg-white text-slate-950'
          }`}
        >
          <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-75">
            Round Complete · {gameTitle}
          </p>
          <div className="font-mono-num mt-3 text-6xl font-extrabold">
            +{me.roundScore.toLocaleString()}
          </div>
          <p className="mt-1 text-sm font-semibold opacity-80">Points earned this round</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className={`rounded-2xl p-3.5 ${isRed ? 'bg-black/20' : 'bg-slate-100'}`}>
              <div className="text-[11px] font-bold tracking-wider uppercase opacity-70">
                Round Rank
              </div>
              <div className="font-mono-num mt-1 flex items-center justify-center gap-1 text-2xl font-extrabold">
                <Award className="h-5 w-5 text-amber-400" />#{myRank}
              </div>
            </div>

            <div className={`rounded-2xl p-3.5 ${isRed ? 'bg-black/20' : 'bg-slate-100'}`}>
              <div className="text-[11px] font-bold tracking-wider uppercase opacity-70">
                Your Total
              </div>
              <div className="font-mono-num mt-1 text-2xl font-extrabold">
                {me.totalScore.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Team Standing Card */}
        <div
          className={`rounded-3xl p-5 ${
            isRed ? 'bg-black/25 text-white' : 'border border-slate-200 bg-white text-slate-950'
          }`}
        >
          <div className="text-center text-xs font-extrabold tracking-[0.16em] uppercase opacity-75">
            {teamStatus}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-[#E63946] p-3 text-white">
              <div className="text-[10px] font-bold tracking-widest uppercase opacity-80">
                Team Red
              </div>
              <div className="font-mono-num text-2xl font-extrabold">
                {teams.red.totalScore.toLocaleString()}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#F8F9FB] p-3 text-slate-950">
              <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                Team White
              </div>
              <div className="font-mono-num text-2xl font-extrabold">
                {teams.white.totalScore.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </main>

      <p className="text-xs font-bold tracking-[0.16em] uppercase opacity-75">
        Waiting for Host to advance…
      </p>
    </div>
  );
}

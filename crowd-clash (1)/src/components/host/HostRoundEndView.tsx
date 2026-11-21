import { ArrowRight, Award, Crown, Sparkles } from 'lucide-react';
import type { MiniGameDefinition, PlayerRecord, TeamsState } from '../../types/game';
import { TeamBattleBar } from '../TeamBattleBar';

interface HostRoundEndViewProps {
  game: MiniGameDefinition | null;
  roundNumber: number;
  totalRounds: number;
  nextGameTitle: string | null;
  teams: TeamsState;
  players: PlayerRecord[];
  onAdvance: () => void;
}

export function HostRoundEndView({
  game,
  roundNumber,
  totalRounds,
  nextGameTitle,
  teams,
  players,
  onAdvance,
}: HostRoundEndViewProps) {
  const top5 = [...players]
    .sort((a, b) => b.roundScore - a.roundScore || b.totalScore - a.totalScore)
    .slice(0, 5);
  const mvp = top5[0] ?? null;

  const roundWinner =
    teams.red.roundScore > teams.white.roundScore
      ? 'Team Red takes the round!'
      : teams.white.roundScore > teams.red.roundScore
        ? 'Team White takes the round!'
        : 'Round ended in a dead tie!';

  const isLastRound = !nextGameTitle;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* Header & Advance CTA */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-amber-400 uppercase">
            Round {roundNumber} of {totalRounds} Complete · {game?.title}
          </p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            {roundWinner}
          </h1>
        </div>

        <button
          id="host-advance-round-btn"
          type="button"
          onClick={onAdvance}
          className={`font-display inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-lg font-bold shadow-xl transition active:scale-[0.98] ${
            isLastRound
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              : 'bg-[#E63946] text-white hover:bg-[#F04452]'
          }`}
        >
          {isLastRound ? (
            <>
              <Sparkles className="h-5 w-5" />
              <span>Reveal Final Winner</span>
            </>
          ) : (
            <>
              <span>Next: {nextGameTitle}</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>

      {/* Cumulative Team Totals */}
      <div>
        <TeamBattleBar
          redScore={teams.red.totalScore}
          whiteScore={teams.white.totalScore}
          label="Cumulative Match Standings"
        />
        <div className="mt-2.5 flex items-center justify-between px-2 text-xs font-bold">
          <span className="font-mono-num text-rose-400">
            +{teams.red.roundScore.toLocaleString()} pts this round
          </span>
          <span className="font-mono-num text-slate-300">
            +{teams.white.roundScore.toLocaleString()} pts this round
          </span>
        </div>
      </div>

      {/* Round MVP + Top 5 Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Round MVP Spotlight */}
        <section className="host-panel flex flex-col items-center justify-center rounded-3xl p-8 text-center lg:col-span-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-400">
            <Crown className="h-9 w-9" />
          </div>
          <span className="mt-4 text-xs font-extrabold tracking-[0.22em] text-amber-400 uppercase">
            Round MVP
          </span>
          {mvp ? (
            <>
              <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
                {mvp.name}
              </h2>
              <span
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold uppercase ${
                  mvp.team === 'red'
                    ? 'bg-[#E63946] text-white'
                    : 'bg-[#F8F9FB] text-slate-950'
                }`}
              >
                {mvp.team === 'red' ? 'Team Red' : 'Team White'}
              </span>
              <div className="font-mono-num mt-5 text-5xl font-extrabold text-amber-300">
                +{mvp.roundScore.toLocaleString()}
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Cumulative Total: {mvp.totalScore.toLocaleString()} pts
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No scores recorded this round.</p>
          )}
        </section>

        {/* Top 5 This Round */}
        <section className="host-panel rounded-3xl p-6 lg:col-span-7">
          <div className="mb-4 flex items-center gap-2.5">
            <Award className="h-5 w-5 text-amber-400" />
            <h2 className="font-display text-xl font-bold text-white">Top 5 This Round</h2>
          </div>

          {top5.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No player scores yet.</p>
          ) : (
            <div className="space-y-2.5">
              {top5.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/30 px-4 py-3.5"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`font-mono-num flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-xs text-slate-400">
                        <span className={p.team === 'red' ? 'text-rose-400' : 'text-slate-200'}>
                          {p.team === 'red' ? 'Team Red' : 'Team White'}
                        </span>
                        {' · '}
                        Total {p.totalScore.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono-num text-2xl font-extrabold text-white">
                    +{p.roundScore.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

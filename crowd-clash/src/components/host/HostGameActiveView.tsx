import { Square, Timer, Trophy } from 'lucide-react';
import type { MiniGameDefinition, PlayerRecord, TeamsState } from '../../types/game';
import { GameIcon } from '../GameIcon';
import { TeamBattleBar } from '../TeamBattleBar';
import { TugOfWarRope } from '../TugOfWarRope';

interface HostGameActiveViewProps {
  game: MiniGameDefinition;
  roundNumber: number;
  totalRounds: number;
  timeLeft: number;
  teams: TeamsState;
  players: PlayerRecord[];
  onEndRoundEarly: () => void;
}

export function HostGameActiveView({
  game,
  roundNumber,
  totalRounds,
  timeLeft,
  teams,
  players,
  onEndRoundEarly,
}: HostGameActiveViewProps) {
  const topPlayers = [...players]
    .sort((a, b) => b.roundScore - a.roundScore || b.totalScore - a.totalScore)
    .slice(0, 8);

  const isUrgent = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* Top Broadcast Strip: Game Title + Synced Countdown Timer + End Early */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
            <GameIcon icon={game.icon} className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
              Round {roundNumber} of {totalRounds} · Live Leaderboard
            </div>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {game.title}
            </h1>
          </div>
        </div>

        {/* Center / Right Countdown Timer */}
        <div className="flex items-center gap-4">
          <div
            id="host-round-timer"
            className={`flex items-center gap-3 rounded-2xl border px-6 py-3 ${
              isUrgent
                ? 'animate-urgency border-rose-500 bg-rose-500/20 text-rose-200'
                : 'border-white/15 bg-white/5 text-white'
            }`}
          >
            <Timer className={`h-6 w-6 ${isUrgent ? 'text-rose-400' : 'text-amber-400'}`} />
            <span className="font-mono-num text-4xl font-extrabold tracking-tight sm:text-5xl">
              {String(timeLeft).padStart(2, '0')}s
            </span>
          </div>

          <button
            id="host-end-round-early-btn"
            type="button"
            onClick={onEndRoundEarly}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-rose-400/50 hover:bg-rose-500/20 hover:text-white"
          >
            <Square className="h-4 w-4 fill-current" />
            <span>End Round Early</span>
          </button>
        </div>
      </div>

      {/* Live Team Score Visual (Animated Rope for Tug-of-War, Split Bar for other games) */}
      {game.id === 'tug-of-war' ? (
        <TugOfWarRope redScore={teams.red.roundScore} whiteScore={teams.white.roundScore} />
      ) : (
        <TeamBattleBar
          redScore={teams.red.roundScore}
          whiteScore={teams.white.roundScore}
          label="Live Round Score"
        />
      )}

      {/* Live Top 8 Individual Players */}
      <section className="host-panel rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="font-display text-xl font-bold text-white">
              Live Top 8 Players — This Round
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Updating live from audience phones
          </span>
        </div>

        {topPlayers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-slate-500">
            Waiting for scores to roll in…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {topPlayers.map((player, idx) => {
              const isRed = player.team === 'red';
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/30 px-4 py-3.5 transition-all"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className={`font-mono-num flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      #{idx + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-white">
                        {player.name}
                      </div>
                      <span
                        className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${
                          isRed
                            ? 'bg-[#E63946]/25 text-rose-300'
                            : 'bg-white/15 text-slate-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isRed ? 'bg-[#E63946]' : 'bg-white'
                          }`}
                        />
                        {isRed ? 'Team Red' : 'Team White'}
                      </span>
                    </div>
                  </div>

                  <div className="font-mono-num text-2xl font-extrabold text-white">
                    {player.roundScore.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

import { Play, Shield, Users } from 'lucide-react';
import type { PlayerRecord } from '../../types/game';

interface HostTeamSelectViewProps {
  players: PlayerRecord[];
  playlistCount: number;
  onStartGames: () => void;
}

export function HostTeamSelectView({
  players,
  playlistCount,
  onStartGames,
}: HostTeamSelectViewProps) {
  const redPlayers = players.filter((p) => p.team === 'red');
  const whitePlayers = players.filter((p) => p.team === 'white');
  const unassigned = players.filter((p) => !p.team);

  const assignedTotal = redPlayers.length + whitePlayers.length;
  const redPct = assignedTotal === 0 ? 50 : Math.round((redPlayers.length / assignedTotal) * 100);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {/* Title & Action Strip */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-amber-400 uppercase">
            Pick Your Side on Your Phone
          </p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Team Red vs. Team White
          </h1>
        </div>

        <button
          id="host-start-games-btn"
          type="button"
          onClick={onStartGames}
          className="font-display inline-flex items-center gap-2.5 rounded-2xl bg-amber-400 px-8 py-4 text-lg font-bold text-slate-950 shadow-xl shadow-amber-950/40 transition hover:bg-amber-300 active:scale-[0.98]"
        >
          <Play className="h-5 w-5 fill-slate-950" />
          <span>Start Games ({playlistCount})</span>
        </button>
      </div>

      {/* Balance Bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/10 p-0.5">
        <div className="flex h-full w-full overflow-hidden rounded-full">
          <div
            className="h-full bg-[#E63946] transition-all duration-300"
            style={{ width: `${redPct}%` }}
          />
          <div
            className="h-full bg-[#F8F9FB] transition-all duration-300"
            style={{ width: `${100 - redPct}%` }}
          />
        </div>
      </div>

      {/* Split-Screen Live Roster */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Team Red Panel */}
        <section className="flex min-h-[340px] flex-col rounded-3xl border border-rose-500/30 bg-gradient-to-b from-[#3A1219] to-[#1A0B0E] p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between border-b border-rose-400/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E63946] text-white shadow-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Team Red</h2>
                <p className="text-xs font-semibold tracking-wider text-rose-300/80 uppercase">
                  Crimson Squad
                </p>
              </div>
            </div>
            <div className="font-mono-num rounded-2xl bg-[#E63946] px-4 py-2 text-2xl font-extrabold text-white">
              {redPlayers.length}
            </div>
          </div>

          {redPlayers.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm font-medium text-rose-200/50">
              No players on Team Red yet…
            </div>
          ) : (
            <div className="flex flex-wrap content-start gap-2.5">
              {redPlayers.map((p) => (
                <span
                  key={p.id}
                  className="animate-chip-pop inline-flex items-center gap-2 rounded-full bg-[#E63946] px-4 py-2 text-sm font-bold text-white shadow-sm"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${p.online ? 'bg-white' : 'bg-rose-950/60'}`}
                  />
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Team White Panel */}
        <section className="flex min-h-[340px] flex-col rounded-3xl border border-white/25 bg-gradient-to-b from-[#252A36] to-[#14171F] p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between border-b border-white/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8F9FB] text-slate-950 shadow-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Team White</h2>
                <p className="text-xs font-semibold tracking-wider text-slate-300/80 uppercase">
                  Ivory Squad
                </p>
              </div>
            </div>
            <div className="font-mono-num rounded-2xl bg-[#F8F9FB] px-4 py-2 text-2xl font-extrabold text-slate-950">
              {whitePlayers.length}
            </div>
          </div>

          {whitePlayers.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm font-medium text-slate-400/60">
              No players on Team White yet…
            </div>
          ) : (
            <div className="flex flex-wrap content-start gap-2.5">
              {whitePlayers.map((p) => (
                <span
                  key={p.id}
                  className="animate-chip-pop inline-flex items-center gap-2 rounded-full bg-[#F8F9FB] px-4 py-2 text-sm font-bold text-slate-950 shadow-sm"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${p.online ? 'bg-emerald-600' : 'bg-slate-400'}`}
                  />
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Unassigned Players Strip */}
      {unassigned.length > 0 && (
        <div className="host-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Users className="h-4 w-4 text-amber-400" />
            <span>
              {unassigned.length} still choosing ({unassigned.map((u) => u.name).join(', ')})
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Anyone still undecided is auto-balanced when you start.
          </span>
        </div>
      )}
    </div>
  );
}

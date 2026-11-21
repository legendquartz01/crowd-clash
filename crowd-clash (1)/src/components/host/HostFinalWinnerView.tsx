import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Crown, RefreshCw, RotateCcw, Trophy } from 'lucide-react';
import type { PlayerRecord, TeamsState } from '../../types/game';

interface HostFinalWinnerViewProps {
  roomCode: string;
  teams: TeamsState;
  players: PlayerRecord[];
  onPlayAgainSameRoom: () => void;
  onNewRoom: () => void;
}

export function HostFinalWinnerView({
  roomCode,
  teams,
  players,
  onPlayAgainSameRoom,
  onNewRoom,
}: HostFinalWinnerViewProps) {
  const redTotal = teams.red.totalScore;
  const whiteTotal = teams.white.totalScore;
  const winner = redTotal > whiteTotal ? 'red' : whiteTotal > redTotal ? 'white' : 'tie';

  const top3 = [...players]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3);

  // Trigger celebratory team-colored canvas-confetti bursts
  useEffect(() => {
    const colors =
      winner === 'red'
        ? ['#E63946', '#FF6B6B', '#FBBF24', '#FFFFFF']
        : winner === 'white'
          ? ['#FFFFFF', '#E2E8F0', '#FBBF24', '#94A3B8']
          : ['#E63946', '#FFFFFF', '#FBBF24'];

    const fire = (originX: number, angle: number) => {
      void confetti({
        particleCount: 70,
        angle,
        spread: 68,
        origin: { x: originX, y: 0.65 },
        colors,
      });
    };

    fire(0.15, 60);
    fire(0.85, 120);

    const t1 = window.setTimeout(() => {
      void confetti({
        particleCount: 95,
        spread: 95,
        origin: { x: 0.5, y: 0.4 },
        colors,
      });
    }, 450);

    const t2 = window.setTimeout(() => {
      fire(0.2, 65);
      fire(0.8, 115);
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [winner]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-7 text-center">
      {/* Winning Team Hero Banner */}
      <section
        className={`w-full rounded-[2rem] border p-8 shadow-2xl sm:p-12 ${
          winner === 'red'
            ? 'border-rose-400/40 bg-gradient-to-b from-[#6B121E] via-[#3A0C13] to-[#1A090C]'
            : winner === 'white'
              ? 'border-white/35 bg-gradient-to-b from-[#333A4A] via-[#1E232E] to-[#12151C]'
              : 'border-amber-400/35 bg-gradient-to-b from-[#3B2B0D] via-[#1F1A11] to-[#12151C]'
        }`}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-400 text-slate-950 shadow-xl">
          <Trophy className="h-11 w-11" />
        </div>

        <p className="mt-5 text-xs font-extrabold tracking-[0.26em] text-amber-300 uppercase">
          Final Championship Result
        </p>

        <h1 className="font-display mt-2 text-5xl font-bold tracking-tight text-white sm:text-7xl">
          {winner === 'red'
            ? 'TEAM RED WINS!'
            : winner === 'white'
              ? 'TEAM WHITE WINS!'
              : "IT'S A CHAMPIONSHIP TIE!"}
        </h1>

        {/* Final Score Breakdown */}
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-4">
          <div
            className={`rounded-2xl border p-5 ${
              winner === 'red'
                ? 'border-rose-400 bg-[#E63946] text-white shadow-xl'
                : 'border-white/10 bg-black/35 text-slate-200'
            }`}
          >
            <div className="text-xs font-extrabold tracking-[0.18em] uppercase opacity-80">
              Team Red
            </div>
            <div className="font-mono-num mt-1 text-4xl font-extrabold sm:text-5xl">
              {redTotal.toLocaleString()}
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              winner === 'white'
                ? 'border-white bg-[#F8F9FB] text-slate-950 shadow-xl'
                : 'border-white/10 bg-black/35 text-slate-200'
            }`}
          >
            <div className="text-xs font-extrabold tracking-[0.18em] uppercase opacity-80">
              Team White
            </div>
            <div className="font-mono-num mt-1 text-4xl font-extrabold sm:text-5xl">
              {whiteTotal.toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      {/* Top 3 Overall MVP Podium */}
      <section className="host-panel w-full rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <Crown className="h-6 w-6 text-amber-400" />
          <h2 className="font-display text-2xl font-bold text-white">Overall Top 3 MVPs</h2>
        </div>

        {top3.length === 0 ? (
          <p className="py-6 text-sm text-slate-400">No players participated in this match.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {top3.map((player, idx) => {
              const rankLabel = idx === 0 ? '1ST · MVP' : idx === 1 ? '2ND' : '3RD';
              const rankColors =
                idx === 0
                  ? 'border-amber-400/50 bg-amber-400/10'
                  : idx === 1
                    ? 'border-slate-300/30 bg-white/5'
                    : 'border-amber-700/40 bg-amber-900/15';

              return (
                <div
                  key={player.id}
                  className={`flex flex-col items-center rounded-2xl border p-6 ${rankColors}`}
                >
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold tracking-widest uppercase ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                          ? 'bg-slate-200 text-slate-950'
                          : 'bg-amber-700 text-white'
                    }`}
                  >
                    {rankLabel}
                  </span>
                  <div className="font-display mt-3 text-2xl font-bold text-white">
                    {player.name}
                  </div>
                  <span
                    className={`mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                      player.team === 'red'
                        ? 'bg-[#E63946] text-white'
                        : 'bg-[#F8F9FB] text-slate-950'
                    }`}
                  >
                    {player.team === 'red' ? 'Team Red' : 'Team White'}
                  </span>
                  <div className="font-mono-num mt-4 text-3xl font-extrabold text-white">
                    {player.totalScore.toLocaleString()}
                  </div>
                  <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    Total Points
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Rematch Action Buttons */}
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          id="host-play-again-same-room-btn"
          type="button"
          onClick={onPlayAgainSameRoom}
          className="font-display inline-flex items-center gap-2.5 rounded-2xl bg-emerald-400 px-9 py-4 text-lg font-bold text-slate-950 shadow-2xl shadow-emerald-950/50 transition hover:bg-emerald-300 active:scale-[0.98]"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Play Again (Same Room · {roomCode})</span>
        </button>

        <button
          id="host-play-again-new-room-btn"
          type="button"
          onClick={onNewRoom}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-6 py-4 text-sm font-bold text-slate-200 transition hover:bg-white/15 hover:text-white active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" />
          <span>New Room</span>
        </button>
      </div>
    </div>
  );
}

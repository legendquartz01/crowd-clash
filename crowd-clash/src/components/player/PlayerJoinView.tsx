import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, MonitorPlay, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { normalizeRoomCode, type PlayerLastProfile } from '../../lib/storage';

interface PlayerJoinViewProps {
  initialRoomCode: string;
  lastProfile: PlayerLastProfile | null;
  onJoin: (roomCode: string, name: string) => void;
}

export function PlayerJoinView({
  initialRoomCode,
  lastProfile,
  onJoin,
}: PlayerJoinViewProps) {
  const urlCode = normalizeRoomCode(initialRoomCode);
  const [roomCode, setRoomCode] = useState(() => urlCode || lastProfile?.roomCode || '');
  const [name, setName] = useState(() => lastProfile?.name ?? '');
  const [error, setError] = useState('');

  // Show 1-tap Rejoin card whenever the player has a saved room + nickname
  const rejoinCode = urlCode || lastProfile?.roomCode || '';
  const rejoinName = lastProfile?.name?.trim() || '';
  const canOneTapRejoin = rejoinCode.length === 4 && rejoinName.length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanCode = normalizeRoomCode(roomCode);
    const cleanName = name.trim();
    if (cleanCode.length !== 4) {
      setError('Enter the 4-letter room code shown on the big screen.');
      return;
    }
    if (cleanName.length < 1) {
      setError('Pick a nickname so your team can cheer for you.');
      return;
    }
    setError('');
    onJoin(cleanCode, cleanName);
  };

  return (
    <div className="player-surface-neutral flex min-h-dvh flex-col items-center justify-between px-5 py-8">
      {/* Top Brand Mark */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 overflow-hidden rounded-xl border border-slate-300 shadow-sm">
          <div className="h-full w-1/2 bg-[#E63946]" />
          <div className="h-full w-1/2 bg-white" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight text-slate-900">
          CROWD CLASH
        </span>
      </div>

      {/* Main Join Card */}
      <main className="my-6 w-full max-w-sm space-y-3.5">
        {/* 1-Tap Rejoin Banner */}
        {canOneTapRejoin && (
          <button
            id="player-one-tap-rejoin-btn"
            type="button"
            onClick={() => onJoin(rejoinCode, rejoinName)}
            className="flex w-full items-center justify-between gap-3 rounded-3xl border-2 border-emerald-500/40 bg-[#11151E] px-5 py-4 text-left text-white shadow-xl transition hover:border-emerald-400 hover:bg-[#171D29] active:scale-[0.98]"
          >
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold tracking-[0.18em] text-emerald-400 uppercase">
                1-Tap Quick Rejoin
              </div>
              <div className="font-display mt-0.5 truncate text-lg font-bold text-white">
                Rejoin <span className="font-mono-num tracking-wider text-emerald-300">{rejoinCode}</span> as {rejoinName}
              </div>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950">
              <RefreshCw className="h-5 w-5" />
            </div>
          </button>
        )}

        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-7">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Jump In
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter the room code from the Host screen and pick your nickname.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="player-room-code-input"
                className="mb-1.5 block text-xs font-bold tracking-[0.14em] text-slate-500 uppercase"
              >
                Room Code
              </label>
              <input
                id="player-room-code-input"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(normalizeRoomCode(e.target.value))}
                placeholder="ABCD"
                className="font-mono-num w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-3xl font-extrabold tracking-[0.3em] text-slate-950 uppercase placeholder:text-slate-300 focus:border-[#E63946] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="player-nickname-input"
                className="mb-1.5 block text-xs font-bold tracking-[0.14em] text-slate-500 uppercase"
              >
                Nickname
              </label>
              <input
                id="player-nickname-input"
                type="text"
                autoComplete="nickname"
                maxLength={18}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex, Nova, Kai"
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-lg font-bold text-slate-950 placeholder:font-medium placeholder:text-slate-400 focus:border-[#E63946] focus:bg-white focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
                {error}
              </p>
            )}

            <button
              id="player-join-submit-btn"
              type="submit"
              className="font-display flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E63946] px-5 py-4 text-lg font-bold text-white shadow-lg shadow-rose-600/25 transition hover:bg-[#D62839] active:scale-[0.98]"
            >
              <span>Join Room</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>
      </main>

      {/* Host Switcher Footer */}
      <footer className="text-center">
        <Link
          id="launch-host-stage-link"
          to="/host"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-white hover:text-slate-950"
        >
          <MonitorPlay className="h-4 w-4 text-[#E63946]" />
          <span>Hosting on a big screen? Launch Host Stage</span>
        </Link>
      </footer>
    </div>
  );
}

import { CheckCircle2, Gamepad2, LogOut, UserX, Users } from 'lucide-react';
import type { ConnectionStatus, GameMode, TransportMode } from '../../types/game';
import { ConnectionBadge } from '../ConnectionBadge';

interface PlayerLobbyViewProps {
  roomCode: string;
  playerName: string;
  gameMode: GameMode;
  connectedPlayersCount: number;
  hasHostSynced: boolean;
  connectionStatus: ConnectionStatus;
  transportMode: TransportMode;
  onLeave: () => void;
}

export function PlayerLobbyView({
  roomCode,
  playerName,
  gameMode,
  connectedPlayersCount,
  hasHostSynced,
  connectionStatus,
  transportMode,
  onLeave,
}: PlayerLobbyViewProps) {
  return (
    <div className="player-surface-neutral flex min-h-dvh flex-col items-center justify-between px-5 py-7">
      {/* Top Bar */}
      <header className="flex w-full max-w-md items-center justify-between">
        <div className="rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-extrabold tracking-[0.16em] text-white uppercase">
          Room <span className="font-mono-num">{roomCode}</span>
        </div>
        <ConnectionBadge status={connectionStatus} mode={transportMode} variant="light" />
      </header>

      {/* Main Waiting Card */}
      <main className="my-6 w-full max-w-md text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <h1 className="font-display mt-5 text-3xl font-bold tracking-tight text-slate-950">
            You&apos;re in!
          </h1>
          <p className="mt-2 text-base font-medium text-slate-600">
            {hasHostSynced
              ? gameMode === 'imposter'
                ? 'Host selected Imposter Mode — waiting for roles…'
                : 'Waiting for host to start team selection…'
              : `Connecting to Host in room ${roomCode}…`}
          </p>

          <div className="mt-6 rounded-2xl bg-slate-100 p-4">
            <div className="text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
              Playing As
            </div>
            <div className="font-display mt-1 text-2xl font-bold text-slate-900">
              {playerName}
            </div>
          </div>

          {hasHostSynced && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-600">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-mono-num">{connectedPlayersCount}</span>
                <span>in room</span>
              </div>
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold ${
                  gameMode === 'imposter'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-900 text-white'
                }`}
              >
                {gameMode === 'imposter' ? (
                  <>
                    <UserX className="h-3.5 w-3.5" />
                    <span>Imposter Mode</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="h-3.5 w-3.5" />
                    <span>Arcade Mode</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer>
        <button
          id="player-leave-room-btn"
          type="button"
          onClick={onLeave}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-800"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Leave Room</span>
        </button>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import { RotateCcw, Users, Volume2, VolumeX } from 'lucide-react';
import { stageAudio } from '../lib/sound';
import type { ConnectionStatus, GameState, TransportMode } from '../types/game';
import { ConnectionBadge } from './ConnectionBadge';

interface HostHeaderProps {
  roomCode: string;
  onlineCount: number;
  totalPlayers: number;
  gameState: GameState;
  connectionStatus: ConnectionStatus;
  transportMode: TransportMode;
  onNewRoom: () => void;
}

const STATE_LABELS: Record<GameState, string> = {
  LOBBY: 'Lobby',
  TEAM_SELECT: 'Team Selection',
  GAME_INTRO: 'Up Next',
  GAME_ACTIVE: 'Live Round',
  ROUND_END: 'Round Results',
  FINAL_WINNER: 'Championship',
};

export function HostHeader({
  roomCode,
  onlineCount,
  totalPlayers,
  gameState,
  connectionStatus,
  transportMode,
  onNewRoom,
}: HostHeaderProps) {
  const [muted, setMuted] = useState(stageAudio.muted);

  const toggleMute = () => {
    const next = !muted;
    stageAudio.muted = next;
    setMuted(next);
  };

  return (
    <header className="border-b border-white/10 bg-[#0C0E12]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 overflow-hidden rounded-xl border border-white/15">
              <div className="h-full w-1/2 bg-[#E63946]" />
              <div className="h-full w-1/2 bg-[#F8F9FB]" />
            </div>
            <div>
              <div className="font-display text-lg font-bold tracking-tight text-white leading-none">
                CROWD CLASH
              </div>
              <div className="mt-0.5 text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                Host Stage · {STATE_LABELS[gameState]}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Room Code Chip */}
          <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5">
            <span className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase">
              Room
            </span>
            <span className="font-mono-num text-sm font-extrabold tracking-[0.18em] text-white">
              {roomCode}
            </span>
          </div>

          {/* Live Player Counter */}
          <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-sm font-bold text-white">
            <Users className="h-4 w-4 text-amber-400" />
            <span className="font-mono-num">{onlineCount}</span>
            <span className="hidden text-xs font-medium text-slate-400 sm:inline">
              online{totalPlayers > onlineCount ? ` / ${totalPlayers}` : ''}
            </span>
          </div>

          <ConnectionBadge status={connectionStatus} mode={transportMode} variant="dark" />

          <button
            id="host-mute-btn"
            type="button"
            onClick={toggleMute}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            title={muted ? 'Unmute stage sound cues' : 'Mute stage sound cues'}
            aria-label={muted ? 'Unmute stage sound cues' : 'Mute stage sound cues'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {gameState !== 'LOBBY' && (
            <button
              id="host-reset-room-btn"
              type="button"
              onClick={onNewRoom}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-200"
              title="Start a brand new room"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Room</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

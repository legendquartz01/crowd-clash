import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Gamepad2,
  ListChecks,
  UserX,
  Users,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { GAME_REGISTRY } from '../../games/registry';
import type {
  GameMode,
  ImposterSettings,
  PlayerRecord,
} from '../../types/game';
import { GameIcon } from '../GameIcon';
import { HostImposterSetupPanel } from './HostImposterSetupPanel';

interface HostLobbyViewProps {
  roomCode: string;
  onlineCount: number;
  players: PlayerRecord[];
  gameMode: GameMode;
  playlist: string[];
  imposterSettings: ImposterSettings;
  usedImposterWordsCount: number;
  onSelectMode: (mode: GameMode) => void;
  onToggleGame: (gameId: string) => void;
  onNextTeamSelect: () => void;
  onUpdateImposterSettings: (patch: Partial<ImposterSettings>) => void;
  onStartImposterRound: () => void;
}

export function HostLobbyView({
  roomCode,
  onlineCount,
  players,
  gameMode,
  playlist,
  imposterSettings,
  usedImposterWordsCount,
  onSelectMode,
  onToggleGame,
  onNextTeamSelect,
  onUpdateImposterSettings,
  onStartImposterRound,
}: HostLobbyViewProps) {
  const [copied, setCopied] = useState(false);

  const joinUrl = `${window.location.origin}/?room=${roomCode}`;
  const sortedPlayers = [...players].sort((a, b) => Number(b.online) - Number(a.online));
  const activeRosterCount =
    players.filter((p) => p.online).length || players.length;

  const totalDuration = GAME_REGISTRY.filter((g) => playlist.includes(g.id)).reduce(
    (sum, g) => sum + g.durationSec,
    0
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left Column: Join Card (QR + 4-letter Room Code) */}
      <section className="host-panel flex flex-col items-center justify-between rounded-3xl p-6 text-center sm:p-8 lg:col-span-5">
        <div className="w-full">
          <p className="text-xs font-bold tracking-[0.22em] text-slate-400 uppercase">
            Scan to Join on Your Phone
          </p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join the Crowd
          </h1>
        </div>

        {/* High-Contrast QR Container */}
        <div className="my-6 rounded-3xl bg-white p-5 shadow-2xl shadow-black/50">
          <QRCodeSVG
            value={joinUrl}
            size={216}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#0C0E12"
            includeMargin={false}
          />
        </div>

        {/* Giant 4-Letter Room Code */}
        <div className="w-full rounded-2xl border border-white/10 bg-black/35 px-5 py-4">
          <div className="text-[11px] font-bold tracking-[0.22em] text-slate-400 uppercase">
            Room Code
          </div>
          <div
            id="host-room-code"
            className="font-mono-num mt-1 pl-[0.28em] text-5xl font-extrabold tracking-[0.28em] text-white sm:text-6xl"
          >
            {roomCode}
          </div>
          <p className="mt-2 truncate text-xs text-slate-400">{joinUrl}</p>
        </div>

        {/* Copy Link & Open Player Tab */}
        <div className="mt-4 flex w-full gap-2.5">
          <button
            id="host-copy-link-btn"
            type="button"
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                Copied Link
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Join Link
              </>
            )}
          </button>

          <a
            id="host-open-player-tab"
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            title="Open a player view in a new tab to test locally"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Test Player Tab</span>
          </a>
        </div>
      </section>

      {/* Right Column: Live Roster + Mode Switcher + Arcade / Imposter Setup */}
      <div className="flex flex-col gap-6 lg:col-span-7">
        {/* Live Joined Players */}
        <section className="host-panel flex flex-col rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-amber-400" />
              <h2 className="font-display text-xl font-bold text-white">Players in Lobby</h2>
            </div>
            <div className="font-mono-num rounded-full bg-amber-400/15 px-3.5 py-1 text-sm font-extrabold text-amber-300">
              {onlineCount} Connected
            </div>
          </div>

          {sortedPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-black/20 px-6 py-8 text-center">
              <p className="text-base font-semibold text-slate-300">
                Waiting for the audience to join…
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Players scan the QR code or enter{' '}
                <span className="font-mono-num font-bold text-slate-300">{roomCode}</span> on their phones.
              </p>
            </div>
          ) : (
            <div className="flex max-h-40 flex-wrap content-start gap-2.5 overflow-y-auto pr-1">
              {sortedPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`animate-chip-pop inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${
                    player.online
                      ? 'border-white/15 bg-white/10 text-white'
                      : 'border-white/5 bg-white/5 text-slate-500'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      player.online ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                  />
                  <span>{player.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mode Switcher + Game Setup Panel */}
        <section className="host-panel flex-1 rounded-3xl p-6">
          {/* Mode Switcher Tabs (Switches cleanly without disconnecting anyone) */}
          <div
            role="tablist"
            aria-label="Game Mode"
            className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/40 p-1.5"
          >
            <button
              id="lobby-mode-arcade-tab"
              type="button"
              role="tab"
              aria-selected={gameMode === 'arcade'}
              onClick={() => onSelectMode('arcade')}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                gameMode === 'arcade'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              <span>Arcade Mode</span>
            </button>

            <button
              id="lobby-mode-imposter-tab"
              type="button"
              role="tab"
              aria-selected={gameMode === 'imposter'}
              onClick={() => onSelectMode('imposter')}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                gameMode === 'imposter'
                  ? 'bg-[#E63946] text-white shadow-md'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <UserX className="h-4 w-4" />
              <span>Imposter Mode</span>
            </button>
          </div>

          {gameMode === 'arcade' ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <ListChecks className="h-5 w-5 text-rose-400" />
                  <h2 className="font-display text-xl font-bold text-white">Game Playlist</h2>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                  <span>{playlist.length} rounds selected</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />~{totalDuration}s play
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {GAME_REGISTRY.map((game) => {
                  const selected = playlist.includes(game.id);
                  const orderIndex = playlist.indexOf(game.id);
                  return (
                    <button
                      key={game.id}
                      id={`playlist-toggle-${game.id}`}
                      type="button"
                      onClick={() => onToggleGame(game.id)}
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                        selected
                          ? 'border-white/25 bg-white/10 text-white'
                          : 'border-white/5 bg-black/25 text-slate-500 hover:border-white/15 hover:text-slate-300'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          selected ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        <GameIcon icon={game.icon} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold">{game.title}</span>
                          <span className="font-mono-num shrink-0 text-[11px] font-bold opacity-70">
                            {selected ? `#${orderIndex + 1} · ${game.durationSec}s` : 'Off'}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs opacity-75">{game.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Primary Action Button */}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  {onlineCount === 0
                    ? 'You can advance now or wait for players — latecomers can still join anytime.'
                    : `${onlineCount} ${onlineCount === 1 ? 'player' : 'players'} ready for Red vs. White team selection.`}
                </p>
                <button
                  id="host-next-team-select-btn"
                  type="button"
                  onClick={onNextTeamSelect}
                  className="font-display inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#E63946] px-7 py-4 text-lg font-bold text-white shadow-lg shadow-rose-950/50 transition hover:bg-[#F04452] active:scale-[0.98]"
                >
                  <span>Next: Pick Teams</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <HostImposterSetupPanel
              settings={imposterSettings}
              usedWordsCount={usedImposterWordsCount}
              playerCount={activeRosterCount}
              onUpdateSettings={onUpdateImposterSettings}
              onStartRound={onStartImposterRound}
            />
          )}
        </section>
      </div>
    </div>
  );
}

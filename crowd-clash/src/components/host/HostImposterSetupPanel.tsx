import {
  Clock,
  MessageSquareText,
  Mic,
  Minus,
  Play,
  Plus,
  UserX,
} from 'lucide-react';
import { IMPOSTER_WORDS } from '../../data/imposterWords';
import {
  getMaxImposters,
  getResolvedImposterCount,
} from '../../hooks/useHostRoom';
import type { ImposterSettings } from '../../types/game';

interface HostImposterSetupPanelProps {
  settings: ImposterSettings;
  usedWordsCount: number;
  playerCount: number;
  onUpdateSettings: (patch: Partial<ImposterSettings>) => void;
  onStartRound: () => void;
}

export function HostImposterSetupPanel({
  settings,
  usedWordsCount,
  playerCount,
  onUpdateSettings,
  onStartRound,
}: HostImposterSetupPanelProps) {
  const isSilent = settings.playStyle === 'silent';
  const maxImposters = getMaxImposters(playerCount);
  const resolvedImposters = getResolvedImposterCount(
    playerCount,
    settings.imposterCountOverride
  );
  const activeDiscussionSec = isSilent
    ? settings.silentDiscussionSec
    : settings.voiceDiscussionSec;

  const adjustDiscussion = (delta: number) => {
    if (isSilent) {
      onUpdateSettings({ silentDiscussionSec: settings.silentDiscussionSec + delta });
    } else {
      onUpdateSettings({ voiceDiscussionSec: settings.voiceDiscussionSec + delta });
    }
  };

  return (
    <div className="space-y-5">
      {/* Play Style Toggle */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-extrabold tracking-[0.16em] text-slate-400 uppercase">
            Play Style
          </span>
          <span className="font-mono-num text-[11px] font-semibold text-slate-400">
            {IMPOSTER_WORDS.length} words · {usedWordsCount} played
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="imposter-style-voice-btn"
            type="button"
            onClick={() => onUpdateSettings({ playStyle: 'voice' })}
            className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
              !isSilent
                ? 'border-amber-400/70 bg-amber-400/15 text-white'
                : 'border-white/8 bg-black/25 text-slate-400 hover:border-white/15 hover:text-slate-200'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                !isSilent ? 'bg-amber-400 text-slate-950' : 'bg-white/8 text-slate-400'
              }`}
            >
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Voice Mode</div>
              <div className="text-xs opacity-75">Talk clues out loud</div>
            </div>
          </button>

          <button
            id="imposter-style-silent-btn"
            type="button"
            onClick={() => onUpdateSettings({ playStyle: 'silent' })}
            className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
              isSilent
                ? 'border-sky-400/70 bg-sky-400/15 text-white'
                : 'border-white/8 bg-black/25 text-slate-400 hover:border-white/15 hover:text-slate-200'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isSilent ? 'bg-sky-400 text-slate-950' : 'bg-white/8 text-slate-400'
              }`}
            >
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Silent Mode</div>
              <div className="text-xs opacity-75">Type clues on phones</div>
            </div>
          </button>
        </div>
      </div>

      {/* Adjustable Timers & Imposter Count Grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {/* Writing Time (Silent Mode) */}
        {isSilent && (
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Clock className="h-3.5 w-3.5 text-sky-400" />
                <span>Writing Time</span>
              </div>
              <div className="text-[11px] text-slate-500">15s–90s (5s steps)</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="imposter-writing-minus"
                type="button"
                disabled={settings.writingTimeSec <= 15}
                onClick={() =>
                  onUpdateSettings({ writingTimeSec: settings.writingTimeSec - 5 })
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35"
                aria-label="Decrease writing time"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-mono-num min-w-[3.2rem] text-center text-base font-extrabold text-white">
                {settings.writingTimeSec}s
              </span>
              <button
                id="imposter-writing-plus"
                type="button"
                disabled={settings.writingTimeSec >= 90}
                onClick={() =>
                  onUpdateSettings({ writingTimeSec: settings.writingTimeSec + 5 })
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35"
                aria-label="Increase writing time"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Discussion / Clue-Reading Time */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>{isSilent ? 'Clue-Reading' : 'Discussion'}</span>
            </div>
            <div className="text-[11px] text-slate-500">20s–300s (10s steps)</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="imposter-discussion-minus"
              type="button"
              disabled={activeDiscussionSec <= 20}
              onClick={() => adjustDiscussion(-10)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35"
              aria-label="Decrease discussion time"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="font-mono-num min-w-[3.2rem] text-center text-base font-extrabold text-white">
              {activeDiscussionSec}s
            </span>
            <button
              id="imposter-discussion-plus"
              type="button"
              disabled={activeDiscussionSec >= 300}
              onClick={() => adjustDiscussion(10)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35"
              aria-label="Increase discussion time"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Voting Time */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Clock className="h-3.5 w-3.5 text-rose-400" />
              <span>Voting Time</span>
            </div>
            <div className="text-[11px] text-slate-500">15s–90s (5s steps)</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="imposter-voting-minus"
              type="button"
              disabled={settings.votingTimeSec <= 15}
              onClick={() =>
                onUpdateSettings({ votingTimeSec: settings.votingTimeSec - 5 })
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35"
              aria-label="Decrease voting time"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="font-mono-num min-w-[3.2rem] text-center text-base font-extrabold text-white">
              {settings.votingTimeSec}s
            </span>
            <button
              id="imposter-voting-plus"
              type="button"
              disabled={settings.votingTimeSec >= 90}
              onClick={() =>
                onUpdateSettings({ votingTimeSec: settings.votingTimeSec + 5 })
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35"
              aria-label="Increase voting time"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Imposter Count */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <UserX className="h-3.5 w-3.5 text-[#E63946]" />
              <span>Imposters</span>
              {settings.imposterCountOverride === null ? (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 uppercase">
                  Auto
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ imposterCountOverride: null })}
                  className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase hover:bg-amber-400/30"
                >
                  Reset Auto
                </button>
              )}
            </div>
            <div className="text-[11px] text-slate-500">
              Max {maxImposters} · Auto 2 at 8+ players
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="imposter-count-minus"
              type="button"
              disabled={resolvedImposters <= 1}
              onClick={() =>
                onUpdateSettings({ imposterCountOverride: resolvedImposters - 1 })
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35"
              aria-label="Decrease imposter count"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="font-mono-num min-w-[2.2rem] text-center text-base font-extrabold text-white">
              {resolvedImposters}
            </span>
            <button
              id="imposter-count-plus"
              type="button"
              disabled={resolvedImposters >= maxImposters}
              onClick={() =>
                onUpdateSettings({ imposterCountOverride: resolvedImposters + 1 })
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-35"
              aria-label="Increase imposter count"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Start Imposter Round CTA */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          {playerCount < 3
            ? 'Best with 3+ players (you can still start with fewer to test).'
            : `${playerCount} players ready · ${resolvedImposters} secret ${
                resolvedImposters === 1 ? 'Imposter' : 'Imposters'
              } will be dealt.`}
        </p>
        <button
          id="host-start-imposter-btn"
          type="button"
          disabled={playerCount < 1}
          onClick={onStartRound}
          className="font-display inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#E63946] px-7 py-4 text-lg font-bold text-white shadow-lg shadow-rose-950/50 transition hover:bg-[#F04452] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Play className="h-5 w-5 fill-white" />
          <span>Deal Imposter Roles</span>
        </button>
      </div>
    </div>
  );
}

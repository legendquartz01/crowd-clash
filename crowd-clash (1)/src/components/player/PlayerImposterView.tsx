import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Mic,
  Send,
  ShieldCheck,
  Timer,
  UserX,
  Vote,
} from 'lucide-react';
import type {
  ClueReactionType,
  ImposterRoundState,
  ImposterSettings,
  PlayerRecord,
} from '../../types/game';

interface PlayerImposterViewProps {
  meId: string;
  meName: string;
  roomCode: string;
  round: ImposterRoundState;
  settings: ImposterSettings;
  allPlayers: PlayerRecord[];
  timeLeft: number;
  onSubmitClue: (clue: string) => void;
  onReactToClue: (targetPlayerId: string, reaction: ClueReactionType) => void;
  onSubmitVote: (targetPlayerId: string) => void;
}

export function PlayerImposterView({
  meId,
  meName,
  roomCode,
  round,
  settings,
  allPlayers,
  timeLeft,
  onSubmitClue,
  onReactToClue,
  onSubmitVote,
}: PlayerImposterViewProps) {
  const [roleVisible, setRoleVisible] = useState(false);
  const [peekRole, setPeekRole] = useState(false);
  const [clueDraft, setClueDraft] = useState('');

  const isImposter = round.imposterIds.includes(meId);
  const isSilent = settings.playStyle === 'silent';
  const mySubmittedClue = round.clues[meId] ?? '';
  const myVote = round.votes[meId] ?? null;
  const isUrgent = timeLeft > 0 && timeLeft <= 5;

  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));
  const activePlayers = allPlayers.filter((p) => p.online);
  const roster = activePlayers.length > 0 ? activePlayers : allPlayers;

  const handleClueSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = clueDraft.trim();
    if (!trimmed) return;
    onSubmitClue(trimmed);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#0B0E14] px-4 py-5 text-white select-none">
      {/* Compact Dark Top Header */}
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono-num rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-extrabold tracking-[0.14em] text-slate-200 uppercase">
            {roomCode}
          </span>
          <span className="truncate text-xs font-bold text-slate-400">{meName}</span>
        </div>

        {(round.phase === 'WRITING' ||
          round.phase === 'DISCUSSION' ||
          round.phase === 'VOTING') && (
          <div
            className={`font-mono-num inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-extrabold ${
              isUrgent
                ? 'animate-urgency bg-[#E63946] text-white'
                : 'bg-white/10 text-amber-300'
            }`}
          >
            <Timer className="h-4 w-4" />
            <span>{timeLeft}s</span>
          </div>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        {/* ---------------- PHASE 1: SECRET ROLE REVEAL ---------------- */}
        {round.phase === 'ROLE_REVEAL' && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div>
              <span className="text-xs font-extrabold tracking-[0.22em] text-rose-400 uppercase">
                Imposter Round #{round.roundNumber}
              </span>
              <h1 className="font-display mt-1 text-3xl font-bold text-white">
                Your Secret Role
              </h1>
            </div>

            {/* Tap to Reveal / Hide Privacy Card */}
            <button
              id="player-imposter-privacy-card"
              type="button"
              onClick={() => setRoleVisible((prev) => !prev)}
              className={`relative flex min-h-[290px] w-full flex-col items-center justify-center rounded-3xl border-2 p-7 text-center shadow-2xl transition-all active:scale-[0.98] ${
                !roleVisible
                  ? 'border-white/15 bg-[#141925] hover:border-white/25'
                  : isImposter
                    ? 'border-rose-500 bg-gradient-to-b from-[#5E111E] to-[#23080D]'
                    : 'border-emerald-400/70 bg-gradient-to-b from-[#0E3A2D] to-[#0D1A18]'
              }`}
            >
              {!roleVisible ? (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
                    <Eye className="h-8 w-8" />
                  </div>
                  <div className="font-display mt-5 text-2xl font-bold text-white">
                    Tap to Reveal
                  </div>
                  <p className="mt-2 max-w-[240px] text-xs font-semibold text-slate-400">
                    Make sure nobody nearby is peeking at your screen!
                  </p>
                </>
              ) : isImposter ? (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E63946] text-white shadow-lg">
                    <UserX className="h-8 w-8" />
                  </div>
                  <div className="mt-4 text-xs font-extrabold tracking-[0.22em] text-rose-300 uppercase">
                    Secret Role
                  </div>
                  <div className="font-display mt-1 text-3xl font-bold tracking-tight text-white">
                    YOU ARE THE IMPOSTER
                  </div>
                  <div className="mt-5 rounded-2xl border border-rose-400/30 bg-black/35 px-5 py-3">
                    <div className="text-[10px] font-bold tracking-[0.2em] text-rose-200/80 uppercase">
                      Category Only
                    </div>
                    <div className="font-display mt-0.5 text-xl font-bold text-amber-300">
                      {round.category}
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-rose-100/80">
                    Blend in without knowing the word! Tap card to hide.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div className="mt-4 text-[11px] font-extrabold tracking-[0.2em] text-emerald-300 uppercase">
                    Category · {round.category}
                  </div>
                  <div className="font-display mt-2 text-4xl font-bold tracking-tight text-white">
                    {round.secretWord}
                  </div>
                  <p className="mt-4 text-xs font-semibold text-emerald-100/80">
                    Give a subtle clue so Crew knows you&apos;re legit. Tap card to hide.
                  </p>
                </>
              )}

              <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-[11px] font-bold text-slate-300">
                {roleVisible ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Tap to Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Privacy Shield Active
                  </>
                )}
              </span>
            </button>

            <p className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">
              Waiting for Host to start the round…
            </p>
          </div>
        )}

        {/* ---------------- PHASE 2a: SILENT MODE WRITING ---------------- */}
        {round.phase === 'WRITING' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-[#131823] p-6 text-center shadow-xl">
              <div className="text-xs font-extrabold tracking-[0.2em] text-sky-400 uppercase">
                Category: {round.category}
              </div>

              {/* Compact Private Role Peek Toggle */}
              <button
                type="button"
                onClick={() => setPeekRole((v) => !v)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-slate-300"
              >
                {peekRole ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>
                  {peekRole
                    ? isImposter
                      ? 'Role: IMPOSTER (tap to hide)'
                      : `Word: ${round.secretWord} (tap to hide)`
                    : 'Tap to peek at your secret role'}
                </span>
              </button>

              {mySubmittedClue ? (
                <div className="mt-6 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-5">
                  <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-400" />
                  <div className="mt-2 text-xs font-extrabold tracking-widest text-emerald-300 uppercase">
                    Clue Locked In
                  </div>
                  <div className="font-display mt-1 text-2xl font-bold text-white">
                    “{mySubmittedClue}”
                  </div>
                  <p className="mt-2 text-xs text-slate-300">
                    Waiting for everyone else to submit…
                  </p>
                </div>
              ) : (
                <form onSubmit={handleClueSubmit} className="mt-6 space-y-3.5 text-left">
                  <label
                    htmlFor="player-imposter-clue-input"
                    className="block text-xs font-bold tracking-[0.14em] text-slate-400 uppercase"
                  >
                    Enter a 1–2 Word Clue
                  </label>
                  <input
                    id="player-imposter-clue-input"
                    type="text"
                    maxLength={32}
                    autoComplete="off"
                    value={clueDraft}
                    onChange={(e) => setClueDraft(e.target.value)}
                    placeholder={isImposter ? 'Bluff a subtle clue…' : 'Hint without giving it away…'}
                    className="w-full rounded-2xl border-2 border-white/15 bg-[#0B0E14] px-4 py-4 text-xl font-bold text-white placeholder:font-medium placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                  />
                  <button
                    id="player-imposter-clue-submit-btn"
                    type="submit"
                    disabled={!clueDraft.trim()}
                    className="font-display flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400 py-4 text-lg font-bold text-slate-950 shadow-lg transition hover:bg-sky-300 active:scale-[0.98] disabled:opacity-40"
                  >
                    <Send className="h-5 w-5" />
                    <span>Lock In Clue</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ---------------- PHASE 2b: DISCUSSION / SYNCED CLUE BOARD ---------------- */}
        {round.phase === 'DISCUSSION' && (
          <div className="flex flex-col gap-4">
            {!isSilent ? (
              /* Voice Mode Phone Screen */
              <div className="rounded-3xl border border-white/10 bg-[#131823] p-7 text-center shadow-2xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
                  <Mic className="h-8 w-8" />
                </div>
                <p className="mt-4 text-xs font-extrabold tracking-[0.2em] text-amber-300 uppercase">
                  Voice Discussion · {round.category}
                </p>
                <h1 className="font-display mt-2 text-3xl font-bold text-white">
                  {round.starterPlayerId === meId
                    ? 'You go first!'
                    : `${
                        (round.starterPlayerId && playerMap.get(round.starterPlayerId)?.name) ||
                        'First player'
                      } goes first!`}
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Listen closely to everyone&apos;s clues and figure out who&apos;s faking it.
                </p>

                <button
                  type="button"
                  onClick={() => setPeekRole((v) => !v)}
                  className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200"
                >
                  {peekRole ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>
                    {peekRole
                      ? isImposter
                        ? 'YOU ARE THE IMPOSTER'
                        : `Secret Word: ${round.secretWord}`
                      : 'Peek at My Secret Role'}
                  </span>
                </button>
              </div>
            ) : (
              /* Silent Mode Synced Clue Board with Live Reaction Badges */
              <div className="flex flex-col gap-3">
                <div className="text-center">
                  <div className="text-xs font-extrabold tracking-[0.2em] text-amber-300 uppercase">
                    Synced Clue Board · {round.category}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Read every clue &amp; tap quick reactions before voting!
                  </p>
                </div>

                <div className="max-h-[66dvh] space-y-2.5 overflow-y-auto pr-0.5">
                  {roster.map((p) => {
                    const clueText = round.clues[p.id];
                    const reactMap = round.reactions[p.id] ?? {};
                    const myReaction = reactMap[meId] ?? null;
                    const susCount = Object.values(reactMap).filter((r) => r === 'sus').length;
                    const caughtCount = Object.values(reactMap).filter((r) => r === 'caught').length;

                    return (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-white/10 bg-[#141925] p-3.5 shadow-md"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                            {p.name}
                            {p.id === meId ? ' (You)' : ''}
                          </span>
                        </div>
                        <div
                          className={`font-display mt-1 text-xl font-bold ${
                            clueText ? 'text-white' : 'italic text-slate-500'
                          }`}
                        >
                          {clueText ? `“${clueText}”` : 'No clue submitted'}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            id={`react-sus-${p.id}`}
                            type="button"
                            onClick={() => onReactToClue(p.id, 'sus')}
                            className={`font-mono-num inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-extrabold transition active:scale-95 ${
                              myReaction === 'sus'
                                ? 'border-amber-400 bg-amber-400/25 text-amber-200'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <span>🤔 Sus</span>
                            {susCount > 0 && <span>{susCount}</span>}
                          </button>

                          <button
                            id={`react-caught-${p.id}`}
                            type="button"
                            onClick={() => onReactToClue(p.id, 'caught')}
                            className={`font-mono-num inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-extrabold transition active:scale-95 ${
                              myReaction === 'caught'
                                ? 'border-rose-400 bg-rose-500/30 text-rose-200'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <span>🚨 Caught</span>
                            {caughtCount > 0 && <span>{caughtCount}</span>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- PHASE 3: SYNCHRONIZED VOTING ---------------- */}
        {round.phase === 'VOTING' && (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-[0.2em] text-rose-400 uppercase">
                <Vote className="h-4 w-4" />
                <span>Cast Your Vote</span>
              </div>
              <h1 className="font-display mt-1 text-3xl font-bold text-white">
                Who is the Imposter?
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                {myVote
                  ? `Vote locked on ${playerMap.get(myVote)?.name ?? 'player'}`
                  : 'Tap 1 player below (you cannot vote for yourself).'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {roster
                .filter((p) => p.id !== meId)
                .map((candidate) => {
                  const selected = myVote === candidate.id;
                  const clueText = isSilent ? round.clues[candidate.id] : null;
                  return (
                    <button
                      key={candidate.id}
                      id={`imposter-vote-btn-${candidate.id}`}
                      type="button"
                      onClick={() => onSubmitVote(candidate.id)}
                      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center shadow-lg transition-all active:scale-[0.96] ${
                        selected
                          ? 'border-rose-400 bg-[#E63946] text-white'
                          : 'border-white/12 bg-[#151B28] text-white hover:border-rose-400/50 hover:bg-[#1C2334]'
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-600">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                      )}
                      <span className="font-display text-lg font-bold">{candidate.name}</span>
                      {clueText && (
                        <span
                          className={`mt-1 line-clamp-1 text-xs ${
                            selected ? 'text-rose-100' : 'text-slate-400'
                          }`}
                        >
                          “{clueText}”
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* ---------------- PHASE 4: REVEAL ---------------- */}
        {round.phase === 'REVEAL' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className={`w-full rounded-3xl border-2 p-7 shadow-2xl ${
                round.winner === 'crew'
                  ? 'border-emerald-400/60 bg-gradient-to-b from-[#0E3A2D] to-[#0E131B]'
                  : 'border-rose-500/60 bg-gradient-to-b from-[#54101B] to-[#0E131B]'
              }`}
            >
              <p className="text-xs font-extrabold tracking-[0.22em] text-amber-300 uppercase">
                Round #{round.roundNumber} Complete
              </p>
              <h1 className="font-display mt-2 text-4xl font-bold text-white">
                {round.winner === 'crew' ? 'CREW WINS!' : 'IMPOSTER WINS!'}
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-200">
                {isImposter
                  ? round.winner === 'imposter'
                    ? 'You fooled the room and survived!'
                    : 'Busted — the Crew caught you!'
                  : round.winner === 'crew'
                    ? 'Nice detective work — Imposter caught!'
                    : 'The Imposter got away this time!'}
              </p>

              <div className="mt-5 rounded-2xl bg-black/35 p-4">
                <div className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                  {round.wasTie ? 'Vote Result' : 'Voted Out'}
                </div>
                <div className="font-display mt-1 text-xl font-bold text-white">
                  {round.wasTie || !round.eliminatedPlayerId
                    ? 'Tie — Nobody Eliminated'
                    : `${playerMap.get(round.eliminatedPlayerId)?.name ?? 'Player'} (${
                        round.imposterIds.includes(round.eliminatedPlayerId)
                          ? 'IMPOSTER'
                          : 'INNOCENT'
                      })`}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black/35 p-3.5">
                  <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Secret Word
                  </div>
                  <div className="font-display mt-1 text-lg font-bold text-amber-300">
                    {round.secretWord}
                  </div>
                </div>
                <div className="rounded-2xl bg-black/35 p-3.5">
                  <div className="text-[10px] font-bold tracking-wider text-rose-300 uppercase">
                    Imposter
                  </div>
                  <div className="font-display mt-1 text-lg font-bold text-white">
                    {round.imposterIds
                      .map((id) => playerMap.get(id)?.name)
                      .filter(Boolean)
                      .join(', ') || 'None'}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">
              Stay here — Host can deal the next round immediately!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

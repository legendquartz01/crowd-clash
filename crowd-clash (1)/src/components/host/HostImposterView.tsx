import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  EyeOff,
  MessageSquareText,
  Mic,
  Play,
  RefreshCw,
  ShieldCheck,
  SkipForward,
  Timer,
  UserX,
  Vote,
} from 'lucide-react';
import type {
  ImposterRoundState,
  ImposterSettings,
  PlayerRecord,
} from '../../types/game';

interface HostImposterViewProps {
  round: ImposterRoundState;
  settings: ImposterSettings;
  players: PlayerRecord[];
  timeLeft: number;
  onStartClues: () => void;
  onRevealCluesNow: () => void;
  onStartVote: () => void;
  onEndVoteNow: () => void;
  onPlayAnotherRound: () => void;
  onBackToLobby: () => void;
}

export function HostImposterView({
  round,
  settings,
  players,
  timeLeft,
  onStartClues,
  onRevealCluesNow,
  onStartVote,
  onEndVoteNow,
  onPlayAnotherRound,
  onBackToLobby,
}: HostImposterViewProps) {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const activePlayers = players.filter((p) => p.online);
  const roster = activePlayers.length > 0 ? activePlayers : players;
  const isSilent = settings.playStyle === 'silent';
  const isUrgent = timeLeft > 0 && timeLeft <= 5;

  // Celebrate round winner in REVEAL phase
  useEffect(() => {
    if (round.phase !== 'REVEAL' || !round.winner) return;
    const colors =
      round.winner === 'crew'
        ? ['#10B981', '#34D399', '#FBBF24', '#FFFFFF']
        : ['#E63946', '#FF6B6B', '#FBBF24'];

    void confetti({
      particleCount: 85,
      spread: 80,
      origin: { y: 0.55 },
      colors,
    });
  }, [round.phase, round.winner]);

  // ---------------- PHASE 1: SECRET ROLE REVEAL ----------------
  if (round.phase === 'ROLE_REVEAL') {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <div className="host-panel w-full rounded-[2rem] p-8 sm:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/15 px-4 py-1.5 text-xs font-extrabold tracking-[0.2em] text-rose-300 uppercase">
            Imposter Round #{round.roundNumber} ·{' '}
            {isSilent ? 'Silent Mode' : 'Voice Mode'}
          </div>

          <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#E63946] text-white shadow-2xl shadow-rose-950/60">
            <EyeOff className="h-10 w-10" />
          </div>

          <h1 className="font-display mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Roles Dealt — Check Your Phones
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed font-medium text-slate-300 sm:text-xl">
            Everyone tap your screen privately to see your role.{' '}
            <span className="font-bold text-rose-300">
              {round.imposterIds.length}{' '}
              {round.imposterIds.length === 1 ? 'Imposter' : 'Imposters'}
            </span>{' '}
            hidden among{' '}
            <span className="font-bold text-white">{roster.length} players</span>.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              id="host-imposter-start-round-btn"
              type="button"
              onClick={onStartClues}
              className="font-display inline-flex items-center gap-3 rounded-2xl bg-emerald-400 px-10 py-5 text-2xl font-bold text-slate-950 shadow-2xl shadow-emerald-950/50 transition hover:bg-emerald-300 active:scale-[0.98]"
            >
              <Play className="h-7 w-7 fill-slate-950" />
              <span>Start Round</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- PHASE 2a: SILENT MODE WRITING ----------------
  if (round.phase === 'WRITING') {
    const submittedCount = roster.filter((p) => Boolean(round.clues[p.id])).length;

    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.2em] text-sky-400 uppercase">
              Silent Mode · Step 1: Write Your Clue
            </p>
            <h1 className="font-display mt-1 text-3xl font-bold text-white sm:text-5xl">
              Category: <span className="text-amber-300">{round.category}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3 ${
                isUrgent
                  ? 'animate-urgency border-rose-500 bg-rose-500/20 text-rose-200'
                  : 'border-white/15 bg-white/5 text-white'
              }`}
            >
              <Timer className={`h-6 w-6 ${isUrgent ? 'text-rose-400' : 'text-sky-400'}`} />
              <span className="font-mono-num text-4xl font-extrabold">
                {String(timeLeft).padStart(2, '0')}s
              </span>
            </div>

            <button
              id="host-imposter-reveal-clues-btn"
              type="button"
              onClick={onRevealCluesNow}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-white/15 hover:text-white"
            >
              <SkipForward className="h-4 w-4" />
              <span>Reveal Clues Now</span>
            </button>
          </div>
        </div>

        <section className="host-panel rounded-3xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
            <MessageSquareText className="h-8 w-8" />
          </div>

          <div
            id="host-imposter-clue-progress"
            className="font-mono-num mt-4 text-5xl font-extrabold text-white sm:text-6xl"
          >
            {submittedCount} / {roster.length}
          </div>
          <p className="mt-1 text-lg font-semibold text-slate-300">clues locked in</p>

          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            {roster.map((p) => {
              const locked = Boolean(round.clues[p.id]);
              return (
                <div
                  key={p.id}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                    locked
                      ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                      : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                >
                  {locked ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                  )}
                  <span>{p.name}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // ---------------- PHASE 2b: DISCUSSION (VOICE) OR SYNCED CLUE BOARD (SILENT) ----------------
  if (round.phase === 'DISCUSSION') {
    const starterName =
      (round.starterPlayerId && playerMap.get(round.starterPlayerId)?.name) ||
      roster[0]?.name ||
      'Someone';

    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.2em] text-amber-400 uppercase">
              {isSilent ? 'Silent Mode · Synced Clue Board' : 'Voice Mode · Live Discussion'}
            </p>
            <h1 className="font-display mt-1 text-3xl font-bold text-white sm:text-5xl">
              Category: <span className="text-amber-300">{round.category}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3 ${
                isUrgent
                  ? 'animate-urgency border-rose-500 bg-rose-500/20 text-rose-200'
                  : 'border-white/15 bg-white/5 text-white'
              }`}
            >
              <Timer className={`h-6 w-6 ${isUrgent ? 'text-rose-400' : 'text-amber-400'}`} />
              <span className="font-mono-num text-4xl font-extrabold">
                {String(timeLeft).padStart(2, '0')}s
              </span>
            </div>

            <button
              id="host-imposter-start-vote-btn"
              type="button"
              onClick={onStartVote}
              className="font-display inline-flex items-center gap-2 rounded-2xl bg-[#E63946] px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-[#F04452] active:scale-[0.98]"
            >
              <Vote className="h-5 w-5" />
              <span>{isSilent ? 'Start Vote' : 'Skip to Vote'}</span>
            </button>
          </div>
        </div>

        {!isSilent ? (
          /* Voice Mode Stage */
          <section className="host-panel flex flex-col items-center rounded-[2rem] p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-400 text-slate-950 shadow-xl">
              <Mic className="h-10 w-10" />
            </div>
            <p className="mt-6 text-xs font-extrabold tracking-[0.22em] text-amber-300 uppercase">
              First Clue Goes To
            </p>
            <h2 className="font-display mt-2 text-5xl font-bold text-white sm:text-6xl">
              {starterName} goes first!
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
              Go around the room giving a quick 1-word or 1-phrase clue out loud — don&apos;t make it too obvious for the Imposter!
            </p>
          </section>
        ) : (
          /* Silent Mode Synced Clue Board */
          <section className="host-panel rounded-3xl p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-white">
                Everyone&apos;s Clues — React Live from Your Phone
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                Tap 🤔 Sus or 🚨 Caught on any clue
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {roster.map((p) => {
                const clueText = round.clues[p.id];
                const reactMap = round.reactions[p.id] ?? {};
                const susCount = Object.values(reactMap).filter((r) => r === 'sus').length;
                const caughtCount = Object.values(reactMap).filter((r) => r === 'caught').length;

                return (
                  <div
                    key={p.id}
                    className="animate-chip-pop flex flex-col justify-between rounded-2xl border border-white/10 bg-[#10141D] p-4 shadow-md"
                  >
                    <div>
                      <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                        {p.name}
                      </div>
                      <div
                        className={`font-display mt-2 text-2xl font-bold ${
                          clueText ? 'text-white' : 'italic text-slate-500'
                        }`}
                      >
                        {clueText ? `“${clueText}”` : 'No clue submitted'}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <span
                        className={`font-mono-num inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          susCount > 0
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        <span>🤔</span>
                        <span>Sus {susCount}</span>
                      </span>
                      <span
                        className={`font-mono-num inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          caughtCount > 0
                            ? 'bg-rose-500/25 text-rose-300'
                            : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        <span>🚨</span>
                        <span>Caught {caughtCount}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ---------------- PHASE 3: SYNCHRONIZED VOTING ----------------
  if (round.phase === 'VOTING') {
    const votesCast = Object.keys(round.votes).length;

    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.2em] text-rose-400 uppercase">
              Synchronized Vote · Category: {round.category}
            </p>
            <h1 className="font-display mt-1 text-3xl font-bold text-white sm:text-5xl">
              Vote Out the Imposter!
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2.5 rounded-2xl border px-5 py-3 ${
                isUrgent
                  ? 'animate-urgency border-rose-500 bg-rose-500/20 text-rose-200'
                  : 'border-white/15 bg-white/5 text-white'
              }`}
            >
              <Timer className={`h-6 w-6 ${isUrgent ? 'text-rose-400' : 'text-rose-400'}`} />
              <span className="font-mono-num text-4xl font-extrabold">
                {String(timeLeft).padStart(2, '0')}s
              </span>
            </div>

            <button
              id="host-imposter-end-vote-btn"
              type="button"
              onClick={onEndVoteNow}
              className="font-display inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-6 py-4 text-base font-bold text-slate-950 shadow-lg transition hover:bg-amber-300 active:scale-[0.98]"
            >
              <span>End Vote Now</span>
            </button>
          </div>
        </div>

        <section className="host-panel rounded-3xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <Vote className="h-9 w-9" />
          </div>
          <div
            id="host-imposter-vote-progress"
            className="font-mono-num mt-4 text-5xl font-extrabold text-white sm:text-6xl"
          >
            {votesCast} / {roster.length}
          </div>
          <p className="mt-1 text-lg font-semibold text-slate-300">votes locked in</p>

          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            {roster.map((p) => {
              const voted = Boolean(round.votes[p.id]);
              return (
                <div
                  key={p.id}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${
                    voted
                      ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                      : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                >
                  {voted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                  )}
                  <span>{p.name}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // ---------------- PHASE 4: DRAMATIC REVEAL & REMATCH ----------------
  const eliminatedPlayer = round.eliminatedPlayerId
    ? playerMap.get(round.eliminatedPlayerId) ?? null
    : null;
  const eliminatedWasImposter =
    round.eliminatedPlayerId !== null &&
    round.imposterIds.includes(round.eliminatedPlayerId);
  const realImposters = round.imposterIds
    .map((id) => playerMap.get(id)?.name)
    .filter((n): n is string => Boolean(n));

  // Tally vote counts per candidate for breakdown
  const voteCounts = new Map<string, number>();
  for (const targetId of Object.values(round.votes)) {
    voteCounts.set(targetId, (voteCounts.get(targetId) ?? 0) + 1);
  }
  const voteBreakdown = Array.from(voteCounts.entries())
    .map(([id, count]) => ({
      id,
      name: playerMap.get(id)?.name ?? 'Player',
      count,
      isImposter: round.imposterIds.includes(id),
    }))
    .sort((a, b) => b.count - a.count);

  const crewWon = round.winner === 'crew';

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 text-center">
      {/* Winner Hero Card */}
      <section
        className={`w-full rounded-[2rem] border p-8 shadow-2xl sm:p-10 ${
          crewWon
            ? 'border-emerald-400/45 bg-gradient-to-b from-[#0C3B2E] via-[#0B221D] to-[#0E1118]'
            : 'border-rose-500/45 bg-gradient-to-b from-[#54101B] via-[#2B0A10] to-[#0E1118]'
        }`}
      >
        <p
          className={`text-xs font-extrabold tracking-[0.25em] uppercase ${
            crewWon ? 'text-emerald-300' : 'text-rose-300'
          }`}
        >
          Imposter Round #{round.roundNumber} Result
        </p>

        <h1 className="font-display mt-2 text-5xl font-bold tracking-tight text-white sm:text-7xl">
          {crewWon ? 'CREW WINS!' : 'IMPOSTER WINS!'}
        </h1>

        {/* Dramatic Flipped Elimination Card */}
        <div className="animate-countdown-pop mx-auto mt-7 max-w-lg rounded-3xl border border-white/15 bg-black/45 p-6">
          {round.wasTie || !eliminatedPlayer ? (
            <>
              <div className="text-xs font-extrabold tracking-[0.2em] text-amber-300 uppercase">
                Vote Tied — No One Eliminated
              </div>
              <p className="font-display mt-2 text-2xl font-bold text-white">
                The Imposter slipped away!
              </p>
            </>
          ) : (
            <>
              <div className="text-xs font-extrabold tracking-[0.2em] text-slate-400 uppercase">
                Most Voted Out
              </div>
              <div className="font-display mt-1 text-3xl font-bold text-white sm:text-4xl">
                {eliminatedPlayer.name}
              </div>
              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold tracking-[0.2em] uppercase ${
                  eliminatedWasImposter
                    ? 'bg-[#E63946] text-white shadow-lg shadow-rose-950/60'
                    : 'bg-sky-400 text-slate-950 shadow-lg'
                }`}
              >
                {eliminatedWasImposter ? (
                  <>
                    <UserX className="h-4 w-4" />
                    <span>IMPOSTER</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>INNOCENT</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Secret Word & Real Imposter Reveal */}
        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
            <div className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
              Secret Word ({round.category})
            </div>
            <div className="font-display mt-1.5 text-3xl font-bold text-amber-300">
              {round.secretWord}
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/35 p-5">
            <div className="text-[11px] font-bold tracking-[0.2em] text-rose-300 uppercase">
              The Real {realImposters.length === 1 ? 'Imposter' : 'Imposters'}
            </div>
            <div className="font-display mt-1.5 text-3xl font-bold text-white">
              {realImposters.length > 0 ? realImposters.join(', ') : 'None'}
            </div>
          </div>
        </div>
      </section>

      {/* Vote Breakdown */}
      {voteBreakdown.length > 0 && (
        <section className="host-panel w-full rounded-3xl p-5">
          <div className="mb-3 text-xs font-extrabold tracking-[0.18em] text-slate-400 uppercase">
            Vote Tally
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {voteBreakdown.map((item) => (
              <div
                key={item.id}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${
                  item.isImposter
                    ? 'border-rose-400/50 bg-rose-500/20 text-rose-200'
                    : 'border-white/10 bg-white/5 text-slate-200'
                }`}
              >
                <span>{item.name}</span>
                <span className="font-mono-num rounded-full bg-black/40 px-2 py-0.5 text-xs text-amber-300">
                  {item.count} {item.count === 1 ? 'vote' : 'votes'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rematch & Back to Lobby Buttons */}
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          id="host-imposter-play-again-btn"
          type="button"
          onClick={onPlayAnotherRound}
          className="font-display inline-flex items-center gap-2.5 rounded-2xl bg-emerald-400 px-8 py-4 text-lg font-bold text-slate-950 shadow-2xl shadow-emerald-950/50 transition hover:bg-emerald-300 active:scale-[0.98]"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Play Another Imposter Round</span>
        </button>

        <button
          id="host-imposter-back-lobby-btn"
          type="button"
          onClick={onBackToLobby}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-6 py-4 text-sm font-bold text-slate-200 transition hover:bg-white/15 hover:text-white active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Lobby</span>
        </button>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { pickNextImposterWord } from '../data/imposterWords';
import { DEFAULT_PLAYLIST, getGameById } from '../games/registry';
import { createRoomChannel, type RoomChannelAdapter } from '../lib/realtime';
import { stageAudio } from '../lib/sound';
import {
  clearHostSession,
  generateRoomCode,
  loadHostRoomCode,
  loadHostSession,
  saveHostRoomCode,
  saveHostSession,
} from '../lib/storage';
import { isSupabaseConfigured } from '../lib/supabase';
import type {
  ConnectionStatus,
  GameMode,
  ImposterRoundState,
  ImposterSettings,
  ImposterState,
  PlayerRecord,
  RoomState,
  TeamId,
  TransportMode,
} from '../types/game';
import { useCountdown } from './useCountdown';

const TRANSPORT_MODE: TransportMode = isSupabaseConfigured ? 'supabase' : 'local-demo';
// 3.0s for "3", "2", "1" + 0.5s punchy "GO!" flash before active round timer starts
const PRE_ROUND_COUNTDOWN_MS = 3500;

export const DEFAULT_IMPOSTER_SETTINGS: ImposterSettings = {
  playStyle: 'voice',
  writingTimeSec: 30,
  voiceDiscussionSec: 90,
  silentDiscussionSec: 30,
  votingTimeSec: 30,
  imposterCountOverride: null,
};

export function getMaxImposters(playerCount: number): number {
  return Math.max(1, Math.floor(playerCount / 3));
}

export function getResolvedImposterCount(
  playerCount: number,
  override: number | null
): number {
  const maxAllowed = getMaxImposters(playerCount);
  if (override !== null) {
    return Math.max(1, Math.min(maxAllowed, override));
  }
  const autoDefault = playerCount >= 8 ? 2 : 1;
  return Math.min(maxAllowed, autoDefault);
}

function createInitialImposterState(): ImposterState {
  return {
    settings: { ...DEFAULT_IMPOSTER_SETTINGS },
    usedWords: [],
    round: null,
  };
}

function createInitialRoomState(): RoomState {
  return {
    meta: {
      state: 'LOBBY',
      gameMode: 'arcade',
      currentGameId: DEFAULT_PLAYLIST[0] ?? null,
      gamePlaylist: [...DEFAULT_PLAYLIST],
      currentRoundIndex: 0,
      roundDurationSec: getGameById(DEFAULT_PLAYLIST[0])?.durationSec ?? 25,
      countdownEndsAt: null,
      roundEndsAt: null,
    },
    teams: {
      red: { totalScore: 0, roundScore: 0 },
      white: { totalScore: 0, roundScore: 0 },
    },
    players: {},
    imposter: createInitialImposterState(),
  };
}

function hydrateSavedState(saved: RoomState): RoomState {
  const validPlaylist = (saved.meta.gamePlaylist ?? []).filter((id) => Boolean(getGameById(id)));
  const playlist = validPlaylist.length > 0 ? validPlaylist : [...DEFAULT_PLAYLIST];
  const validCurrent = getGameById(saved.meta.currentGameId)
    ? saved.meta.currentGameId
    : playlist[0] ?? null;

  const savedImposter = saved.imposter;
  const imposter: ImposterState = savedImposter
    ? {
        settings: {
          ...DEFAULT_IMPOSTER_SETTINGS,
          ...(savedImposter.settings ?? {}),
        },
        usedWords: Array.isArray(savedImposter.usedWords) ? savedImposter.usedWords : [],
        round: savedImposter.round ?? null,
      }
    : createInitialImposterState();

  return {
    ...saved,
    meta: {
      ...saved.meta,
      gameMode: saved.meta.gameMode === 'imposter' ? 'imposter' : 'arcade',
      gamePlaylist: playlist,
      currentGameId: validCurrent,
      countdownEndsAt: saved.meta.countdownEndsAt ?? null,
    },
    imposter,
  };
}

function pickBalancedTeam(players: Record<string, PlayerRecord>): TeamId {
  let redCount = 0;
  let whiteCount = 0;
  for (const p of Object.values(players)) {
    if (p.team === 'red') redCount++;
    else if (p.team === 'white') whiteCount++;
  }
  return redCount <= whiteCount ? 'red' : 'white';
}

function getActiveRosterIds(players: Record<string, PlayerRecord>): string[] {
  const all = Object.values(players);
  const online = all.filter((p) => p.online).map((p) => p.id);
  return online.length > 0 ? online : all.map((p) => p.id);
}

function resolveImposterVoteOutcome(round: ImposterRoundState): ImposterRoundState {
  const counts = new Map<string, number>();
  for (const targetId of Object.values(round.votes)) {
    counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
  }

  let maxVotes = 0;
  let leaders: string[] = [];
  for (const [targetId, count] of counts.entries()) {
    if (count > maxVotes) {
      maxVotes = count;
      leaders = [targetId];
    } else if (count === maxVotes && count > 0) {
      leaders.push(targetId);
    }
  }

  const wasTie = maxVotes === 0 || leaders.length !== 1;
  const eliminatedPlayerId = wasTie ? null : leaders[0];
  const caughtImposter =
    eliminatedPlayerId !== null && round.imposterIds.includes(eliminatedPlayerId);

  return {
    ...round,
    phase: 'REVEAL',
    phaseEndsAt: null,
    wasTie,
    eliminatedPlayerId,
    winner: caughtImposter ? 'crew' : 'imposter',
  };
}

export function useHostRoom() {
  const [initialBoot] = useState(() => {
    const saved = loadHostSession();
    const persistedCode = saved?.roomCode ?? loadHostRoomCode() ?? generateRoomCode();
    const state = saved?.state ? hydrateSavedState(saved.state) : createInitialRoomState();
    saveHostRoomCode(persistedCode);
    return {
      roomCode: persistedCode,
      state,
    };
  });

  const [roomCode, setRoomCode] = useState<string>(initialBoot.roomCode);
  const [roomState, setRoomState] = useState<RoomState>(initialBoot.state);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [onlineCount, setOnlineCount] = useState<number>(0);

  const stateRef = useRef<RoomState>(initialBoot.state);
  useEffect(() => {
    stateRef.current = roomState;
  }, [roomState]);

  const channelRef = useRef<RoomChannelAdapter | null>(null);
  const scoreThrottleTimerRef = useRef<number | null>(null);
  const scoreDirtyRef = useRef(false);
  const lastRoundEndAtRef = useRef<number>(0);

  const broadcastStateSync = useCallback((nextState: RoomState) => {
    void channelRef.current?.broadcast('STATE_SYNC', {
      meta: nextState.meta,
      teams: nextState.teams,
      players: nextState.players,
      imposter: nextState.imposter,
    });
  }, []);

  const commitState = useCallback(
    (updater: (prev: RoomState) => RoomState, shouldBroadcast = true) => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      setRoomState(next);
      saveHostSession(roomCode, next);
      if (shouldBroadcast) {
        broadcastStateSync(next);
      }
      return next;
    },
    [roomCode, broadcastStateSync]
  );

  const flushScoreBroadcast = useCallback(() => {
    if (!scoreDirtyRef.current) return;
    scoreDirtyRef.current = false;
    const snap = stateRef.current;
    void channelRef.current?.broadcast('SCORE_UPDATE', {
      teams: snap.teams,
      players: snap.players,
    });
  }, []);

  const scheduleScoreBroadcast = useCallback(() => {
    scoreDirtyRef.current = true;
    if (scoreThrottleTimerRef.current !== null) return;
    scoreThrottleTimerRef.current = window.setTimeout(() => {
      scoreThrottleTimerRef.current = null;
      flushScoreBroadcast();
    }, 260);
  }, [flushScoreBroadcast]);

  // Connect / reconnect channel whenever roomCode changes
  useEffect(() => {
    const channel = createRoomChannel({
      roomCode,
      clientId: `host_${roomCode}`,
      onStatusChange: (status) => {
        setConnectionStatus(status);
        if (status === 'connected') {
          broadcastStateSync(stateRef.current);
        }
      },
      onPresenceChange: (snapshot) => {
        const onlineSet = new Set(snapshot.onlinePlayerIds);
        setOnlineCount(onlineSet.size);

        commitState((prev) => {
          let changed = false;
          const nextPlayers: Record<string, PlayerRecord> = { ...prev.players };

          for (const id of Object.keys(nextPlayers)) {
            const isOnline = onlineSet.has(id);
            if (nextPlayers[id].online !== isOnline) {
              nextPlayers[id] = { ...nextPlayers[id], online: isOnline };
              changed = true;
            }
          }

          for (const entry of snapshot.entries) {
            if (!nextPlayers[entry.playerId]) {
              const pastTeamSelect =
                prev.meta.state !== 'LOBBY' &&
                prev.meta.state !== 'TEAM_SELECT' &&
                prev.meta.state !== 'IMPOSTER_ACTIVE';
              nextPlayers[entry.playerId] = {
                id: entry.playerId,
                name: entry.name || 'Player',
                team: entry.team ?? (pastTeamSelect ? pickBalancedTeam(nextPlayers) : null),
                totalScore: 0,
                roundScore: 0,
                online: true,
              };
              changed = true;
            }
          }

          if (!changed) return prev;
          return { ...prev, players: nextPlayers };
        }, false);
      },
    });

    channelRef.current = channel;

    const offJoin = channel.on('PLAYER_JOIN', (payload) => {
      if (!payload?.playerId) return;
      const isNew = !stateRef.current.players[payload.playerId];
      if (isNew) {
        stageAudio.playJoin();
      }
      commitState((prev) => {
        const existing = prev.players[payload.playerId];
        const pastTeamSelect =
          prev.meta.state !== 'LOBBY' &&
          prev.meta.state !== 'TEAM_SELECT' &&
          prev.meta.state !== 'IMPOSTER_ACTIVE';

        const resolvedTeam =
          existing?.team ??
          payload.team ??
          (pastTeamSelect ? pickBalancedTeam(prev.players) : null);

        const nextPlayer: PlayerRecord = existing
          ? {
              ...existing,
              name: payload.name?.trim() || existing.name,
              team: resolvedTeam,
              online: true,
            }
          : {
              id: payload.playerId,
              name: payload.name?.trim() || 'Player',
              team: resolvedTeam,
              totalScore: 0,
              roundScore: 0,
              online: true,
            };

        return {
          ...prev,
          players: {
            ...prev.players,
            [payload.playerId]: nextPlayer,
          },
        };
      }, true);
    });

    const offTeamPick = channel.on('TEAM_PICK', (payload) => {
      if (!payload?.playerId || (payload.team !== 'red' && payload.team !== 'white')) return;
      if (stateRef.current.meta.state !== 'TEAM_SELECT') return;

      commitState((prev) => {
        const existing = prev.players[payload.playerId];
        if (!existing) return prev;
        if (existing.team === payload.team) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [payload.playerId]: {
              ...existing,
              team: payload.team,
            },
          },
        };
      }, true);
    });

    const offScoreDelta = channel.on('SCORE_DELTA', (payload) => {
      if (!payload?.playerId || typeof payload.delta !== 'number' || payload.delta === 0) return;

      const current = stateRef.current;
      const inGraceWindow =
        current.meta.state === 'ROUND_END' && Date.now() <= lastRoundEndAtRef.current + 750;
      if (current.meta.state !== 'GAME_ACTIVE' && !inGraceWindow) return;

      const player = current.players[payload.playerId];
      if (!player) return;

      const team: TeamId | null = player.team ?? payload.team ?? null;
      if (!team) return;

      const nextRoundScore = Math.max(0, player.roundScore + payload.delta);
      const appliedDelta = nextRoundScore - player.roundScore;
      if (appliedDelta === 0) return;

      commitState((prev) => {
        const p = prev.players[payload.playerId];
        if (!p) return prev;
        const t = p.team ?? team;
        const safeNextRound = Math.max(0, p.roundScore + payload.delta);
        const delta = safeNextRound - p.roundScore;
        if (delta === 0) return prev;

        return {
          ...prev,
          teams: {
            ...prev.teams,
            [t]: {
              roundScore: Math.max(0, prev.teams[t].roundScore + delta),
              totalScore: Math.max(0, prev.teams[t].totalScore + delta),
            },
          },
          players: {
            ...prev.players,
            [payload.playerId]: {
              ...p,
              roundScore: safeNextRound,
              totalScore: Math.max(0, p.totalScore + delta),
            },
          },
        };
      }, inGraceWindow);

      if (!inGraceWindow) {
        scheduleScoreBroadcast();
      }
    });

    // ---------------- Imposter Mode Broadcast Listeners ----------------
    const offImposterClue = channel.on('IMPOSTER_CLUE', (payload) => {
      if (!payload?.playerId || typeof payload.clue !== 'string') return;
      const cleanClue = payload.clue.trim().replace(/\s+/g, ' ').slice(0, 36);
      if (!cleanClue) return;

      commitState((prev) => {
        const round = prev.imposter.round;
        if (prev.meta.state !== 'IMPOSTER_ACTIVE' || !round || round.phase !== 'WRITING') {
          return prev;
        }
        if (!prev.players[payload.playerId]) return prev;

        const nextClues = { ...round.clues, [payload.playerId]: cleanClue };
        const activeIds = getActiveRosterIds(prev.players);
        const allSubmitted =
          activeIds.length > 0 && activeIds.every((id) => Boolean(nextClues[id]));

        if (allSubmitted) {
          stageAudio.playRoundStart();
        }

        const nextRound: ImposterRoundState = allSubmitted
          ? {
              ...round,
              clues: nextClues,
              phase: 'DISCUSSION',
              phaseEndsAt: Date.now() + prev.imposter.settings.silentDiscussionSec * 1000,
            }
          : {
              ...round,
              clues: nextClues,
            };

        return {
          ...prev,
          imposter: {
            ...prev.imposter,
            round: nextRound,
          },
        };
      }, true);
    });

    const offImposterReact = channel.on('IMPOSTER_REACT', (payload) => {
      if (
        !payload?.reactorId ||
        !payload?.targetPlayerId ||
        (payload.reaction !== 'sus' && payload.reaction !== 'caught')
      ) {
        return;
      }

      commitState((prev) => {
        const round = prev.imposter.round;
        if (prev.meta.state !== 'IMPOSTER_ACTIVE' || !round || round.phase !== 'DISCUSSION') {
          return prev;
        }

        const existingForTarget = { ...(round.reactions[payload.targetPlayerId] ?? {}) };
        if (existingForTarget[payload.reactorId] === payload.reaction) {
          delete existingForTarget[payload.reactorId];
        } else {
          existingForTarget[payload.reactorId] = payload.reaction;
        }

        return {
          ...prev,
          imposter: {
            ...prev.imposter,
            round: {
              ...round,
              reactions: {
                ...round.reactions,
                [payload.targetPlayerId]: existingForTarget,
              },
            },
          },
        };
      }, true);
    });

    const offImposterVote = channel.on('IMPOSTER_VOTE', (payload) => {
      if (!payload?.voterId || !payload?.targetPlayerId) return;
      if (payload.voterId === payload.targetPlayerId) return; // Cannot vote for self

      commitState((prev) => {
        const round = prev.imposter.round;
        if (prev.meta.state !== 'IMPOSTER_ACTIVE' || !round || round.phase !== 'VOTING') {
          return prev;
        }
        if (!prev.players[payload.voterId] || !prev.players[payload.targetPlayerId]) return prev;

        const nextVotes = { ...round.votes, [payload.voterId]: payload.targetPlayerId };
        const activeIds = getActiveRosterIds(prev.players);
        const allVoted = activeIds.length >= 2 && activeIds.every((id) => Boolean(nextVotes[id]));

        let nextRound: ImposterRoundState = {
          ...round,
          votes: nextVotes,
        };

        if (allVoted) {
          stageAudio.playVictory();
          nextRound = resolveImposterVoteOutcome(nextRound);
        }

        return {
          ...prev,
          imposter: {
            ...prev.imposter,
            round: nextRound,
          },
        };
      }, true);
    });

    channel.subscribe();

    return () => {
      offJoin();
      offTeamPick();
      offScoreDelta();
      offImposterClue();
      offImposterReact();
      offImposterVote();
      if (scoreThrottleTimerRef.current !== null) {
        clearTimeout(scoreThrottleTimerRef.current);
        scoreThrottleTimerRef.current = null;
      }
      void channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomCode, broadcastStateSync, commitState, scheduleScoreBroadcast]);

  // ---------------- Arcade Countdown & Active Round Timers ----------------
  const activateRoundAfterCountdown = useCallback(() => {
    if (stateRef.current.meta.state !== 'COUNTDOWN') return;
    stageAudio.playRoundStart();
    commitState((prev) => {
      const duration = prev.meta.roundDurationSec || 25;
      return {
        ...prev,
        meta: {
          ...prev.meta,
          state: 'GAME_ACTIVE',
          countdownEndsAt: null,
          roundEndsAt: Date.now() + duration * 1000,
        },
      };
    }, true);
  }, [commitState]);

  useEffect(() => {
    if (roomState.meta.state !== 'COUNTDOWN' || !roomState.meta.countdownEndsAt) return;
    const endsAt = roomState.meta.countdownEndsAt;
    let lastBeepStep = '';

    const check = () => {
      const remaining = endsAt - Date.now();
      const step =
        remaining > 2500 ? '3' : remaining > 1500 ? '2' : remaining > 500 ? '1' : 'GO!';

      if (step !== lastBeepStep) {
        lastBeepStep = step;
        if (step !== 'GO!') {
          stageAudio.playTick();
        }
      }

      if (remaining <= 0) {
        activateRoundAfterCountdown();
      }
    };

    check();
    const interval = window.setInterval(check, 50);
    return () => clearInterval(interval);
  }, [roomState.meta.state, roomState.meta.countdownEndsAt, activateRoundAfterCountdown]);

  const endRound = useCallback(() => {
    if (stateRef.current.meta.state !== 'GAME_ACTIVE') return;
    lastRoundEndAtRef.current = Date.now();
    stageAudio.playRoundEnd();
    commitState(
      (prev) => ({
        ...prev,
        meta: {
          ...prev.meta,
          state: 'ROUND_END',
          countdownEndsAt: null,
          roundEndsAt: null,
        },
      }),
      true
    );
  }, [commitState]);

  const timeLeft = useCountdown(
    roomState.meta.roundEndsAt,
    roomState.meta.state === 'GAME_ACTIVE',
    endRound
  );

  // ---------------- Imposter Phase Timer ----------------
  const imposterRound = roomState.imposter.round;
  const isImposterTimedPhase =
    roomState.meta.state === 'IMPOSTER_ACTIVE' &&
    Boolean(imposterRound?.phaseEndsAt) &&
    (imposterRound?.phase === 'WRITING' ||
      imposterRound?.phase === 'DISCUSSION' ||
      imposterRound?.phase === 'VOTING');

  const handleImposterPhaseExpire = useCallback(() => {
    const curr = stateRef.current;
    const round = curr.imposter.round;
    if (curr.meta.state !== 'IMPOSTER_ACTIVE' || !round) return;

    if (round.phase === 'WRITING') {
      stageAudio.playRoundStart();
      commitState((prev) => {
        if (!prev.imposter.round || prev.imposter.round.phase !== 'WRITING') return prev;
        return {
          ...prev,
          imposter: {
            ...prev.imposter,
            round: {
              ...prev.imposter.round,
              phase: 'DISCUSSION',
              phaseEndsAt: Date.now() + prev.imposter.settings.silentDiscussionSec * 1000,
            },
          },
        };
      }, true);
    } else if (round.phase === 'DISCUSSION') {
      stageAudio.playRoundEnd();
      commitState((prev) => {
        if (!prev.imposter.round || prev.imposter.round.phase !== 'DISCUSSION') return prev;
        return {
          ...prev,
          imposter: {
            ...prev.imposter,
            round: {
              ...prev.imposter.round,
              phase: 'VOTING',
              phaseEndsAt: Date.now() + prev.imposter.settings.votingTimeSec * 1000,
            },
          },
        };
      }, true);
    } else if (round.phase === 'VOTING') {
      stageAudio.playVictory();
      commitState((prev) => {
        if (!prev.imposter.round || prev.imposter.round.phase !== 'VOTING') return prev;
        return {
          ...prev,
          imposter: {
            ...prev.imposter,
            round: resolveImposterVoteOutcome(prev.imposter.round),
          },
        };
      }, true);
    }
  }, [commitState]);

  const imposterTimeLeft = useCountdown(
    imposterRound?.phaseEndsAt ?? null,
    isImposterTimedPhase,
    handleImposterPhaseExpire
  );

  // Tick audio cue during final 5 seconds of active Arcade or Imposter timed phases
  const activeTickSeconds =
    roomState.meta.state === 'GAME_ACTIVE'
      ? timeLeft
      : isImposterTimedPhase
        ? imposterTimeLeft
        : 0;
  const prevTickRef = useRef<number>(activeTickSeconds);
  useEffect(() => {
    if (activeTickSeconds > 0 && activeTickSeconds <= 5 && activeTickSeconds !== prevTickRef.current) {
      stageAudio.playTick();
    }
    prevTickRef.current = activeTickSeconds;
  }, [activeTickSeconds]);

  // ---------------- Mode Switcher & Arcade Controls ----------------
  const setGameMode = useCallback(
    (mode: GameMode) => {
      commitState(
        (prev) => ({
          ...prev,
          meta: {
            ...prev.meta,
            gameMode: mode,
          },
        }),
        true
      );
    },
    [commitState]
  );

  const togglePlaylistGame = useCallback(
    (gameId: string) => {
      commitState((prev) => {
        const exists = prev.meta.gamePlaylist.includes(gameId);
        let nextPlaylist: string[];
        if (exists) {
          if (prev.meta.gamePlaylist.length <= 1) return prev;
          nextPlaylist = prev.meta.gamePlaylist.filter((id) => id !== gameId);
        } else {
          const candidateSet = new Set([...prev.meta.gamePlaylist, gameId]);
          nextPlaylist = DEFAULT_PLAYLIST.filter((id) => candidateSet.has(id));
        }
        return {
          ...prev,
          meta: {
            ...prev.meta,
            gamePlaylist: nextPlaylist,
            currentGameId: nextPlaylist[0] ?? null,
          },
        };
      }, true);
    },
    [commitState]
  );

  const goToTeamSelect = useCallback(() => {
    commitState(
      (prev) => ({
        ...prev,
        meta: {
          ...prev.meta,
          gameMode: 'arcade',
          state: 'TEAM_SELECT',
        },
      }),
      true
    );
  }, [commitState]);

  const startGames = useCallback(() => {
    commitState((prev) => {
      const playlist =
        prev.meta.gamePlaylist.length > 0 ? prev.meta.gamePlaylist : [...DEFAULT_PLAYLIST];
      const firstGameId = playlist[0];
      const gameDef = getGameById(firstGameId);

      const nextPlayers: Record<string, PlayerRecord> = { ...prev.players };
      for (const id of Object.keys(nextPlayers)) {
        if (!nextPlayers[id].team) {
          nextPlayers[id] = {
            ...nextPlayers[id],
            team: pickBalancedTeam(nextPlayers),
          };
        }
      }

      return {
        ...prev,
        players: nextPlayers,
        meta: {
          ...prev.meta,
          state: 'GAME_INTRO',
          gamePlaylist: playlist,
          currentRoundIndex: 0,
          currentGameId: firstGameId,
          roundDurationSec: gameDef?.durationSec ?? 25,
          countdownEndsAt: null,
          roundEndsAt: null,
        },
      };
    }, true);
  }, [commitState]);

  const setRoundDuration = useCallback(
    (seconds: number) => {
      const clamped = Math.max(10, Math.min(90, Math.round(seconds)));
      commitState(
        (prev) => ({
          ...prev,
          meta: {
            ...prev.meta,
            roundDurationSec: clamped,
          },
        }),
        true
      );
    },
    [commitState]
  );

  const startRound = useCallback(() => {
    commitState((prev) => {
      const resetPlayers: Record<string, PlayerRecord> = {};
      for (const [id, p] of Object.entries(prev.players)) {
        resetPlayers[id] = { ...p, roundScore: 0 };
      }

      return {
        ...prev,
        teams: {
          red: { ...prev.teams.red, roundScore: 0 },
          white: { ...prev.teams.white, roundScore: 0 },
        },
        players: resetPlayers,
        meta: {
          ...prev.meta,
          state: 'COUNTDOWN',
          countdownEndsAt: Date.now() + PRE_ROUND_COUNTDOWN_MS,
          roundEndsAt: null,
        },
      };
    }, true);
  }, [commitState]);

  const advanceAfterRound = useCallback(() => {
    const prev = stateRef.current;
    const nextIndex = prev.meta.currentRoundIndex + 1;

    if (nextIndex < prev.meta.gamePlaylist.length) {
      const nextGameId = prev.meta.gamePlaylist[nextIndex];
      const nextGame = getGameById(nextGameId);
      commitState(
        (curr) => ({
          ...curr,
          meta: {
            ...curr.meta,
            state: 'GAME_INTRO',
            currentRoundIndex: nextIndex,
            currentGameId: nextGameId,
            roundDurationSec: nextGame?.durationSec ?? 25,
            countdownEndsAt: null,
            roundEndsAt: null,
          },
        }),
        true
      );
    } else {
      stageAudio.playVictory();
      commitState(
        (curr) => ({
          ...curr,
          meta: {
            ...curr.meta,
            state: 'FINAL_WINNER',
            countdownEndsAt: null,
            roundEndsAt: null,
          },
        }),
        true
      );
    }
  }, [commitState]);

  const playAgainSameRoom = useCallback(() => {
    commitState((prev) => {
      const playlist =
        prev.meta.gamePlaylist.length > 0 ? prev.meta.gamePlaylist : [...DEFAULT_PLAYLIST];
      const firstGameId = playlist[0] ?? null;
      const firstGame = getGameById(firstGameId);

      const resetPlayers: Record<string, PlayerRecord> = {};
      for (const [id, p] of Object.entries(prev.players)) {
        resetPlayers[id] = {
          ...p,
          totalScore: 0,
          roundScore: 0,
        };
      }

      return {
        ...prev,
        meta: {
          ...prev.meta,
          state: 'LOBBY',
          currentGameId: firstGameId,
          gamePlaylist: playlist,
          currentRoundIndex: 0,
          roundDurationSec: firstGame?.durationSec ?? 25,
          countdownEndsAt: null,
          roundEndsAt: null,
        },
        teams: {
          red: { totalScore: 0, roundScore: 0 },
          white: { totalScore: 0, roundScore: 0 },
        },
        players: resetPlayers,
      };
    }, true);
  }, [commitState]);

  // ---------------- Imposter Host Controls ----------------
  const updateImposterSettings = useCallback(
    (patch: Partial<ImposterSettings>) => {
      commitState((prev) => {
        const curr = prev.imposter.settings;
        const activeCount = getActiveRosterIds(prev.players).length;
        const maxImp = getMaxImposters(activeCount);

        const nextWriting =
          patch.writingTimeSec !== undefined
            ? Math.max(15, Math.min(90, patch.writingTimeSec))
            : curr.writingTimeSec;
        const nextVoiceDisc =
          patch.voiceDiscussionSec !== undefined
            ? Math.max(20, Math.min(300, patch.voiceDiscussionSec))
            : curr.voiceDiscussionSec;
        const nextSilentDisc =
          patch.silentDiscussionSec !== undefined
            ? Math.max(20, Math.min(300, patch.silentDiscussionSec))
            : curr.silentDiscussionSec;
        const nextVoting =
          patch.votingTimeSec !== undefined
            ? Math.max(15, Math.min(90, patch.votingTimeSec))
            : curr.votingTimeSec;
        const nextOverride =
          patch.imposterCountOverride !== undefined
            ? patch.imposterCountOverride === null
              ? null
              : Math.max(1, Math.min(maxImp, patch.imposterCountOverride))
            : curr.imposterCountOverride;

        return {
          ...prev,
          imposter: {
            ...prev.imposter,
            settings: {
              playStyle: patch.playStyle ?? curr.playStyle,
              writingTimeSec: nextWriting,
              voiceDiscussionSec: nextVoiceDisc,
              silentDiscussionSec: nextSilentDisc,
              votingTimeSec: nextVoting,
              imposterCountOverride: nextOverride,
            },
          },
        };
      }, true);
    },
    [commitState]
  );

  const startImposterRound = useCallback(() => {
    stageAudio.playRoundStart();
    commitState((prev) => {
      const activeIds = getActiveRosterIds(prev.players);
      const { entry, nextUsedWords } = pickNextImposterWord(prev.imposter.usedWords);

      const shuffled = [...activeIds];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const imposterCount =
        shuffled.length > 0
          ? getResolvedImposterCount(shuffled.length, prev.imposter.settings.imposterCountOverride)
          : 0;
      const imposterIds = shuffled.slice(0, imposterCount);
      const starterPlayerId =
        activeIds.length > 0
          ? activeIds[Math.floor(Math.random() * activeIds.length)]
          : null;

      const prevRoundNum = prev.imposter.round?.roundNumber ?? 0;

      const nextRound: ImposterRoundState = {
        phase: 'ROLE_REVEAL',
        roundNumber: prevRoundNum + 1,
        category: entry.category,
        secretWord: entry.word,
        imposterIds,
        starterPlayerId,
        phaseEndsAt: null,
        clues: {},
        reactions: {},
        votes: {},
        eliminatedPlayerId: null,
        wasTie: false,
        winner: null,
      };

      return {
        ...prev,
        meta: {
          ...prev.meta,
          gameMode: 'imposter',
          state: 'IMPOSTER_ACTIVE',
          countdownEndsAt: null,
          roundEndsAt: null,
        },
        imposter: {
          ...prev.imposter,
          usedWords: nextUsedWords,
          round: nextRound,
        },
      };
    }, true);
  }, [commitState]);

  const beginImposterClues = useCallback(() => {
    stageAudio.playRoundStart();
    commitState((prev) => {
      const round = prev.imposter.round;
      if (prev.meta.state !== 'IMPOSTER_ACTIVE' || !round || round.phase !== 'ROLE_REVEAL') {
        return prev;
      }
      const { playStyle, writingTimeSec, voiceDiscussionSec } = prev.imposter.settings;
      if (playStyle === 'silent') {
        return {
          ...prev,
          imposter: {
            ...prev.imposter,
            round: {
              ...round,
              phase: 'WRITING',
              phaseEndsAt: Date.now() + writingTimeSec * 1000,
            },
          },
        };
      }
      return {
        ...prev,
        imposter: {
          ...prev.imposter,
          round: {
            ...round,
            phase: 'DISCUSSION',
            phaseEndsAt: Date.now() + voiceDiscussionSec * 1000,
          },
        },
      };
    }, true);
  }, [commitState]);

  const revealImposterCluesNow = useCallback(() => {
    stageAudio.playRoundStart();
    commitState((prev) => {
      const round = prev.imposter.round;
      if (prev.meta.state !== 'IMPOSTER_ACTIVE' || !round || round.phase !== 'WRITING') {
        return prev;
      }
      return {
        ...prev,
        imposter: {
          ...prev.imposter,
          round: {
            ...round,
            phase: 'DISCUSSION',
            phaseEndsAt: Date.now() + prev.imposter.settings.silentDiscussionSec * 1000,
          },
        },
      };
    }, true);
  }, [commitState]);

  const startImposterVoting = useCallback(() => {
    stageAudio.playRoundEnd();
    commitState((prev) => {
      const round = prev.imposter.round;
      if (prev.meta.state !== 'IMPOSTER_ACTIVE' || !round || round.phase !== 'DISCUSSION') {
        return prev;
      }
      return {
        ...prev,
        imposter: {
          ...prev.imposter,
          round: {
            ...round,
            phase: 'VOTING',
            phaseEndsAt: Date.now() + prev.imposter.settings.votingTimeSec * 1000,
          },
        },
      };
    }, true);
  }, [commitState]);

  const endImposterVotingNow = useCallback(() => {
    stageAudio.playVictory();
    commitState((prev) => {
      const round = prev.imposter.round;
      if (prev.meta.state !== 'IMPOSTER_ACTIVE' || !round || round.phase !== 'VOTING') {
        return prev;
      }
      return {
        ...prev,
        imposter: {
          ...prev.imposter,
          round: resolveImposterVoteOutcome(round),
        },
      };
    }, true);
  }, [commitState]);

  const backToLobbyFromImposter = useCallback(() => {
    commitState(
      (prev) => ({
        ...prev,
        meta: {
          ...prev.meta,
          state: 'LOBBY',
          countdownEndsAt: null,
          roundEndsAt: null,
        },
        imposter: {
          ...prev.imposter,
          round: null,
        },
      }),
      true
    );
  }, [commitState]);

  const playAgainNewRoom = useCallback(() => {
    clearHostSession();
    const freshCode = generateRoomCode();
    const freshState = createInitialRoomState();
    stateRef.current = freshState;
    setRoomState(freshState);
    setOnlineCount(0);
    saveHostSession(freshCode, freshState);
    setRoomCode(freshCode);
  }, []);

  return {
    roomCode,
    roomState,
    timeLeft,
    imposterTimeLeft,
    onlineCount,
    connectionStatus,
    transportMode: TRANSPORT_MODE,
    setGameMode,
    togglePlaylistGame,
    goToTeamSelect,
    startGames,
    setRoundDuration,
    startRound,
    endRoundEarly: endRound,
    advanceAfterRound,
    playAgainSameRoom,
    playAgainNewRoom,
    updateImposterSettings,
    startImposterRound,
    beginImposterClues,
    revealImposterCluesNow,
    startImposterVoting,
    endImposterVotingNow,
    backToLobbyFromImposter,
  };
}

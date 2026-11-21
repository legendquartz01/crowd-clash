import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_PLAYLIST, getGameById } from '../games/registry';
import { createRoomChannel, type RoomChannelAdapter } from '../lib/realtime';
import { stageAudio } from '../lib/sound';
import {
  clearHostSession,
  generateRoomCode,
  loadHostSession,
  saveHostSession,
} from '../lib/storage';
import type {
  ConnectionStatus,
  PlayerRecord,
  RoomState,
  TeamId,
  TransportMode,
} from '../types/game';
import { useCountdown } from './useCountdown';

function createInitialRoomState(): RoomState {
  return {
    meta: {
      state: 'LOBBY',
      currentGameId: DEFAULT_PLAYLIST[0] ?? null,
      gamePlaylist: [...DEFAULT_PLAYLIST],
      currentRoundIndex: 0,
      roundDurationSec: getGameById(DEFAULT_PLAYLIST[0])?.durationSec ?? 25,
      roundEndsAt: null,
    },
    teams: {
      red: { totalScore: 0, roundScore: 0 },
      white: { totalScore: 0, roundScore: 0 },
    },
    players: {},
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

export function useHostRoom() {
  const [initialBoot] = useState(() => {
    const saved = loadHostSession();
    return {
      roomCode: saved?.roomCode ?? generateRoomCode(),
      state: saved?.state ?? createInitialRoomState(),
    };
  });

  const [roomCode, setRoomCode] = useState<string>(initialBoot.roomCode);
  const [roomState, setRoomState] = useState<RoomState>(initialBoot.state);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [transportMode, setTransportMode] = useState<TransportMode>('local-demo');
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
    }, 280);
  }, [flushScoreBroadcast]);

  // Connect / reconnect channel whenever roomCode changes
  useEffect(() => {
    const channel = createRoomChannel({
      roomCode,
      clientId: `host_${roomCode}`,
      onStatusChange: (status) => {
        setConnectionStatus(status);
        if (status === 'connected') {
          // Immediately sync existing players after a Host refresh
          broadcastStateSync(stateRef.current);
        }
      },
      onPresenceChange: (snapshot) => {
        const onlineSet = new Set(snapshot.onlinePlayerIds);
        setOnlineCount(onlineSet.size);

        commitState((prev) => {
          let changed = false;
          const nextPlayers: Record<string, PlayerRecord> = { ...prev.players };

          // Update online flags for known players
          for (const id of Object.keys(nextPlayers)) {
            const isOnline = onlineSet.has(id);
            if (nextPlayers[id].online !== isOnline) {
              nextPlayers[id] = { ...nextPlayers[id], online: isOnline };
              changed = true;
            }
          }

          // Recover any tracked player missing from state (e.g. race on refresh)
          for (const entry of snapshot.entries) {
            if (!nextPlayers[entry.playerId]) {
              const pastTeamSelect =
                prev.meta.state !== 'LOBBY' && prev.meta.state !== 'TEAM_SELECT';
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
    setTransportMode(channel.mode);

    const offJoin = channel.on('PLAYER_JOIN', (payload) => {
      if (!payload?.playerId) return;
      const isNew = !stateRef.current.players[payload.playerId];
      if (isNew) {
        stageAudio.playJoin();
      }
      commitState((prev) => {
        const existing = prev.players[payload.playerId];
        const pastTeamSelect =
          prev.meta.state !== 'LOBBY' && prev.meta.state !== 'TEAM_SELECT';

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

      // Keep individual round scores >= 0 while applying exact delta to team totals
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

    channel.subscribe();

    return () => {
      offJoin();
      offTeamPick();
      offScoreDelta();
      if (scoreThrottleTimerRef.current !== null) {
        clearTimeout(scoreThrottleTimerRef.current);
        scoreThrottleTimerRef.current = null;
      }
      void channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomCode, broadcastStateSync, commitState, scheduleScoreBroadcast]);

  // Finish round transition (shared by timer expiration and "End Round Early")
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

  // Tick audio cue during final 5 seconds
  const prevTimeLeftRef = useRef<number>(timeLeft);
  useEffect(() => {
    if (
      roomState.meta.state === 'GAME_ACTIVE' &&
      timeLeft > 0 &&
      timeLeft <= 5 &&
      timeLeft !== prevTimeLeftRef.current
    ) {
      stageAudio.playTick();
    }
    prevTimeLeftRef.current = timeLeft;
  }, [roomState.meta.state, timeLeft]);

  // Host Controls
  const togglePlaylistGame = useCallback(
    (gameId: string) => {
      commitState((prev) => {
        const exists = prev.meta.gamePlaylist.includes(gameId);
        let nextPlaylist: string[];
        if (exists) {
          // Ensure at least one game remains selected
          if (prev.meta.gamePlaylist.length <= 1) return prev;
          nextPlaylist = prev.meta.gamePlaylist.filter((id) => id !== gameId);
        } else {
          // Preserve registry ordering
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

      // Auto-balance any unassigned players so everyone plays
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
    stageAudio.playRoundStart();
    commitState((prev) => {
      const duration = prev.meta.roundDurationSec || 25;
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
          state: 'GAME_ACTIVE',
          roundEndsAt: Date.now() + duration * 1000,
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
            roundEndsAt: null,
          },
        }),
        true
      );
    }
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
    onlineCount,
    connectionStatus,
    transportMode,
    togglePlaylistGame,
    goToTeamSelect,
    startGames,
    setRoundDuration,
    startRound,
    endRoundEarly: endRound,
    advanceAfterRound,
    playAgainNewRoom,
  };
}

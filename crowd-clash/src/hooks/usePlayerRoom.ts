import { useCallback, useEffect, useRef, useState } from 'react';
import { getGameById } from '../games/registry';
import { createRoomChannel, type RoomChannelAdapter } from '../lib/realtime';
import {
  clearPlayerSession,
  generatePlayerId,
  loadPlayerLastProfile,
  loadPlayerSession,
  normalizeRoomCode,
  savePlayerSession,
  type PlayerLastProfile,
  type PlayerPersistedSession,
} from '../lib/storage';
import { isSupabaseConfigured } from '../lib/supabase';
import type {
  ClueReactionType,
  ConnectionStatus,
  RoomState,
  TeamId,
  TransportMode,
} from '../types/game';
import { useCountdown } from './useCountdown';

const TRANSPORT_MODE: TransportMode = isSupabaseConfigured ? 'supabase' : 'local-demo';

export function usePlayerRoom(urlRoomCode: string | null) {
  const normalizedUrlRoom = urlRoomCode ? normalizeRoomCode(urlRoomCode) : '';

  const [session, setSession] = useState<PlayerPersistedSession | null>(() => {
    const saved = loadPlayerSession();
    if (!saved) return null;
    if (normalizedUrlRoom && normalizedUrlRoom !== saved.roomCode) {
      return null;
    }
    return saved;
  });

  const [lastProfile, setLastProfile] = useState<PlayerLastProfile | null>(() =>
    loadPlayerLastProfile()
  );
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [optimisticDelta, setOptimisticDelta] = useState<number>(0);

  const channelRef = useRef<RoomChannelAdapter | null>(null);
  const sessionRef = useRef<PlayerPersistedSession | null>(session);
  const roomStateRef = useRef<RoomState | null>(roomState);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  const pendingDeltaRef = useRef<number>(0);
  const flushTimerRef = useRef<number | null>(null);
  const syncedRef = useRef<boolean>(false);

  const activeRoomState = session ? roomState : null;
  const activeGame = getGameById(activeRoomState?.meta.currentGameId);
  const throttleMs = activeGame?.throttleMs ?? 350;

  const flushPendingScore = useCallback(() => {
    if (flushTimerRef.current !== null) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    const delta = pendingDeltaRef.current;
    if (delta === 0) return;

    const currentSession = sessionRef.current;
    const myPlayer = currentSession ? roomStateRef.current?.players[currentSession.playerId] : null;
    const team = myPlayer?.team ?? currentSession?.team;
    if (!currentSession || !team) return;

    pendingDeltaRef.current = 0;
    void channelRef.current?.broadcast('SCORE_DELTA', {
      playerId: currentSession.playerId,
      team,
      delta,
    });
  }, []);

  const activeRoomCode = session?.roomCode ?? null;
  const activePlayerId = session?.playerId ?? null;

  useEffect(() => {
    if (!activeRoomCode || !activePlayerId) {
      syncedRef.current = false;
      pendingDeltaRef.current = 0;
      return;
    }

    syncedRef.current = false;
    pendingDeltaRef.current = 0;

    const channel = createRoomChannel({
      roomCode: activeRoomCode,
      clientId: activePlayerId,
      onStatusChange: (status) => {
        setConnectionStatus(status);
        if (status === 'connected') {
          const s = sessionRef.current;
          if (!s) return;
          void channel.track({
            playerId: s.playerId,
            name: s.name,
            team: s.team,
          });
          void channel.broadcast('PLAYER_JOIN', {
            playerId: s.playerId,
            name: s.name,
            team: s.team,
          });
        }
      },
    });

    channelRef.current = channel;

    const offStateSync = channel.on('STATE_SYNC', (payload) => {
      syncedRef.current = true;
      setRoomState({
        meta: payload.meta,
        teams: payload.teams,
        players: payload.players,
        imposter: payload.imposter,
      });
      setOptimisticDelta(0);

      const current = sessionRef.current;
      if (current) {
        const hostPlayer = payload.players[current.playerId];
        if (hostPlayer && hostPlayer.team !== current.team) {
          const updated: PlayerPersistedSession = {
            ...current,
            team: hostPlayer.team,
          };
          sessionRef.current = updated;
          setSession(updated);
          savePlayerSession(updated);
          void channel.track({
            playerId: updated.playerId,
            name: updated.name,
            team: updated.team,
          });
        }
      }
    });

    const offScoreUpdate = channel.on('SCORE_UPDATE', (payload) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          teams: payload.teams,
          players: payload.players,
        };
      });
      setOptimisticDelta(pendingDeltaRef.current);
    });

    channel.subscribe();

    const joinRetryInterval = window.setInterval(() => {
      if (syncedRef.current) return;
      const s = sessionRef.current;
      if (!s) return;
      void channel.broadcast('PLAYER_JOIN', {
        playerId: s.playerId,
        name: s.name,
        team: s.team,
      });
    }, 2000);

    return () => {
      flushPendingScore();
      clearInterval(joinRetryInterval);
      offStateSync();
      offScoreUpdate();
      void channel.unsubscribe();
      channelRef.current = null;
    };
  }, [activeRoomCode, activePlayerId, flushPendingScore]);

  const isGameActive = activeRoomState?.meta.state === 'GAME_ACTIVE';
  const timeLeft = useCountdown(
    activeRoomState?.meta.roundEndsAt ?? null,
    Boolean(isGameActive),
    flushPendingScore
  );

  const imposterRound = activeRoomState?.imposter?.round ?? null;
  const isImposterTimedPhase =
    activeRoomState?.meta.state === 'IMPOSTER_ACTIVE' &&
    Boolean(imposterRound?.phaseEndsAt) &&
    (imposterRound?.phase === 'WRITING' ||
      imposterRound?.phase === 'DISCUSSION' ||
      imposterRound?.phase === 'VOTING');

  const imposterTimeLeft = useCountdown(
    imposterRound?.phaseEndsAt ?? null,
    Boolean(isImposterTimedPhase)
  );

  useEffect(() => {
    if (!isGameActive) {
      flushPendingScore();
    }
  }, [isGameActive, flushPendingScore]);

  const joinRoom = useCallback((rawCode: string, rawName: string) => {
    const cleanCode = normalizeRoomCode(rawCode);
    const cleanName = rawName.trim().slice(0, 18);
    if (cleanCode.length !== 4 || !cleanName) return;

    const existing = loadPlayerSession();
    const prevProfile = loadPlayerLastProfile();
    const reuseFromActive = existing && existing.roomCode === cleanCode;
    const reuseFromProfile = prevProfile && prevProfile.roomCode === cleanCode;

    const nextSession: PlayerPersistedSession = {
      roomCode: cleanCode,
      playerId: reuseFromActive
        ? existing.playerId
        : reuseFromProfile
          ? prevProfile.playerId
          : generatePlayerId(),
      name: cleanName,
      team: reuseFromActive ? existing.team : null,
    };

    savePlayerSession(nextSession);
    sessionRef.current = nextSession;
    setLastProfile({
      roomCode: nextSession.roomCode,
      playerId: nextSession.playerId,
      name: nextSession.name,
    });
    setRoomState(null);
    setOptimisticDelta(0);
    setSession(nextSession);
  }, []);

  const pickTeam = useCallback((team: TeamId) => {
    const current = sessionRef.current;
    if (!current) return;

    const updated: PlayerPersistedSession = { ...current, team };
    sessionRef.current = updated;
    setSession(updated);
    savePlayerSession(updated);

    void channelRef.current?.track({
      playerId: updated.playerId,
      name: updated.name,
      team,
    });
    void channelRef.current?.broadcast('TEAM_PICK', {
      playerId: updated.playerId,
      team,
    });
  }, []);

  const recordScore = useCallback(
    (points: number) => {
      if (!points || roomStateRef.current?.meta.state !== 'GAME_ACTIVE') return;

      pendingDeltaRef.current += points;
      setOptimisticDelta((prev) => prev + points);

      if (flushTimerRef.current === null) {
        flushTimerRef.current = window.setTimeout(() => {
          flushPendingScore();
        }, throttleMs);
      }
    },
    [flushPendingScore, throttleMs]
  );

  // ---------------- Imposter Mode Player Actions ----------------
  const submitImposterClue = useCallback((rawClue: string) => {
    const current = sessionRef.current;
    const cleanClue = rawClue.trim().replace(/\s+/g, ' ').slice(0, 36);
    if (!current || !cleanClue) return;
    void channelRef.current?.broadcast('IMPOSTER_CLUE', {
      playerId: current.playerId,
      clue: cleanClue,
    });
  }, []);

  const reactToImposterClue = useCallback(
    (targetPlayerId: string, reaction: ClueReactionType) => {
      const current = sessionRef.current;
      if (!current || !targetPlayerId) return;
      void channelRef.current?.broadcast('IMPOSTER_REACT', {
        reactorId: current.playerId,
        targetPlayerId,
        reaction,
      });
    },
    []
  );

  const submitImposterVote = useCallback((targetPlayerId: string) => {
    const current = sessionRef.current;
    if (!current || !targetPlayerId || targetPlayerId === current.playerId) return;
    void channelRef.current?.broadcast('IMPOSTER_VOTE', {
      voterId: current.playerId,
      targetPlayerId,
    });
  }, []);

  const leaveRoom = useCallback(() => {
    flushPendingScore();
    clearPlayerSession();
    setLastProfile(loadPlayerLastProfile());
    sessionRef.current = null;
    setSession(null);
    setRoomState(null);
    setOptimisticDelta(0);
  }, [flushPendingScore]);

  const me = session && activeRoomState ? activeRoomState.players[session.playerId] ?? null : null;
  const effectiveTeam: TeamId | null = me?.team ?? session?.team ?? null;
  const displayRoundScore = Math.max(
    0,
    (me?.roundScore ?? 0) + (isGameActive ? optimisticDelta : 0)
  );

  return {
    session,
    lastProfile,
    roomState: activeRoomState,
    me,
    effectiveTeam,
    displayRoundScore,
    timeLeft,
    imposterTimeLeft,
    connectionStatus,
    transportMode: TRANSPORT_MODE,
    joinRoom,
    pickTeam,
    recordScore,
    submitImposterClue,
    reactToImposterClue,
    submitImposterVote,
    leaveRoom,
  };
}

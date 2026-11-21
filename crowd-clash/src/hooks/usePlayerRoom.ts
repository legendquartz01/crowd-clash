import { useCallback, useEffect, useRef, useState } from 'react';
import { getGameById } from '../games/registry';
import { createRoomChannel, type RoomChannelAdapter } from '../lib/realtime';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  clearPlayerSession,
  generatePlayerId,
  loadPlayerSession,
  normalizeRoomCode,
  savePlayerSession,
  type PlayerPersistedSession,
} from '../lib/storage';
import type {
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
    // If URL explicitly specifies a DIFFERENT room code, don't auto-connect to stale room
    if (normalizedUrlRoom && normalizedUrlRoom !== saved.roomCode) {
      return null;
    }
    return saved;
  });

  const [savedNameHint] = useState<string>(() => loadPlayerSession()?.name ?? '');
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

  // Subscribe to `room:{roomCode}` whenever roomCode & playerId are active
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
      });
      setOptimisticDelta(0);

      // Persist authoritative team assigned/restored by Host
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
      // Reset optimistic offset once authoritative snapshot arrives (keep only un-flushed pending taps)
      setOptimisticDelta(pendingDeltaRef.current);
    });

    channel.subscribe();

    // Retry PLAYER_JOIN until first STATE_SYNC arrives (resilient to Host refresh / slow start)
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

  // Flush remaining score buffer whenever round ends
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
    const reuseIdentity = existing && existing.roomCode === cleanCode;

    const nextSession: PlayerPersistedSession = {
      roomCode: cleanCode,
      playerId: reuseIdentity ? existing.playerId : generatePlayerId(),
      name: cleanName,
      team: reuseIdentity ? existing.team : null,
    };

    savePlayerSession(nextSession);
    sessionRef.current = nextSession;
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

  const leaveRoom = useCallback(() => {
    flushPendingScore();
    clearPlayerSession();
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
    savedNameHint,
    roomState: activeRoomState,
    me,
    effectiveTeam,
    displayRoundScore,
    timeLeft,
    connectionStatus,
    transportMode: TRANSPORT_MODE,
    joinRoom,
    pickTeam,
    recordScore,
    leaveRoom,
  };
}

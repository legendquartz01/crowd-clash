import type { ComponentType } from 'react';

export type GameState =
  | 'LOBBY'
  | 'TEAM_SELECT'
  | 'GAME_INTRO'
  | 'GAME_ACTIVE'
  | 'ROUND_END'
  | 'FINAL_WINNER';

export type TeamId = 'red' | 'white';

export interface RoomMeta {
  state: GameState;
  currentGameId: string | null;
  gamePlaylist: string[];
  currentRoundIndex: number;
  roundDurationSec: number;
  roundEndsAt: number | null;
}

export interface TeamScore {
  totalScore: number;
  roundScore: number;
}

export interface TeamsState {
  red: TeamScore;
  white: TeamScore;
}

export interface PlayerRecord {
  id: string;
  name: string;
  team: TeamId | null;
  totalScore: number;
  roundScore: number;
  online: boolean;
}

export interface RoomState {
  meta: RoomMeta;
  teams: TeamsState;
  players: Record<string, PlayerRecord>;
}

export interface PresencePayload {
  playerId: string;
  name: string;
  team: TeamId | null;
}

// Broadcast Event Payloads
export interface StateSyncPayload {
  meta: RoomMeta;
  teams: TeamsState;
  players: Record<string, PlayerRecord>;
}

export interface PlayerJoinPayload {
  playerId: string;
  name: string;
  team: TeamId | null;
}

export interface TeamPickPayload {
  playerId: string;
  team: TeamId;
}

export interface ScoreDeltaPayload {
  playerId: string;
  team: TeamId;
  delta: number;
}

export interface ScoreUpdatePayload {
  teams: TeamsState;
  players: Record<string, PlayerRecord>;
}

export type RealtimeEventMap = {
  STATE_SYNC: StateSyncPayload;
  PLAYER_JOIN: PlayerJoinPayload;
  TEAM_PICK: TeamPickPayload;
  SCORE_DELTA: ScoreDeltaPayload;
  SCORE_UPDATE: ScoreUpdatePayload;
};

export type RealtimeEventName = keyof RealtimeEventMap;

// Modular Mini-Game Plugin Contract
export interface MiniGameProps {
  onScore: (points: number) => void; // adds or subtracts points
  team: 'red' | 'white';
  timeLeft: number; // seconds remaining
  isActive: boolean;
}

export interface MiniGameDefinition {
  id: string;
  title: string;
  tagline: string;
  rules: string;
  durationSec: number;
  icon: 'flame' | 'palette' | 'crosshair' | 'zap';
  accent: string;
  throttleMs: number;
  component: ComponentType<MiniGameProps>;
}

export type TransportMode = 'supabase' | 'local-demo';
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

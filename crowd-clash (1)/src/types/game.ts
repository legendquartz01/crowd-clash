import type { ComponentType } from 'react';

export type GameMode = 'arcade' | 'imposter';

export type GameState =
  | 'LOBBY'
  | 'TEAM_SELECT'
  | 'GAME_INTRO'
  | 'COUNTDOWN'
  | 'GAME_ACTIVE'
  | 'ROUND_END'
  | 'FINAL_WINNER'
  | 'IMPOSTER_ACTIVE';

export type TeamId = 'red' | 'white';

export type ImposterPlayStyle = 'voice' | 'silent';

export type ImposterPhase = 'ROLE_REVEAL' | 'WRITING' | 'DISCUSSION' | 'VOTING' | 'REVEAL';

export type ClueReactionType = 'sus' | 'caught';

export interface ImposterSettings {
  playStyle: ImposterPlayStyle;
  writingTimeSec: number; // Silent Mode: 15..90 step 5, default 30
  voiceDiscussionSec: number; // Voice Mode: 20..300 step 10, default 90
  silentDiscussionSec: number; // Silent Mode: 20..300 step 10, default 30
  votingTimeSec: number; // 15..90 step 5, default 30
  imposterCountOverride: number | null; // null = auto (1, or 2 if 8+ players)
}

export interface ImposterRoundState {
  phase: ImposterPhase;
  roundNumber: number;
  category: string;
  secretWord: string;
  imposterIds: string[];
  starterPlayerId: string | null;
  phaseEndsAt: number | null;
  clues: Record<string, string>; // playerId -> submitted clue
  reactions: Record<string, Record<string, ClueReactionType>>; // targetPlayerId -> { reactorId: reaction }
  votes: Record<string, string>; // voterId -> targetPlayerId
  eliminatedPlayerId: string | null;
  wasTie: boolean;
  winner: 'crew' | 'imposter' | null;
}

export interface ImposterState {
  settings: ImposterSettings;
  usedWords: string[];
  round: ImposterRoundState | null;
}

export interface RoomMeta {
  state: GameState;
  gameMode: GameMode;
  currentGameId: string | null;
  gamePlaylist: string[];
  currentRoundIndex: number;
  roundDurationSec: number;
  countdownEndsAt: number | null;
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
  imposter: ImposterState;
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
  imposter: ImposterState;
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

export interface ImposterCluePayload {
  playerId: string;
  clue: string;
}

export interface ImposterReactPayload {
  reactorId: string;
  targetPlayerId: string;
  reaction: ClueReactionType;
}

export interface ImposterVotePayload {
  voterId: string;
  targetPlayerId: string;
}

export type RealtimeEventMap = {
  STATE_SYNC: StateSyncPayload;
  PLAYER_JOIN: PlayerJoinPayload;
  TEAM_PICK: TeamPickPayload;
  SCORE_DELTA: ScoreDeltaPayload;
  SCORE_UPDATE: ScoreUpdatePayload;
  IMPOSTER_CLUE: ImposterCluePayload;
  IMPOSTER_REACT: ImposterReactPayload;
  IMPOSTER_VOTE: ImposterVotePayload;
};

export type RealtimeEventName = keyof RealtimeEventMap;

// Modular Mini-Game Plugin Contract
export interface MiniGameProps {
  onScore: (points: number) => void; // adds or subtracts points
  team: 'red' | 'white';
  timeLeft: number; // seconds remaining
  isActive: boolean;
}

export type GameIconId =
  | 'flame'
  | 'eye'
  | 'palette'
  | 'zap'
  | 'hand'
  | 'check'
  | 'sparkles'
  | 'crosshair';

export interface MiniGameDefinition {
  id: string;
  title: string;
  tagline: string;
  rules: string;
  durationSec: number;
  icon: GameIconId;
  accent: string;
  throttleMs: number;
  component: ComponentType<MiniGameProps>;
}

export type TransportMode = 'supabase' | 'local-demo';
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

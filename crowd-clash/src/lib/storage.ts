import type { RoomState, TeamId } from '../types/game';

const HOST_SESSION_KEY = 'crowd_clash_host_session_v1';
const PLAYER_SESSION_KEY = 'crowd_clash_player_session_v1';

// Exclude easily confused characters (I, O) so codes read effortlessly from a projector
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateRoomCode(length = 4): string {
  let code = '';
  const values = new Uint32Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < length; i++) {
      values[i] = Math.floor(Math.random() * 10000);
    }
  }
  for (let i = 0; i < length; i++) {
    code += ROOM_ALPHABET[values[i] % ROOM_ALPHABET.length];
  }
  return code;
}

export function normalizeRoomCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
}

export function generatePlayerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface HostPersistedSession {
  roomCode: string;
  state: RoomState;
  savedAt: number;
}

export function loadHostSession(): HostPersistedSession | null {
  try {
    const raw = sessionStorage.getItem(HOST_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HostPersistedSession;
    if (!parsed?.roomCode || !parsed?.state?.meta) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveHostSession(roomCode: string, state: RoomState): void {
  try {
    const payload: HostPersistedSession = {
      roomCode,
      state,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(HOST_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota/private-mode storage errors
  }
}

export function clearHostSession(): void {
  try {
    sessionStorage.removeItem(HOST_SESSION_KEY);
  } catch {
    // Ignore
  }
}

export interface PlayerPersistedSession {
  roomCode: string;
  playerId: string;
  name: string;
  team: TeamId | null;
}

export function loadPlayerSession(): PlayerPersistedSession | null {
  try {
    const raw = localStorage.getItem(PLAYER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerPersistedSession;
    if (!parsed?.roomCode || !parsed?.playerId || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePlayerSession(session: PlayerPersistedSession): void {
  try {
    localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore
  }
}

export function clearPlayerSession(): void {
  try {
    localStorage.removeItem(PLAYER_SESSION_KEY);
  } catch {
    // Ignore
  }
}

import type { RoomState, TeamId } from '../types/game';

const HOST_SESSION_KEY = 'crowd_clash_host_session_v1';
const HOST_ROOM_CODE_KEY = 'crowd_clash_host_room_code_v1';
const PLAYER_SESSION_KEY = 'crowd_clash_player_session_v1';
const PLAYER_LAST_PROFILE_KEY = 'crowd_clash_player_last_profile_v1';

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

// ---------------- Host Persistence (sessionStorage + localStorage) ----------------

export interface HostPersistedSession {
  roomCode: string;
  state: RoomState;
  savedAt: number;
}

export function loadHostRoomCode(): string | null {
  try {
    const raw = localStorage.getItem(HOST_ROOM_CODE_KEY);
    if (!raw) return null;
    const clean = normalizeRoomCode(raw);
    return clean.length === 4 ? clean : null;
  } catch {
    return null;
  }
}

export function saveHostRoomCode(roomCode: string): void {
  try {
    const clean = normalizeRoomCode(roomCode);
    if (clean.length === 4) {
      localStorage.setItem(HOST_ROOM_CODE_KEY, clean);
    }
  } catch {
    // Ignore storage errors
  }
}

export function loadHostSession(): HostPersistedSession | null {
  try {
    const raw = sessionStorage.getItem(HOST_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HostPersistedSession;
      if (parsed?.roomCode && parsed?.state?.meta) {
        saveHostRoomCode(parsed.roomCode);
        return parsed;
      }
    }
  } catch {
    // Fall through to localStorage
  }

  // Fallback to localStorage mirror so full browser restarts still restore the room state
  try {
    const rawLocal = localStorage.getItem(HOST_SESSION_KEY);
    if (!rawLocal) return null;
    const parsed = JSON.parse(rawLocal) as HostPersistedSession;
    if (!parsed?.roomCode || !parsed?.state?.meta) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveHostSession(roomCode: string, state: RoomState): void {
  saveHostRoomCode(roomCode);
  const payload: HostPersistedSession = {
    roomCode,
    state,
    savedAt: Date.now(),
  };
  const serialized = JSON.stringify(payload);
  try {
    sessionStorage.setItem(HOST_SESSION_KEY, serialized);
  } catch {
    // Ignore
  }
  try {
    localStorage.setItem(HOST_SESSION_KEY, serialized);
  } catch {
    // Ignore
  }
}

export function clearHostSession(): void {
  try {
    sessionStorage.removeItem(HOST_SESSION_KEY);
  } catch {
    // Ignore
  }
  try {
    localStorage.removeItem(HOST_SESSION_KEY);
    localStorage.removeItem(HOST_ROOM_CODE_KEY);
  } catch {
    // Ignore
  }
}

// ---------------- Player Persistence & 1-Tap Rejoin (localStorage) ----------------

export interface PlayerPersistedSession {
  roomCode: string;
  playerId: string;
  name: string;
  team: TeamId | null;
}

export interface PlayerLastProfile {
  roomCode: string;
  playerId: string;
  name: string;
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

export function loadPlayerLastProfile(): PlayerLastProfile | null {
  try {
    const raw = localStorage.getItem(PLAYER_LAST_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlayerLastProfile;
      if (parsed?.roomCode && parsed?.name && parsed?.playerId) return parsed;
    }
  } catch {
    // Fall back to active session if available
  }
  const active = loadPlayerSession();
  if (!active) return null;
  return {
    roomCode: active.roomCode,
    playerId: active.playerId,
    name: active.name,
  };
}

export function savePlayerSession(session: PlayerPersistedSession): void {
  try {
    localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(session));
    const profile: PlayerLastProfile = {
      roomCode: session.roomCode,
      playerId: session.playerId,
      name: session.name,
    };
    localStorage.setItem(PLAYER_LAST_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

export function clearPlayerSession(): void {
  try {
    // Clear active auto-connect session while preserving lastProfile for 1-tap Rejoin
    localStorage.removeItem(PLAYER_SESSION_KEY);
  } catch {
    // Ignore
  }
}

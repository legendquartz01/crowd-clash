import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  ConnectionStatus,
  PresencePayload,
  RealtimeEventMap,
  RealtimeEventName,
  TransportMode,
} from '../types/game';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export interface PresenceSnapshot {
  onlinePlayerIds: string[];
  entries: PresencePayload[];
}

export interface RoomChannelOptions {
  roomCode: string;
  clientId: string;
  onStatusChange?: (status: ConnectionStatus) => void;
  onPresenceChange?: (snapshot: PresenceSnapshot) => void;
}

export interface RoomChannelAdapter {
  readonly mode: TransportMode;
  on<E extends RealtimeEventName>(
    event: E,
    handler: (payload: RealtimeEventMap[E]) => void
  ): () => void;
  broadcast<E extends RealtimeEventName>(event: E, payload: RealtimeEventMap[E]): Promise<void>;
  track(presence: PresencePayload): Promise<void>;
  subscribe(): void;
  unsubscribe(): Promise<void>;
}

/**
 * Primary production adapter using Supabase Realtime Broadcast + Presence
 * on channel `room:{roomCode}` with `{ broadcast: { self: false }, presence: { key: clientId } }`.
 */
class SupabaseRoomAdapter implements RoomChannelAdapter {
  readonly mode: TransportMode = 'supabase';
  private channel: RealtimeChannel;
  private listeners = new Map<RealtimeEventName, Set<(payload: unknown) => void>>();
  private onStatusChange?: (status: ConnectionStatus) => void;
  private onPresenceChange?: (snapshot: PresenceSnapshot) => void;
  private pendingPresence: PresencePayload | null = null;
  private isSubscribed = false;

  constructor(options: RoomChannelOptions) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase client is not configured');
    }
    this.onStatusChange = options.onStatusChange;
    this.onPresenceChange = options.onPresenceChange;

    this.channel = supabase.channel(`room:${options.roomCode}`, {
      config: {
        broadcast: { self: false },
        presence: { key: options.clientId },
      },
    });

    const events: RealtimeEventName[] = [
      'STATE_SYNC',
      'PLAYER_JOIN',
      'TEAM_PICK',
      'SCORE_DELTA',
      'SCORE_UPDATE',
      'IMPOSTER_CLUE',
      'IMPOSTER_REACT',
      'IMPOSTER_VOTE',
    ];

    for (const evt of events) {
      this.channel.on('broadcast', { event: evt }, ({ payload }) => {
        const handlers = this.listeners.get(evt);
        if (!handlers) return;
        for (const handler of handlers) {
          handler(payload);
        }
      });
    }

    const emitPresence = () => {
      if (!this.onPresenceChange) return;
      const rawState = this.channel.presenceState<PresencePayload>();
      const byId = new Map<string, PresencePayload>();
      for (const metas of Object.values(rawState)) {
        for (const meta of metas) {
          if (meta && typeof meta.playerId === 'string') {
            byId.set(meta.playerId, {
              playerId: meta.playerId,
              name: meta.name,
              team: meta.team ?? null,
            });
          }
        }
      }
      this.onPresenceChange({
        onlinePlayerIds: Array.from(byId.keys()),
        entries: Array.from(byId.values()),
      });
    };

    this.channel
      .on('presence', { event: 'sync' }, emitPresence)
      .on('presence', { event: 'join' }, emitPresence)
      .on('presence', { event: 'leave' }, emitPresence);
  }

  on<E extends RealtimeEventName>(
    event: E,
    handler: (payload: RealtimeEventMap[E]) => void
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const wrapped = handler as (payload: unknown) => void;
    set.add(wrapped);
    return () => {
      set?.delete(wrapped);
    };
  }

  async broadcast<E extends RealtimeEventName>(
    event: E,
    payload: RealtimeEventMap[E]
  ): Promise<void> {
    if (!this.isSubscribed) return;
    await this.channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }

  async track(presence: PresencePayload): Promise<void> {
    this.pendingPresence = presence;
    if (!this.isSubscribed) return;
    await this.channel.track(presence);
  }

  subscribe(): void {
    this.onStatusChange?.('connecting');
    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        this.isSubscribed = true;
        this.onStatusChange?.('connected');
        if (this.pendingPresence) {
          await this.channel.track(this.pendingPresence);
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        this.isSubscribed = false;
        this.onStatusChange?.('reconnecting');
      } else if (status === 'CLOSED') {
        this.isSubscribed = false;
      }
    });
  }

  async unsubscribe(): Promise<void> {
    this.isSubscribed = false;
    this.listeners.clear();
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.removeChannel(this.channel);
    } else {
      await this.channel.unsubscribe();
    }
  }
}

/**
 * Local Multi-Tab Demo fallback using browser BroadcastChannel when
 * VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not yet configured.
 * Mirrors the exact Broadcast + Presence semantics across tabs on the same origin.
 */
interface LocalEnvelope {
  kind: 'broadcast' | 'presence_ping' | 'presence_leave' | 'presence_query';
  senderId: string;
  event?: RealtimeEventName;
  payload?: unknown;
  presence?: PresencePayload;
}

class LocalDemoRoomAdapter implements RoomChannelAdapter {
  readonly mode: TransportMode = 'local-demo';
  private bc: BroadcastChannel | null = null;
  private clientId: string;
  private listeners = new Map<RealtimeEventName, Set<(payload: unknown) => void>>();
  private presenceMap = new Map<string, { data: PresencePayload; lastSeen: number }>();
  private myPresence: PresencePayload | null = null;
  private onStatusChange?: (status: ConnectionStatus) => void;
  private onPresenceChange?: (snapshot: PresenceSnapshot) => void;
  private heartbeatTimer: number | null = null;
  private pruneTimer: number | null = null;
  private roomName: string;

  constructor(options: RoomChannelOptions) {
    this.clientId = options.clientId;
    this.roomName = `room:${options.roomCode}`;
    this.onStatusChange = options.onStatusChange;
    this.onPresenceChange = options.onPresenceChange;
  }

  private emitPresenceSnapshot(): void {
    if (!this.onPresenceChange) return;
    const entries = Array.from(this.presenceMap.values()).map((v) => v.data);
    this.onPresenceChange({
      onlinePlayerIds: entries.map((e) => e.playerId),
      entries,
    });
  }

  on<E extends RealtimeEventName>(
    event: E,
    handler: (payload: RealtimeEventMap[E]) => void
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const wrapped = handler as (payload: unknown) => void;
    set.add(wrapped);
    return () => {
      set?.delete(wrapped);
    };
  }

  async broadcast<E extends RealtimeEventName>(
    event: E,
    payload: RealtimeEventMap[E]
  ): Promise<void> {
    const msg: LocalEnvelope = {
      kind: 'broadcast',
      senderId: this.clientId,
      event,
      payload,
    };
    this.bc?.postMessage(msg);
  }

  async track(presence: PresencePayload): Promise<void> {
    this.myPresence = presence;
    this.bc?.postMessage({
      kind: 'presence_ping',
      senderId: this.clientId,
      presence,
    } satisfies LocalEnvelope);
  }

  subscribe(): void {
    this.onStatusChange?.('connecting');
    if (typeof BroadcastChannel === 'undefined') {
      this.onStatusChange?.('error');
      return;
    }

    this.bc = new BroadcastChannel(this.roomName);
    this.bc.onmessage = (e: MessageEvent<LocalEnvelope>) => {
      const msg = e.data;
      if (!msg || msg.senderId === this.clientId) return; // broadcast.self = false

      if (msg.kind === 'broadcast' && msg.event) {
        const handlers = this.listeners.get(msg.event);
        if (handlers) {
          for (const handler of handlers) {
            handler(msg.payload);
          }
        }
      } else if (msg.kind === 'presence_ping' && msg.presence) {
        this.presenceMap.set(msg.presence.playerId, {
          data: msg.presence,
          lastSeen: Date.now(),
        });
        this.emitPresenceSnapshot();
      } else if (msg.kind === 'presence_leave' && msg.presence) {
        this.presenceMap.delete(msg.presence.playerId);
        this.emitPresenceSnapshot();
      } else if (msg.kind === 'presence_query' && this.myPresence) {
        this.bc?.postMessage({
          kind: 'presence_ping',
          senderId: this.clientId,
          presence: this.myPresence,
        } satisfies LocalEnvelope);
      }
    };

    // Ask existing peers to report presence & start heartbeat
    this.bc.postMessage({
      kind: 'presence_query',
      senderId: this.clientId,
    } satisfies LocalEnvelope);

    if (this.myPresence) {
      void this.track(this.myPresence);
    }

    this.heartbeatTimer = window.setInterval(() => {
      if (this.myPresence) {
        this.bc?.postMessage({
          kind: 'presence_ping',
          senderId: this.clientId,
          presence: this.myPresence,
        } satisfies LocalEnvelope);
      }
    }, 2000);

    this.pruneTimer = window.setInterval(() => {
      const now = Date.now();
      let removed = false;
      for (const [key, value] of this.presenceMap.entries()) {
        if (now - value.lastSeen > 6500) {
          this.presenceMap.delete(key);
          removed = true;
        }
      }
      if (removed) {
        this.emitPresenceSnapshot();
      }
    }, 2500);

    window.addEventListener('beforeunload', this.handleUnload);
    this.onStatusChange?.('connected');
  }

  private handleUnload = () => {
    if (this.myPresence && this.bc) {
      this.bc.postMessage({
        kind: 'presence_leave',
        senderId: this.clientId,
        presence: this.myPresence,
      } satisfies LocalEnvelope);
    }
  };

  async unsubscribe(): Promise<void> {
    window.removeEventListener('beforeunload', this.handleUnload);
    this.handleUnload();
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pruneTimer !== null) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
    this.listeners.clear();
    this.presenceMap.clear();
    this.bc?.close();
    this.bc = null;
  }
}

export function createRoomChannel(options: RoomChannelOptions): RoomChannelAdapter {
  if (isSupabaseConfigured) {
    return new SupabaseRoomAdapter(options);
  }
  return new LocalDemoRoomAdapter(options);
}

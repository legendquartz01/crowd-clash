import { Radio, Wifi, WifiOff } from 'lucide-react';
import type { ConnectionStatus, TransportMode } from '../types/game';

interface ConnectionBadgeProps {
  status: ConnectionStatus;
  mode: TransportMode;
  variant?: 'dark' | 'light';
}

export function ConnectionBadge({ status, mode, variant = 'dark' }: ConnectionBadgeProps) {
  const isConnected = status === 'connected';
  const isLocal = mode === 'local-demo';

  const base =
    variant === 'dark'
      ? 'border-white/10 bg-white/5 text-slate-300'
      : 'border-slate-200 bg-white/80 text-slate-700';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${base}`}
      title={
        isLocal
          ? 'Running in Local Multi-Tab Demo Mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env for live crowd sync across phones.'
          : 'Connected via Supabase Realtime Broadcast & Presence'
      }
    >
      {status === 'error' ? (
        <WifiOff className="h-3.5 w-3.5 text-rose-400" />
      ) : isLocal ? (
        <Radio className={`h-3.5 w-3.5 ${isConnected ? 'text-amber-400' : 'text-slate-400'}`} />
      ) : (
        <Wifi className={`h-3.5 w-3.5 ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
      )}
      <span>
        {status === 'connecting'
          ? 'Connecting…'
          : status === 'reconnecting'
            ? 'Reconnecting…'
            : status === 'error'
              ? 'Offline'
              : isLocal
                ? 'Local Demo Sync'
                : 'Supabase Live'}
      </span>
    </div>
  );
}

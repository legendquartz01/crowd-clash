import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Flame } from 'lucide-react';
import type { MiniGameProps } from '../types/game';

interface FloatingSpark {
  id: number;
  x: number;
  y: number;
  label: string;
}

export function TugOfWarGame({ onScore, team, isActive }: MiniGameProps) {
  const [tapCount, setTapCount] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [sparks, setSparks] = useState<FloatingSpark[]>([]);
  const [tapsPerSec, setTapsPerSec] = useState(0);
  const tapTimestampsRef = useRef<number[]>([]);
  const sparkIdRef = useRef(0);

  // Measure live tap cadence every 200ms
  useEffect(() => {
    if (!isActive) return;
    const interval = window.setInterval(() => {
      const cutoff = Date.now() - 1000;
      tapTimestampsRef.current = tapTimestampsRef.current.filter((t) => t > cutoff);
      setTapsPerSec(tapTimestampsRef.current.length);
    }, 200);
    return () => clearInterval(interval);
  }, [isActive]);

  const handlePull = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!isActive) return;
      e.preventDefault();

      const now = Date.now();
      tapTimestampsRef.current.push(now);
      setTapCount((prev) => prev + 1);
      setIsPressed(true);
      onScore(1);

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const id = ++sparkIdRef.current;

      setSparks((prev) => [...prev.slice(-10), { id, x: Math.max(15, Math.min(85, x)), y: Math.max(15, Math.min(80, y)), label: '+1' }]);

      window.setTimeout(() => {
        setIsPressed(false);
      }, 75);

      window.setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== id));
      }, 620);
    },
    [isActive, onScore]
  );

  const intensity = Math.min(100, Math.round((tapsPerSec / 10) * 100));
  const isRed = team === 'red';

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-5 py-2 select-none">
      {/* Speed / Heat Meter */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex items-center justify-between text-xs font-bold tracking-wider uppercase">
          <span className={isRed ? 'text-rose-100/80' : 'text-slate-600'}>Pull Cadence</span>
          <span className={`font-mono-num flex items-center gap-1 ${isRed ? 'text-amber-300' : 'text-amber-600'}`}>
            <Flame className="h-3.5 w-3.5" />
            {tapsPerSec} / sec
          </span>
        </div>
        <div
          className={`h-3 w-full overflow-hidden rounded-full ${
            isRed ? 'bg-black/30' : 'bg-slate-200'
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              intensity >= 75
                ? 'bg-amber-400'
                : isRed
                  ? 'bg-white'
                  : 'bg-slate-900'
            }`}
            style={{ width: `${Math.max(6, intensity)}%` }}
          />
        </div>
      </div>

      {/* Main Kinetic Pull Button */}
      <div className="relative flex w-full max-w-md flex-1 items-center justify-center">
        <button
          id="tug-pull-button"
          type="button"
          disabled={!isActive}
          onPointerDown={handlePull}
          className={`relative flex aspect-square w-full max-w-[290px] flex-col items-center justify-center overflow-hidden rounded-full border-4 transition-transform duration-75 focus:outline-none ${
            isPressed ? 'scale-[0.94]' : 'scale-100 hover:scale-[1.015]'
          } ${
            isRed
              ? 'border-white/90 bg-white text-rose-700 shadow-[0_18px_0_rgba(127,16,30,0.65),0_28px_50px_rgba(0,0,0,0.35)] active:shadow-[0_6px_0_rgba(127,16,30,0.65)]'
              : 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_0_rgba(148,163,184,0.7),0_28px_50px_rgba(15,23,42,0.22)] active:shadow-[0_6px_0_rgba(148,163,184,0.7)]'
          } disabled:opacity-50`}
        >
          {/* Inner braided ring */}
          <div
            className={`pointer-events-none absolute inset-3 rounded-full border-2 border-dashed ${
              isRed ? 'border-rose-300/80' : 'border-slate-600/80'
            }`}
          />

          <span className="font-display pointer-events-none text-4xl font-bold tracking-tight">
            PULL!
          </span>
          <span
            className={`pointer-events-none mt-1 text-xs font-bold tracking-[0.2em] uppercase ${
              isRed ? 'text-rose-500' : 'text-slate-400'
            }`}
          >
            Tap Rapidly
          </span>

          {/* Floating +1 Sparks */}
          {sparks.map((spark) => (
            <span
              key={spark.id}
              style={{ left: `${spark.x}%`, top: `${spark.y}%` }}
              className={`animate-float-up font-mono-num pointer-events-none absolute text-2xl font-extrabold ${
                isRed ? 'text-rose-600' : 'text-amber-300'
              }`}
            >
              {spark.label}
            </span>
          ))}
        </button>
      </div>

      {/* Bottom Pull Counter */}
      <div
        className={`flex w-full max-w-md items-center justify-between rounded-2xl px-5 py-3.5 ${
          isRed ? 'bg-black/25 text-white' : 'bg-slate-900/5 text-slate-900'
        }`}
      >
        <span className="text-sm font-semibold opacity-80">Your Pulls</span>
        <span className="font-mono-num text-2xl font-extrabold">{tapCount}</span>
      </div>
    </div>
  );
}

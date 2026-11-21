import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Hand, OctagonAlert, Zap } from 'lucide-react';
import type { MiniGameProps } from '../types/game';

type LightPhase = 'green' | 'red';

interface FloatingHit {
  id: number;
  x: number;
  y: number;
  label: string;
  penalty: boolean;
}

// Fair human reaction grace window (ms) right after flipping GREEN -> RED
const RED_GRACE_MS = 220;

export function RedLightTapGame({ onScore, isActive }: MiniGameProps) {
  const [phase, setPhase] = useState<LightPhase>('green');
  const [hits, setHits] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [shakeToken, setShakeToken] = useState(0);
  const [sparks, setSparks] = useState<FloatingHit[]>([]);

  const phaseRef = useRef<LightPhase>('green');
  const redStartedAtRef = useRef<number>(0);
  const sparkIdRef = useRef<number>(0);

  // Drive randomized GREEN / RED phase switches only while active
  useEffect(() => {
    if (!isActive) return;

    let timerId: number | null = null;
    let cancelled = false;

    const scheduleNext = (current: LightPhase) => {
      if (cancelled) return;
      // GREEN lasts 1.7s - 3.3s, RED lasts 1.1s - 2.1s
      const delay =
        current === 'green'
          ? 1700 + Math.floor(Math.random() * 1600)
          : 1100 + Math.floor(Math.random() * 1000);

      timerId = window.setTimeout(() => {
        if (cancelled) return;
        const next: LightPhase = current === 'green' ? 'red' : 'green';
        phaseRef.current = next;
        if (next === 'red') {
          redStartedAtRef.current = Date.now();
        }
        setPhase(next);
        scheduleNext(next);
      }, delay);
    };

    scheduleNext(phaseRef.current);

    return () => {
      cancelled = true;
      if (timerId !== null) {
        clearTimeout(timerId);
      }
    };
  }, [isActive]);

  const handleTap = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!isActive) return;

      setIsPressed(true);
      window.setTimeout(() => setIsPressed(false), 70);

      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(15, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(15, Math.min(80, ((e.clientY - rect.top) / rect.height) * 100));
      const id = ++sparkIdRef.current;

      if (phaseRef.current === 'green') {
        setHits((prev) => prev + 1);
        onScore(2);
        setSparks((prev) => [...prev.slice(-8), { id, x, y, label: '+2', penalty: false }]);
      } else {
        // Ignore split-second accidental taps within 220ms of the color flip
        if (Date.now() - redStartedAtRef.current < RED_GRACE_MS) {
          return;
        }
        setPenalties((prev) => prev + 1);
        setShakeToken((t) => t + 1);
        onScore(-10);
        setSparks((prev) => [...prev.slice(-8), { id, x, y, label: '-10', penalty: true }]);
      }

      window.setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== id));
      }, 600);
    },
    [isActive, onScore]
  );

  const isGreen = phase === 'green';

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-3.5 py-1 select-none">
      {/* Status Banner */}
      <div
        className={`flex w-full max-w-md items-center justify-between rounded-2xl border px-4 py-3 text-white shadow-lg transition-colors duration-150 ${
          isGreen
            ? 'border-emerald-400/50 bg-emerald-950/80'
            : 'border-rose-500/70 bg-rose-950/90'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`h-3.5 w-3.5 rounded-full ${
              isGreen
                ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                : 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
            }`}
          />
          <span className="font-display text-base font-bold tracking-wide uppercase">
            {isGreen ? 'GREEN LIGHT — MASH!' : 'RED LIGHT — FREEZE!'}
          </span>
        </div>
        <span className="font-mono-num text-xs font-extrabold opacity-80">
          {isGreen ? '+2 / tap' : '-10 penalty'}
        </span>
      </div>

      {/* Giant Mash / Freeze Arena */}
      <div
        key={shakeToken > 0 ? `freeze-hit-${shakeToken}` : 'arena'}
        className={`relative flex w-full max-w-md flex-1 items-center justify-center rounded-3xl border-2 p-5 shadow-2xl transition-colors duration-100 ${
          shakeToken > 0 && !isGreen ? 'animate-shake' : ''
        } ${
          isGreen
            ? 'border-emerald-400/60 bg-[#071D15]'
            : 'border-rose-500 bg-[#26070C]'
        }`}
      >
        <button
          id="red-light-tap-btn"
          type="button"
          disabled={!isActive}
          onPointerDown={handleTap}
          className={`relative flex aspect-square w-full max-w-[280px] flex-col items-center justify-center overflow-hidden rounded-full border-4 transition-transform duration-75 focus:outline-none disabled:opacity-50 ${
            isPressed ? 'scale-[0.93]' : 'scale-100'
          } ${
            isGreen
              ? 'border-emerald-200 bg-emerald-500 text-slate-950 shadow-[0_16px_0_#047857,0_25px_50px_rgba(16,185,129,0.35)] active:shadow-[0_6px_0_#047857]'
              : 'border-rose-300 bg-[#E63946] text-white shadow-[0_16px_0_#881322,0_25px_50px_rgba(230,57,70,0.45)]'
          }`}
        >
          {isGreen ? (
            <>
              <Zap className="pointer-events-none h-12 w-12 fill-slate-950 stroke-[2]" />
              <span className="font-display pointer-events-none mt-2 text-4xl font-bold tracking-tight">
                TAP FAST!
              </span>
              <span className="pointer-events-none mt-1 text-xs font-extrabold tracking-[0.2em] uppercase opacity-75">
                Keep Going
              </span>
            </>
          ) : (
            <>
              <Hand className="pointer-events-none h-12 w-12 stroke-[2.2]" />
              <span className="font-display pointer-events-none mt-2 text-4xl font-bold tracking-tight">
                FREEZE!
              </span>
              <span className="pointer-events-none mt-1 inline-flex items-center gap-1 text-xs font-extrabold tracking-[0.18em] text-rose-100 uppercase">
                <OctagonAlert className="h-3.5 w-3.5" />
                Hands Off (-10)
              </span>
            </>
          )}

          {/* Floating Sparks */}
          {sparks.map((spark) => (
            <span
              key={spark.id}
              style={{ left: `${spark.x}%`, top: `${spark.y}%` }}
              className={`animate-float-up font-mono-num pointer-events-none absolute text-2xl font-extrabold ${
                spark.penalty ? 'text-amber-300' : 'text-white drop-shadow'
              }`}
            >
              {spark.label}
            </span>
          ))}
        </button>
      </div>

      {/* Bottom Stats Strip */}
      <div className="flex w-full max-w-md items-center justify-between rounded-2xl border border-white/10 bg-[#121620] px-4 py-2.5 text-xs font-bold text-slate-300">
        <span>
          Clean Taps: <strong className="font-mono-num text-emerald-400">{hits}</strong>
        </span>
        <span>
          Freeze Penalties: <strong className="font-mono-num text-rose-400">{penalties}</strong>
        </span>
      </div>
    </div>
  );
}

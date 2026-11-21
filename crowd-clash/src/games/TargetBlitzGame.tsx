import { useCallback, useEffect, useRef, useState } from 'react';
import { Bomb, Crosshair, Star } from 'lucide-react';
import type { MiniGameProps } from '../types/game';

type CellKind = 'empty' | 'normal' | 'gold' | 'bomb';

interface CellState {
  kind: CellKind;
  token: number;
  expiresAt: number;
}

const GRID_SIZE = 9;

function createEmptyGrid(): CellState[] {
  return Array.from({ length: GRID_SIZE }, () => ({ kind: 'empty', token: 0, expiresAt: 0 }));
}

export function TargetBlitzGame({ onScore, team, isActive }: MiniGameProps) {
  const [cells, setCells] = useState<CellState[]>(createEmptyGrid);
  const [lastHit, setLastHit] = useState<{ index: number; delta: number; token: number } | null>(null);
  const tokenRef = useRef(1);

  // Spawn & expire targets on a tight loop
  useEffect(() => {
    if (!isActive) return;

    const tick = () => {
      const now = Date.now();
      setCells((prev) => {
        const next = prev.map((cell) =>
          cell.kind !== 'empty' && cell.expiresAt <= now
            ? { kind: 'empty' as const, token: 0, expiresAt: 0 }
            : cell
        );

        const activeCount = next.filter((c) => c.kind !== 'empty').length;
        if (activeCount < 3) {
          const emptyIndices = next
            .map((c, idx) => (c.kind === 'empty' ? idx : -1))
            .filter((idx) => idx !== -1);

          if (emptyIndices.length > 0) {
            const pickIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            const roll = Math.random();
            let kind: CellKind = 'normal';
            let ttl = 1150;
            if (roll < 0.18) {
              kind = 'gold';
              ttl = 820;
            } else if (roll < 0.38) {
              kind = 'bomb';
              ttl = 1100;
            }
            next[pickIdx] = {
              kind,
              token: ++tokenRef.current,
              expiresAt: now + ttl,
            };
          }
        }
        return next;
      });
    };

    tick();
    const interval = window.setInterval(tick, 340);
    return () => clearInterval(interval);
  }, [isActive]);

  const handleTapCell = useCallback(
    (index: number) => {
      if (!isActive) return;
      const cell = cells[index];
      if (!cell || cell.kind === 'empty') return;

      const delta = cell.kind === 'gold' ? 15 : cell.kind === 'bomb' ? -10 : 5;
      onScore(delta);
      setLastHit({ index, delta, token: Date.now() });

      setCells((prev) =>
        prev.map((c, idx) => (idx === index ? { kind: 'empty', token: 0, expiresAt: 0 } : c))
      );
    },
    [cells, isActive, onScore]
  );

  const isRed = team === 'red';

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-4 py-1 select-none">
      {/* Legend */}
      <div
        className={`flex w-full max-w-md items-center justify-center gap-4 rounded-2xl px-4 py-2.5 text-xs font-bold ${
          isRed ? 'bg-black/25 text-white' : 'bg-slate-900/5 text-slate-800'
        }`}
      >
        <span className="flex items-center gap-1">
          <Crosshair className="h-3.5 w-3.5 text-emerald-400" /> +5
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> +15
        </span>
        <span className="flex items-center gap-1">
          <Bomb className="h-3.5 w-3.5 text-rose-400" /> -10
        </span>
      </div>

      {/* 3x3 Reflex Grid */}
      <div className="grid aspect-square w-full max-w-[340px] grid-cols-3 gap-3">
        {cells.map((cell, idx) => {
          const showPop = lastHit?.index === idx;
          return (
            <button
              key={idx}
              id={`blitz-cell-${idx}`}
              type="button"
              disabled={!isActive}
              onPointerDown={(e) => {
                e.preventDefault();
                handleTapCell(idx);
              }}
              className={`relative flex items-center justify-center rounded-2xl transition-all ${
                cell.kind === 'empty'
                  ? isRed
                    ? 'border border-white/15 bg-black/20'
                    : 'border border-slate-200 bg-slate-100'
                  : cell.kind === 'gold'
                    ? 'animate-target-pop border-b-4 border-amber-600 bg-amber-400 text-slate-950 shadow-lg active:scale-95'
                    : cell.kind === 'bomb'
                      ? 'animate-target-pop border-b-4 border-slate-950 bg-slate-800 text-rose-400 shadow-lg active:scale-95'
                      : 'animate-target-pop border-b-4 border-emerald-700 bg-emerald-500 text-white shadow-lg active:scale-95'
              }`}
            >
              {cell.kind === 'normal' && <Crosshair className="h-10 w-10 stroke-[2.5]" />}
              {cell.kind === 'gold' && <Star className="h-10 w-10 fill-slate-950 stroke-[2]" />}
              {cell.kind === 'bomb' && <Bomb className="h-10 w-10 stroke-[2.2]" />}

              {showPop && cell.kind === 'empty' && (
                <span
                  key={lastHit.token}
                  className={`animate-float-up font-mono-num pointer-events-none absolute top-1/2 left-1/2 text-lg font-extrabold ${
                    lastHit.delta > 0
                      ? isRed
                        ? 'text-amber-300'
                        : 'text-emerald-600'
                      : 'text-rose-500'
                  }`}
                >
                  {lastHit.delta > 0 ? `+${lastHit.delta}` : lastHit.delta}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p
        className={`text-center text-xs font-semibold ${
          isRed ? 'text-rose-100/80' : 'text-slate-500'
        }`}
      >
        Hit targets before they vanish — watch out for bombs!
      </p>
    </div>
  );
}

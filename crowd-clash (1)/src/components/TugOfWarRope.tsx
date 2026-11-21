interface TugOfWarRopeProps {
  redScore: number;
  whiteScore: number;
}

/**
 * Animated visual SVG Tug-of-War rope graphic for Host GAME_ACTIVE.
 * Positive delta for Red pulls the center marker LEFT; White pulls RIGHT.
 */
export function TugOfWarRope({ redScore, whiteScore }: TugOfWarRopeProps) {
  const total = redScore + whiteScore;
  const diff = whiteScore - redScore; // negative = Red leads (left), positive = White leads (right)
  // Smooth asymptotic tug position between 14% and 86%
  const scale = Math.max(25, total * 0.45);
  const normalized = Math.tanh(diff / scale); // -1 .. +1
  const knotPct = 50 + normalized * 34;

  const leader =
    redScore > whiteScore ? 'red' : whiteScore > redScore ? 'white' : 'tie';

  return (
    <div className="host-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
      {/* Team Score Headers */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E63946] font-display text-xl font-bold text-white shadow-lg shadow-rose-950/50">
            R
          </div>
          <div>
            <div className="text-xs font-bold tracking-[0.2em] text-rose-400 uppercase">
              Team Red
            </div>
            <div className="font-mono-num text-4xl font-extrabold text-white sm:text-5xl">
              {redScore.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="hidden text-center sm:block">
          <span
            className={`inline-block rounded-full px-3.5 py-1 text-xs font-extrabold tracking-[0.16em] uppercase ${
              leader === 'red'
                ? 'bg-rose-500/20 text-rose-300'
                : leader === 'white'
                  ? 'bg-white/15 text-white'
                  : 'bg-amber-500/15 text-amber-300'
            }`}
          >
            {leader === 'red'
              ? `Red pulls +${(redScore - whiteScore).toLocaleString()}`
              : leader === 'white'
                ? `White pulls +${(whiteScore - redScore).toLocaleString()}`
                : 'Dead Even!'}
          </span>
        </div>

        <div className="flex items-center gap-3.5 text-right">
          <div>
            <div className="text-xs font-bold tracking-[0.2em] text-slate-300 uppercase">
              Team White
            </div>
            <div className="font-mono-num text-4xl font-extrabold text-white sm:text-5xl">
              {whiteScore.toLocaleString()}
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8F9FB] font-display text-xl font-bold text-slate-950 shadow-lg">
            W
          </div>
        </div>
      </div>

      {/* Interactive Rope Arena */}
      <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D12]">
        {/* Left & Right Territory Zones */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[16%] border-r-2 border-dashed border-rose-500/50 bg-rose-600/15" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[16%] border-l-2 border-dashed border-slate-200/40 bg-white/10" />

        {/* Center Field Line */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/20" />
        <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
          Center
        </div>

        {/* Moving Rope Assembly */}
        <div
          className="absolute top-1/2 left-0 w-full -translate-y-1/2 transition-transform duration-200 ease-out"
          style={{ transform: `translate(${knotPct - 50}%, -50%)` }}
        >
          <svg
            viewBox="0 0 1000 80"
            className="h-16 w-full overflow-visible"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="rope-braid"
                width="26"
                height="18"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(24)"
              >
                <rect width="26" height="18" fill="#C9975B" />
                <line x1="0" y1="0" x2="0" y2="18" stroke="#8C5E2A" strokeWidth="7" />
                <line x1="13" y1="0" x2="13" y2="18" stroke="#E5BE87" strokeWidth="4" />
              </pattern>
            </defs>

            {/* Rope shadow */}
            <rect x="-350" y="34" width="1700" height="16" rx="8" fill="rgba(0,0,0,0.45)" />
            {/* Braided rope body */}
            <rect
              x="-350"
              y="30"
              width="1700"
              height="16"
              rx="8"
              fill="url(#rope-braid)"
              stroke="#6B441C"
              strokeWidth="2"
            />
            {/* Red side tape */}
            <rect x="405" y="27" width="16" height="22" rx="4" fill="#E63946" />
            {/* White side tape */}
            <rect x="579" y="27" width="16" height="22" rx="4" fill="#F8F9FB" />

            {/* Center Pennant Knot */}
            <g transform="translate(500, 38)">
              <polygon points="0,12 -16,40 16,40" fill="#F59E0B" />
              <circle r="15" fill="#FBBF24" stroke="#78350F" strokeWidth="3" />
              <circle r="5" fill="#78350F" />
            </g>
          </svg>
        </div>

        {/* Zone Labels */}
        <span className="pointer-events-none absolute bottom-2 left-3 text-[10px] font-extrabold tracking-[0.2em] text-rose-400 uppercase">
          Red Zone
        </span>
        <span className="pointer-events-none absolute right-3 bottom-2 text-[10px] font-extrabold tracking-[0.2em] text-slate-300 uppercase">
          White Zone
        </span>
      </div>
    </div>
  );
}

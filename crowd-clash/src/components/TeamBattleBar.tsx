interface TeamBattleBarProps {
  redScore: number;
  whiteScore: number;
  label?: string;
}

export function TeamBattleBar({
  redScore,
  whiteScore,
  label = 'Live Round Battle',
}: TeamBattleBarProps) {
  const total = redScore + whiteScore;
  const redPct = total === 0 ? 50 : Math.max(8, Math.min(92, (redScore / total) * 100));
  const whitePct = 100 - redPct;

  return (
    <div className="host-panel rounded-3xl p-6 sm:p-7">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-3.5 w-3.5 rounded-full bg-[#E63946]" />
          <div>
            <div className="text-xs font-bold tracking-[0.18em] text-rose-400 uppercase">
              Team Red
            </div>
            <div className="font-mono-num text-3xl font-extrabold text-white sm:text-5xl">
              {redScore.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="hidden text-xs font-bold tracking-[0.2em] text-slate-400 uppercase sm:block">
          {label}
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <div className="text-xs font-bold tracking-[0.18em] text-slate-300 uppercase">
              Team White
            </div>
            <div className="font-mono-num text-3xl font-extrabold text-white sm:text-5xl">
              {whiteScore.toLocaleString()}
            </div>
          </div>
          <span className="h-3.5 w-3.5 rounded-full bg-[#F8F9FB]" />
        </div>
      </div>

      {/* Split Progress Bar */}
      <div className="relative flex h-9 w-full overflow-hidden rounded-2xl bg-slate-900 p-1">
        <div
          className="flex items-center justify-start rounded-l-xl bg-[#E63946] px-3 transition-all duration-300 ease-out"
          style={{ width: `${redPct}%` }}
        >
          <span className="font-mono-num text-xs font-extrabold text-white">
            {Math.round(redPct)}%
          </span>
        </div>
        <div className="w-1 shrink-0 bg-[#0C0E12]" />
        <div
          className="flex items-center justify-end rounded-r-xl bg-[#F8F9FB] px-3 transition-all duration-300 ease-out"
          style={{ width: `${whitePct}%` }}
        >
          <span className="font-mono-num text-xs font-extrabold text-slate-950">
            {Math.round(whitePct)}%
          </span>
        </div>
      </div>
    </div>
  );
}

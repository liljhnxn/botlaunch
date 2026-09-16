"use client";

import { calculateProgress, formatEtherAmount } from "@/lib/format";

interface SaleProgressProps {
  totalRaised: bigint;
  softCap: bigint;
  hardCap: bigint;
}

export function SaleProgress({ totalRaised, softCap, hardCap }: SaleProgressProps) {
  const percent = calculateProgress(totalRaised, hardCap);
  const softCapPercent = calculateProgress(softCap, hardCap);
  const softCapReached = totalRaised >= softCap;

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Progress</span>
        <div className="flex items-center gap-2">
          {softCapReached && (
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Soft Cap Met
            </span>
          )}
          <span className="font-mono font-bold text-white">{percent.toFixed(1)}%</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-3 bg-surface rounded-full overflow-hidden border border-surface-border">
        {/* Soft cap indicator line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
          style={{ left: `${softCapPercent}%` }}
          title={`Soft Cap: ${formatEtherAmount(softCap)} BOT`}
        />

        {/* Fill Bar */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            softCapReached
              ? "bg-gradient-to-r from-emerald-500 via-primary to-cyan-300"
              : "bg-gradient-to-r from-purple-600 to-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Amounts */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <div>
          <span className="text-white font-semibold">{formatEtherAmount(totalRaised)}</span> BOT
        </div>
        <div className="text-right">
          <span className="text-white font-semibold">{formatEtherAmount(hardCap)}</span> BOT
        </div>
      </div>
    </div>
  );
}

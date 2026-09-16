"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { formatEtherAmount, getSaleStatus } from "@/lib/format";
import { SaleProgress } from "./SaleProgress";
import { Countdown } from "./Countdown";
import { Users, ArrowUpRight, Coins } from "lucide-react";
import BotTokenArtifact from "@/contracts/BotToken.json";

export interface SaleData {
  id: bigint;
  creator: `0x${string}`;
  token: `0x${string}`;
  tokenAmount: bigint;
  tokenPrice: bigint;
  softCap: bigint;
  hardCap: bigint;
  minContribution: bigint;
  maxContribution: bigint;
  startTime: bigint;
  endTime: bigint;
  totalRaised: bigint;
  finalized: boolean;
  successful: boolean;
}

interface SaleCardProps {
  sale: SaleData;
  participantCount?: bigint;
}

export function SaleCard({ sale, participantCount = 0n }: SaleCardProps) {
  // Read real token metadata directly from on-chain token contract
  const { data: tokenSymbol } = useReadContract({
    address: sale.token,
    abi: BotTokenArtifact.abi,
    functionName: "symbol",
  });

  const { data: tokenName } = useReadContract({
    address: sale.token,
    abi: BotTokenArtifact.abi,
    functionName: "name",
  });

  const status = getSaleStatus(sale);

  const statusBadge = {
    LIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    UPCOMING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    ENDED: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    SUCCESSFUL: "bg-primary/10 text-primary border-primary/30",
    FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  }[status];

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-all duration-300" />

      <div className="space-y-4">
        {/* Header: Token Info + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-surface border border-surface-border flex items-center justify-center font-mono font-bold text-lg text-primary shadow-sm group-hover:border-primary/40 transition-colors">
              {((tokenSymbol as string) || "TK").slice(0, 3)}
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-primary transition-colors flex items-center gap-1.5">
                <span>{(tokenSymbol as string) || `Sale #${sale.id.toString()}`}</span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[160px]">
                {(tokenName as string) || "Project Token"}
              </p>
            </div>
          </div>

          <span
            className={`text-[11px] font-mono font-semibold uppercase px-2.5 py-1 rounded-full border ${statusBadge}`}
          >
            {status}
          </span>
        </div>

        {/* Pricing Info */}
        <div className="grid grid-cols-2 gap-2 bg-surface/60 p-3 rounded-xl border border-surface-border/60">
          <div>
            <div className="text-[11px] text-slate-400">Token Price</div>
            <div className="font-mono text-xs font-semibold text-white mt-0.5 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-primary" />
              <span>{formatEtherAmount(sale.tokenPrice)} BOT</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Hard Cap</div>
            <div className="font-mono text-xs font-semibold text-white mt-0.5">
              {formatEtherAmount(sale.hardCap)} BOT
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <SaleProgress
          totalRaised={sale.totalRaised}
          softCap={sale.softCap}
          hardCap={sale.hardCap}
        />

        {/* Timing / Countdown */}
        <div className="pt-1 flex items-center justify-between text-xs border-t border-surface-border/40">
          <div className="flex items-center gap-1 text-slate-400 font-mono">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{participantCount.toString()} Backers</span>
          </div>

          {status === "UPCOMING" && (
            <Countdown targetTime={sale.startTime} label="Starts in" />
          )}
          {status === "LIVE" && (
            <Countdown targetTime={sale.endTime} label="Ends in" />
          )}
          {status === "ENDED" && (
            <span className="text-slate-400 font-mono">Awaiting Finalize</span>
          )}
          {status === "SUCCESSFUL" && (
            <span className="text-primary font-mono font-semibold">Sale Succeeded</span>
          )}
          {status === "FAILED" && (
            <span className="text-rose-400 font-mono font-semibold">Goal Not Met</span>
          )}
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-5">
        <Link
          href={`/sales/${sale.id.toString()}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface border border-surface-border hover:border-primary/50 text-white hover:text-primary text-sm font-semibold transition-all group-hover:bg-primary-dim shadow-sm"
        >
          <span>View Sale</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </div>
  );
}

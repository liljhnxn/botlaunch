"use client";

import { useAccount, useReadContract } from "wagmi";
import { BOTLAUNCH_ADDRESS, BOTCHAIN_EXPLORER_URL } from "@/contracts/addresses";
import BotLaunchpadArtifact from "@/contracts/BotLaunchpad.json";
import { SaleData } from "@/components/SaleCard";
import { formatEtherAmount, getSaleStatus } from "@/lib/format";
import Link from "next/link";
import {
  PieChart,
  Wallet,
  ArrowUpRight,
  Coins,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ExternalLink,
} from "lucide-react";

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();

  // Read all sales to aggregate user's activities
  const { data: allSalesData, isLoading } = useReadContract({
    address: BOTLAUNCH_ADDRESS,
    abi: BotLaunchpadArtifact.abi,
    functionName: "getAllSales",
  });

  const sales = (allSalesData as SaleData[]) || [];

  if (!isConnected) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border mx-auto flex items-center justify-center text-primary shadow-glow">
          <Wallet className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Connect your Web3 wallet to view your participated sales, claimable tokens, refunds, and
          created projects.
        </p>
      </div>
    );
  }

  // Filter sales created by this user
  const createdSales = sales.filter(
    (s) => s.creator.toLowerCase() === address?.toLowerCase()
  );

  return (
    <div className="space-y-10 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-primary mb-1">
            <PieChart className="w-4 h-4" />
            <span>Investor Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Your Portfolio</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Connected: {address}
          </p>
        </div>

        <Link
          href="/launch"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-black font-semibold text-xs shadow-glow hover:opacity-90 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-black" />
          <span>Create New Sale</span>
        </Link>
      </div>

      {/* Created Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            <span>Sales Created by You ({createdSales.length})</span>
          </h2>
        </div>

        {createdSales.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {createdSales.map((sale) => {
              const status = getSaleStatus(sale);
              return (
                <div
                  key={sale.id.toString()}
                  className="glass-card rounded-2xl p-5 border border-white/5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">
                        Sale #{sale.id.toString()}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface border border-surface-border text-slate-300">
                        {status}
                      </span>
                    </div>
                    <Link
                      href={`/sales/${sale.id.toString()}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Manage</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-surface/50 p-3 rounded-xl border border-surface-border font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Raised</span>
                      <span className="text-white font-bold">{formatEtherAmount(sale.totalRaised)} BOT</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Hard Cap</span>
                      <span className="text-slate-300 font-medium">{formatEtherAmount(sale.hardCap)} BOT</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-surface/30 border border-surface-border text-center space-y-3">
            <p className="text-xs text-slate-400">You haven't launched any token sales yet.</p>
            <Link
              href="/launch"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
            >
              <span>Launch your first project on Botchain</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Participated Sales Directory */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Wallet className="w-4 h-4 text-purple-400" />
          <span>Active & Concluded Participations</span>
        </h2>
        <p className="text-xs text-slate-400">
          Check any sale directly from the explorer to view individual allocations, claim tokens, or
          request refunds.
        </p>

        <div className="p-8 rounded-2xl bg-surface/30 border border-surface-border text-center space-y-3">
          <p className="text-xs text-slate-300">
            All participations are recorded on the public Botchain Testnet ledger.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/sales"
              className="px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-card-hover border border-surface-border text-xs text-primary font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <span>Browse All Sales</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href={`${BOTCHAIN_EXPLORER_URL}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-card-hover border border-surface-border text-xs text-slate-300 font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <span>View BohrScan History</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

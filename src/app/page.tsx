"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import { BOTLAUNCH_ADDRESS, BOTCHAIN_CHAIN_ID } from "@/contracts/addresses";
import BotLaunchpadArtifact from "@/contracts/BotLaunchpad.json";
import { SaleCard, SaleData } from "@/components/SaleCard";
import { formatEtherAmount, getSaleStatus } from "@/lib/format";
import {
  Rocket,
  Shield,
  Coins,
  ArrowRight,
  Sparkles,
  Layers,
  Zap,
  CheckCircle,
  Globe,
  Lock,
} from "lucide-react";

export default function HomePage() {
  // Read all sales from smart contract
  const { data: allSalesData, isLoading } = useReadContract({
    address: BOTLAUNCH_ADDRESS,
    abi: BotLaunchpadArtifact.abi,
    functionName: "getAllSales",
  });

  const sales = (allSalesData as SaleData[]) || [];

  // Calculate real metrics directly from blockchain data
  const totalProjects = sales.length;
  let totalRaisedWei = 0n;
  let activeSalesCount = 0;
  let completedSalesCount = 0;

  for (const sale of sales) {
    totalRaisedWei += sale.totalRaised;
    const status = getSaleStatus(sale);
    if (status === "LIVE") {
      activeSalesCount++;
    } else if (status === "SUCCESSFUL" || status === "ENDED") {
      completedSalesCount++;
    }
  }

  const liveOrFeaturedSales = sales
    .filter((s) => getSaleStatus(s) === "LIVE" || getSaleStatus(s) === "UPCOMING")
    .slice(0, 3);

  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="relative text-center py-16 sm:py-24 overflow-hidden rounded-3xl bg-hero-glow border border-white/5 px-4 sm:px-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-6 shadow-glow">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Botchain Mainnet (Chain ID {BOTCHAIN_CHAIN_ID})</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Launch. Fund. <span className="text-gradient">Build.</span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          A decentralized token launchpad built for the Botchain ecosystem.
          Launch your ERC-20 project token, raise native BOT with automated soft/hard caps,
          and participate with transparent on-chain claiming.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/sales"
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-cyan-400 text-black font-bold shadow-glow hover:opacity-95 transition-all text-sm active:scale-95"
          >
            <Rocket className="w-4 h-4 text-black" />
            <span>Explore Sales</span>
          </Link>
          <Link
            href="/launch"
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-surface-card border border-surface-border hover:border-primary/50 text-white font-semibold hover:bg-surface-card-hover transition-all text-sm"
          >
            <span>Launch a Token</span>
            <ArrowRight className="w-4 h-4 text-primary" />
          </Link>
        </div>

        {/* Real Blockchain Metric Counters */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="glass-panel p-5 rounded-2xl text-left border border-white/5">
            <div className="text-xs text-slate-400 font-medium">Total Funds Raised</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {formatEtherAmount(totalRaisedWei)} <span className="text-xs text-primary font-normal">BOT</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Verified On-Chain
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl text-left border border-white/5">
            <div className="text-xs text-slate-400 font-medium">Active Sales</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {activeSalesCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">Live on Botchain</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl text-left border border-white/5">
            <div className="text-xs text-slate-400 font-medium">Total Projects</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {totalProjects}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">Registered Sales</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl text-left border border-white/5">
            <div className="text-xs text-slate-400 font-medium">Completed Sales</div>
            <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
              {completedSalesCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">Funded & Finalized</div>
          </div>
        </div>
      </section>

      {/* Featured / Live Sales Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Live Opportunities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Featured Token Sales
            </h2>
          </div>
          <Link
            href="/sales"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Sales ({totalProjects})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-surface-card animate-pulse border border-surface-border"
              />
            ))}
          </div>
        ) : liveOrFeaturedSales.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {liveOrFeaturedSales.map((sale) => (
              <SaleCard key={sale.id.toString()} sale={sale} />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-surface-card border border-surface-border mx-auto flex items-center justify-center text-slate-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">No Active Sales Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Be the pioneer! Deploy your ERC-20 project token and launch the first sale on Botchain Mainnet.
              </p>
            </div>
            <Link
              href="/launch"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-semibold text-xs shadow-glow hover:opacity-90"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Launch First Sale</span>
            </Link>
          </div>
        )}
      </section>

      {/* Why BotLaunch Security & Architecture */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-primary text-xs font-mono uppercase tracking-wider">
            Trust & Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Engineered for Security & Decentralization
          </h2>
          <p className="text-xs text-slate-400">
            Smart contracts audited for escrow safety, non-reentrancy, and strict caps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary-dim border border-primary/20 flex items-center justify-center text-primary">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Non-Custodial Escrow</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sale tokens are deposited directly into the smart contract escrow upon creation.
              No centralized admin keys can move or redirect token supplies.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Guaranteed Refunds</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If a sale fails to achieve its soft cap by the closing timestamp, participants are
              cryptographically guaranteed a 100% refund of their contributed native BOT.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Deterministic On-Chain Math</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pricing and token distributions are calculated entirely through integer arithmetic in Solidity ^0.8.24,
              preventing rounding exploits or floating-point discrepancies.
            </p>
          </div>
        </div>
      </section>

      {/* Ecosystem Roadmap Preview (Section 35) */}
      <section className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/5 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-mono mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Botchain Ecosystem Suite</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Future Ecosystem Integrations</h2>
            <p className="text-xs text-slate-400 mt-1">
              BotLaunch is engineered to connect seamlessly with upcoming core Botchain infrastructure.
            </p>
          </div>
          <Link
            href="/docs"
            className="text-xs text-primary hover:underline font-mono flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface/50 p-4 rounded-xl border border-surface-border">
            <div className="font-mono text-xs font-semibold text-white">BotNS (.bot)</div>
            <p className="text-[11px] text-slate-400 mt-1">Decentralized naming service for creator identities</p>
          </div>
          <div className="bg-surface/50 p-4 rounded-xl border border-surface-border">
            <div className="font-mono text-xs font-semibold text-white">BotPay</div>
            <p className="text-[11px] text-slate-400 mt-1">Instant multichain settlements & checkout widgets</p>
          </div>
          <div className="bg-surface/50 p-4 rounded-xl border border-surface-border">
            <div className="font-mono text-xs font-semibold text-white">BotVault</div>
            <p className="text-[11px] text-slate-400 mt-1">Automated liquidity locks and vesting contracts</p>
          </div>
          <div className="bg-surface/50 p-4 rounded-xl border border-surface-border">
            <div className="font-mono text-xs font-semibold text-white">BotDAO</div>
            <p className="text-[11px] text-slate-400 mt-1">Governance-gated curated launch approvals</p>
          </div>
        </div>
      </section>
    </div>
  );
}

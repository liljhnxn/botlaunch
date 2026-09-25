"use client";

import { useState } from "react";
import {
  BOTCHAIN_CHAIN_ID,
  BOTCHAIN_RPC_URL,
  BOTCHAIN_EXPLORER_URL,
} from "@/contracts/addresses";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  Code2,
  Cpu,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function DocsPage() {
  const [networkAdded, setNetworkAdded] = useState(false);
  const [addError, setAddError] = useState("");

  async function handleAddBotchainToMetaMask() {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setAddError("MetaMask / Web3 provider not detected in browser.");
      return;
    }

    try {
      setAddError("");
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${BOTCHAIN_CHAIN_ID.toString(16)}`,
            chainName: "Botchain Mainnet",
            nativeCurrency: {
              name: "BOT",
              symbol: "BOT",
              decimals: 18,
            },
            rpcUrls: [BOTCHAIN_RPC_URL],
            blockExplorerUrls: [BOTCHAIN_EXPLORER_URL],
          },
        ],
      });
      setNetworkAdded(true);
    } catch (err: any) {
      console.error(err);
      setAddError(err?.message || "Failed to add network to wallet.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6">
      {/* Header */}
      <div className="space-y-3 border-b border-white/5 pb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-primary bg-primary-dim px-3 py-1 rounded-full border border-primary/20">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Documentation & Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          BotLaunch Protocol Docs
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Technical specifications, smart contract architecture, token pricing mechanics, and
          network setup for BotLaunch on Botchain Mainnet.
        </p>
      </div>

      {/* 1-Click Botchain Network Setup */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-primary/30 space-y-4 shadow-glow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              <span>Connect to Botchain Mainnet</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Add the official Botchain Mainnet RPC configuration to your MetaMask or Web3 wallet.
            </p>
          </div>

          <button
            onClick={handleAddBotchainToMetaMask}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-bold text-xs shadow-glow hover:opacity-95 transition-all self-start sm:self-auto active:scale-95"
          >
            {networkAdded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Added to MetaMask ✓</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-black" />
                <span>Add Botchain to MetaMask</span>
              </>
            )}
          </button>
        </div>

        {addError && (
          <p className="text-xs text-rose-400 font-mono bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/40">
            {addError}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs pt-2">
          <div className="p-3 rounded-xl bg-surface border border-surface-border">
            <span className="text-slate-500 text-[10px] block">Network Name</span>
            <span className="text-white font-semibold">Botchain Mainnet</span>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-surface-border">
            <span className="text-slate-500 text-[10px] block">Chain ID</span>
            <span className="text-primary font-bold">{BOTCHAIN_CHAIN_ID}</span>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-surface-border">
            <span className="text-slate-500 text-[10px] block">Native Currency</span>
            <span className="text-white font-semibold">BOT (18 dec)</span>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-surface-border">
            <span className="text-slate-500 text-[10px] block">Total Supply</span>
            <span className="text-emerald-400 font-semibold">150M BOT</span>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-surface-border">
            <span className="text-slate-500 text-[10px] block">RPC Endpoint</span>
            <span className="text-slate-300 truncate block">{BOTCHAIN_RPC_URL.replace(/^https?:\/\//, "")}</span>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-surface-border">
            <span className="text-slate-500 text-[10px] block">Explorer</span>
            <span className="text-slate-300 truncate block">{BOTCHAIN_EXPLORER_URL.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>
      </div>

      {/* Core Protocol Mechanics */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <span>Launchpad Sale Mechanics</span>
        </h2>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            BotLaunchpad is an autonomous, non-custodial smart contract system where project creators
            deposit ERC-20 tokens into escrow and participants contribute native BOT. The lifecycle
            flows through four deterministic stages:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-surface/50 border border-surface-border space-y-2">
              <h3 className="font-bold text-white text-sm">1. Creation & Escrow</h3>
              <p className="text-slate-400">
                The creator deploys an ERC-20 token and calls <code className="text-primary">createSale</code>.
                The full token allocation required to cover the hard cap is transferred into the
                contract using OpenZeppelin's <code className="text-primary">SafeERC20</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface/50 border border-surface-border space-y-2">
              <h3 className="font-bold text-white text-sm">2. Participation Window</h3>
              <p className="text-slate-400">
                During <code className="text-white">startTime &lt;= timestamp &lt; endTime</code>,
                contributors send native BOT via <code className="text-primary">participate(saleId)</code>.
                Minimum and maximum contribution limits per address and the hard cap are strictly
                enforced.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface/50 border border-surface-border space-y-2">
              <h3 className="font-bold text-white text-sm">3. Finalization</h3>
              <p className="text-slate-400">
                Once the sale reaches its end time (or hits the hard cap), anyone can trigger
                <code className="text-primary"> finalizeSale(saleId)</code>. If total raised reaches
                the soft cap, the sale is deemed successful.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface/50 border border-surface-border space-y-2">
              <h3 className="font-bold text-white text-sm">4. Claiming or Refunds</h3>
              <p className="text-slate-400">
                If successful, participants claim purchased tokens using <code className="text-primary">claim(saleId)</code>
                and the creator withdraws raised BOT. If soft cap was missed, contributors claim a 100%
                BOT refund.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Formula */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Deterministic On-Chain Pricing</h2>
        <div className="p-5 rounded-2xl bg-surface/60 border border-surface-border space-y-3 font-mono text-xs">
          <div className="text-slate-400">
            Token price is defined as the amount of BOT (in wei) required to purchase 1 whole token
            (10^decimals).
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-primary/20 text-primary">
            tokenAllocation = (msg.value * (10 ** tokenDecimals)) / sale.tokenPrice
          </div>
          <div className="text-slate-400 text-[11px] leading-relaxed">
            For example: With 1 NOVA = 0.01 BOT (10^16 wei), a contribution of 10 BOT (10 * 10^18 wei) yields:
            <br />
            (10 * 10^18 * 10^18) / 10^16 = 1,000 * 10^18 base units = <strong>1,000 NOVA</strong>.
          </div>
        </div>
      </div>

      {/* Security Principles */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span>Security Implementation</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-surface/40 border border-surface-border">
            <h3 className="font-bold text-white mb-1">Reentrancy Protection</h3>
            <p className="text-slate-400 leading-relaxed">
              Every mutative state function is protected by OpenZeppelin's <code className="text-primary">ReentrancyGuard</code>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface/40 border border-surface-border">
            <h3 className="font-bold text-white mb-1">Checks-Effects-Interactions</h3>
            <p className="text-slate-400 leading-relaxed">
              State flags (e.g. <code className="text-primary">claimed</code>, <code className="text-primary">refunded</code>, <code className="text-primary">fundsWithdrawn</code>) are updated prior to any external ether or token transfer.
            </p>
          </div>
        </div>
      </div>

      {/* Future Roadmap (Section 34) */}
      <div className="space-y-6 pt-4 border-t border-white/5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <span>Protocol Roadmap</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-surface/50 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>Phase 1</span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Completed
              </span>
            </div>
            <ul className="space-y-1 text-slate-300">
              <li>✓ ERC-20 token creation</li>
              <li>✓ Decentralized token sales</li>
              <li>✓ Native BOT participation</li>
              <li>✓ Soft & hard caps</li>
              <li>✓ Token claims & refund escrow</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-surface/50 border border-surface-border space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span>Phase 2</span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                Upcoming
              </span>
            </div>
            <ul className="space-y-1 text-slate-400">
              <li>□ Token vesting schedules</li>
              <li>□ Merkle-root whitelists</li>
              <li>□ Tiered allocation tiers</li>
              <li>□ Real-time price chart analytics</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-surface/50 border border-surface-border space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span>Phase 3</span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                Planned
              </span>
            </div>
            <ul className="space-y-1 text-slate-400">
              <li>□ BotNS (.bot) decentralized identity</li>
              <li>□ DAO-managed launches</li>
              <li>□ Project reputation scoring</li>
              <li>□ Verified creator profiles</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-surface/50 border border-surface-border space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span>Phase 4</span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                Future
              </span>
            </div>
            <ul className="space-y-1 text-slate-400">
              <li>□ Dutch & batch auction models</li>
              <li>□ Launchpad token staking rewards</li>
              <li>□ Protocol governance</li>
              <li>□ Advanced multichain bridges</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

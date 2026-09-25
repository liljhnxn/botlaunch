"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { WalletButton } from "./WalletButton";
import {
  Rocket,
  AlertTriangle,
  Menu,
  X,
  BookOpen,
  PlusCircle,
  Compass,
  PieChart,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import {
  BOTCHAIN_CHAIN_ID,
  BOTCHAIN_EXPLORER_URL,
  BOTLAUNCH_ADDRESS,
} from "@/contracts/addresses";

export function Navbar() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isWrongNetwork = isConnected && chainId !== BOTCHAIN_CHAIN_ID;

  const navLinks = [
    { name: "Explore Sales", href: "/sales", icon: Compass },
    { name: "Launch Token", href: "/launch", icon: PlusCircle },
    { name: "Portfolio", href: "/portfolio", icon: PieChart },
    { name: "Docs", href: "/docs", icon: BookOpen },
    {
      name: "Explorer",
      href: BOTCHAIN_EXPLORER_URL,
      icon: ExternalLink,
      isExternal: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#06090e]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Rocket className="w-5 h-5 text-black transform -rotate-45" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>BOTLAUNCH</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono -mt-0.5 hidden sm:block">
                Launch. Fund. Build.
              </p>
            </div>
          </Link>

          {/* Clickable Verified Mainnet Explorer Badge */}
          <a
            href={`${BOTCHAIN_EXPLORER_URL}/address/${BOTLAUNCH_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center gap-1.5 shadow-sm"
            title="View BotLaunchpad Contract on Botchain Mainnet Explorer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mainnet</span>
            <ExternalLink className="w-2.5 h-2.5 text-emerald-400/70" />
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-surface/80 p-1.5 rounded-2xl border border-surface-border">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              !link.isExternal &&
              (pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href)));

            if (link.isExternal) {
              return (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-primary hover:bg-white/5 transition-all"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span>{link.name}</span>
                </a>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-dim text-primary border border-primary/20 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions & Network Warning */}
        <div className="flex items-center gap-3">
          {/* Direct Mainnet Explorer Quick-Link */}
          <a
            href={BOTCHAIN_EXPLORER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-card hover:bg-surface-card-hover border border-surface-border text-xs text-slate-300 hover:text-primary transition-all font-medium"
            title="Open Botchain Mainnet Explorer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-primary" />
            <span>Mainnet Explorer</span>
          </a>

          {isWrongNetwork && (
            <button
              onClick={() => switchChain({ chainId: BOTCHAIN_CHAIN_ID })}
              disabled={isSwitching}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-all animate-pulse"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{isSwitching ? "Switching..." : `Switch to Botchain (${BOTCHAIN_CHAIN_ID})`}</span>
            </button>
          )}

          <WalletButton />

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-surface-card border border-surface-border"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-surface-border bg-surface-card/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-4 duration-200">
          {isWrongNetwork && (
            <button
              onClick={() => switchChain({ chainId: BOTCHAIN_CHAIN_ID })}
              disabled={isSwitching}
              className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{isSwitching ? "Switching..." : `Switch to Botchain (${BOTCHAIN_CHAIN_ID})`}</span>
            </button>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              !link.isExternal &&
              (pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href)));

            if (link.isExternal) {
              return (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-primary hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{link.name}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-slate-500">External</span>
                </a>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? "bg-primary-dim text-primary border border-primary/20"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

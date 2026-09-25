"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { formatAddress, formatEtherAmount } from "@/lib/format";
import { BOTCHAIN_EXPLORER_URL } from "@/contracts/addresses";
import { Wallet, LogOut, ExternalLink, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch real native BOT balance directly from blockchain
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isConnected) {
    return (
      <button
        onClick={() => {
          const connector = connectors[0];
          if (connector) connect({ connector });
        }}
        disabled={isPending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold shadow-glow hover:opacity-95 transition-all active:scale-95 disabled:opacity-50 text-sm"
      >
        <Wallet className="w-4 h-4" />
        <span>{isPending ? "Connecting..." : "Connect Wallet"}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-card border border-surface-border hover:border-primary/40 transition-all text-sm group"
      >
        {/* Real native BOT balance */}
        <div className="flex items-center gap-1.5 font-mono text-xs text-primary bg-primary-dim px-2.5 py-1 rounded-lg border border-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>
            {balanceLoading
              ? "..."
              : `${formatEtherAmount(balanceData?.value || 0n, 2)} BOT`}
          </span>
        </div>

        {/* Formatted address */}
        <span className="font-mono font-medium text-slate-200">
          {formatAddress(address)}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            dropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-card border border-surface-border shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2 border-b border-surface-border/60">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Connected Account
            </div>
            <div className="font-mono text-xs text-slate-200 truncate mt-1">
              {address}
            </div>
          </div>

          <a
            href={`${BOTCHAIN_EXPLORER_URL}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 text-xs text-slate-300 hover:text-primary hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View on BotChain Explorer</span>
          </a>

          <button
            onClick={() => {
              disconnect();
              setDropdownOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        </div>
      )}
    </div>
  );
}

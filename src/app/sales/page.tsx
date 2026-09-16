"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { BOTLAUNCH_ADDRESS } from "@/contracts/addresses";
import BotLaunchpadArtifact from "@/contracts/BotLaunchpad.json";
import { SaleCard, SaleData } from "@/components/SaleCard";
import { getSaleStatus } from "@/lib/format";
import { Compass, Search, Filter, Rocket, Plus } from "lucide-react";
import Link from "next/link";

export default function SalesExplorerPage() {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: allSalesData, isLoading, refetch } = useReadContract({
    address: BOTLAUNCH_ADDRESS,
    abi: BotLaunchpadArtifact.abi,
    functionName: "getAllSales",
  });

  const sales = (allSalesData as SaleData[]) || [];

  const filteredSales = sales.filter((sale) => {
    const status = getSaleStatus(sale);

    // Filter by status tab
    if (filterStatus === "LIVE" && status !== "LIVE") return false;
    if (filterStatus === "UPCOMING" && status !== "UPCOMING") return false;
    if (filterStatus === "SUCCESSFUL" && status !== "SUCCESSFUL") return false;
    if (filterStatus === "FAILED" && status !== "FAILED") return false;
    if (filterStatus === "ENDED" && status !== "ENDED" && status !== "SUCCESSFUL" && status !== "FAILED") return false;

    // Filter by query (sale id, token address, creator address)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const idMatch = sale.id.toString() === q || `#${sale.id.toString()}` === q;
      const tokenMatch = sale.token.toLowerCase().includes(q);
      const creatorMatch = sale.creator.toLowerCase().includes(q);
      return idMatch || tokenMatch || creatorMatch;
    }

    return true;
  });

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-primary mb-1">
            <Compass className="w-4 h-4" />
            <span>Launchpad Market</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Explore Token Sales
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Discover active and upcoming decentralized sales on Botchain Testnet.
          </p>
        </div>

        <Link
          href="/launch"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-semibold text-xs shadow-glow hover:opacity-90 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Launch Your Sale</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface rounded-xl border border-surface-border overflow-x-auto max-w-full w-full md:w-auto">
          {["ALL", "LIVE", "UPCOMING", "SUCCESSFUL", "FAILED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === status
                  ? "bg-primary text-black shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface rounded-xl border border-surface-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      {/* Sales Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-surface-card animate-pulse border border-surface-border"
            />
          ))}
        </div>
      ) : filteredSales.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSales.map((sale) => (
            <SaleCard key={sale.id.toString()} sale={sale} />
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-16 text-center border border-white/5 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-card border border-surface-border mx-auto flex items-center justify-center text-slate-500">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">No Sales Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery || filterStatus !== "ALL"
                ? "No token sales match your selected filters. Try clearing your search query."
                : "No token sales have been registered yet on Botchain Testnet."}
            </p>
          </div>
          {(searchQuery || filterStatus !== "ALL") && (
            <button
              onClick={() => {
                setFilterStatus("ALL");
                setSearchQuery("");
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

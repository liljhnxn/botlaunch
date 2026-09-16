import { formatEther, formatUnits } from "viem";

/**
 * Truncates an EVM address to 0x1234...5678 format
 */
export function formatAddress(address?: string | null): string {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats wei BOT amount to human readable string
 */
export function formatEtherAmount(amountWei: bigint | string | number = 0n, maxDecimals = 4): string {
  try {
    const weiBigInt = typeof amountWei === "bigint" ? amountWei : BigInt(amountWei || 0);
    const formatted = formatEther(weiBigInt);
    const num = parseFloat(formatted);
    if (isNaN(num)) return "0";
    if (num === 0) return "0";
    if (num < 0.0001) return "<0.0001";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    });
  } catch {
    return "0";
  }
}

/**
 * Formats raw ERC-20 token amount with specific decimals
 */
export function formatTokenAmount(
  amountRaw: bigint | string | number = 0n,
  decimals = 18,
  maxDecimals = 4
): string {
  try {
    const rawBigInt = typeof amountRaw === "bigint" ? amountRaw : BigInt(amountRaw || 0);
    const formatted = formatUnits(rawBigInt, decimals);
    const num = parseFloat(formatted);
    if (isNaN(num)) return "0";
    if (num === 0) return "0";
    if (num < 0.0001) return "<0.0001";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    });
  } catch {
    return "0";
  }
}

/**
 * Calculates progress percentage (0 - 100)
 */
export function calculateProgress(totalRaised: bigint = 0n, hardCap: bigint = 1n): number {
  if (hardCap === 0n) return 0;
  const progress = Number((totalRaised * 10000n) / hardCap) / 100;
  return Math.min(Math.max(progress, 0), 100);
}

export type SaleStatus = "UPCOMING" | "LIVE" | "ENDED" | "SUCCESSFUL" | "FAILED";

export function getSaleStatus(sale: {
  startTime: bigint | number;
  endTime: bigint | number;
  totalRaised: bigint;
  softCap: bigint;
  hardCap: bigint;
  finalized: boolean;
  successful: boolean;
}): SaleStatus {
  const now = Math.floor(Date.now() / 1000);
  const start = Number(sale.startTime);
  const end = Number(sale.endTime);

  if (sale.finalized) {
    return sale.successful ? "SUCCESSFUL" : "FAILED";
  }

  if (now < start) {
    return "UPCOMING";
  }

  if (sale.totalRaised >= sale.hardCap) {
    return "ENDED";
  }

  if (now >= end) {
    return "ENDED";
  }

  return "LIVE";
}

export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "Ended";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
}

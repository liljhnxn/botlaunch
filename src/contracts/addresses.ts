/**
 * Contract addresses for BotLaunchpad and BotToken.
 * Defaults to environment variables, with fallback to local deployment artifacts if present.
 */

import addressesJson from "./addresses.json";

export const BOTLAUNCH_ADDRESS = (process.env.NEXT_PUBLIC_BOTLAUNCH_ADDRESS ||
  (addressesJson as any)?.botLaunchpad ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const BOTTOKEN_ADDRESS = (process.env.NEXT_PUBLIC_BOTTOKEN_ADDRESS ||
  (addressesJson as any)?.botToken ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const BOTCHAIN_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_BOTCHAIN_CHAIN_ID || 968
);

export const BOTCHAIN_RPC_URL =
  process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.bohr.life";

export const BOTCHAIN_EXPLORER_URL =
  process.env.NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL || "https://scan.bohr.life";

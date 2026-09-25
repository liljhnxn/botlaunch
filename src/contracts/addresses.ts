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

// Enforce Botchain Mainnet (Chain ID 677). Stale testnet values (e.g. 968) are rejected.
const rawChainId = Number(process.env.NEXT_PUBLIC_BOTCHAIN_CHAIN_ID);
export const BOTCHAIN_CHAIN_ID = (rawChainId && rawChainId !== 968) ? rawChainId : 677;

const rawRpc = process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL;
export const BOTCHAIN_RPC_URL = (rawRpc && !rawRpc.includes("bohr.life")) ? rawRpc : "https://rpc.botchain.ai";

const rawExplorer = process.env.NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL;
export const BOTCHAIN_EXPLORER_URL = (rawExplorer && !rawExplorer.includes("bohr.life")) ? rawExplorer : "https://scan.botchain.ai";


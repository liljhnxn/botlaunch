import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";
import {
  BOTCHAIN_CHAIN_ID,
  BOTCHAIN_RPC_URL,
  BOTCHAIN_EXPLORER_URL,
} from "@/contracts/addresses";

export const botchain = defineChain({
  id: BOTCHAIN_CHAIN_ID,
  name: "Botchain Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "BOT",
    symbol: "BOT",
  },
  rpcUrls: {
    default: {
      http: [BOTCHAIN_RPC_URL],
    },
    public: {
      http: [BOTCHAIN_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "Botchain Explorer",
      url: BOTCHAIN_EXPLORER_URL,
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [botchain],
  connectors: [
    injected({
      target: "metaMask",
    }),
    injected(),
  ],
  transports: {
    [botchain.id]: http(),
  },
  ssr: true,
});

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const rawKey = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const PRIVATE_KEY = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
const BOTCHAIN_RPC_URL = process.env.NEXT_PUBLIC_BOTCHAIN_RPC_URL || "https://rpc.botchain.ai";
const BOTCHAIN_CHAIN_ID = Number(process.env.NEXT_PUBLIC_BOTCHAIN_CHAIN_ID) || 677;
const BOTCHAIN_EXPLORER_URL = process.env.NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL || "https://scan.botchain.ai";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "botchain",
  networks: {
    botchain: {
      url: BOTCHAIN_RPC_URL,
      chainId: BOTCHAIN_CHAIN_ID,
      accounts: [PRIVATE_KEY],
    },
    mainnet: {
      url: BOTCHAIN_RPC_URL,
      chainId: 677,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      botchain: "empty",
      mainnet: "empty",
    },
    customChains: [
      {
        network: "botchain",
        chainId: BOTCHAIN_CHAIN_ID,
        urls: {
          apiURL: `${BOTCHAIN_EXPLORER_URL}/api`,
          browserURL: BOTCHAIN_EXPLORER_URL,
        },
      },
      {
        network: "mainnet",
        chainId: 677,
        urls: {
          apiURL: `${BOTCHAIN_EXPLORER_URL}/api`,
          browserURL: BOTCHAIN_EXPLORER_URL,
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;

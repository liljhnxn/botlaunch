# 🚀 BOTLAUNCH — Decentralized Token Launchpad

> **Launch. Fund. Build.**
> A decentralized token launchpad built natively for the Botchain ecosystem.

---

## 📌 Overview

**BotLaunch** is a production-grade Web3 decentralized application (dApp) engineered for **Botchain Mainnet**. It enables developers and project creators to deploy custom ERC-20 project tokens and initiate non-custodial token sales with automated soft and hard caps. Investors and community members can participate directly using native **BOT**, with guaranteed on-chain token claiming upon sale success, or automated 100% BOT refunds if a sale fails to achieve its soft cap.

This application is connected directly to the blockchain via **Wagmi** and **Viem** with real smart contract transactions—**zero simulated data, zero fake balances, and zero hardcoded sales.**

---

## 🌟 Key Features

* **3-Step Launch Wizard (`/launch`)**:
  1. Deploy standard OpenZeppelin ERC-20 project tokens directly from your wallet.
  2. Approve the launchpad escrow allocation.
  3. Initialize the token sale on Botchain Mainnet with custom caps, timelines, and rates.
* **Sales Explorer (`/sales`)**: Real-time listing of active, upcoming, successful, and concluded sales with dynamic search and status filtering.
* **Interactive Sale Terminal (`/sales/[id]`)**:
  * Live status badges and real-time countdown clocks.
  * Visual progress bar indicating raised funds vs. soft cap and hard cap targets.
  * Real-time BOT-to-token allocation calculator.
  * 7-step transaction UX (`Idle` → `Preparing` → `Awaiting Wallet` → `Pending` → `Confirming` → `Success` / `Error`) with direct BotChain Explorer links.
  * Guaranteed 1-click token claiming for successful sales.
  * Guaranteed 1-click BOT refunds for missed soft cap sales.
  * Creator management suite for finalization, raised BOT withdrawal, and unsold token recovery.
* **Investor Portfolio (`/portfolio`)**: Consolidated overview of connected wallet's participations, claimable assets, refundable sales, and created projects.
* **Comprehensive Docs & Network Setup (`/docs`)**: Includes an interactive 1-click "Add Botchain to MetaMask" button, contract architecture guides, and roadmap.
* **Network Guard**: Detects if the user's wallet is on the wrong chain and prompts a 1-click chain switch to Botchain Mainnet (Chain ID 677).

---

## 🏗️ System Architecture

```
contracts/
├── BotToken.sol      # Standard ERC-20 project token
└── BotLaunchpad.sol  # Non-custodial launchpad escrow & sale engine
```

### Sale Lifecycle

```
[Project Creator]
        │
        ▼
   Deploy Token
        │
        ▼
   Approve Escrow
        │
        ▼
   Create Sale ─── Escrow Tokens Deposited
        │
        ▼
  [Sale Active] ◄─── Users Contribute Native BOT
        │
        ▼
    Sale Ends
        │
        ▼
  [Finalization]
        │
   ┌────┴────────────────────────┐
   ▼                             ▼
Soft Cap Reached?               Soft Cap Not Reached?
  [YES: SUCCESS]                  [NO: FAILED]
   │                              │
   ├─► Users Claim Tokens         ├─► Users Claim 100% BOT Refund
   ├─► Creator Withdraws BOT      └─► Creator Recovers All Tokens
   └─► Creator Recovers Unsold
```

---

## 🧮 Pricing & Decimal Math

The sale price is defined as the amount of native BOT (in wei) required to purchase 1 whole project token ($10^{18}$ base units):

$$\text{tokenAllocation} = \frac{\text{msg.value} \times 10^{\text{tokenDecimals}}}{\text{tokenPrice}}$$

*Example:*
* Price = `0.01 BOT` ($10^{16}$ wei)
* Contribution = `10 BOT` ($10^{19}$ wei)
* Allocation = $\frac{10^{19} \times 10^{18}}{10^{16}} = 1,000 \times 10^{18} \text{ base units} = \mathbf{1,000\ NOVA}$

All arithmetic is executed entirely on-chain using integer math in Solidity `^0.8.24`, preventing floating-point discrepancies or precision vulnerabilities.

---

## 🛡️ Security Implementation

* **Reentrancy Protection**: All state-changing external functions utilize OpenZeppelin's `ReentrancyGuard`.
* **Safe Transfers**: ERC-20 token transfers are executed strictly via `SafeERC20`.
* **Checks-Effects-Interactions**: All internal states (e.g., `claimed`, `refunded`, `fundsWithdrawn`, `unsoldTokensWithdrawn`) are updated before any native BOT or ERC-20 token transfer.
* **Escrow Guarantee**: `tokenAmount` must be $\ge \frac{\text{hardCap} \times 10^d}{\text{tokenPrice}}$, ensuring the contract holds sufficient tokens for all potential contributors.
* **No Backdoors**: Decentralized, non-custodial architecture with no admin privileges to seize user funds.

---

## 🌐 Botchain Mainnet Configuration

| Parameter | Value |
| :--- | :--- |
| **Network Name** | Botchain Mainnet |
| **Chain ID** | `677` (`0x2A5`) |
| **RPC URL** | `https://rpc.botchain.ai` |
| **Explorer URL** | `https://scan.botchain.ai` |
| **Native Currency** | `BOT` (18 decimals) |
| **Total Supply** | `150 Million BOT` |
| **BotLaunchpad Contract** | `0xA1d534dB780c2f82078A3204568289b4604eaFC3` |
| **BotToken (Sample Token)** | `0x7098adCB452De319A5971fA2da65AB00e3904651` |

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_BOTCHAIN_CHAIN_ID=677
NEXT_PUBLIC_BOTCHAIN_RPC_URL=https://rpc.botchain.ai
NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL=https://scan.botchain.ai

NEXT_PUBLIC_BOTLAUNCH_ADDRESS=0xA1d534dB780c2f82078A3204568289b4604eaFC3
NEXT_PUBLIC_BOTTOKEN_ADDRESS=0x7098adCB452De319A5971fA2da65AB00e3904651

# Deployer Private Key for Hardhat on Botchain Mainnet
PRIVATE_KEY=
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+ or v20+)
* npm

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile Contracts

```bash
npx hardhat compile
```

### 3. Run Test Suite

Run the comprehensive 25-scenario Hardhat test suite:

```bash
npx hardhat test
```

### 4. Deploy Contracts to Botchain Mainnet

```bash
npx hardhat run scripts/deploy.ts --network mainnet
```

### 5. Run the Frontend Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build

```bash
npm run build
npm run start
```

---

## 🗺️ Future Roadmap

* **Phase 1 (Current Release)**:
  * [x] ERC-20 token deployment wizard
  * [x] Non-custodial token sales escrow
  * [x] Native BOT participation
  * [x] Dynamic soft and hard caps
  * [x] Guaranteed claims and 100% refunds
  * [x] Creator fund and unsold token withdrawals
* **Phase 2**:
  * [ ] Linear and cliff token vesting schedules
  * [ ] Merkle-root whitelist allocations
  * [ ] Tiered staking participation tiers
  * [ ] Real-time trading and price charts
* **Phase 3**:
  * [ ] BotNS (`.bot`) decentralized naming resolution
  * [ ] DAO-governed community sale approvals
  * [ ] On-chain creator reputation scorecards
* **Phase 4**:
  * [ ] Dutch and batch auction sale mechanics
  * [ ] Cross-chain liquidity bridges

---

## ⚠️ Disclaimer

This software is built for Botchain Mainnet. Written with industry-standard security patterns (OpenZeppelin, ReentrancyGuard, SafeERC20). Please ensure independent security reviews and tokenomic modeling prior to executing high-value community capital raises.

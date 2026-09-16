"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useDeployContract,
  usePublicClient,
} from "wagmi";
import { parseUnits, parseEther } from "viem";
import {
  BOTLAUNCH_ADDRESS,
  BOTCHAIN_EXPLORER_URL,
} from "@/contracts/addresses";
import BotLaunchpadArtifact from "@/contracts/BotLaunchpad.json";
import BotTokenArtifact from "@/contracts/BotToken.json";
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ArrowRight,
  Info,
  AlertCircle,
  Coins,
} from "lucide-react";

export default function LaunchPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // Form Fields
  const [tokenName, setTokenName] = useState("Nova Token");
  const [tokenSymbol, setTokenSymbol] = useState("NOVA");
  const [initialSupply, setInitialSupply] = useState("1000000");
  const [saleAllocation, setSaleAllocation] = useState("500000");
  const [tokenPrice, setTokenPrice] = useState("0.01"); // in BOT
  const [softCap, setSoftCap] = useState("5000"); // in BOT
  const [hardCap, setHardCap] = useState("10000"); // in BOT
  const [minContribution, setMinContribution] = useState("1"); // in BOT
  const [maxContribution, setMaxContribution] = useState("100"); // in BOT

  // Default start date: 5 mins from now, end date: 3 days from now
  const nowUnix = Math.floor(Date.now() / 1000);
  const [startTimeLocal, setStartTimeLocal] = useState(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [endTimeLocal, setEndTimeLocal] = useState(() => {
    const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });

  // Step Tracker: 1 = Deploy Token, 2 = Approve Launchpad, 3 = Create Sale, 4 = Complete
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [deployedTokenAddress, setDeployedTokenAddress] = useState<string>("");
  const [createdSaleId, setCreatedSaleId] = useState<string>("");

  // Step Statuses
  const [step1State, setStep1State] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [step2State, setStep2State] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [step3State, setStep3State] = useState<"idle" | "loading" | "done" | "error">("idle");

  const [step1Tx, setStep1Tx] = useState<string>("");
  const [step2Tx, setStep2Tx] = useState<string>("");
  const [step3Tx, setStep3Tx] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const { deployContractAsync } = useDeployContract();
  const { writeContractAsync } = useWriteContract();

  // STEP 1: Deploy ERC-20 Project Token
  async function handleDeployToken() {
    if (!isConnected || !address) return;
    try {
      setErrorMsg("");
      setStep1State("loading");

      const supplyWei = parseUnits(initialSupply, 18);

      const hash = await deployContractAsync({
        abi: BotTokenArtifact.abi,
        bytecode: BotTokenArtifact.bytecode as `0x${string}`,
        args: [tokenName, tokenSymbol, supplyWei, address],
      });

      setStep1Tx(hash);

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.contractAddress) {
          setDeployedTokenAddress(receipt.contractAddress);
          setStep1State("done");
          setCurrentStep(2);
          return;
        }
      }

      setStep1State("done");
      setCurrentStep(2);
    } catch (err: any) {
      console.error(err);
      setStep1State("error");
      setErrorMsg(err?.shortMessage || err?.message || "Token deployment failed");
    }
  }

  // STEP 2: Approve Launchpad Contract for Sale Allocation
  async function handleApproveLaunchpad() {
    if (!isConnected || !deployedTokenAddress) return;
    try {
      setErrorMsg("");
      setStep2State("loading");

      const allocationWei = parseUnits(saleAllocation, 18);

      const hash = await writeContractAsync({
        address: deployedTokenAddress as `0x${string}`,
        abi: BotTokenArtifact.abi,
        functionName: "approve",
        args: [BOTLAUNCH_ADDRESS, allocationWei],
      });

      setStep2Tx(hash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setStep2State("done");
      setCurrentStep(3);
    } catch (err: any) {
      console.error(err);
      setStep2State("error");
      setErrorMsg(err?.shortMessage || err?.message || "Token approval failed");
    }
  }

  // STEP 3: Create Sale on BotLaunchpad
  async function handleCreateSale() {
    if (!isConnected || !deployedTokenAddress) return;
    try {
      setErrorMsg("");
      setStep3State("loading");

      const startUnix = Math.floor(new Date(startTimeLocal).getTime() / 1000);
      const endUnix = Math.floor(new Date(endTimeLocal).getTime() / 1000);

      const allocationWei = parseUnits(saleAllocation, 18);
      const priceWei = parseEther(tokenPrice);
      const softCapWei = parseEther(softCap);
      const hardCapWei = parseEther(hardCap);
      const minWei = parseEther(minContribution);
      const maxWei = parseEther(maxContribution);

      const hash = await writeContractAsync({
        address: BOTLAUNCH_ADDRESS,
        abi: BotLaunchpadArtifact.abi,
        functionName: "createSale",
        args: [
          deployedTokenAddress as `0x${string}`,
          allocationWei,
          priceWei,
          softCapWei,
          hardCapWei,
          minWei,
          maxWei,
          BigInt(startUnix),
          BigInt(endUnix),
        ],
      });

      setStep3Tx(hash);

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        // Read sale ID from SaleCreated event topic or fallback to reading saleCount
        try {
          const count = await publicClient.readContract({
            address: BOTLAUNCH_ADDRESS,
            abi: BotLaunchpadArtifact.abi,
            functionName: "saleCount",
          });
          setCreatedSaleId((count as bigint).toString());
        } catch {
          setCreatedSaleId("1");
        }
      }

      setStep3State("done");
      setCurrentStep(4);
    } catch (err: any) {
      console.error(err);
      setStep3State("error");
      setErrorMsg(err?.shortMessage || err?.message || "Sale creation failed");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-primary bg-primary-dim px-3 py-1 rounded-full border border-primary/20">
          <Rocket className="w-3.5 h-3.5" />
          <span>Launch Studio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Launch Your Token & Sale
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Deploy a standard ERC-20 project token, authorize non-custodial escrow, and initialize
          your public sale on Botchain Testnet in 3 sequential steps.
        </p>
      </div>

      {/* 3-Step Wizard Indicator */}
      <div className="grid grid-cols-3 gap-4">
        {/* Step 1 Indicator */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            currentStep === 1
              ? "bg-surface-card border-primary text-white shadow-glow"
              : step1State === "done"
              ? "bg-surface/50 border-emerald-500/40 text-emerald-400"
              : "bg-surface/30 border-surface-border text-slate-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase">Step 1</span>
            {step1State === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {step1State === "loading" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          </div>
          <div className="font-semibold text-xs sm:text-sm mt-1">Deploy ERC-20</div>
        </div>

        {/* Step 2 Indicator */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            currentStep === 2
              ? "bg-surface-card border-primary text-white shadow-glow"
              : step2State === "done"
              ? "bg-surface/50 border-emerald-500/40 text-emerald-400"
              : "bg-surface/30 border-surface-border text-slate-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase">Step 2</span>
            {step2State === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {step2State === "loading" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          </div>
          <div className="font-semibold text-xs sm:text-sm mt-1">Approve Escrow</div>
        </div>

        {/* Step 3 Indicator */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            currentStep === 3
              ? "bg-surface-card border-primary text-white shadow-glow"
              : step3State === "done"
              ? "bg-surface/50 border-emerald-500/40 text-emerald-400"
              : "bg-surface/30 border-surface-border text-slate-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase">Step 3</span>
            {step3State === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {step3State === "loading" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          </div>
          <div className="font-semibold text-xs sm:text-sm mt-1">Launch Sale</div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="break-words font-mono">{errorMsg}</div>
        </div>
      )}

      {/* Wizard Form Cards */}
      {currentStep < 4 ? (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/5 space-y-8">
          {/* Section 1: Token Parameters */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary font-mono flex items-center gap-2">
              <Coins className="w-4 h-4" />
              <span>Token Parameters</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Token Name</label>
                <input
                  type="text"
                  value={tokenName}
                  disabled={currentStep > 1}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-primary/50"
                  placeholder="Nova Token"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Token Symbol</label>
                <input
                  type="text"
                  value={tokenSymbol}
                  disabled={currentStep > 1}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-primary/50"
                  placeholder="NOVA"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Initial Supply</label>
                <input
                  type="number"
                  value={initialSupply}
                  disabled={currentStep > 1}
                  onChange={(e) => setInitialSupply(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white font-mono disabled:opacity-60 focus:outline-none focus:border-primary/50"
                  placeholder="1000000"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sale Allocation</label>
                <input
                  type="number"
                  value={saleAllocation}
                  disabled={currentStep > 2}
                  onChange={(e) => setSaleAllocation(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white font-mono disabled:opacity-60 focus:outline-none focus:border-primary/50"
                  placeholder="500000"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sale & Cap Parameters */}
          <div className="space-y-4 pt-4 border-t border-surface-border/50">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary font-mono flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              <span>Sale & Cap Economics</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Token Price (in BOT)</label>
                <input
                  type="number"
                  step="any"
                  value={tokenPrice}
                  disabled={currentStep > 2}
                  onChange={(e) => setTokenPrice(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white font-mono disabled:opacity-60 focus:outline-none focus:border-primary/50"
                  placeholder="0.01"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">e.g. 0.01 BOT = 1 token</span>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Soft Cap (in BOT)</label>
                <input
                  type="number"
                  value={softCap}
                  disabled={currentStep > 2}
                  onChange={(e) => setSoftCap(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white font-mono disabled:opacity-60 focus:outline-none focus:border-primary/50"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Hard Cap (in BOT)</label>
                <input
                  type="number"
                  value={hardCap}
                  disabled={currentStep > 2}
                  onChange={(e) => setHardCap(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white font-mono disabled:opacity-60 focus:outline-none focus:border-primary/50"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Min Contribution (BOT)</label>
                <input
                  type="number"
                  value={minContribution}
                  disabled={currentStep > 2}
                  onChange={(e) => setMinContribution(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white font-mono disabled:opacity-60 focus:outline-none focus:border-primary/50"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Max Contribution (BOT)</label>
                <input
                  type="number"
                  value={maxContribution}
                  disabled={currentStep > 2}
                  onChange={(e) => setMaxContribution(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white font-mono disabled:opacity-60 focus:outline-none focus:border-primary/50"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Schedule Dates */}
          <div className="space-y-4 pt-4 border-t border-surface-border/50">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary font-mono">
              Sale Timeline
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startTimeLocal}
                  disabled={currentStep > 2}
                  onChange={(e) => setStartTimeLocal(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endTimeLocal}
                  disabled={currentStep > 2}
                  onChange={(e) => setEndTimeLocal(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-xs text-white disabled:opacity-60 focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Active Action Button */}
          <div className="pt-6 border-t border-surface-border/60">
            {currentStep === 1 && (
              <button
                onClick={handleDeployToken}
                disabled={!isConnected || step1State === "loading"}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-bold text-sm shadow-glow hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {step1State === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Step 1: Deploying ERC-20 Token...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 text-black" />
                    <span>Step 1: Deploy Token ({tokenSymbol})</span>
                  </>
                )}
              </button>
            )}

            {currentStep === 2 && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-surface border border-surface-border text-xs flex items-center justify-between font-mono">
                  <span className="text-slate-400">Deployed Token:</span>
                  <span className="text-primary font-bold truncate max-w-xs">{deployedTokenAddress}</span>
                </div>
                <button
                  onClick={handleApproveLaunchpad}
                  disabled={step2State === "loading"}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-sm shadow-glow-purple hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                >
                  {step2State === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Step 2: Approving Escrow Allocation...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span>Step 2: Approve {saleAllocation} {tokenSymbol} for Escrow</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleCreateSale}
                disabled={step3State === "loading"}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-black font-bold text-sm shadow-glow hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
              >
                {step3State === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Step 3: Creating Sale Contract Escrow...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 text-black" />
                    <span>Step 3: Launch Token Sale on Botchain</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Complete Success Screen */
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-emerald-500/30 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 shadow-glow">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Sale Successfully Launched!</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-2">
              Your token has been deployed, escrow funded, and the sale is officially recorded on
              Botchain Testnet.
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-xl bg-surface border border-surface-border text-xs font-mono space-y-2 text-left">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Token Address:</span>
              <a
                href={`${BOTCHAIN_EXPLORER_URL}/address/${deployedTokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <span>{deployedTokenAddress.slice(0, 8)}...{deployedTokenAddress.slice(-6)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Sale ID:</span>
              <span className="text-white font-bold">#{createdSaleId}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href={`/sales/${createdSaleId}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-black font-bold text-xs shadow-glow hover:opacity-90"
            >
              <span>View Your Sale</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => {
                setCurrentStep(1);
                setStep1State("idle");
                setStep2State("idle");
                setStep3State("idle");
              }}
              className="px-6 py-3 rounded-xl bg-surface border border-surface-border text-xs text-slate-300 hover:text-white font-semibold"
            >
              Launch Another Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

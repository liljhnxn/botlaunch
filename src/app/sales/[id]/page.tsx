"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { parseEther, parseUnits } from "viem";
import {
  BOTLAUNCH_ADDRESS,
  BOTCHAIN_EXPLORER_URL,
} from "@/contracts/addresses";
import BotLaunchpadArtifact from "@/contracts/BotLaunchpad.json";
import BotTokenArtifact from "@/contracts/BotToken.json";
import {
  formatEtherAmount,
  formatTokenAmount,
  formatAddress,
  getSaleStatus,
} from "@/lib/format";
import { SaleProgress } from "@/components/SaleProgress";
import { Countdown } from "@/components/Countdown";
import {
  TransactionStatusModal,
  TxStep,
} from "@/components/TransactionStatusModal";
import {
  ArrowLeft,
  ExternalLink,
  Coins,
  Shield,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Settings,
} from "lucide-react";

export default function SaleDetailPage() {
  const params = useParams();
  const rawId = params?.id as string;
  const saleId = BigInt(rawId || "0");

  const { address, isConnected } = useAccount();
  const { data: userBalance } = useBalance({ address });

  // Read Sale from contract
  const {
    data: saleData,
    isLoading: saleLoading,
    refetch: refetchSale,
  } = useReadContract({
    address: BOTLAUNCH_ADDRESS,
    abi: BotLaunchpadArtifact.abi,
    functionName: "getSale",
    args: [saleId],
  });

  const sale = saleData as any;

  // Read Token info
  const { data: tokenSymbol } = useReadContract({
    address: sale?.token,
    abi: BotTokenArtifact.abi,
    functionName: "symbol",
  });

  const { data: tokenName } = useReadContract({
    address: sale?.token,
    abi: BotTokenArtifact.abi,
    functionName: "name",
  });

  const { data: tokenDecimals } = useReadContract({
    address: sale?.token,
    abi: BotTokenArtifact.abi,
    functionName: "decimals",
  });

  // Read Participant count
  const { data: participantCount } = useReadContract({
    address: BOTLAUNCH_ADDRESS,
    abi: BotLaunchpadArtifact.abi,
    functionName: "participantCount",
    args: [saleId],
  });

  // Read User Contribution
  const {
    data: userContribution,
    refetch: refetchContribution,
  } = useReadContract({
    address: BOTLAUNCH_ADDRESS,
    abi: BotLaunchpadArtifact.abi,
    functionName: "getContribution",
    args: [saleId, address || "0x0000000000000000000000000000000000000000"],
  });

  // Read Claimable Tokens
  const { data: claimableTokens, refetch: refetchClaimable } = useReadContract({
    address: BOTLAUNCH_ADDRESS,
    abi: BotLaunchpadArtifact.abi,
    functionName: "getClaimableTokens",
    args: [saleId, address || "0x0000000000000000000000000000000000000000"],
  });

  // Read User Claim Status
  const { data: isClaimed, refetch: refetchClaimed } = useReadContract({
    address: BOTLAUNCH_ADDRESS,
    abi: BotLaunchpadArtifact.abi,
    functionName: "isClaimed",
    args: [saleId, address || "0x0000000000000000000000000000000000000000"],
  });

  // Read User Refund Status
  const { data: isRefunded, refetch: refetchRefunded } = useReadContract({
    address: BOTLAUNCH_ADDRESS,
    abi: BotLaunchpadArtifact.abi,
    functionName: "isRefunded",
    args: [saleId, address || "0x0000000000000000000000000000000000000000"],
  });

  // Read Creator Withdrawal Status
  const { data: fundsWithdrawn, refetch: refetchFundsWithdrawn } = useReadContract({
    address: BOTLAUNCH_ADDRESS,
    abi: BotLaunchpadArtifact.abi,
    functionName: "fundsWithdrawn",
    args: [saleId],
  });

  const { data: unsoldWithdrawn, refetch: refetchUnsoldWithdrawn } = useReadContract({
    address: BOTLAUNCH_ADDRESS,
    abi: BotLaunchpadArtifact.abi,
    functionName: "unsoldTokensWithdrawn",
    args: [saleId],
  });

  // Transaction state
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [modalTitle, setModalTitle] = useState("Processing Transaction");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Input form state
  const [contribAmount, setContribAmount] = useState<string>("");

  const {
    data: txHash,
    writeContractAsync,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isWaitingReceipt, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  const decimals = Number(tokenDecimals || 18);
  const symbol = (tokenSymbol as string) || "TOKEN";
  const name = (tokenName as string) || `Sale #${sale?.id?.toString() || ""}`;
  const contribBigInt = (userContribution as bigint) || 0n;
  const claimableBigInt = (claimableTokens as bigint) || 0n;
  const isClaimedBool = Boolean(isClaimed);
  const isRefundedBool = Boolean(isRefunded);
  const fundsWithdrawnBool = Boolean(fundsWithdrawn);
  const unsoldWithdrawnBool = Boolean(unsoldWithdrawn);

  // Dynamic token calculation
  let expectedTokens = "0";
  if (contribAmount && sale?.tokenPrice && Number(contribAmount) > 0) {
    try {
      const contribWei = parseEther(contribAmount);
      const tokenUnits = (contribWei * BigInt(10 ** decimals)) / BigInt(sale.tokenPrice);
      expectedTokens = formatTokenAmount(tokenUnits, decimals);
    } catch {
      expectedTokens = "0";
    }
  }

  const isCreator = Boolean(
    address && sale?.creator && address.toLowerCase() === sale.creator.toLowerCase()
  );

  const status = sale ? getSaleStatus(sale) : "UPCOMING";

  async function handleParticipate() {
    if (!contribAmount || Number(contribAmount) <= 0) return;
    try {
      setErrorMessage("");
      setModalTitle("Sale Participation");
      setSuccessMsg(`Successfully contributed ${contribAmount} BOT! Tokens will be claimable after sale success.`);
      setTxStep("preparing");

      const valueWei = parseEther(contribAmount);

      setTxStep("awaiting_wallet");
      const hash = await writeContractAsync({
        address: BOTLAUNCH_ADDRESS,
        abi: BotLaunchpadArtifact.abi,
        functionName: "participate",
        args: [saleId],
        value: valueWei,
      });

      setTxStep("confirming");
      // Wait for confirmation
      await refetchSale();
      await refetchContribution();
      setTxStep("success");
      setContribAmount("");
    } catch (err: any) {
      console.error(err);
      setTxStep("error");
      setErrorMessage(err?.shortMessage || err?.message || "Participation failed.");
    }
  }

  async function handleClaim() {
    try {
      setErrorMessage("");
      setModalTitle("Claim Tokens");
      setSuccessMsg("Tokens claimed successfully to your wallet!");
      setTxStep("awaiting_wallet");

      await writeContractAsync({
        address: BOTLAUNCH_ADDRESS,
        abi: BotLaunchpadArtifact.abi,
        functionName: "claim",
        args: [saleId],
      });

      setTxStep("confirming");
      await refetchClaimed();
      await refetchClaimable();
      setTxStep("success");
    } catch (err: any) {
      console.error(err);
      setTxStep("error");
      setErrorMessage(err?.shortMessage || err?.message || "Claim failed.");
    }
  }

  async function handleRefund() {
    try {
      setErrorMessage("");
      setModalTitle("Claim Refund");
      setSuccessMsg("Contribution refunded back to your wallet!");
      setTxStep("awaiting_wallet");

      await writeContractAsync({
        address: BOTLAUNCH_ADDRESS,
        abi: BotLaunchpadArtifact.abi,
        functionName: "refund",
        args: [saleId],
      });

      setTxStep("confirming");
      await refetchRefunded();
      setTxStep("success");
    } catch (err: any) {
      console.error(err);
      setTxStep("error");
      setErrorMessage(err?.shortMessage || err?.message || "Refund failed.");
    }
  }

  async function handleFinalize() {
    try {
      setErrorMessage("");
      setModalTitle("Finalize Sale");
      setSuccessMsg("Sale finalized on-chain!");
      setTxStep("awaiting_wallet");

      await writeContractAsync({
        address: BOTLAUNCH_ADDRESS,
        abi: BotLaunchpadArtifact.abi,
        functionName: "finalizeSale",
        args: [saleId],
      });

      setTxStep("confirming");
      await refetchSale();
      setTxStep("success");
    } catch (err: any) {
      console.error(err);
      setTxStep("error");
      setErrorMessage(err?.shortMessage || err?.message || "Finalization failed.");
    }
  }

  async function handleWithdrawFunds() {
    try {
      setErrorMessage("");
      setModalTitle("Withdraw Raised Funds");
      setSuccessMsg("Raised BOT transferred to creator wallet!");
      setTxStep("awaiting_wallet");

      await writeContractAsync({
        address: BOTLAUNCH_ADDRESS,
        abi: BotLaunchpadArtifact.abi,
        functionName: "withdrawRaisedFunds",
        args: [saleId],
      });

      setTxStep("confirming");
      await refetchFundsWithdrawn();
      setTxStep("success");
    } catch (err: any) {
      console.error(err);
      setTxStep("error");
      setErrorMessage(err?.shortMessage || err?.message || "Fund withdrawal failed.");
    }
  }

  async function handleWithdrawUnsold() {
    try {
      setErrorMessage("");
      setModalTitle("Withdraw Unsold Tokens");
      setSuccessMsg("Unsold project tokens transferred to creator wallet!");
      setTxStep("awaiting_wallet");

      await writeContractAsync({
        address: BOTLAUNCH_ADDRESS,
        abi: BotLaunchpadArtifact.abi,
        functionName: "withdrawUnsoldTokens",
        args: [saleId],
      });

      setTxStep("confirming");
      await refetchUnsoldWithdrawn();
      setTxStep("success");
    } catch (err: any) {
      console.error(err);
      setTxStep("error");
      setErrorMessage(err?.shortMessage || err?.message || "Withdrawal failed.");
    }
  }

  if (saleLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading sale #{rawId} from Botchain...</p>
      </div>
    );
  }

  if (!sale || sale.id === 0n) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Sale Not Found</h2>
        <p className="text-xs text-slate-400">
          No sale exists with ID #{rawId} on Botchain Mainnet.
        </p>
        <Link
          href="/sales"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-surface-border text-xs text-primary font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explorer</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Back Button */}
      <Link
        href="/sales"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Sales</span>
      </Link>

      {/* Hero Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-surface-border flex items-center justify-center font-mono font-bold text-2xl text-primary shadow-glow">
              {((tokenSymbol as string) || "TK").slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {(tokenName as string) || `Sale #${sale.id.toString()}`}
                </h1>
                <span className="text-xs font-mono text-primary font-bold">
                  ${(tokenSymbol as string) || "TOKEN"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Sale ID: #{sale.id.toString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-mono font-semibold uppercase px-3 py-1.5 rounded-full border ${
                status === "LIVE"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : status === "SUCCESSFUL"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : status === "FAILED"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : "bg-slate-500/10 text-slate-400 border-slate-500/30"
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Progress */}
        <SaleProgress
          totalRaised={sale.totalRaised}
          softCap={sale.softCap}
          hardCap={sale.hardCap}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sale Metrics */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Sale Specifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-surface/60 p-3.5 rounded-xl border border-surface-border">
                <div className="text-[11px] text-slate-400">Token Price</div>
                <div className="font-mono text-sm font-bold text-white mt-0.5">
                  {formatEtherAmount(sale.tokenPrice)} BOT
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">per 1 {tokenSymbol as string}</div>
              </div>

              <div className="bg-surface/60 p-3.5 rounded-xl border border-surface-border">
                <div className="text-[11px] text-slate-400">Soft Cap</div>
                <div className="font-mono text-sm font-bold text-amber-400 mt-0.5">
                  {formatEtherAmount(sale.softCap)} BOT
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Minimum target</div>
              </div>

              <div className="bg-surface/60 p-3.5 rounded-xl border border-surface-border">
                <div className="text-[11px] text-slate-400">Hard Cap</div>
                <div className="font-mono text-sm font-bold text-primary mt-0.5">
                  {formatEtherAmount(sale.hardCap)} BOT
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Maximum ceiling</div>
              </div>

              <div className="bg-surface/60 p-3.5 rounded-xl border border-surface-border">
                <div className="text-[11px] text-slate-400">Min Contribution</div>
                <div className="font-mono text-sm font-semibold text-white mt-0.5">
                  {formatEtherAmount(sale.minContribution)} BOT
                </div>
              </div>

              <div className="bg-surface/60 p-3.5 rounded-xl border border-surface-border">
                <div className="text-[11px] text-slate-400">Max Contribution</div>
                <div className="font-mono text-sm font-semibold text-white mt-0.5">
                  {formatEtherAmount(sale.maxContribution)} BOT
                </div>
              </div>

              <div className="bg-surface/60 p-3.5 rounded-xl border border-surface-border">
                <div className="text-[11px] text-slate-400">Total Backers</div>
                <div className="font-mono text-sm font-semibold text-white mt-0.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{(participantCount as bigint || 0n).toString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Contract Addresses */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
              On-Chain Information
            </h2>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-surface/50 border border-surface-border gap-2">
                <span className="text-slate-400">Token Contract:</span>
                <a
                  href={`${BOTCHAIN_EXPLORER_URL}/address/${sale.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline break-all"
                >
                  <span>{sale.token}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-surface/50 border border-surface-border gap-2">
                <span className="text-slate-400">Creator Address:</span>
                <a
                  href={`${BOTCHAIN_EXPLORER_URL}/address/${sale.creator}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-slate-300 hover:text-primary hover:underline break-all"
                >
                  <span>{sale.creator}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-surface/50 border border-surface-border gap-2">
                <span className="text-slate-400">Start Time:</span>
                <span className="text-white">
                  {new Date(Number(sale.startTime) * 1000).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-surface/50 border border-surface-border gap-2">
                <span className="text-slate-400">End Time:</span>
                <span className="text-white">
                  {new Date(Number(sale.endTime) * 1000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Actions (Participate, Claim, Refund, Creator Controls) */}
        <div className="space-y-6">
          {/* Participate Card (when LIVE) */}
          {status === "LIVE" && (
            <div className="glass-card rounded-2xl p-6 border border-primary/30 space-y-5 relative">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary" />
                  <span>Participate in Sale</span>
                </h3>
                <Countdown targetTime={sale.endTime} label="Ends in" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-slate-400">Contribution Amount</label>
                  <span className="text-slate-400 font-mono">
                    Balance: {formatEtherAmount(userBalance?.value || 0n)} BOT
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="10"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary/50 pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-primary">
                    BOT
                  </span>
                </div>

                {/* Dynamic Token preview */}
                <div className="p-3 rounded-xl bg-surface/70 border border-surface-border text-xs space-y-1">
                  <div className="text-slate-400">You will receive approximately:</div>
                  <div className="font-mono text-base font-bold text-primary">
                    {expectedTokens} {symbol}
                  </div>
                </div>

                {/* Your previous contribution */}
                {contribBigInt > 0n && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Your previous contribution:{" "}
                    <span className="text-white font-semibold">
                      {formatEtherAmount(contribBigInt)} BOT
                    </span>
                  </div>
                )}

                <button
                  onClick={handleParticipate}
                  disabled={
                    !isConnected ||
                    !contribAmount ||
                    Number(contribAmount) <= 0 ||
                    isWritePending
                  }
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-black font-bold shadow-glow hover:opacity-95 transition-all disabled:opacity-50 text-sm active:scale-95"
                >
                  {!isConnected ? "Connect Wallet to Participate" : "Confirm Contribution"}
                </button>
              </div>
            </div>
          )}

          {/* Claim Tokens Card (when SUCCESSFUL) */}
          {status === "SUCCESSFUL" && (
            <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Sale Successful!</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                The soft cap was reached and the sale has concluded. Participants can claim their
                purchased tokens below.
              </p>

              <div className="p-4 rounded-xl bg-surface/70 border border-surface-border space-y-2">
                <div className="text-xs text-slate-400">Your Allocation</div>
                <div className="font-mono text-xl font-bold text-primary">
                  {formatTokenAmount(claimableBigInt, decimals)} {symbol}
                </div>
              </div>

              {isClaimedBool ? (
                <div className="py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center">
                  Tokens Already Claimed ✓
                </div>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={!isConnected || claimableBigInt === 0n || isWritePending}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all disabled:opacity-50 active:scale-95"
                >
                  {claimableBigInt === 0n
                    ? "No Claimable Tokens"
                    : "Claim Purchased Tokens"}
                </button>
              )}
            </div>
          )}

          {/* Refund Card (when FAILED) */}
          {status === "FAILED" && (
            <div className="glass-card rounded-2xl p-6 border border-rose-500/30 space-y-4">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Sale Failed</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                The soft cap was not reached before the sale deadline. Participants can claim a 100%
                refund of their contributed native BOT.
              </p>

              <div className="p-4 rounded-xl bg-surface/70 border border-surface-border space-y-2">
                <div className="text-xs text-slate-400">Your Contributed Amount</div>
                <div className="font-mono text-xl font-bold text-rose-400">
                  {formatEtherAmount(contribBigInt)} BOT
                </div>
              </div>

              {isRefundedBool ? (
                <div className="py-2.5 px-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
                  Refund Claimed ✓
                </div>
              ) : (
                <button
                  onClick={handleRefund}
                  disabled={!isConnected || contribBigInt === 0n || isWritePending}
                  className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm transition-all disabled:opacity-50 active:scale-95"
                >
                  {contribBigInt === 0n
                    ? "No Contribution to Refund"
                    : "Claim Full Refund"}
                </button>
              )}
            </div>
          )}

          {/* Creator Management Section */}
          {isCreator && (
            <div className="glass-card rounded-2xl p-6 border border-purple-500/30 space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Settings className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Creator Controls</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                As the project creator, you can finalize the sale and withdraw raised funds or unsold
                tokens.
              </p>

              <div className="space-y-2.5 pt-2">
                {!sale.finalized && (
                  <button
                    onClick={handleFinalize}
                    disabled={isWritePending}
                    className="w-full py-2.5 rounded-xl bg-surface border border-purple-500/40 text-purple-300 hover:bg-purple-500/10 font-semibold text-xs transition-colors"
                  >
                    Finalize Sale
                  </button>
                )}

                {Boolean(sale.finalized && sale.successful) && (
                  <button
                    onClick={handleWithdrawFunds}
                    disabled={fundsWithdrawnBool || isWritePending}
                    className="w-full py-2.5 rounded-xl bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 font-semibold text-xs transition-colors disabled:opacity-40"
                  >
                    {fundsWithdrawnBool ? "Funds Already Withdrawn ✓" : "Withdraw Raised BOT"}
                  </button>
                )}

                {Boolean(sale.finalized) && (
                  <button
                    onClick={handleWithdrawUnsold}
                    disabled={unsoldWithdrawnBool || isWritePending}
                    className="w-full py-2.5 rounded-xl bg-surface border border-surface-border text-slate-300 hover:text-white font-semibold text-xs transition-colors disabled:opacity-40"
                  >
                    {unsoldWithdrawnBool ? "Unsold Tokens Withdrawn ✓" : "Withdraw Unsold Tokens"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionStatusModal
        isOpen={txStep !== "idle"}
        step={txStep}
        txHash={txHash}
        errorMessage={errorMessage}
        title={modalTitle}
        successMessage={successMsg}
        onClose={() => setTxStep("idle")}
      />
    </div>
  );
}

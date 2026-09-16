"use client";

import { BOTCHAIN_EXPLORER_URL } from "@/contracts/addresses";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export type TxStep =
  | "idle"
  | "preparing"
  | "awaiting_wallet"
  | "pending"
  | "confirming"
  | "success"
  | "error";

interface TransactionStatusModalProps {
  isOpen: boolean;
  step: TxStep;
  txHash?: string;
  errorMessage?: string;
  title?: string;
  successMessage?: string;
  onClose: () => void;
}

export function TransactionStatusModal({
  isOpen,
  step,
  txHash,
  errorMessage,
  title = "Transaction Progress",
  successMessage = "Transaction confirmed successfully on Botchain!",
  onClose,
}: TransactionStatusModalProps) {
  if (!isOpen || step === "idle") return null;

  const isWorking =
    step === "preparing" ||
    step === "awaiting_wallet" ||
    step === "pending" ||
    step === "confirming";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-surface-card border border-surface-border p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          {!isWorking && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-white/5"
            >
              Close
            </button>
          )}
        </div>

        {/* Status Indicators */}
        <div className="py-3 flex flex-col items-center text-center space-y-4">
          {step === "preparing" && (
            <>
              <div className="w-14 h-14 rounded-full bg-primary-dim border border-primary/30 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Preparing Transaction</h4>
                <p className="text-xs text-slate-400 mt-1">Validating contract parameters and network state...</p>
              </div>
            </>
          )}

          {step === "awaiting_wallet" && (
            <>
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Awaiting Wallet Confirmation</h4>
                <p className="text-xs text-slate-400 mt-1">Please confirm the transaction in your wallet prompt...</p>
              </div>
            </>
          )}

          {(step === "pending" || step === "confirming") && (
            <>
              <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
              </div>
              <div>
                <h4 className="font-semibold text-white">
                  {step === "pending" ? "Transaction Submitted" : "Confirming on Botchain..."}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Broadcasting block to Bohr consensus. Waiting for block receipt...
                </p>
              </div>
            </>
          )}

          {step === "success" && (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-400">Success!</h4>
                <p className="text-xs text-slate-300 mt-1">{successMessage}</p>
              </div>
            </>
          )}

          {step === "error" && (
            <>
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <h4 className="font-semibold text-rose-400">Transaction Failed</h4>
                <p className="text-xs text-rose-300 mt-1 max-h-24 overflow-y-auto break-words font-mono bg-rose-950/40 p-2 rounded border border-rose-900/40">
                  {errorMessage || "An unexpected error occurred. Check wallet and parameters."}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Explorer Link */}
        {txHash && (
          <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Transaction Hash:</span>
            <a
              href={`${BOTCHAIN_EXPLORER_URL}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline font-mono"
            >
              <span>{txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Action Button */}
        {!isWorking && (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-surface hover:bg-surface-card-hover border border-surface-border text-white text-sm font-semibold transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

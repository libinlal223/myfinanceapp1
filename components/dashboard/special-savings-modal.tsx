"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Loader2, ArrowDownLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import { depositToSpecialSavings, withdrawFromSpecialSavings } from "@/lib/actions";
import { formatCurrency } from "@/lib/types";

interface Props {
  availableBalance: number;
  vaultBalance: number;
  initialMode?: "deposit" | "withdraw";
  onClose: () => void;
}

export default function SpecialSavingsModal({
  availableBalance,
  vaultBalance,
  initialMode = "deposit",
  onClose,
}: Props) {
  const [mode, setMode] = useState<"deposit" | "withdraw">(initialMode);
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const maxAmount = mode === "deposit" ? Math.max(0, availableBalance) : Math.max(0, vaultBalance);

  useEffect(() => {
    setError(null);
  }, [mode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (mode === "deposit" && val > availableBalance) {
      setError(`Cannot deposit more than your available balance (${formatCurrency(availableBalance)})`);
      return;
    }

    if (mode === "withdraw" && val > vaultBalance) {
      setError(`Cannot withdraw more than your vault balance (${formatCurrency(vaultBalance)})`);
      return;
    }

    startTransition(async () => {
      const res =
        mode === "deposit"
          ? await depositToSpecialSavings(val, label)
          : await withdrawFromSpecialSavings(val, label);

      if (!res.success) {
        setError(res.error);
        return;
      }

      onClose();
    });
  }

  function handleSetMax() {
    if (maxAmount > 0) {
      setAmount(String(maxAmount));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-savings/15 text-savings flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Special Savings Vault</h2>
              <p className="text-xs text-muted-foreground">Split and protect your balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-secondary rounded-xl gap-1 mb-5">
          <button
            type="button"
            onClick={() => setMode("deposit")}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "deposit"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpRight size={14} className="text-savings" />
            Deposit to Vault
          </button>
          <button
            type="button"
            onClick={() => setMode("withdraw")}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "withdraw"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownLeft size={14} className="text-income" />
            Withdraw to Balance
          </button>
        </div>

        {/* Info Strip */}
        <div className="p-3 rounded-xl bg-secondary/50 border border-border/50 text-xs mb-4 flex items-center justify-between">
          <span className="text-muted-foreground">
            {mode === "deposit" ? "Available to deposit:" : "Available in vault:"}
          </span>
          <span className="font-semibold font-mono-num">
            {formatCurrency(maxAmount)}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Amount (₹)
              </label>
              {maxAmount > 0 && (
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Use Max
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                max={maxAmount > 0 ? maxAmount : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full h-12 pl-8 pr-3 rounded-lg bg-input border border-border text-lg font-mono-num font-semibold focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2000, 5000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="py-1.5 px-2 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-mono-num text-muted-foreground hover:text-foreground transition-colors border border-border/50"
              >
                +₹{preset}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Purpose / Label (Optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={100}
              placeholder={mode === "deposit" ? "e.g. Emergency Fund, Trip, Laptop" : "e.g. Weekend expense"}
              className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || !amount || parseFloat(amount) <= 0}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {mode === "deposit" ? "Depositing…" : "Withdrawing…"}
                </>
              ) : mode === "deposit" ? (
                "Deposit to Vault"
              ) : (
                "Withdraw to Balance"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

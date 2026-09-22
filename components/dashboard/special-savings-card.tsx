"use client";

import { useState } from "react";
import { ShieldCheck, Plus, ArrowDownLeft, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/types";
import SpecialSavingsModal from "./special-savings-modal";

interface Props {
  vaultBalance: number;
  availableBalance: number;
}

export default function SpecialSavingsCard({ vaultBalance, availableBalance }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"deposit" | "withdraw">("deposit");

  function openDeposit() {
    setModalMode("deposit");
    setModalOpen(true);
  }

  function openWithdraw() {
    setModalMode("withdraw");
    setModalOpen(true);
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-savings/20 bg-gradient-to-br from-card via-card to-savings/10 p-5 shadow-sm transition-all hover:border-savings/35">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Info */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-savings/15 text-savings flex items-center justify-center flex-shrink-0 shadow-inner">
              <ShieldCheck size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-savings">
                  Special Savings Vault
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-savings/10 px-2 py-0.5 text-[10px] font-medium text-savings">
                  <Lock size={10} /> Locked Reserve
                </span>
              </div>
              <p className="text-2xl font-bold font-mono-num text-foreground mt-0.5">
                {formatCurrency(vaultBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Separated from your spendable balance • Withdrawable anytime
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:self-center">
            <button
              onClick={openDeposit}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-savings/20 hover:bg-savings/30 text-savings text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] border border-savings/30"
            >
              <Plus size={14} className="stroke-[2.5]" />
              Deposit
            </button>

            <button
              onClick={openWithdraw}
              disabled={vaultBalance <= 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed text-foreground text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] border border-border"
            >
              <ArrowDownLeft size={14} className="stroke-[2.5] text-income" />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <SpecialSavingsModal
          availableBalance={availableBalance}
          vaultBalance={vaultBalance}
          initialMode={modalMode}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

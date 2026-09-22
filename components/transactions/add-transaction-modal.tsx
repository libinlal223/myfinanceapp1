"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { createTransaction } from "@/lib/actions";
import { Category, TransactionType, TYPE_CONFIG, getTodayISODate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const TABS: TransactionType[] = ["expense", "income", "savings", "investment"];

interface Props {
  userId: string;
  categories: Category[];
  onClose: () => void;
  defaultType?: TransactionType;
}

export default function AddTransactionModal({ categories, onClose, defaultType = "expense" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getTodayISODate());
  const [categoryId, setCategoryId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Reset category when tab changes
  useEffect(() => {
    setCategoryId("");
    setError(null);
  }, [activeTab]);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const expenseCategories = categories.filter(() => true); // All categories for expenses

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("type", activeTab);
    formData.set("amount", amount);
    formData.set("note", note);
    formData.set("transaction_date", date);
    if (categoryId) formData.set("category_id", categoryId);

    startTransition(async () => {
      const result = await createTransaction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  const config = TYPE_CONFIG[activeTab];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full md:max-w-md bg-card border border-border rounded-t-2xl md:rounded-2xl shadow-2xl animate-slide-up max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-base">Add Transaction</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {TABS.map((tab) => {
            const cfg = TYPE_CONFIG[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition-all border-b-2",
                  activeTab === tab
                    ? `${cfg.color} border-current`
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
              <input
                id="amount-input"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className={cn(
                  "w-full h-12 pl-8 pr-3 rounded-lg bg-input border text-lg font-mono-num font-semibold focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
                  config.color,
                  "border-border"
                )}
              />
            </div>
          </div>

          {/* Category (expense only) */}
          {activeTab === "expense" && expenseCategories.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                Category
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {expenseCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id === categoryId ? "" : cat.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all border",
                      categoryId === cat.id
                        ? "bg-primary/15 border-primary text-primary"
                        : "border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-base leading-none">{cat.icon}</span>
                    <span className="truncate w-full text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Note <span className="normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?"
              maxLength={500}
              className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !amount}
            className={cn(
              "w-full h-11 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              activeTab === "income" ? "bg-income text-white hover:bg-income/90" :
              activeTab === "expense" ? "bg-expense text-white hover:bg-expense/90" :
              activeTab === "savings" ? "bg-savings text-white hover:bg-savings/90" :
              "bg-investment text-white hover:bg-investment/90"
            )}
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              `Add ${TYPE_CONFIG[activeTab].label}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

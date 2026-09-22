"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Transaction, TransactionType, TYPE_CONFIG, formatCurrency, formatDateShort } from "@/lib/types";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import TransactionItem from "@/components/transactions/transaction-item";

interface Category { id: string; name: string; icon: string; }

interface Props {
  userId: string;
  categories: Category[];
}

const TYPES: TransactionType[] = ["income", "expense", "savings", "investment"];

export default function SearchClient({ userId, categories }: Props) {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<TransactionType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [results, setResults] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const toggleType = (t: TransactionType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setSearched(true);

    const supabase = createClient();
    let q = supabase
      .from("transactions")
      .select("*, categories(id, name, icon)")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (query.trim()) {
      q = q.ilike("note", `%${query.trim()}%`);
    }
    if (selectedTypes.length > 0) {
      q = q.in("type", selectedTypes);
    }
    if (selectedCategory) {
      q = q.eq("category_id", selectedCategory);
    }
    if (minAmount) {
      q = q.gte("amount", parseFloat(minAmount));
    }
    if (maxAmount) {
      q = q.lte("amount", parseFloat(maxAmount));
    }
    if (fromDate) {
      q = q.gte("transaction_date", fromDate);
    }
    if (toDate) {
      q = q.lte("transaction_date", toDate);
    }

    const { data } = await q;
    setResults(data ?? []);
    setLoading(false);
  }

  function handleReset() {
    setQuery("");
    setSelectedTypes([]);
    setSelectedCategory("");
    setMinAmount("");
    setMaxAmount("");
    setFromDate("");
    setToDate("");
    setResults(null);
    setSearched(false);
  }

  const hasFilters = query || selectedTypes.length > 0 || selectedCategory || minAmount || maxAmount || fromDate || toDate;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="space-y-3">
        {/* Text search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, categories…"
            className="w-full h-11 pl-9 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Type filters */}
        <div className="flex gap-2 flex-wrap">
          {TYPES.map((t) => {
            const cfg = TYPE_CONFIG[t];
            const active = selectedTypes.includes(t);
            return (
              <button key={t} type="button" onClick={() => toggleType(t)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  active ? `${cfg.color} ${cfg.bg} border-current` : "text-muted-foreground border-border hover:text-foreground"
                )}>
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Advanced filters */}
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Min ₹" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} min="0" step="0.01"
            className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors" />
          <input type="number" placeholder="Max ₹" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} min="0" step="0.01"
            className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors" />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors" />
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
          {hasFilters && (
            <button type="button" onClick={handleReset}
              className="h-10 px-4 rounded-xl border border-border text-sm hover:bg-accent transition-colors">
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : results && results.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <span className="text-3xl mb-2 block">🔍</span>
              <p className="text-sm text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">
                {results?.length} result{results?.length !== 1 ? "s" : ""}
              </p>
              <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                {results?.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

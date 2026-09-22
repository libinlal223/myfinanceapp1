// Shared TypeScript types for the Personal Money Tracker

export type TransactionType = "income" | "expense" | "savings" | "investment";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category_id: string | null;
  note: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, "id" | "name" | "icon"> | null;
}

export interface BalanceSummary {
  income_total: number;
  expense_total: number;
  savings_total: number;
  investment_total: number;
  available_balance: number;
}

export interface PeriodSummary {
  income_total: number;
  expense_total: number;
  savings_total: number;
  investment_total: number;
}

export interface CategorySpending {
  category_id: string | null;
  category_name: string;
  category_icon: string;
  total: number;
  pct: number;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function getTodayISODate(): string {
  return new Date().toISOString().split("T")[0];
}

export const TYPE_CONFIG: Record<
  TransactionType,
  { label: string; color: string; bg: string; icon: string; sign: string }
> = {
  income: {
    label: "Income",
    color: "text-income",
    bg: "bg-income/10",
    icon: "↑",
    sign: "+",
  },
  expense: {
    label: "Expense",
    color: "text-expense",
    bg: "bg-expense/10",
    icon: "↓",
    sign: "-",
  },
  savings: {
    label: "Savings",
    color: "text-savings",
    bg: "bg-savings/10",
    icon: "◆",
    sign: "→",
  },
  investment: {
    label: "Investment",
    color: "text-investment",
    bg: "bg-investment/10",
    icon: "▲",
    sign: "→",
  },
};

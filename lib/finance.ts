import { SupabaseClient } from "@supabase/supabase-js";
import {
  BalanceSummary,
  PeriodSummary,
  CategorySpending,
  Category,
  Transaction,
} from "./types";

export const DEFAULT_CATEGORIES = [
  { name: "Food", icon: "🍔" },
  { name: "Transport", icon: "🚗" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Bills", icon: "📄" },
  { name: "Family", icon: "👨‍👩‍👧" },
  { name: "Personal", icon: "👤" },
  { name: "Fun", icon: "🎮" },
];

export async function ensureDefaultCategories(
  supabase: SupabaseClient,
  userId: string,
): Promise<Category[]> {
  const { data: existing } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("name");

  if (existing && existing.length > 0) {
    return existing as Category[];
  }

  const toInsert = DEFAULT_CATEGORIES.map((cat) => ({
    user_id: userId,
    name: cat.name,
    icon: cat.icon,
    is_default: true,
  }));

  const { data: inserted } = await supabase
    .from("categories")
    .insert(toInsert)
    .select();

  return (inserted ?? []) as Category[];
}

/**
 * High-performance single-query dashboard data loader.
 * Replaces 5 separate network queries with 1 single query and computes aggregations in memory.
 */
export async function getDashboardData(
  supabase: SupabaseClient,
  userId: string,
) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, user_id, type, amount, category_id, note, transaction_date, created_at, categories(id, name, icon)",
    )
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  const txs = (transactions ?? []) as unknown as Transaction[];

  let income_total = 0;
  let expense_total = 0;
  let savings_total = 0;
  let investment_total = 0;
  let vault_deposits = 0;
  let vault_withdrawals = 0;

  let m_income = 0;
  let m_expense = 0;
  let m_savings = 0;
  let m_investment = 0;

  let todaySpending = 0;

  const catMap = new Map<
    string,
    { category_id: string | null; name: string; icon: string; total: number }
  >();
  let monthExpenseTotal = 0;

  for (const tx of txs) {
    const amt = Number(tx.amount) || 0;
    const isThisMonth =
      tx.transaction_date >= monthStart && tx.transaction_date <= monthEnd;
    const isToday = tx.transaction_date === today;
    const isVaultDeposit = tx.type === "savings" && tx.note?.includes("[Vault Deposit]");
    const isVaultWithdrawal = tx.type === "income" && tx.note?.includes("[Vault Withdraw]");

    // Special savings vault
    if (isVaultDeposit) {
      vault_deposits += amt;
    } else if (isVaultWithdrawal) {
      vault_withdrawals += amt;
    } else {
      // Regular income & savings
      if (tx.type === "income") income_total += amt;
      else if (tx.type === "savings") savings_total += amt;
    }

    if (tx.type === "expense") expense_total += amt;
    else if (tx.type === "investment") investment_total += amt;

    // This month (exclude internal vault transfers from monthly earned income / monthly savings)
    if (isThisMonth) {
      if (tx.type === "income" && !isVaultWithdrawal) m_income += amt;
      else if (tx.type === "expense") {
        m_expense += amt;
        monthExpenseTotal += amt;
        const cat = tx.categories;
        const catId = cat?.id ?? tx.category_id ?? "uncategorized";
        const catName = cat?.name ?? "Uncategorized";
        const catIcon = cat?.icon ?? "📦";
        const cur = catMap.get(catId) || {
          category_id: cat?.id ?? null,
          name: catName,
          icon: catIcon,
          total: 0,
        };
        cur.total += amt;
        catMap.set(catId, cur);
      } else if (tx.type === "savings" && !isVaultDeposit) m_savings += amt;
      else if (tx.type === "investment") m_investment += amt;
    }

    // Today
    if (isToday && tx.type === "expense") {
      todaySpending += amt;
    }
  }

  const categoryRows: CategorySpending[] = [];
  catMap.forEach((val) => {
    categoryRows.push({
      category_id: val.category_id,
      category_name: val.name,
      category_icon: val.icon,
      total: val.total,
      pct:
        monthExpenseTotal > 0
          ? Math.round((val.total / monthExpenseTotal) * 1000) / 10
          : 0,
    });
  });
  categoryRows.sort((a, b) => b.total - a.total);

  const special_savings_balance = Math.max(0, vault_deposits - vault_withdrawals);
  const net_vault_transfer = vault_deposits - vault_withdrawals;
  const available_balance =
    income_total - expense_total - savings_total - investment_total - net_vault_transfer;

  return {
    balance: {
      income_total,
      expense_total,
      savings_total,
      investment_total,
      available_balance,
      special_savings_balance,
    },
    period: {
      income_total: m_income,
      expense_total: m_expense,
      savings_total: m_savings,
      investment_total: m_investment,
    },
    todaySpending,
    categoryRows,
    recentTx: txs.slice(0, 8),
  };
}

/**
 * High-performance analytics data loader using single query.
 */
export async function getAnalyticsData(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number,
) {
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).toISOString().split("T")[0];

  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      "id, user_id, type, amount, category_id, note, transaction_date, created_at, categories(id, name, icon)",
    )
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false });

  const txs = (transactions ?? []) as unknown as Transaction[];

  let income_total = 0;
  let expense_total = 0;
  let savings_total = 0;
  let investment_total = 0;
  let vault_deposits = 0;
  let vault_withdrawals = 0;

  let m_income = 0;
  let m_expense = 0;
  let m_savings = 0;
  let m_investment = 0;

  const catMap = new Map<
    string,
    { category_id: string | null; name: string; icon: string; total: number }
  >();
  let monthExpenseTotal = 0;

  for (const tx of txs) {
    const amt = Number(tx.amount) || 0;
    const isSelectedMonth =
      tx.transaction_date >= firstDay && tx.transaction_date <= lastDay;
    const isVaultDeposit = tx.type === "savings" && tx.note?.includes("[Vault Deposit]");
    const isVaultWithdrawal = tx.type === "income" && tx.note?.includes("[Vault Withdraw]");

    // Special savings vault
    if (isVaultDeposit) {
      vault_deposits += amt;
    } else if (isVaultWithdrawal) {
      vault_withdrawals += amt;
    } else {
      // Regular all-time balance
      if (tx.type === "income") income_total += amt;
      else if (tx.type === "savings") savings_total += amt;
    }

    if (tx.type === "expense") expense_total += amt;
    else if (tx.type === "investment") investment_total += amt;

    // Selected month
    if (isSelectedMonth) {
      if (tx.type === "income" && !isVaultWithdrawal) m_income += amt;
      else if (tx.type === "expense") {
        m_expense += amt;
        monthExpenseTotal += amt;
        const cat = tx.categories;
        const catId = cat?.id ?? tx.category_id ?? "uncategorized";
        const catName = cat?.name ?? "Uncategorized";
        const catIcon = cat?.icon ?? "📦";
        const cur = catMap.get(catId) || {
          category_id: cat?.id ?? null,
          name: catName,
          icon: catIcon,
          total: 0,
        };
        cur.total += amt;
        catMap.set(catId, cur);
      } else if (tx.type === "savings" && !isVaultDeposit) m_savings += amt;
      else if (tx.type === "investment") m_investment += amt;
    }
  }

  const categoryRows: CategorySpending[] = [];
  catMap.forEach((val) => {
    categoryRows.push({
      category_id: val.category_id,
      category_name: val.name,
      category_icon: val.icon,
      total: val.total,
      pct:
        monthExpenseTotal > 0
          ? Math.round((val.total / monthExpenseTotal) * 1000) / 10
          : 0,
    });
  });
  categoryRows.sort((a, b) => b.total - a.total);

  const special_savings_balance = Math.max(0, vault_deposits - vault_withdrawals);
  const net_vault_transfer = vault_deposits - vault_withdrawals;
  const available_balance =
    income_total - expense_total - savings_total - investment_total - net_vault_transfer;

  return {
    balance: {
      income_total,
      expense_total,
      savings_total,
      investment_total,
      available_balance,
      special_savings_balance,
    },
    period: {
      income_total: m_income,
      expense_total: m_expense,
      savings_total: m_savings,
      investment_total: m_investment,
    },
    categories: categoryRows,
  };
}

export async function getBalanceSummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<BalanceSummary> {
  const { balance } = await getDashboardData(supabase, userId);
  return balance;
}

export async function getTodaySpending(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { todaySpending } = await getDashboardData(supabase, userId);
  return todaySpending;
}

export async function getPeriodSummary(
  supabase: SupabaseClient,
  userId: string,
  from?: string,
  to?: string,
): Promise<PeriodSummary> {
  let query = supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", userId);

  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);

  const { data } = await query;
  if (!data) {
    return {
      income_total: 0,
      expense_total: 0,
      savings_total: 0,
      investment_total: 0,
    };
  }

  let income = 0;
  let expense = 0;
  let savings = 0;
  let investment = 0;

  for (const item of data) {
    const amt = Number(item.amount) || 0;
    if (item.type === "income") income += amt;
    else if (item.type === "expense") expense += amt;
    else if (item.type === "savings") savings += amt;
    else if (item.type === "investment") investment += amt;
  }

  return {
    income_total: income,
    expense_total: expense,
    savings_total: savings,
    investment_total: investment,
  };
}

export async function getCategorySpending(
  supabase: SupabaseClient,
  userId: string,
  from?: string,
  to?: string,
): Promise<CategorySpending[]> {
  let query = supabase
    .from("transactions")
    .select("category_id, amount, categories(id, name, icon)")
    .eq("user_id", userId)
    .eq("type", "expense");

  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);

  const { data } = await query;
  if (!data || data.length === 0) return [];

  const map = new Map<
    string,
    { category_id: string | null; name: string; icon: string; total: number }
  >();

  let grandTotal = 0;

  for (const item of data) {
    const amt = Number(item.amount) || 0;
    grandTotal += amt;
    // @ts-expect-error - PostgREST joined relation typing
    const cat = item.categories as { id: string; name: string; icon: string } | null;
    const catId = cat?.id ?? item.category_id ?? "uncategorized";
    const name = cat?.name ?? "Uncategorized";
    const icon = cat?.icon ?? "📦";

    const current = map.get(catId) || {
      category_id: cat?.id ?? null,
      name,
      icon,
      total: 0,
    };
    current.total += amt;
    map.set(catId, current);
  }

  const result: CategorySpending[] = [];
  map.forEach((value) => {
    result.push({
      category_id: value.category_id,
      category_name: value.name,
      category_icon: value.icon,
      total: value.total,
      pct: grandTotal > 0 ? Math.round((value.total / grandTotal) * 1000) / 10 : 0,
    });
  });

  return result.sort((a, b) => b.total - a.total);
}


import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/types";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SpendingChart from "@/components/dashboard/spending-chart";
import { getAnalyticsData } from "@/lib/finance";

interface SearchParams {
  month?: string;
  year?: string;
}

export const instant = false;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()));
  const month = parseInt(params.month ?? String(now.getMonth() + 1));
  const monthName = new Date(year, month - 1).toLocaleDateString("en-IN", {
    month: "long",
  });

  // Prev / next month links
  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prevLink = `/analytics?year=${prevDate.getFullYear()}&month=${prevDate.getMonth() + 1}`;
  const nextLink = `/analytics?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}`;
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;

  const { period, categories, balance } = await getAnalyticsData(
    supabase,
    user.id,
    year,
    month,
  );

  const net =
    Number(period.income_total) -
    Number(period.expense_total) -
    Number(period.savings_total) -
    Number(period.investment_total);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + month nav */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <div className="flex items-center gap-1">
          <Link
            href={prevLink}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <ChevronLeft size={16} />
          </Link>
          <span className="text-sm font-medium px-2 min-w-28 text-center">
            {monthName} {year}
          </span>
          <Link
            href={nextLink}
            className={`w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors ${
              isCurrentMonth ? "opacity-30 pointer-events-none" : ""
            }`}
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "Income",
            value: Number(period.income_total),
            color: "text-income",
            border: "border-income/20",
            bg: "bg-income/10",
          },
          {
            label: "Expenses",
            value: Number(period.expense_total),
            color: "text-expense",
            border: "border-expense/20",
            bg: "bg-expense/10",
          },
          {
            label: "Savings",
            value: Number(period.savings_total),
            color: "text-savings",
            border: "border-savings/20",
            bg: "bg-savings/10",
          },
          {
            label: "Investments",
            value: Number(period.investment_total),
            color: "text-investment",
            border: "border-investment/20",
            bg: "bg-investment/10",
          },
        ].map(({ label, value, color, border, bg }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
            <p
              className={`text-[10px] font-semibold uppercase tracking-widest ${color} mb-1`}
            >
              {label}
            </p>
            <p className={`text-xl font-bold font-mono-num ${color}`}>
              {formatCurrency(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Net for month */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Net this month
          </p>
          <p
            className={`text-2xl font-bold font-mono-num ${
              net >= 0 ? "text-income" : "text-expense"
            }`}
          >
            {net >= 0 ? "+" : ""}
            {formatCurrency(net)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            All-time balance
          </p>
          <p className="text-lg font-bold font-mono-num">
            {formatCurrency(Number(balance.available_balance))}
          </p>
        </div>
      </div>

      {/* Category spending chart */}
      <SpendingChart
        categories={categories}
        monthName={monthName}
        totalExpense={Number(period.expense_total)}
      />

      {/* Category breakdown table */}
      {categories.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Category Breakdown</h3>
          </div>
          <div className="divide-y divide-border">
            {categories.map((cat) => (
              <div
                key={cat.category_id ?? "uncat"}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.category_icon}</span>
                  <div>
                    <p className="text-sm font-medium">{cat.category_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.pct}% of expenses
                    </p>
                  </div>
                </div>
                <span className="font-mono-num font-semibold text-sm">
                  {formatCurrency(cat.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

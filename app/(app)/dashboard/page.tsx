import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BalanceCard from "@/components/dashboard/balance-card";
import SpecialSavingsCard from "@/components/dashboard/special-savings-card";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import SpendingChart from "@/components/dashboard/spending-chart";
import SummaryCards from "@/components/dashboard/summary-cards";
import { getDashboardData } from "@/lib/finance";

export const instant = false;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { balance, todaySpending, categoryRows, period, recentTx } =
    await getDashboardData(supabase, user.id);

  const now = new Date();
  const monthName = now.toLocaleDateString("en-IN", { month: "long" });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {monthName} {now.getFullYear()}
        </p>
      </div>

      {/* Balance hero */}
      <BalanceCard balance={balance} todaySpending={todaySpending} />

      {/* Special Savings Vault */}
      <SpecialSavingsCard
        vaultBalance={balance.special_savings_balance}
        availableBalance={balance.available_balance}
      />

      {/* This month summary cards */}
      <SummaryCards period={period} monthName={monthName} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendingChart
          categories={categoryRows}
          monthName={monthName}
          totalExpense={Number(period.expense_total)}
        />

        {/* Allocation chart */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">Allocation this month</h3>
          <div className="space-y-3">
            {[
              {
                label: "Spending",
                value: Number(period.expense_total),
                color: "bg-expense",
              },
              {
                label: "Savings",
                value: Number(period.savings_total),
                color: "bg-savings",
              },
              {
                label: "Investments",
                value: Number(period.investment_total),
                color: "bg-investment",
              },
            ].map(({ label, value, color }) => {
              const total =
                Number(period.expense_total) +
                Number(period.savings_total) +
                Number(period.investment_total);
              const pct = total > 0 ? (value / total) * 100 : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono-num font-medium">
                      ₹{value.toLocaleString("en-IN")} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${color}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Recent Transactions</h2>
          <a
            href="/transactions"
            className="text-xs text-primary hover:underline"
          >
            View all →
          </a>
        </div>
        <RecentTransactions transactions={recentTx} />
      </div>
    </div>
  );
}

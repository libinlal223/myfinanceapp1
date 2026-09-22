import { BalanceSummary, formatCurrency } from "@/lib/types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  balance: BalanceSummary;
  todaySpending: number;
}

export default function BalanceCard({ balance, todaySpending }: Props) {
  const isPositive = balance.available_balance >= 0;

  return (
    <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-5 glow-income">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-12 translate-x-12 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/3 rounded-full translate-y-8 -translate-x-8 pointer-events-none" />

      <div className="relative">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
          Available Balance
        </p>
        <p className={`text-4xl md:text-5xl font-bold font-mono-num tracking-tight mb-1 ${isPositive ? "text-foreground" : "text-expense"}`}>
          {formatCurrency(balance.available_balance)}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-5">
          <span>Spendable funds</span>
          {balance.special_savings_balance > 0 && (
            <>
              <span>•</span>
              <span className="text-savings font-medium font-mono-num">
                Vault: {formatCurrency(balance.special_savings_balance)}
              </span>
              <span>•</span>
              <span className="text-foreground font-medium font-mono-num">
                Total Net: {formatCurrency(balance.available_balance + balance.special_savings_balance + balance.investment_total)}
              </span>
            </>
          )}
        </div>

        {/* Grid of stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill
            label="Income"
            value={balance.income_total}
            color="text-income"
            icon={<TrendingUp size={13} />}
          />
          <StatPill
            label="Expenses"
            value={balance.expense_total}
            color="text-expense"
            icon={<TrendingDown size={13} />}
          />
          <StatPill
            label="Savings"
            value={balance.savings_total + (balance.special_savings_balance || 0)}
            color="text-savings"
          />
          <StatPill label="Invested" value={balance.investment_total} color="text-investment" />
        </div>

        {/* Today's spending */}
        {todaySpending > 0 && (
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Today&apos;s spending:</span>
            <span className="text-xs font-semibold text-expense font-mono-num">
              {formatCurrency(todaySpending)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2">
      <div className={`flex items-center gap-1 ${color} mb-0.5`}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-sm font-bold font-mono-num ${color}`}>
        ₹{Number(value).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}

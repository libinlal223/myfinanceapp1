import { PeriodSummary } from "@/lib/types";

interface Props {
  period: PeriodSummary;
  monthName: string;
}

export default function SummaryCards({ period, monthName }: Props) {
  const cards = [
    {
      label: "Income",
      value: Number(period.income_total),
      color: "text-income",
      bg: "bg-income/10",
      border: "border-income/20",
    },
    {
      label: "Expenses",
      value: Number(period.expense_total),
      color: "text-expense",
      bg: "bg-expense/10",
      border: "border-expense/20",
    },
    {
      label: "Savings",
      value: Number(period.savings_total),
      color: "text-savings",
      bg: "bg-savings/10",
      border: "border-savings/20",
    },
    {
      label: "Investments",
      value: Number(period.investment_total),
      color: "text-investment",
      bg: "bg-investment/10",
      border: "border-investment/20",
    },
  ];

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {monthName} Summary
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(({ label, value, color, bg, border }) => (
          <div
            key={label}
            className={`${bg} border ${border} rounded-xl p-3.5`}
          >
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${color} mb-1`}>
              {label}
            </p>
            <p className={`text-lg font-bold font-mono-num ${color}`}>
              ₹{value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

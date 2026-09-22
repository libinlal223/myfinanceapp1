"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CategorySpending } from "@/lib/types";

interface Props {
  categories: CategorySpending[];
  monthName: string;
  totalExpense: number;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#a855f7",
  "#ec4899",
  "#f97316",
];

export default function SpendingChart({ categories, monthName, totalExpense }: Props) {
  if (categories.length === 0 || totalExpense === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center min-h-[220px]">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm text-muted-foreground">No expenses in {monthName} yet</p>
      </div>
    );
  }

  const chartData = categories.slice(0, 8).map((c) => ({
    name: `${c.category_icon} ${c.category_name}`,
    value: Number(c.total),
    pct: Number(c.pct),
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3">Spending by category — {monthName}</h3>
      <div className="flex items-center gap-4">
        {/* Donut chart */}
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={56}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: any) => [`₹${Number(value || 0).toLocaleString("en-IN")}`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5 overflow-hidden">
          {chartData.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate text-muted-foreground flex-1">{d.name}</span>
              <span className="font-medium font-mono-num text-foreground shrink-0">
                {d.pct.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

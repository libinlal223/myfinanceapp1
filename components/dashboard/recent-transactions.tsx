import Link from "next/link";
import { Transaction, TYPE_CONFIG, formatCurrency, formatDateShort } from "@/lib/types";
import { ArrowRight } from "lucide-react";

interface Props {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <h3 className="text-sm font-semibold">Recent Transactions</h3>
        <Link
          href="/transactions"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <span className="text-3xl mb-2">💸</span>
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Tap <strong>+</strong> to add your first one.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {transactions.map((tx) => {
            const config = TYPE_CONFIG[tx.type];
            return (
              <li key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-base leading-none">
                    {tx.categories?.icon ?? config.icon}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tx.note || tx.categories?.name || config.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.categories?.name && tx.note ? `${tx.categories.name} · ` : ""}
                    {formatDateShort(tx.transaction_date)}
                  </p>
                </div>

                {/* Amount */}
                <p className={`text-sm font-bold font-mono-num ${config.color} flex-shrink-0`}>
                  {config.sign}{formatCurrency(tx.amount)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Transaction, TYPE_CONFIG, formatCurrency, formatDate } from "@/lib/types";
import TransactionItem from "@/components/transactions/transaction-item";

interface SearchParams {
  page?: string;
}

export const instant = false;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const limit = 25;
  const offset = (page - 1) * limit;

  const { data: transactions, count } = await supabase
    .from("transactions")
    .select("*, categories(id, name, icon)", { count: "exact" })
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const totalPages = Math.ceil((count ?? 0) / limit);

  // Group by date
  const grouped = groupByDate(transactions ?? []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{count ?? 0} total</p>
      </div>

      {transactions?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-xl">
          <span className="text-4xl mb-3">💸</span>
          <p className="font-medium mb-1">No transactions yet</p>
          <p className="text-sm text-muted-foreground">Tap + to add your first transaction</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {formatDate(date)}
                </p>
                <div className="flex-1 h-px bg-border" />
                <p className="text-xs text-muted-foreground font-mono-num">
                  {getDayNet(txs)}
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                {txs.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <a
              href={`/transactions?page=${page - 1}`}
              className="px-4 py-2 text-sm rounded-lg bg-card border border-border hover:bg-accent transition-colors"
            >
              Previous
            </a>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/transactions?page=${page + 1}`}
              className="px-4 py-2 text-sm rounded-lg bg-card border border-border hover:bg-accent transition-colors"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function groupByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  return transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const date = tx.transaction_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {});
}

function getDayNet(transactions: Transaction[]): string {
  let net = 0;
  for (const tx of transactions) {
    if (tx.type === "income") net += Number(tx.amount);
    else net -= Number(tx.amount);
  }
  const sign = net >= 0 ? "+" : "";
  return `${sign}₹${Math.abs(net).toLocaleString("en-IN")}`;
}

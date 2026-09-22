"use client";

import { useState, useTransition } from "react";
import { Transaction, TYPE_CONFIG, formatCurrency, formatDateShort } from "@/lib/types";
import { deleteTransaction } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import EditTransactionModal from "./edit-transaction-modal";

interface Props {
  transaction: Transaction;
}

export default function TransactionItem({ transaction: tx }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const config = TYPE_CONFIG[tx.type];

  function handleDelete() {
    startTransition(async () => {
      await deleteTransaction(tx.id);
    });
  }

  return (
    <>
      <div className={cn("flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors group", isPending && "opacity-50")}>
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
          <span className="text-base leading-none">
            {tx.categories?.icon ?? config.icon}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowEdit(true)}>
          <p className="text-sm font-medium truncate">
            {tx.note || tx.categories?.name || config.label}
          </p>
          <p className="text-xs text-muted-foreground">
            {tx.categories?.name && tx.note ? `${tx.categories.name} · ` : ""}
            <span className={`text-[10px] uppercase tracking-wide ${config.color}`}>{config.label}</span>
          </p>
        </div>

        {/* Amount */}
        <p className={`text-sm font-bold font-mono-num ${config.color} flex-shrink-0`}>
          {config.sign}{formatCurrency(tx.amount)}
        </p>

        {/* Actions (appear on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowEdit(true)}
            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            aria-label="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            aria-label="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowDeleteConfirm(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold mb-1">Delete transaction?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently remove <strong>{formatCurrency(tx.amount)}</strong> {tx.note ? `"${tx.note}"` : `(${config.label})`}.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}
                className="flex-1 h-9 rounded-lg bg-destructive text-white text-sm hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <EditTransactionModal
          transaction={tx}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}

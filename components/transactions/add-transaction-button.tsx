"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddTransactionModal from "./add-transaction-modal";
import { Category } from "@/lib/types";

interface AddTransactionButtonProps {
  userId: string;
}

export default function AddTransactionButton({ userId }: AddTransactionButtonProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  async function handleOpen() {
    // Fetch categories lazily on first open
    const res = await fetch("/api/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
    }
    setOpen(true);
  }

  return (
    <>
      {/* Floating button */}
      <button
        id="add-transaction-btn"
        onClick={handleOpen}
        aria-label="Add transaction"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all duration-200"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {open && (
        <AddTransactionModal
          userId={userId}
          categories={categories}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

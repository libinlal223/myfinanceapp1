"use client";

import { useState, useTransition } from "react";
import { Category } from "@/lib/types";
import { createCategory, deleteCategory } from "@/lib/actions";
import { Loader2, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const EMOJI_OPTIONS = ["🍔", "🚗", "🛍️", "🎬", "📄", "👨‍👩‍👧", "👤", "🎮", "✈️", "🏠", "💊", "📚", "☕", "🐶", "🎵", "💻", "🏋️", "🎁", "🍺", "⚽"];

interface Props {
  user: { email: string; displayName: string };
  categories: Category[];
}

export default function SettingsClient({ user, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState(EMOJI_OPTIONS[0]);
  const [catError, setCatError] = useState<string | null>(null);

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setCatError(null);
    const fd = new FormData();
    fd.set("name", catName);
    fd.set("icon", catIcon);
    startTransition(async () => {
      const result = await createCategory(fd);
      if (!result.success) { setCatError(result.error); return; }
      setCatName("");
    });
  }

  function handleDeleteCategory(id: string) {
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (!result.success) { setCatError(result.error); return; }
    });
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Account */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Account</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Display name</p>
            <p className="text-sm font-medium">{user.displayName || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Categories</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your expense categories</p>
        </div>

        {/* Existing */}
        <div className="divide-y divide-border">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-5 py-3">
              <span className="text-xl">{cat.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{cat.name}</p>
                {cat.is_default && <p className="text-[10px] text-muted-foreground">Default</p>}
              </div>
              {!cat.is_default && (
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  disabled={isPending}
                  className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-40"
                  aria-label="Delete category"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Add Category</p>
          <form onSubmit={handleAddCategory} className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setCatIcon(em)}
                  className={cn("w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all border",
                    catIcon === em ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                  )}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Category name"
                maxLength={50}
                required
                className="flex-1 h-10 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
              <button
                type="submit"
                disabled={isPending || !catName}
                className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add
              </button>
            </div>
            {catError && <p className="text-xs text-destructive">{catError}</p>}
          </form>
        </div>
      </section>
    </div>
  );
}

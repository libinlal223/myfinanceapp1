"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Schemas ────────────────────────────────────────────────────────────────

const TransactionSchema = z.object({
  type: z.enum(["income", "expense", "savings", "investment"]),
  amount: z.number().positive("Amount must be positive"),
  category_id: z.string().uuid().nullable().optional(),
  note: z.string().max(500).optional().nullable(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
});

const CategorySchema = z.object({
  name: z.string().min(1, "Name required").max(50),
  icon: z.string().min(1, "Icon required"),
});

export type ActionResult = { success: true } | { success: false; error: string };

// ─── Transactions ────────────────────────────────────────────────────────────

export async function createTransaction(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const raw = {
    type: formData.get("type") as string,
    amount: parseFloat(formData.get("amount") as string),
    category_id: (formData.get("category_id") as string) || null,
    note: (formData.get("note") as string) || null,
    transaction_date: formData.get("transaction_date") as string,
  };

  const parsed = TransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const { error } = await supabase.from("transactions").insert({
    ...parsed.data,
    user_id: user.id,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateTransaction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const raw = {
    type: formData.get("type") as string,
    amount: parseFloat(formData.get("amount") as string),
    category_id: (formData.get("category_id") as string) || null,
    note: (formData.get("note") as string) || null,
    transaction_date: formData.get("transaction_date") as string,
  };

  const parsed = TransactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const { error } = await supabase
    .from("transactions")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function createCategory(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const parsed = CategorySchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const { error } = await supabase.from("categories").insert({
    ...parsed.data,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Category name already exists" };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_default", false);

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        error: "Cannot delete: this category is used by transactions",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SearchClient from "./search-client";

export const instant = false;

export default async function SearchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load categories for filter
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon")
    .eq("user_id", user.id)
    .order("name");

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Search</h1>
      <SearchClient userId={user.id} categories={categories ?? []} />
    </div>
  );
}

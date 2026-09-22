import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureDefaultCategories } from "@/lib/finance";
import SettingsClient from "./settings-client";

export const instant = false;

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const categories = await ensureDefaultCategories(supabase, user.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <SettingsClient
        user={{
          email: user.email ?? "",
          displayName: profile?.display_name ?? "",
        }}
        categories={categories}
      />
    </div>
  );
}

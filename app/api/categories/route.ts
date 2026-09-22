import { createClient } from "@/lib/supabase/server";
import { ensureDefaultCategories } from "@/lib/finance";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const categories = await ensureDefaultCategories(supabase, user.id);
  return NextResponse.json(categories);
}

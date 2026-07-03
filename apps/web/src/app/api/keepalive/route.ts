import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Daily Vercel cron ping (vercel.json): keeps the Supabase free-tier project
// from pausing after 7 days of inactivity. Harmless if called by anyone.
export async function GET() {
  try {
    const supabase = createAdminClient();
    await supabase
      .from("projects")
      .select("id", { count: "exact", head: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

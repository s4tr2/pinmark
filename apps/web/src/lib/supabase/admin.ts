import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for the guest API layer. Bypasses RLS — every call site
// must scope queries by project_id resolved from a validated public key.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

import { SELF_HOSTED } from "./config";

// Every function here returns booleans/enums only, never a secret value,
// a token, or a raw error message. /api/health is reachable without auth,
// so what it can leak is bounded by what these functions are allowed to
// return, not by care taken in the route handler.

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CDN_URL",
] as const;

export type EnvCheck = { ok: boolean; missing: string[] };

export function checkEnvVars(
  env: Record<string, string | undefined> = process.env
): EnvCheck {
  const missing = REQUIRED_ENV_VARS.filter((name) => !env[name]);
  return { ok: missing.length === 0, missing };
}

export type MailCheck = { configured: boolean };

export function checkMailConfigured(
  env: Record<string, string | undefined> = process.env
): MailCheck {
  const mailer = env.MAILER;
  if (mailer === "resend") return { configured: Boolean(env.RESEND_API_KEY) };
  if (mailer === "smtp") return { configured: Boolean(env.SMTP_URL) };
  return { configured: false };
}

export function getMode(): "hosted" | "self-hosted" {
  return SELF_HOSTED ? "self-hosted" : "hosted";
}

// Narrow shape, not the full supabase-js client type, so tests can pass a
// minimal fake instead of standing up a real client.
export type HealthSupabaseClient = {
  from: (table: string) => {
    select: (
      columns: string,
      opts?: { head?: boolean; count?: "exact" }
    ) => { limit: (n: number) => PromiseLike<{ error: unknown }> };
  };
};

export type SupabaseCheck = {
  reachable: boolean;
  schemaCurrent: boolean | null;
};

export async function checkSupabaseReachable(
  client: HealthSupabaseClient
): Promise<SupabaseCheck> {
  try {
    const { error } = await client
      .from("projects")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    if (error) return { reachable: false, schemaCurrent: null };
  } catch {
    return { reachable: false, schemaCurrent: null };
  }

  // Narrow, additive check: the newest migration's column. A false here is
  // exactly the "code deployed ahead of the database migration" failure
  // mode, surfaced as a boolean, never the underlying Postgres error text.
  try {
    const { error } = await client
      .from("projects")
      .select("commenting_scope", { head: true })
      .limit(1);
    return { reachable: true, schemaCurrent: !error };
  } catch {
    return { reachable: true, schemaCurrent: false };
  }
}

export type HealthReport = {
  ok: boolean;
  mode: "hosted" | "self-hosted";
  checks: {
    app: true;
    env: EnvCheck;
    supabase: SupabaseCheck;
    mail: MailCheck;
  };
};

export async function getHealthReport(
  makeClient: () => HealthSupabaseClient
): Promise<HealthReport> {
  const env = checkEnvVars();
  const mail = checkMailConfigured();

  let supabase: SupabaseCheck = { reachable: false, schemaCurrent: null };
  if (env.ok) {
    try {
      supabase = await checkSupabaseReachable(makeClient());
    } catch {
      supabase = { reachable: false, schemaCurrent: null };
    }
  }

  const ok = env.ok && supabase.reachable && supabase.schemaCurrent !== false;

  return {
    ok,
    mode: getMode(),
    checks: { app: true, env, supabase, mail },
  };
}

import { describe, expect, it } from "vitest";
import {
  checkEnvVars,
  checkMailConfigured,
  checkSupabaseReachable,
  getHealthReport,
  type HealthSupabaseClient,
} from "./health";

const FULL_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  NEXT_PUBLIC_APP_URL: "https://example.com",
  NEXT_PUBLIC_CDN_URL: "https://example.com",
};

describe("checkEnvVars", () => {
  it("passes when every required var is present", () => {
    expect(checkEnvVars(FULL_ENV)).toEqual({ ok: true, missing: [] });
  });

  it("lists exactly the missing var names, never values", () => {
    const { SUPABASE_SERVICE_ROLE_KEY: _drop, ...partial } = FULL_ENV;
    const result = checkEnvVars(partial);
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(["SUPABASE_SERVICE_ROLE_KEY"]);
  });
});

describe("checkMailConfigured", () => {
  it("is unconfigured when MAILER is unset", () => {
    expect(checkMailConfigured({})).toEqual({ configured: false });
  });

  it("requires RESEND_API_KEY when MAILER=resend", () => {
    expect(checkMailConfigured({ MAILER: "resend" })).toEqual({
      configured: false,
    });
    expect(
      checkMailConfigured({ MAILER: "resend", RESEND_API_KEY: "re_x" })
    ).toEqual({ configured: true });
  });

  it("requires SMTP_URL when MAILER=smtp", () => {
    expect(checkMailConfigured({ MAILER: "smtp" })).toEqual({
      configured: false,
    });
    expect(
      checkMailConfigured({ MAILER: "smtp", SMTP_URL: "smtp://x" })
    ).toEqual({ configured: true });
  });
});

// Minimal fake matching HealthSupabaseClient's shape: distinguishes calls
// by which column was requested, since checkSupabaseReachable makes two
// sequential from("projects").select(...) calls.
function fakeClient(opts: {
  reachable: boolean;
  schemaCurrent: boolean;
}): HealthSupabaseClient {
  return {
    from: () => ({
      select: (columns: string) => ({
        limit: async () => {
          if (!opts.reachable) return { error: { message: "unreachable" } };
          if (columns === "commenting_scope") {
            return opts.schemaCurrent
              ? { error: null }
              : { error: { message: "column does not exist" } };
          }
          return { error: null };
        },
      }),
    }),
  };
}

describe("checkSupabaseReachable", () => {
  it("reports reachable + schema current on a healthy database", async () => {
    const result = await checkSupabaseReachable(
      fakeClient({ reachable: true, schemaCurrent: true })
    );
    expect(result).toEqual({ reachable: true, schemaCurrent: true });
  });

  it("reports schema drift without leaking the underlying error", async () => {
    const result = await checkSupabaseReachable(
      fakeClient({ reachable: true, schemaCurrent: false })
    );
    expect(result).toEqual({ reachable: true, schemaCurrent: false });
  });

  it("reports unreachable when the connection itself fails", async () => {
    const result = await checkSupabaseReachable(
      fakeClient({ reachable: false, schemaCurrent: false })
    );
    expect(result).toEqual({ reachable: false, schemaCurrent: null });
  });

  it("never throws, even if the client itself throws", async () => {
    const throwingClient: HealthSupabaseClient = {
      from: () => ({
        select: () => ({
          limit: async () => {
            throw new Error("SUPABASE_SERVICE_ROLE_KEY=leaked-secret-value");
          },
        }),
      }),
    };
    const result = await checkSupabaseReachable(throwingClient);
    expect(result).toEqual({ reachable: false, schemaCurrent: null });
  });
});

describe("getHealthReport", () => {
  it("is ok when env, supabase, and schema are all healthy", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = FULL_ENV.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
      FULL_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      FULL_ENV.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_APP_URL = FULL_ENV.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_CDN_URL = FULL_ENV.NEXT_PUBLIC_CDN_URL;

    const report = await getHealthReport(() =>
      fakeClient({ reachable: true, schemaCurrent: true })
    );
    expect(report.ok).toBe(true);
    expect(report.checks.supabase).toEqual({
      reachable: true,
      schemaCurrent: true,
    });
  });

  it("is not ok when the schema is behind the deployed code", async () => {
    const report = await getHealthReport(() =>
      fakeClient({ reachable: true, schemaCurrent: false })
    );
    expect(report.ok).toBe(false);
  });

  it("never includes a secret-shaped value anywhere in the report", async () => {
    const report = await getHealthReport(() =>
      fakeClient({ reachable: true, schemaCurrent: true })
    );
    const serialized = JSON.stringify(report);
    expect(serialized).not.toMatch(/service.?role/i);
    expect(serialized).not.toContain(FULL_ENV.SUPABASE_SERVICE_ROLE_KEY);
    expect(serialized).not.toContain(FULL_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  });
});

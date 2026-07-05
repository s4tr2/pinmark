import { NextResponse } from "next/server";
import {
  checkEnvVars,
  checkMailConfigured,
  getHealthReport,
  getMode,
} from "@/lib/health";
import { createAdminClient } from "@/lib/supabase/admin";

// Public, unauthenticated status endpoint for self-hosters and uptime
// checks. Every value returned is a boolean or enum, never a secret, a
// token, a connection string, or a raw error message or stack trace.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await getHealthReport(createAdminClient);
    return NextResponse.json(report, { status: report.ok ? 200 : 503 });
  } catch {
    // Only reachable if createAdminClient itself throws synchronously
    // (Supabase env vars missing/malformed enough to fail construction,
    // not just a failed query). Still report real env/mail status.
    return NextResponse.json(
      {
        ok: false,
        mode: getMode(),
        checks: {
          app: true,
          env: checkEnvVars(),
          supabase: { reachable: false, schemaCurrent: null },
          mail: checkMailConfigured(),
        },
      },
      { status: 503 }
    );
  }
}

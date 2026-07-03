import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// PRD §6.1: per IP + key — 20 comments/hour, 120 reads/min
const LIMITS = {
  read: { max: 120, windowSeconds: 60 },
  write: { max: 20, windowSeconds: 3600 },
} as const;

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Returns true if the request is within limits. Fails open on infrastructure
 * errors: a broken counter table should degrade to "no limiting", not take
 * the product down.
 */
export async function withinRateLimit(
  kind: keyof typeof LIMITS,
  publicKey: string,
  req: NextRequest
): Promise<boolean> {
  const { max, windowSeconds } = LIMITS[kind];
  const windowNo = Math.floor(Date.now() / (windowSeconds * 1000));
  const bucket = `${kind}:${publicKey}:${clientIp(req)}:${windowNo}`;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("bump_rate_limit", {
      p_bucket: bucket,
      p_ttl_seconds: windowSeconds,
    });
    if (error) {
      console.warn("[pinmark] rate limit unavailable:", error.message);
      return true;
    }
    return (data as number) <= max;
  } catch {
    return true;
  }
}

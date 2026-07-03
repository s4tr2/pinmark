import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Split limiter (scale pass):
// - READS are cheap, public, and dominated by widget polling — an
//   approximate per-instance in-memory window is enough to stop abusive
//   loops, and it keeps a DB write off every poll.
// - WRITES are rare and need correctness across instances — they keep the
//   strict Postgres-backed counter.
const READ = { max: 240, windowMs: 60_000 };
const WRITE = { max: 20, windowSeconds: 3600 };

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

const readBuckets = new Map<string, { count: number; windowStart: number }>();

export function withinReadLimit(publicKey: string, req: NextRequest): boolean {
  const key = `${publicKey}:${clientIp(req)}`;
  const now = Date.now();
  const bucket = readBuckets.get(key);

  if (!bucket || now - bucket.windowStart > READ.windowMs) {
    readBuckets.set(key, { count: 1, windowStart: now });
    if (readBuckets.size > 5000) {
      // bound memory on long-lived instances
      for (const [k, v] of readBuckets) {
        if (now - v.windowStart > READ.windowMs) readBuckets.delete(k);
      }
    }
    return true;
  }

  bucket.count += 1;
  return bucket.count <= READ.max;
}

/**
 * Strict DB-backed limit for writes. Fails open on infrastructure errors:
 * a broken counter table should degrade to "no limiting", not downtime.
 */
export async function withinWriteLimit(
  publicKey: string,
  req: NextRequest
): Promise<boolean> {
  const windowNo = Math.floor(Date.now() / (WRITE.windowSeconds * 1000));
  const bucket = `write:${publicKey}:${clientIp(req)}:${windowNo}`;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("bump_rate_limit", {
      p_bucket: bucket,
      p_ttl_seconds: WRITE.windowSeconds,
    });
    if (error) {
      console.warn("[pinmark] rate limit unavailable:", error.message);
      return true;
    }
    return (data as number) <= WRITE.max;
  } catch {
    return true;
  }
}

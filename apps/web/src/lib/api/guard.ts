import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function tokensMatch(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type GuestProject = {
  id: string;
  public_key: string;
  allowed_domains: string[];
  access_mode: "open" | "review_link";
  review_token: string;
  avatar_style: "initial" | "gradient";
};

/**
 * Wildcard-aware hostname match. Port is ignored (compare hostname only).
 * '*.lovable.app' matches 'foo.lovable.app' but NOT 'lovable.app' and NOT
 * 'notlovable.app' (the leading dot is anchored). 'localhost' in the list
 * also allows '127.0.0.1'.
 */
export function hostnameAllowed(hostname: string, patterns: string[]): boolean {
  const host = hostname.toLowerCase();
  for (const raw of patterns) {
    const p = raw.toLowerCase();
    if (p.startsWith("*.")) {
      const suffix = p.slice(1); // ".lovable.app"
      if (host.endsWith(suffix) && host.length > suffix.length) return true;
    } else if (host === p) {
      return true;
    }
  }
  if (
    (host === "127.0.0.1" || host === "localhost") &&
    patterns.some((p) => p.toLowerCase() === "localhost")
  ) {
    return true;
  }
  return false;
}

function requestOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }
  return null;
}

export function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export type GuardResult =
  | { ok: true; project: GuestProject; origin: string }
  | { ok: false; response: NextResponse };

// Per-instance memoization of project lookups (scale pass): projects change
// rarely but are read on every request. Trade-off: settings changes (domains,
// access mode, token/key regeneration) take up to TTL to propagate.
// Invalid keys are cached too, so bad-key floods don't hammer the DB.
const PROJECT_TTL_MS = 30_000;
const projectCache = new Map<
  string,
  { project: GuestProject | null; at: number }
>();

async function lookupProject(key: string): Promise<GuestProject | null> {
  const cached = projectCache.get(key);
  if (cached && Date.now() - cached.at < PROJECT_TTL_MS) return cached.project;

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, public_key, allowed_domains, access_mode, review_token, avatar_style"
    )
    .eq("public_key", key)
    .single();

  projectCache.set(key, { project: project ?? null, at: Date.now() });
  if (projectCache.size > 2000) {
    const cutoff = Date.now() - PROJECT_TTL_MS;
    for (const [k, v] of projectCache) if (v.at < cutoff) projectCache.delete(k);
  }
  return project ?? null;
}

/**
 * Validates public key + request origin against the project's allowlist,
 * and — for review_link projects — the secret review token.
 */
export async function guardGuestRequest(
  req: NextRequest,
  key: string | null,
  reviewToken: string | null
): Promise<GuardResult> {
  // Every rejection carries CORS headers: without them the browser hides
  // the error body and the widget (and its console warning) can only say
  // "Failed to fetch" — undiagnosable for users. Exposing the error code
  // to any origin leaks nothing: the codes are self-describing rejections.
  const origin = requestOrigin(req);
  const reject = (error: string, status: number) =>
    ({
      ok: false,
      response: NextResponse.json(
        { error },
        { status, headers: corsHeaders(origin ?? "*") }
      ),
    }) as const;

  if (!key || !key.startsWith("pk_")) return reject("invalid_key", 401);
  if (!origin) return reject("missing_origin", 403);

  const project = await lookupProject(key);
  if (!project) return reject("invalid_key", 401);

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return reject("bad_origin", 403);
  }

  if (!hostnameAllowed(hostname, project.allowed_domains ?? []))
    return reject("domain_not_allowed", 403);

  if (
    project.access_mode === "review_link" &&
    !tokensMatch(reviewToken, project.review_token)
  )
    return reject("review_token_required", 403);

  return { ok: true, project, origin };
}

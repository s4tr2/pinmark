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

/**
 * Validates public key + request origin against the project's allowlist,
 * and — for review_link projects — the secret review token.
 */
export async function guardGuestRequest(
  req: NextRequest,
  key: string | null,
  reviewToken: string | null
): Promise<GuardResult> {
  if (!key || !key.startsWith("pk_")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "invalid_key" }, { status: 401 }),
    };
  }

  const origin = requestOrigin(req);
  if (!origin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "missing_origin" }, { status: 403 }),
    };
  }

  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, public_key, allowed_domains, access_mode, review_token")
    .eq("public_key", key)
    .single();

  if (!project) {
    return {
      ok: false,
      response: NextResponse.json({ error: "invalid_key" }, { status: 401 }),
    };
  }

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "bad_origin" }, { status: 403 }),
    };
  }

  if (!hostnameAllowed(hostname, project.allowed_domains ?? [])) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "domain_not_allowed" },
        { status: 403 }
      ),
    };
  }

  if (
    project.access_mode === "review_link" &&
    !tokensMatch(reviewToken, project.review_token)
  ) {
    // CORS headers so the widget can read this error and go dormant silently
    return {
      ok: false,
      response: NextResponse.json(
        { error: "review_token_required" },
        { status: 403, headers: corsHeaders(origin) }
      ),
    };
  }

  return { ok: true, project, origin };
}

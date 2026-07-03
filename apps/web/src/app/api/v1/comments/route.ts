import { NextResponse, type NextRequest } from "next/server";
import { corsHeaders, guardGuestRequest } from "@/lib/api/guard";
import { withinRateLimit } from "@/lib/api/ratelimit";
import { notifyNewComment } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Public comment shape. author_token is intentionally absent: guests prove
// ownership of their own comments via the token on writes, never via reads.
const PUBLIC_COLUMNS =
  "id, parent_id, route, anchor, author_name, body, resolved, created_at";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "*";
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const guard = await guardGuestRequest(
    req,
    searchParams.get("key"),
    searchParams.get("token")
  );
  if (!guard.ok) return guard.response;

  if (!(await withinRateLimit("read", guard.project.public_key, req)))
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: corsHeaders(guard.origin) }
    );

  const route = searchParams.get("route") ?? "/";
  const allRoutes = searchParams.get("all") === "1"; // widget threads panel
  const supabase = createAdminClient();

  let commentsQuery = supabase
    .from("comments")
    .select(PUBLIC_COLUMNS)
    .eq("project_id", guard.project.id)
    .order("created_at", { ascending: true });
  if (!allRoutes) commentsQuery = commentsQuery.eq("route", route);

  const [{ data: comments, error }, { data: openPins }] = await Promise.all([
    commentsQuery,
    supabase
      .from("comments")
      .select("route")
      .eq("project_id", guard.project.id)
      .is("parent_id", null)
      .eq("resolved", false),
  ]);

  if (error) {
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: corsHeaders(guard.origin) }
    );
  }

  const counts: Record<string, number> = {};
  for (const row of openPins ?? []) {
    counts[row.route] = (counts[row.route] ?? 0) + 1;
  }

  return NextResponse.json(
    { comments: comments ?? [], counts },
    { headers: corsHeaders(guard.origin) }
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Bounds database growth if a distributed flood gets past per-IP limits;
// the key-regeneration kill switch handles the rest.
const MAX_COMMENTS_PER_PROJECT = 2000;

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const guard = await guardGuestRequest(
    req,
    String(payload.key ?? ""),
    payload.token ? String(payload.token) : null
  );
  if (!guard.ok) return guard.response;

  const headers = corsHeaders(guard.origin);
  const bad = (error: string) =>
    NextResponse.json({ error }, { status: 400, headers });

  if (!(await withinRateLimit("write", guard.project.public_key, req)))
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers });

  const route = String(payload.route ?? "").slice(0, 500);
  const body = String(payload.body ?? "").trim();
  const authorName = String(payload.author_name ?? "").trim();
  const authorToken = String(payload.author_token ?? "");
  const parentId = payload.parent_id ? String(payload.parent_id) : null;
  const anchor = payload.anchor ?? null;

  if (!route) return bad("route_required");
  if (body.length < 1 || body.length > 4000) return bad("body_length");
  if (authorName.length < 1 || authorName.length > 100)
    return bad("author_name_length");
  if (!UUID_RE.test(authorToken)) return bad("author_token_invalid");
  if (parentId && !UUID_RE.test(parentId)) return bad("parent_id_invalid");
  if (anchor !== null && (typeof anchor !== "object" || Array.isArray(anchor)))
    return bad("anchor_invalid");
  if (anchor && JSON.stringify(anchor).length > 4000) return bad("anchor_size");

  const supabase = createAdminClient();

  const { count: existing } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("project_id", guard.project.id);
  if ((existing ?? 0) >= MAX_COMMENTS_PER_PROJECT)
    return NextResponse.json(
      { error: "project_comment_limit" },
      { status: 403, headers }
    );

  if (parentId) {
    // Reply: parent must be a top-level pin in the same project
    const { data: parent } = await supabase
      .from("comments")
      .select("id, project_id, parent_id")
      .eq("id", parentId)
      .single();
    if (!parent || parent.project_id !== guard.project.id || parent.parent_id)
      return bad("parent_not_found");
  } else if (!anchor) {
    return bad("anchor_required");
  }

  const { data: created, error } = await supabase
    .from("comments")
    .insert({
      project_id: guard.project.id,
      parent_id: parentId,
      route,
      anchor: parentId ? null : anchor,
      author_name: authorName,
      author_token: authorToken,
      body,
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers }
    );
  }

  // Notify on new top-level pins only (PRD §8); never blocks the response path
  if (!parentId) {
    await notifyNewComment(guard.project.id, authorName, route, body);
  }

  return NextResponse.json({ comment: created }, { status: 201, headers });
}

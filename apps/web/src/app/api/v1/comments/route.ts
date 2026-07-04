import { NextResponse, type NextRequest } from "next/server";
import { corsHeaders, guardGuestRequest } from "@/lib/api/guard";
import { withinReadLimit, withinWriteLimit } from "@/lib/api/ratelimit";
import { PUBLIC_COLUMNS, validateCommentInput } from "@/lib/api/validate";
import { notifyNewComment } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

  if (!withinReadLimit(guard.project.public_key, req))
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
    {
      comments: comments ?? [],
      counts,
      settings: { avatar_style: guard.project.avatar_style ?? "initial" },
    },
    { headers: corsHeaders(guard.origin) }
  );
}

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

  if (!(await withinWriteLimit(guard.project.public_key, req)))
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers });

  const validated = validateCommentInput(payload);
  if (!validated.ok) return bad(validated.error);
  const { route, body, authorName, authorToken, parentId, anchor } =
    validated.input;

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

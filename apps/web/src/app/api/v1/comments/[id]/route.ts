import { NextResponse, type NextRequest } from "next/server";
import { corsHeaders, guardGuestRequest } from "@/lib/api/guard";
import { withinWriteLimit } from "@/lib/api/ratelimit";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const EDIT_WINDOW_MS = 5 * 60 * 1000; // guests may edit/delete for 5 minutes
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "*";
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

type Ctx = { params: { id: string } };

async function loadOwnComment(
  req: NextRequest,
  id: string,
  payload: Record<string, unknown>
) {
  const guard = await guardGuestRequest(
    req,
    String(payload.key ?? ""),
    payload.token ? String(payload.token) : null
  );
  if (!guard.ok) return { error: guard.response };

  const headers = corsHeaders(guard.origin);
  const fail = (error: string, status: number) => ({
    error: NextResponse.json({ error }, { status, headers }),
  });

  if (!(await withinWriteLimit(guard.project.public_key, req)))
    return fail("rate_limited", 429);

  const authorToken = String(payload.author_token ?? "");
  if (!UUID_RE.test(id) || !UUID_RE.test(authorToken))
    return fail("bad_request", 400);

  const supabase = createAdminClient();
  const { data: comment } = await supabase
    .from("comments")
    .select("id, project_id, author_token, created_at")
    .eq("id", id)
    .single();

  // Same response for wrong project / wrong token / missing row: no oracle.
  if (
    !comment ||
    comment.project_id !== guard.project.id ||
    comment.author_token !== authorToken
  )
    return fail("not_found", 404);

  if (Date.now() - new Date(comment.created_at).getTime() > EDIT_WINDOW_MS)
    return fail("edit_window_expired", 403);

  return { supabase, headers };
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const res = await loadOwnComment(req, params.id, payload);
  if ("error" in res) return res.error;

  const body = String(payload.body ?? "").trim();
  if (body.length < 1 || body.length > 4000)
    return NextResponse.json(
      { error: "body_length" },
      { status: 400, headers: res.headers }
    );

  const { error } = await res.supabase
    .from("comments")
    .update({ body })
    .eq("id", params.id);

  if (error)
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: res.headers }
    );
  return NextResponse.json({ ok: true }, { headers: res.headers });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const res = await loadOwnComment(req, params.id, payload);
  if ("error" in res) return res.error;

  const { error } = await res.supabase
    .from("comments")
    .delete()
    .eq("id", params.id);

  if (error)
    return NextResponse.json(
      { error: "server_error" },
      { status: 500, headers: res.headers }
    );
  return NextResponse.json({ ok: true }, { headers: res.headers });
}

// Pure validation for guest comment writes: everything checkable without
// the database lives here (and is unit-tested); referential checks (parent
// belongs to project) stay in the route.

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const BODY_MAX = 4000;
export const NAME_MAX = 100;
export const ROUTE_MAX = 500;
export const ANCHOR_MAX_BYTES = 4000;

export interface CommentInput {
  route: string;
  body: string;
  authorName: string;
  authorToken: string;
  parentId: string | null;
  anchor: object | null;
}

export type ValidationResult =
  | { ok: true; input: CommentInput }
  | { ok: false; error: string };

export function validateCommentInput(
  payload: Record<string, unknown>
): ValidationResult {
  const fail = (error: string): ValidationResult => ({ ok: false, error });

  const route = String(payload.route ?? "").slice(0, ROUTE_MAX);
  const body = String(payload.body ?? "").trim();
  const authorName = String(payload.author_name ?? "").trim();
  const authorToken = String(payload.author_token ?? "");
  const parentId = payload.parent_id ? String(payload.parent_id) : null;
  const anchor = (payload.anchor ?? null) as object | null;

  if (!route) return fail("route_required");
  if (body.length < 1 || body.length > BODY_MAX) return fail("body_length");
  if (authorName.length < 1 || authorName.length > NAME_MAX)
    return fail("author_name_length");
  if (!UUID_RE.test(authorToken)) return fail("author_token_invalid");
  if (parentId && !UUID_RE.test(parentId)) return fail("parent_id_invalid");
  if (anchor !== null && (typeof anchor !== "object" || Array.isArray(anchor)))
    return fail("anchor_invalid");
  if (anchor && JSON.stringify(anchor).length > ANCHOR_MAX_BYTES)
    return fail("anchor_size");
  if (!parentId && !anchor) return fail("anchor_required");

  return {
    ok: true,
    input: { route, body, authorName, authorToken, parentId, anchor },
  };
}

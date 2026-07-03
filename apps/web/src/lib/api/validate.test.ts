import { describe, expect, it } from "vitest";
import { BODY_MAX, NAME_MAX, validateCommentInput } from "./validate";

const TOKEN = "123e4567-e89b-42d3-a456-426614174000";
const ANCHOR = { route: "/", page_pct: { x: 0.5, y: 0.5 } };

function valid(overrides: Record<string, unknown> = {}) {
  return {
    route: "/checkout",
    body: "the button feels off",
    author_name: "Dana",
    author_token: TOKEN,
    anchor: ANCHOR,
    ...overrides,
  };
}

describe("validateCommentInput", () => {
  it("accepts a well-formed top-level pin", () => {
    const res = validateCommentInput(valid());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.input.parentId).toBeNull();
      expect(res.input.anchor).toEqual(ANCHOR);
    }
  });

  it("accepts a reply without an anchor", () => {
    const res = validateCommentInput(
      valid({ anchor: null, parent_id: TOKEN })
    );
    expect(res.ok).toBe(true);
  });

  it.each([
    ["missing route", valid({ route: "" }), "route_required"],
    ["empty body", valid({ body: "  " }), "body_length"],
    ["oversized body", valid({ body: "x".repeat(BODY_MAX + 1) }), "body_length"],
    ["empty name", valid({ author_name: "" }), "author_name_length"],
    ["oversized name", valid({ author_name: "n".repeat(NAME_MAX + 1) }), "author_name_length"],
    ["malformed author token", valid({ author_token: "not-a-uuid" }), "author_token_invalid"],
    ["missing author token", valid({ author_token: undefined }), "author_token_invalid"],
    ["malformed parent id", valid({ parent_id: "42" }), "parent_id_invalid"],
    ["array as anchor", valid({ anchor: [1, 2] }), "anchor_invalid"],
    ["string as anchor", valid({ anchor: "clickme" }), "anchor_invalid"],
    ["oversized anchor", valid({ anchor: { blob: "x".repeat(5000) } }), "anchor_size"],
    ["top-level pin without anchor", valid({ anchor: null }), "anchor_required"],
  ])("rejects %s", (_label, payload, code) => {
    const res = validateCommentInput(payload as Record<string, unknown>);
    expect(res).toEqual({ ok: false, error: code });
  });

  it("truncates absurdly long routes instead of failing", () => {
    const res = validateCommentInput(valid({ route: "/" + "a".repeat(1000) }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.input.route.length).toBe(500);
  });

  it("coerces injection-shaped values to inert strings, not code", () => {
    const res = validateCommentInput(
      valid({ body: "<script>alert(1)</script>" })
    );
    // validation accepts it as plain text — rendering layers (textContent,
    // React escaping) are responsible for inertness, checked in e2e
    expect(res.ok).toBe(true);
  });
});

describe("read-path token hygiene", () => {
  it("PUBLIC_COLUMNS never exposes author_token", async () => {
    const { PUBLIC_COLUMNS } = await import("./validate");
    expect(PUBLIC_COLUMNS).not.toContain("author_token");
  });
});

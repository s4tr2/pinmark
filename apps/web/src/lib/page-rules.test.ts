import { describe, expect, it } from "vitest";
import {
  commentingEnabledOnRoute,
  parseCommentingPaths,
  routeMatchesPattern,
} from "./page-rules";

describe("page commenting rules", () => {
  it("normalizes paths, URLs, duplicates, and trailing slashes", () => {
    expect(
      parseCommentingPaths(
        "/pricing/\ncheckout/*\nhttps://example.com/docs/?from=nav\n/pricing"
      )
    ).toEqual(["/pricing", "/checkout/*", "/docs"]);
  });

  it("only accepts wildcards at the end", () => {
    expect(() => parseCommentingPaths("/pro*/settings")).toThrow(
      "Wildcards are only supported"
    );
  });

  it("matches exact paths without query strings or hashes", () => {
    expect(routeMatchesPattern("/pricing?plan=pro", "/pricing")).toBe(true);
    expect(routeMatchesPattern("/pricing#faq", "/pricing")).toBe(true);
    expect(routeMatchesPattern("/pricing/team", "/pricing")).toBe(false);
  });

  it("matches wildcard descendants on a segment boundary", () => {
    expect(routeMatchesPattern("/docs", "/docs/*")).toBe(true);
    expect(routeMatchesPattern("/docs/install/vercel", "/docs/*")).toBe(true);
    expect(routeMatchesPattern("/docs-old", "/docs/*")).toBe(false);
  });

  it("supports all, include, and exclude scopes", () => {
    expect(commentingEnabledOnRoute("/anything", "all", [])).toBe(true);
    expect(commentingEnabledOnRoute("/pricing", "include", ["/pricing"])).toBe(
      true
    );
    expect(commentingEnabledOnRoute("/about", "include", ["/pricing"])).toBe(
      false
    );
    expect(commentingEnabledOnRoute("/admin/users", "exclude", ["/admin/*"])).toBe(
      false
    );
    expect(commentingEnabledOnRoute("/about", "exclude", ["/admin/*"])).toBe(
      true
    );
  });
});

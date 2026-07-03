import { describe, expect, it } from "vitest";
import { hostnameAllowed } from "./guard";

// The allowlist is a security boundary: every rule here is load-bearing.
// If a change breaks one of these cases, it is an allowlist bypass or an
// availability regression — not a style preference.
describe("hostnameAllowed", () => {
  describe("exact matches", () => {
    it("matches an exact hostname", () => {
      expect(hostnameAllowed("myproto.vercel.app", ["myproto.vercel.app"])).toBe(true);
    });
    it("is case-insensitive on patterns", () => {
      expect(hostnameAllowed("myproto.vercel.app", ["MyProto.Vercel.App"])).toBe(true);
    });
    it("rejects a different hostname", () => {
      expect(hostnameAllowed("other.vercel.app", ["myproto.vercel.app"])).toBe(false);
    });
    it("rejects a superstring hostname", () => {
      expect(hostnameAllowed("evil-myproto.vercel.app", ["myproto.vercel.app"])).toBe(false);
    });
    it("rejects with an empty allowlist", () => {
      expect(hostnameAllowed("myproto.vercel.app", [])).toBe(false);
    });
  });

  describe("wildcards (dot-anchored)", () => {
    it("matches a subdomain", () => {
      expect(hostnameAllowed("foo.lovable.app", ["*.lovable.app"])).toBe(true);
    });
    it("matches nested subdomains", () => {
      expect(hostnameAllowed("a.b.lovable.app", ["*.lovable.app"])).toBe(true);
    });
    it("does NOT match the apex domain itself", () => {
      expect(hostnameAllowed("lovable.app", ["*.lovable.app"])).toBe(false);
    });
    it("does NOT match a suffix-colliding domain (dot anchoring)", () => {
      expect(hostnameAllowed("notlovable.app", ["*.lovable.app"])).toBe(false);
    });
    it("does NOT match an evil registered domain ending in the suffix", () => {
      expect(hostnameAllowed("evillovable.app", ["*.lovable.app"])).toBe(false);
    });
  });

  describe("localhost convenience", () => {
    it("allows 127.0.0.1 when localhost is listed", () => {
      expect(hostnameAllowed("127.0.0.1", ["localhost"])).toBe(true);
    });
    it("allows localhost when localhost is listed", () => {
      expect(hostnameAllowed("localhost", ["localhost"])).toBe(true);
    });
    it("does NOT allow localhost when only production domains are listed", () => {
      expect(hostnameAllowed("localhost", ["myproto.vercel.app"])).toBe(false);
    });
    it("does NOT let 127.0.0.1 in via a wildcard", () => {
      expect(hostnameAllowed("127.0.0.1", ["*.vercel.app"])).toBe(false);
    });
  });

  describe("hostile inputs", () => {
    it("rejects empty hostname", () => {
      expect(hostnameAllowed("", ["myproto.vercel.app"])).toBe(false);
    });
    it("a bare '*' pattern does not match everything", () => {
      // '*' is not a supported pattern shape; it must not act as allow-all
      expect(hostnameAllowed("evil.example.com", ["*"])).toBe(false);
    });
    it("wildcard pattern requires a name before the suffix dot", () => {
      expect(hostnameAllowed(".lovable.app", ["*.lovable.app"])).toBe(false);
    });
  });
});

import { describe, expect, it } from "vitest";
import { parseDomains } from "./domains";

describe("parseDomains", () => {
  // Regression: 2026-07-03 — a full URL pasted into the allowed-domains
  // field never matched the hostname-based allowlist, so the widget stayed
  // silently invisible on that site.
  it("extracts the hostname from a pasted full URL with a path", () => {
    expect(
      parseDomains("https://scorm-export-prototype.vercel.app/clm-table")
    ).toEqual(["scorm-export-prototype.vercel.app"]);
  });

  it("passes bare hostnames through", () => {
    expect(parseDomains("myproto.vercel.app")).toEqual(["myproto.vercel.app"]);
  });

  it("passes wildcards through untouched", () => {
    expect(parseDomains("*.lovable.app")).toEqual(["*.lovable.app"]);
  });

  it("strips ports", () => {
    expect(parseDomains("localhost:3000")).toEqual(["localhost"]);
  });

  it("handles comma and newline separated mixed lists", () => {
    expect(
      parseDomains("https://a.vercel.app/x, *.lovable.app\nlocalhost")
    ).toEqual(["a.vercel.app", "*.lovable.app", "localhost"]);
  });

  it("lowercases everything", () => {
    expect(parseDomains("MyProto.Vercel.App")).toEqual(["myproto.vercel.app"]);
  });

  it("drops empty entries", () => {
    expect(parseDomains(" , \n ,localhost")).toEqual(["localhost"]);
  });
});

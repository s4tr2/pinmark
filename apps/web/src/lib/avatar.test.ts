import { describe, expect, it } from "vitest";
import { avatarBackground, avatarInitial } from "./avatar";

describe("guest aurora avatars", () => {
  it("is deterministic: same name, same orb, every time", () => {
    expect(avatarBackground("Maya")).toBe(avatarBackground("Maya"));
  });

  it("normalizes case and whitespace to keep identity stable", () => {
    expect(avatarBackground("  MAYA ")).toBe(avatarBackground("maya"));
  });

  it("different names get different orbs", () => {
    expect(avatarBackground("Maya")).not.toBe(avatarBackground("Arjun"));
  });

  it("produces valid gradient CSS", () => {
    const bg = avatarBackground("Maya");
    expect(bg).toContain("radial-gradient");
    expect(bg).toContain("linear-gradient");
    expect(bg).toMatch(/oklch\(/);
  });

  it("initial: first letter uppercased, ? for empty", () => {
    expect(avatarInitial("maya")).toBe("M");
    expect(avatarInitial("  ")).toBe("?");
  });
});

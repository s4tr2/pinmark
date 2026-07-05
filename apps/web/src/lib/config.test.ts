import { afterEach, describe, expect, it, vi } from "vitest";

// SELF_HOSTED is read from process.env at module load, so each case needs
// a fresh module evaluation rather than re-importing the cached one.
async function loadWithEnv(value: string | undefined) {
  vi.resetModules();
  if (value === undefined) delete process.env.NEXT_PUBLIC_SELF_HOSTED;
  else process.env.NEXT_PUBLIC_SELF_HOSTED = value;
  return import("./config");
}

describe("SELF_HOSTED", () => {
  const original = process.env.NEXT_PUBLIC_SELF_HOSTED;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SELF_HOSTED;
    else process.env.NEXT_PUBLIC_SELF_HOSTED = original;
  });

  it('is true only for the exact string "true"', async () => {
    const { SELF_HOSTED } = await loadWithEnv("true");
    expect(SELF_HOSTED).toBe(true);
  });

  it('is false for "false"', async () => {
    const { SELF_HOSTED } = await loadWithEnv("false");
    expect(SELF_HOSTED).toBe(false);
  });

  it("defaults to false when unset, so hosted behavior never changes silently", async () => {
    const { SELF_HOSTED } = await loadWithEnv(undefined);
    expect(SELF_HOSTED).toBe(false);
  });

  it("is false for near-miss values like truthy strings or wrong case", async () => {
    for (const value of ["1", "yes", "TRUE", "True"]) {
      const { SELF_HOSTED } = await loadWithEnv(value);
      expect(SELF_HOSTED).toBe(false);
    }
  });
});

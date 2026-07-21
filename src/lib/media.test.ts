import { describe, expect, it } from "vitest";

import { coverImageSchema } from "./media";

describe("coverImageSchema", () => {
  it("accepts local uploads and external HTTP(S) URLs", () => {
    expect(coverImageSchema.safeParse("").success).toBe(true);
    expect(coverImageSchema.safeParse("/uploads/2026-07/example.png").success).toBe(true);
    expect(coverImageSchema.safeParse("https://example.com/cover.png").success).toBe(true);
    expect(coverImageSchema.safeParse("http://example.com/cover.png").success).toBe(true);
  });

  it("rejects non-HTTP URLs and arbitrary strings", () => {
    expect(coverImageSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(coverImageSchema.safeParse("cover.png").success).toBe(false);
  });
});

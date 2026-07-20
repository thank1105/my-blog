// Phase 7 / Day 1 -- tags schema + helper tests.

import { describe, it, expect } from "vitest";

import {
  createTagSchema,
  listTagsQuerySchema,
  DuplicateTagSlugError,
} from "./tags";

const base = {
  name: "react",
  slug: "react",
  description: "UI library",
  color: "#61DAFB",
};

describe("createTagSchema", () => {
  it("accepts a minimal valid input", () => {
    const r = createTagSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const r = createTagSchema.safeParse({ ...base, name: "" });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid slug", () => {
    const r = createTagSchema.safeParse({ ...base, slug: "Bad Slug!" });
    expect(r.success).toBe(false);
  });

  it("accepts a hex color with hash", () => {
    const r = createTagSchema.safeParse({ ...base, color: "#ff00ff" });
    expect(r.success).toBe(true);
  });

  it("accepts a hex color without hash", () => {
    const r = createTagSchema.safeParse({ ...base, color: "ff00ff" });
    expect(r.success).toBe(true);
  });

  it("rejects a non-hex color", () => {
    const r = createTagSchema.safeParse({ ...base, color: "blue" });
    expect(r.success).toBe(false);
  });

  it("accepts empty color (nullish in storage)", () => {
    const r = createTagSchema.safeParse({ ...base, color: "" });
    expect(r.success).toBe(true);
  });
});

describe("listTagsQuerySchema", () => {
  it("coerces a free-text q", () => {
    const r = listTagsQuerySchema.safeParse({ q: "rea" });
    expect(r.success).toBe(true);
  });
});

describe("DuplicateTagSlugError", () => {
  it("has a meaningful name + message", () => {
    const err = new DuplicateTagSlugError("dup");
    expect(err.name).toBe("DuplicateTagSlugError");
    expect(err.message).toContain("dup");
    expect(err).toBeInstanceOf(Error);
  });
});
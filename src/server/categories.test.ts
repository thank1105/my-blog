// Phase 7 / Day 1 -- categories schema + helper tests.

import { describe, it, expect } from "vitest";

import {
  createCategorySchema,
  listCategoriesQuerySchema,
  DuplicateCategorySlugError,
} from "./categories";

const base = {
  name: "Essays",
  slug: "essays",
  description: "Long-form writing",
  type: "ARTICLE" as const,
  order: 0,
};

describe("createCategorySchema", () => {
  it("accepts a minimal valid input", () => {
    const r = createCategorySchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const r = createCategorySchema.safeParse({ ...base, name: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("name"))).toBe(true);
    }
  });

  it("rejects an invalid slug", () => {
    const r = createCategorySchema.safeParse({ ...base, slug: "Bad Slug!" });
    expect(r.success).toBe(false);
  });

  it("accepts a valid slug", () => {
    const r = createCategorySchema.safeParse({ ...base, slug: "essays" });
    expect(r.success).toBe(true);
  });

  it("rejects an invalid type", () => {
    const r = createCategorySchema.safeParse({ ...base, type: "FOO" });
    expect(r.success).toBe(false);
  });

  it("accepts PROJECT type", () => {
    const r = createCategorySchema.safeParse({ ...base, type: "PROJECT" });
    expect(r.success).toBe(true);
  });

  it("rejects negative order", () => {
    const r = createCategorySchema.safeParse({ ...base, order: -1 });
    expect(r.success).toBe(false);
  });
});

describe("listCategoriesQuerySchema", () => {
  it("accepts a valid type", () => {
    const r = listCategoriesQuerySchema.safeParse({ type: "ARTICLE" });
    expect(r.success).toBe(true);
  });

  it("rejects unknown type", () => {
    const r = listCategoriesQuerySchema.safeParse({ type: "FOO" });
    expect(r.success).toBe(false);
  });
});

describe("DuplicateCategorySlugError", () => {
  it("has a meaningful name + message", () => {
    const err = new DuplicateCategorySlugError("dup");
    expect(err.name).toBe("DuplicateCategorySlugError");
    expect(err.message).toContain("dup");
    expect(err).toBeInstanceOf(Error);
  });
});
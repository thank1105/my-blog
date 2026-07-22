import { describe, expect, it } from "vitest";

import { createCategorySchema, DuplicateCategorySlugError, listCategoriesQuerySchema } from "./categories";

const base = { name: "开源项目", slug: "open-source", description: "项目分类", order: 0 };

describe("project category schemas", () => {
  it("accepts a valid project category", () => {
    expect(createCategorySchema.safeParse(base).success).toBe(true);
  });

  it("rejects an invalid name, slug, or order", () => {
    expect(createCategorySchema.safeParse({ ...base, name: "" }).success).toBe(false);
    expect(createCategorySchema.safeParse({ ...base, slug: "Bad Slug" }).success).toBe(false);
    expect(createCategorySchema.safeParse({ ...base, order: -1 }).success).toBe(false);
  });

  it("supports name and slug searches without a content type", () => {
    expect(listCategoriesQuerySchema.safeParse({ q: "open" }).success).toBe(true);
  });

  it("exposes a useful duplicate error", () => {
    const error = new DuplicateCategorySlugError("open-source");
    expect(error.name).toBe("DuplicateCategorySlugError");
    expect(error.message).toContain("open-source");
  });
});

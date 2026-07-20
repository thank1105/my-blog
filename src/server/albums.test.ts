// Phase 6 / Day 1 -- albums schema + helper tests.
//
// Mirrors src/server/projects.test.ts: we only cover pure units.
// DB-touching paths (createAlbum / updateAlbum) are covered by the
// future e2e / Phase 8 acceptance pass.

import { describe, it, expect } from "vitest";

import {
  createAlbumSchema,
  listAlbumsQuerySchema,
  DuplicateAlbumSlugError,
} from "./albums";

describe("createAlbumSchema", () => {
  const base = {
    title: "Tokyo trip 2024",
    slug: "tokyo-2024",
    description: "Cherry blossoms in Ueno",
    coverImage: "",
    visibility: "PUBLIC" as const,
    status: "DRAFT" as const,
  };

  it("accepts a minimal valid input", () => {
    const r = createAlbumSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const r = createAlbumSchema.safeParse({ ...base, title: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("title"))).toBe(true);
    }
  });

  it("rejects an invalid slug", () => {
    const r = createAlbumSchema.safeParse({ ...base, slug: "Bad Slug!" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("slug"))).toBe(true);
    }
  });

  it("accepts a valid slug", () => {
    const r = createAlbumSchema.safeParse({ ...base, slug: "tokyo-2024" });
    expect(r.success).toBe(true);
  });

  it("rejects a slug that is too long", () => {
    const r = createAlbumSchema.safeParse({ ...base, slug: "a".repeat(81) });
    expect(r.success).toBe(false);
  });

  it("accepts PASSWORD visibility (password column present)", () => {
    const r = createAlbumSchema.safeParse({ ...base, visibility: "PASSWORD", password: "secret123" });
    expect(r.success).toBe(true);
  });

  it("rejects an unknown status", () => {
    const r = createAlbumSchema.safeParse({ ...base, status: "FUTURE" });
    expect(r.success).toBe(false);
  });

  it("trims title and description", () => {
    const r = createAlbumSchema.safeParse({
      ...base,
      title: "  padded  ",
      description: "  desc  ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.title).toBe("padded");
      expect(r.data.description).toBe("desc");
    }
  });

  it("accepts empty description / coverImage", () => {
    const r = createAlbumSchema.safeParse({
      ...base,
      description: "",
      coverImage: "",
    });
    expect(r.success).toBe(true);
  });
});

describe("listAlbumsQuerySchema", () => {
  it("coerces numeric page params", () => {
    const r = listAlbumsQuerySchema.safeParse({ page: "2", pageSize: "10" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.page).toBe(2);
      expect(r.data.pageSize).toBe(10);
    }
  });

  it("rejects unknown statuses", () => {
    const r = listAlbumsQuerySchema.safeParse({ status: "FUTURE" });
    expect(r.success).toBe(false);
  });
});

describe("DuplicateAlbumSlugError", () => {
  it("has a meaningful name + message", () => {
    const err = new DuplicateAlbumSlugError("dup-slug");
    expect(err.name).toBe("DuplicateAlbumSlugError");
    expect(err.message).toContain("dup-slug");
    expect(err).toBeInstanceOf(Error);
  });
});
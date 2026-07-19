// Phase 5 / Day 1 -- schema + helpers for the projects server.
//
// We only test pure units; DB-touching paths (createProject / updateProject)
// are covered by the future e2e / Phase 8 acceptance pass. The schema is
// the public contract the form talks to, so getting it wrong here would
// cascade into every form submit.

import { describe, it, expect } from "vitest";

import {
  createProjectSchema,
  listProjectsQuerySchema,
  flattenProjectTags,
  flattenProjectImages,
} from "./projects";

describe("createProjectSchema", () => {
  const base = {
    title: "我的第一个作品",
    description: "用 markdown 写的简介，描述项目背景、过程和结论。",
    visibility: "PUBLIC" as const,
    status: "DRAFT" as const,
    tagIds: [] as string[],
    images: [] as { imageUrl: string }[],
    order: 999,
    featured: false,
  };

  it("accepts a minimal valid input", () => {
    const result = createProjectSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = createProjectSchema.safeParse({ ...base, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("title"))).toBe(true);
    }
  });

  it("rejects an empty description", () => {
    const result = createProjectSchema.safeParse({ ...base, description: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("description"))).toBe(true);
    }
  });

  it("rejects an invalid slug", () => {
    const result = createProjectSchema.safeParse({ ...base, slug: "Bad Slug!" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("slug"))).toBe(true);
    }
  });

  it("accepts a valid slug", () => {
    const result = createProjectSchema.safeParse({ ...base, slug: "my-cool-project" });
    expect(result.success).toBe(true);
  });

  it("requires >= 4 char password when visibility is PASSWORD", () => {
    const tooShort = createProjectSchema.safeParse({
      ...base,
      visibility: "PASSWORD",
      password: "ab",
    });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      expect(tooShort.error.issues.some((i) => i.path.includes("password"))).toBe(true);
    }

    const ok = createProjectSchema.safeParse({
      ...base,
      visibility: "PASSWORD",
      password: "abcd",
    });
    expect(ok.success).toBe(true);
  });

  it("trims title and description", () => {
    const result = createProjectSchema.safeParse({
      ...base,
      title: "  padded title  ",
      description: "  padded description  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("padded title");
      expect(result.data.description).toBe("padded description");
    }
  });

  it("clamps order to a non-negative integer", () => {
    const result = createProjectSchema.safeParse({ ...base, order: -5 });
    expect(result.success).toBe(false);
  });

  it("accepts gallery images with caption + dimensions", () => {
    const result = createProjectSchema.safeParse({
      ...base,
      images: [
        { imageUrl: "/uploads/2026-07/a.jpg", caption: "封面图", width: 1200, height: 800 },
        { imageUrl: "/uploads/2026-07/b.jpg", caption: "草图" },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.images).toHaveLength(2);
      expect(result.data.images[0]?.caption).toBe("封面图");
    }
  });
});

describe("listProjectsQuerySchema", () => {
  it("coerces numeric page params", () => {
    const result = listProjectsQuerySchema.safeParse({ page: "3", pageSize: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.pageSize).toBe(10);
    }
  });

  it("rejects unknown statuses", () => {
    const result = listProjectsQuerySchema.safeParse({ status: "FUTURE" });
    expect(result.success).toBe(false);
  });
});

describe("flattenProjectTags", () => {
  it("flattens the {tag: {id, name, slug, color}} join", () => {
    const row = {
      id: "p",
      tags: [{ tag: { id: "t1", name: "react", slug: "react", color: "#fff" } }],
    } as unknown as Parameters<typeof flattenProjectTags>[0];
    const out = flattenProjectTags(row);
    expect(out).toEqual([{ id: "t1", name: "react", slug: "react", color: "#fff" }]);
  });
});

describe("flattenProjectImages", () => {
  it("preserves order and tolerates null caption / dimensions", () => {
    const row = {
      id: "p",
      images: [
        { id: "i1", imageUrl: "/a.jpg", caption: null, order: 0, width: 100, height: 200 },
        { id: "i2", imageUrl: "/b.jpg", caption: "second", order: 1, width: null, height: null },
      ],
    } as unknown as Parameters<typeof flattenProjectImages>[0];
    const out = flattenProjectImages(row);
    expect(out).toEqual([
      { id: "i1", imageUrl: "/a.jpg", caption: "", order: 0, width: 100, height: 200 },
      { id: "i2", imageUrl: "/b.jpg", caption: "second", order: 1, width: null, height: null },
    ]);
  });
});

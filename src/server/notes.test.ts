// Phase 4 / Day 1 -- schema + helpers for the notes server.
//
// Mirror of src/server/projects.test.ts in shape; covers the public
// contract the form talks to. DB-touching helpers live in integration
// tests / future e2e; here we only verify pure logic.

import { describe, it, expect } from "vitest";

import {
  createNoteSchema,
  listNotesQuerySchema,
  flattenNoteTags,
} from "./notes";

describe("createNoteSchema", () => {
  const base = {
    title: "我的第一篇笔记",
    content: "随手记一下今天想到的一个小点子……",
    excerpt: "",
    visibility: "PUBLIC" as const,
    status: "DRAFT" as const,
    tagIds: [] as string[],
  };

  it("accepts a minimal valid input", () => {
    const result = createNoteSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = createNoteSchema.safeParse({ ...base, title: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("title"))).toBe(true);
    }
  });

  it("rejects an empty content", () => {
    const result = createNoteSchema.safeParse({ ...base, content: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("content"))).toBe(true);
    }
  });

  it("trims title and content", () => {
    const result = createNoteSchema.safeParse({
      ...base,
      title: "  padded title  ",
      content: "  padded content  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("padded title");
      expect(result.data.content).toBe("padded content");
    }
  });

  it("rejects an invalid slug", () => {
    const result = createNoteSchema.safeParse({ ...base, slug: "Bad Slug!" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("slug"))).toBe(true);
    }
  });

  it("accepts a valid slug", () => {
    const result = createNoteSchema.safeParse({ ...base, slug: "my-first-note" });
    expect(result.success).toBe(true);
  });

  it("requires >= 4 char password when visibility is PASSWORD", () => {
    const tooShort = createNoteSchema.safeParse({
      ...base,
      visibility: "PASSWORD",
      password: "ab",
    });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      expect(tooShort.error.issues.some((i) => i.path.includes("password"))).toBe(true);
    }

    const ok = createNoteSchema.safeParse({
      ...base,
      visibility: "PASSWORD",
      password: "abcd",
    });
    expect(ok.success).toBe(true);
  });

  it("rejects unknown status values", () => {
    const result = createNoteSchema.safeParse({
      ...base,
      status: "FUTURE" as unknown as "DRAFT",
    });
    expect(result.success).toBe(false);
  });
});

describe("listNotesQuerySchema", () => {
  it("coerces numeric page params", () => {
    const result = listNotesQuerySchema.safeParse({ page: "3", pageSize: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.pageSize).toBe(10);
    }
  });

  it("rejects unknown statuses", () => {
    const result = listNotesQuerySchema.safeParse({ status: "FUTURE" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown visibilities", () => {
    const result = listNotesQuerySchema.safeParse({ visibility: "FUTURE" });
    expect(result.success).toBe(false);
  });
});

describe("flattenNoteTags", () => {
  it("flattens the {tag: {id, name, slug, color}} join", () => {
    const row = {
      id: "n",
      tags: [{ tag: { id: "t1", name: "react", slug: "react", color: "#fff" } }],
    } as unknown as Parameters<typeof flattenNoteTags>[0];
    const out = flattenNoteTags(row);
    expect(out).toEqual([{ id: "t1", name: "react", slug: "react", color: "#fff" }]);
  });

  it("returns an empty array for notes without tags", () => {
    const row = {
      id: "n",
      tags: [],
    } as unknown as Parameters<typeof flattenNoteTags>[0];
    expect(flattenNoteTags(row)).toEqual([]);
  });
});

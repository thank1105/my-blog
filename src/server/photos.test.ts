// Phase 6 / Day 1 -- photos schema + helper tests.
//
// Mirrors src/server/projects.test.ts: we only cover pure units.
// DB-touching paths (createPhoto / updatePhoto / movePhotosToAlbum)
// are covered by the future e2e / Phase 8 acceptance pass.

import { describe, it, expect } from "vitest";

import {
  photoInputSchema,
  listPhotosQuerySchema,
  photoRowToForm,
  buildPhotoCreatePayload,
  buildPhotoUpdatePayload,
} from "./photos";

const baseInput = {
  title: "Sunset over West Lake",
  description: "Caught just before golden hour ended.",
  imageUrl: "/uploads/2026-07/sunset.jpg",
  thumbnailUrl: "",
  location: "Hangzhou",
  takenAt: "2026-07-18T18:30",
  albumId: "none",
  visibility: "PUBLIC" as const,
  status: "DRAFT" as const,
  width: 1920,
  height: 1080,
  order: 0,
};

describe("photoInputSchema", () => {
  it("accepts a minimal valid input", () => {
    const r = photoInputSchema.safeParse(baseInput);
    expect(r.success).toBe(true);
  });

  it("rejects an empty imageUrl", () => {
    const r = photoInputSchema.safeParse({ ...baseInput, imageUrl: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("imageUrl"))).toBe(true);
    }
  });

  it("rejects PASSWORD visibility (schema has no password column)", () => {
    // The form is restricted to PUBLIC / PRIVATE because Photo has no
    // password column on the schema. Legacy DB rows can still carry
    // PASSWORD but the admin form does not allow it.
    const r = photoInputSchema.safeParse({ ...baseInput, visibility: "PASSWORD" });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown status", () => {
    const r = photoInputSchema.safeParse({ ...baseInput, status: "FUTURE" });
    expect(r.success).toBe(false);
  });

  it("accepts empty takenAt as unset", () => {
    const r = photoInputSchema.safeParse({ ...baseInput, takenAt: "" });
    expect(r.success).toBe(true);
  });

  it("rejects a non-integer order", () => {
    const r = photoInputSchema.safeParse({ ...baseInput, order: -1 });
    expect(r.success).toBe(false);
  });

  it("rejects a non-positive dimension", () => {
    const r1 = photoInputSchema.safeParse({ ...baseInput, width: 0 });
    expect(r1.success).toBe(false);
    const r2 = photoInputSchema.safeParse({ ...baseInput, height: -10 });
    expect(r2.success).toBe(false);
  });

  it("trims title and description", () => {
    const r = photoInputSchema.safeParse({
      ...baseInput,
      title: "  padded  ",
      description: "  desc  ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.title).toBe("padded");
      expect(r.data.description).toBe("desc");
    }
  });
});

describe("listPhotosQuerySchema", () => {
  it("coerces numeric page params", () => {
    const r = listPhotosQuerySchema.safeParse({ page: "2", pageSize: "50" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.page).toBe(2);
      expect(r.data.pageSize).toBe(50);
    }
  });

  it("rejects unknown statuses", () => {
    const r = listPhotosQuerySchema.safeParse({ status: "FUTURE" });
    expect(r.success).toBe(false);
  });

  it("coerces unassigned=1 to true", () => {
    const r = listPhotosQuerySchema.safeParse({ unassigned: "1" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.unassigned).toBe(true);
    }
  });

  it("leaves unassigned unset when missing", () => {
    const r = listPhotosQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.unassigned).toBeUndefined();
    }
  });
});

describe("photoRowToForm", () => {
  it("maps a DB row into form values, falling back on nullables", () => {
    const form = photoRowToForm({
      id: "p1",
      title: null,
      description: null,
      imageUrl: "/uploads/a.jpg",
      thumbnailUrl: null,
      location: null,
      takenAt: null,
      albumId: null,
      visibility: "PUBLIC",
      password: null,
      status: "DRAFT",
      width: null,
      height: null,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      viewCount: 0,
      authorId: "u1",
      author: { id: "u1", username: "admin", displayName: null, email: "a@b.c" },
      album: null,
    } as never);
    expect(form.title).toBe("");
    expect(form.description).toBe("");
    expect(form.location).toBe("");
    expect(form.takenAt).toBe("");
    expect(form.albumId).toBe("none");
    expect(form.thumbnailUrl).toBe("");
    expect(form.width).toBeNull();
    expect(form.height).toBeNull();
    expect(form.order).toBe(0);
  });

  it("formats a takenAt Date into a datetime-local string", () => {
    const form = photoRowToForm({
      id: "p1",
      title: "T",
      description: null,
      imageUrl: "/a.jpg",
      thumbnailUrl: null,
      location: null,
      takenAt: new Date("2026-07-18T18:30:00Z"),
      albumId: "alb1",
      visibility: "PUBLIC",
      password: null,
      status: "PUBLISHED",
      width: 100,
      height: 200,
      order: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      viewCount: 0,
      authorId: "u1",
      author: { id: "u1", username: "admin", displayName: null, email: "a@b.c" },
      album: { id: "alb1", slug: "tokyo", title: "Tokyo" },
    } as never);
    expect(form.albumId).toBe("alb1");
    expect(form.takenAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(form.width).toBe(100);
    expect(form.height).toBe(200);
    expect(form.order).toBe(5);
  });
});

describe("buildPhotoCreatePayload", () => {
  it("maps albumId='none' to null (no album) and converts takenAt to Date", () => {
    const data = buildPhotoCreatePayload(baseInput, "user-1");
    expect(data.albumId).toBeNull();
    expect(data.authorId).toBe("user-1");
    expect(data.imageUrl).toBe(baseInput.imageUrl);
    expect(data.takenAt).toBeInstanceOf(Date);
    expect(data.width).toBe(1920);
    expect(data.height).toBe(1080);
  });

  it("passes through real album id", () => {
    const data = buildPhotoCreatePayload({ ...baseInput, albumId: "alb-real" }, "u");
    expect(data.albumId).toBe("alb-real");
  });

  it("normalises empty title / description to null", () => {
    const data = buildPhotoCreatePayload({ ...baseInput, title: "", description: "" }, "u");
    expect(data.title).toBeNull();
    expect(data.description).toBeNull();
  });
});

describe("buildPhotoUpdatePayload", () => {
  it("returns a payload without authorId (update does not touch author)", () => {
    const data = buildPhotoUpdatePayload({ ...baseInput, albumId: "alb2" });
    expect((data as Record<string, unknown>).authorId).toBeUndefined();
    expect(data.albumId).toBe("alb2");
    expect(data.takenAt).toBeInstanceOf(Date);
  });
});
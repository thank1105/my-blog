// Phase 6 / Day 1 -- admin-side Album CRUD.
//
// Mirrors src/server/notes.ts: validation schemas, read helpers, and
// write helpers. Albums are containers for `Photo` rows (a photo can
// also stand alone with `albumId = null`). Visibility / status match
// the rest of the content tables so the existing visibility helpers
// can be reused for the public read paths in Day 2.
//
// Note: Album has no `password` column on the schema (only Article /
// Note do), so PASSWORD visibility is not offered in the form. We
// still accept the enum value when reading from old rows so the admin
// does not blow up on legacy data; new albums can only be PUBLIC or
// PRIVATE.

import { z } from "zod";
import { Prisma, type Album, type Status, type Visibility } from "@prisma/client";

import { db } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";

/* ------------------------------------------------------------------ */
/* Schemas (shared with client forms)                                  */
/* ------------------------------------------------------------------ */

/**
 * Visibility values accepted by the form. The DB enum still allows
 * PASSWORD for legacy rows, but the form is restricted to PUBLIC /
 * PRIVATE because there is no `password` column on Album.
 */
export const visibilityValues = ["PUBLIC", "PRIVATE", "PASSWORD"] as const;
export const statusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const titleSchema = z
  .string()
  .trim()
  .min(1, "相册标题不能为空")
  .max(120, "相册标题不超过 120 字");

const slugSchema = z
  .string()
  .trim()
  .max(80, "slug 不超过 80 字")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 仅支持小写字母、数字、连字符")
  .optional()
  .or(z.literal(""));

export const createAlbumSchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  description: z
    .string()
    .trim()
    .max(2000, "描述不超过 2000 字")
    .optional()
    .or(z.literal("")),
  coverImage: z.string().trim().url("封面图需为 URL").optional().or(z.literal("")),
  visibility: z.enum(visibilityValues),
  password: z.string().trim().optional(),
  status: z.enum(statusValues),
});

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = CreateAlbumInput;

export const listAlbumsQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(statusValues).optional(),
  visibility: z.enum(visibilityValues).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type ListAlbumsQuery = z.infer<typeof listAlbumsQuerySchema>;

/* ------------------------------------------------------------------ */
/* Select shape                                                        */
/* ------------------------------------------------------------------ */

export const albumSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  coverImage: true,
  visibility: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  authorId: true,
  author: { select: { id: true, username: true, displayName: true, email: true } },
  // Count photos so the admin list can render `照片 (N)` without N+1.
  _count: { select: { photos: true } },
} satisfies Prisma.AlbumSelect;

export type AlbumRow = Prisma.AlbumGetPayload<{ select: typeof albumSelect }>;

/* ------------------------------------------------------------------ */
/* Slug helpers                                                        */
/* ------------------------------------------------------------------ */

async function existingAlbumSlugs(): Promise<Set<string>> {
  const rows = await db.album.findMany({
    where: { deletedAt: null },
    select: { slug: true },
  });
  return new Set(rows.map((r) => r.slug));
}

export class DuplicateAlbumSlugError extends Error {
  constructor(slug: string) {
    super(`相册 slug 已被占用：${slug}`);
    this.name = "DuplicateAlbumSlugError";
  }
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function getAlbum(id: string): Promise<AlbumRow | null> {
  const row = await db.album.findFirst({
    where: { id, deletedAt: null },
    select: albumSelect,
  });
  return row as unknown as AlbumRow | null;
}

export async function getAlbumBySlug(slug: string): Promise<AlbumRow | null> {
  const row = await db.album.findFirst({
    where: { slug, deletedAt: null },
    select: albumSelect,
  });
  return row as unknown as AlbumRow | null;
}

export async function listAlbums(
  query: ListAlbumsQuery = {},
): Promise<{ rows: AlbumRow[]; total: number; page: number; pageSize: number }> {
  const page = query.page ?? 1;
  const pageSize = Math.min(100, query.pageSize ?? 20);

  const where: Prisma.AlbumWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.visibility ? { visibility: query.visibility } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q } },
            { description: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.album.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: albumSelect,
    }) as unknown as Promise<AlbumRow[]>,
    db.album.count({ where }),
  ]);

  return { rows, total, page, pageSize };
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export interface CreateAlbumContext {
  authorId: string;
}

export async function createAlbum(
  input: CreateAlbumInput,
  ctx: CreateAlbumContext,
): Promise<AlbumRow> {
  let slug = input.slug?.trim() || "";
  if (slug.length === 0) {
    const all = await existingAlbumSlugs();
    slug = uniqueSlug(slugify(input.title), all);
  } else {
    const taken = await db.album.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (taken) throw new DuplicateAlbumSlugError(slug);
  }

  try {
    const data: Prisma.AlbumUncheckedCreateInput = {
      slug,
      title: input.title,
      description: input.description || null,
      coverImage: input.coverImage || null,
      visibility: input.visibility,
      password: input.visibility === "PASSWORD" && input.password ? input.password : null,
      status: input.status,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      authorId: ctx.authorId,
    };
    return (await db.album.create({
      data,
      select: albumSelect,
    })) as unknown as AlbumRow;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateAlbumSlugError(slug);
    }
    throw err;
  }
}

export async function updateAlbum(
  id: string,
  input: UpdateAlbumInput,
): Promise<AlbumRow> {
  const existing = await getAlbum(id);
  if (!existing) throw new Error("相册不存在");

  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    const taken = await db.album.findFirst({
      where: { slug: input.slug, deletedAt: null, NOT: { id } },
      select: { id: true },
    });
    if (taken) throw new DuplicateAlbumSlugError(input.slug);
    slug = input.slug;
  } else if (!input.slug) {
    if (input.title !== existing.title) {
      const all = await existingAlbumSlugs();
      all.delete(existing.slug);
      slug = uniqueSlug(slugify(input.title), all);
    }
  }

  const data: Prisma.AlbumUncheckedUpdateInput = {
    slug,
    title: input.title,
    description: input.description || null,
    coverImage: input.coverImage || null,
    visibility: input.visibility,
    password: input.visibility === "PASSWORD" && input.password ? input.password : null,
    status: input.status,
    publishedAt:
      input.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : null,
  };

  try {
    return (await db.album.update({
      where: { id },
      data,
      select: albumSelect,
    })) as unknown as AlbumRow;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateAlbumSlugError(slug);
    }
    throw err;
  }
}

export async function setAlbumStatus(id: string, status: Status): Promise<void> {
  const existing = await db.album.findFirst({
    where: { id, deletedAt: null },
    select: { status: true, publishedAt: true },
  });
  if (!existing) throw new Error("相册不存在");
  const publishedAt =
    status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt;
  await db.album.update({
    where: { id },
    data: { status, publishedAt },
  });
}

export async function softDeleteAlbum(id: string): Promise<void> {
  await db.album.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function restoreAlbum(id: string): Promise<void> {
  await db.album.update({
    where: { id },
    data: { deletedAt: null },
  });
}

export async function softDeleteAlbums(ids: string[]): Promise<void> {
  await db.album.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

/** Tiny helper for the public read paths: published + non-deleted albums. */
export async function listPublishedAlbumsSimple(): Promise<AlbumRow[]> {
  return (await db.album.findMany({
    where: { status: "PUBLISHED", deletedAt: null, visibility: "PUBLIC" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: albumSelect,
  })) as unknown as AlbumRow[];
}

export type { Album, Status, Visibility };
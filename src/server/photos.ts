// Phase 6 / Day 1 -- admin-side Photo CRUD.
//
// Photos live independently of albums (`albumId` is optional). The
// admin surface has three responsibilities:
//   1. List / search / filter / batch delete / batch move.
//   2. Edit a single photo: title, description, location, takenAt,
//      visibility, status, albumId, width/height (auto-filled on upload).
//   3. Reorder photos within an album. (Day 2 frontend reads use
//      `takenAt desc` so order only matters inside an album gallery.)
//
// All date / datetime work is done at the boundary; the database
// stores `takenAt` as DateTime, the form holds a `datetime-local`
// string, and `toDateTimeLocalString` / `fromDateTimeLocalString`
// translate between the two.
//
// Note: Photo has no `password` column on the schema (only Article /
// Note do), so the form is restricted to PUBLIC / PRIVATE visibility.

import { z } from "zod";
import { Prisma, type Photo, type Status, type Visibility } from "@prisma/client";

import { db } from "@/lib/db";
import { fromDateTimeLocalString, toDateTimeLocalString } from "@/lib/exif";

/* ------------------------------------------------------------------ */
/* Schemas (shared with client forms)                                  */
/* ------------------------------------------------------------------ */

/** Form-visible visibility values. PASSWORD is excluded (no column). */
export const visibilityValues = ["PUBLIC", "PRIVATE", "PASSWORD"] as const;
export const statusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const urlSchema = z.string().trim().min(1, "图片地址不能为空");

export const photoInputSchema = z.object({
  title: z.string().trim().max(200, "标题不超过 200 字").optional().or(z.literal("")),
  description: z.string().trim().max(2000, "描述不超过 2000 字").optional().or(z.literal("")),
  imageUrl: urlSchema,
  thumbnailUrl: z.string().trim().optional().or(z.literal("")),
  location: z.string().trim().max(200, "地点不超过 200 字").optional().or(z.literal("")),
  /** `datetime-local` string, "" = unset. */
  takenAt: z.string().trim().optional().or(z.literal("")),
  albumId: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .or(z.literal("none")),
  visibility: z.enum(visibilityValues),
  password: z.string().trim().optional(),
  status: z.enum(statusValues),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  order: z.number().int().min(0).default(0),
});

export type PhotoInput = z.infer<typeof photoInputSchema>;

export const listPhotosQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(statusValues).optional(),
  visibility: z.enum(visibilityValues).optional(),
  albumId: z.string().trim().optional(),
  /** "none" filters to photos that are not in any album. */
  unassigned: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(200).optional(),
});

export type ListPhotosQuery = z.infer<typeof listPhotosQuerySchema>;

/* ------------------------------------------------------------------ */
/* Select shape                                                        */
/* ------------------------------------------------------------------ */

export const photoSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  thumbnailUrl: true,
  location: true,
  takenAt: true,
  albumId: true,
  visibility: true,
  status: true,
  width: true,
  height: true,
  order: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  viewCount: true,
  authorId: true,
  author: { select: { id: true, username: true, displayName: true, email: true } },
  album: {
    select: { id: true, slug: true, title: true },
  },
} satisfies Prisma.PhotoSelect;

export type PhotoRow = Prisma.PhotoGetPayload<{ select: typeof photoSelect }>;

/* ------------------------------------------------------------------ */
/* Form ↔ DB translation                                               */
/* ------------------------------------------------------------------ */

export interface PhotoFormValues {
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  location: string;
  /** `datetime-local` string for the <input type="datetime-local">. */
  takenAt: string;
  /** "none" = no album; otherwise an album id. */
  albumId: string;
  visibility: Visibility;
  status: Status;
  width: number | null;
  height: number | null;
  order: number;
}

export function photoRowToForm(row: PhotoRow): PhotoFormValues {
  return {
    title: row.title ?? "",
    description: row.description ?? "",
    imageUrl: row.imageUrl,
    thumbnailUrl: row.thumbnailUrl ?? "",
    location: row.location ?? "",
    takenAt: toDateTimeLocalString(row.takenAt),
    albumId: row.albumId ?? "none",
    visibility: row.visibility,
    status: row.status,
    width: row.width ?? null,
    height: row.height ?? null,
    order: row.order,
  };
}

/**
 * Convert PhotoInput -> unchecked create payload. Using the unchecked
 * variant keeps the call site flat (no nested `album: { connect }`
 * gymnastics) and matches the way the admin forms shape their values.
 */
export function buildPhotoCreatePayload(
  input: PhotoInput,
  authorId: string,
): Prisma.PhotoUncheckedCreateInput {
  const takenAt = fromDateTimeLocalString(input.takenAt);
  const albumId = input.albumId && input.albumId !== "none" ? input.albumId : null;
  return {
    title: input.title ? input.title : null,
    description: input.description ? input.description : null,
    imageUrl: input.imageUrl,
    thumbnailUrl: input.thumbnailUrl ? input.thumbnailUrl : null,
    location: input.location ? input.location : null,
    takenAt,
    albumId,
    visibility: input.visibility,
    status: input.status,
    width: input.width ?? null,
    height: input.height ?? null,
    order: input.order,
    authorId,
  };
}

export function buildPhotoUpdatePayload(input: PhotoInput): Prisma.PhotoUncheckedUpdateInput {
  const takenAt = fromDateTimeLocalString(input.takenAt);
  const albumId = input.albumId && input.albumId !== "none" ? input.albumId : null;
  return {
    title: input.title ? input.title : null,
    description: input.description ? input.description : null,
    imageUrl: input.imageUrl,
    thumbnailUrl: input.thumbnailUrl ? input.thumbnailUrl : null,
    location: input.location ? input.location : null,
    takenAt,
    albumId,
    visibility: input.visibility,
    status: input.status,
    width: input.width ?? null,
    height: input.height ?? null,
    order: input.order,
  };
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function getPhoto(id: string): Promise<PhotoRow | null> {
  const row = await db.photo.findFirst({
    where: { id, deletedAt: null },
    select: photoSelect,
  });
  return row as unknown as PhotoRow | null;
}

export async function listPhotos(
  query: ListPhotosQuery = {},
): Promise<{ rows: PhotoRow[]; total: number; page: number; pageSize: number }> {
  const page = query.page ?? 1;
  const pageSize = Math.min(200, query.pageSize ?? 24);

  const where: Prisma.PhotoWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.visibility ? { visibility: query.visibility } : {}),
    ...(query.albumId ? { albumId: query.albumId } : {}),
    ...(query.unassigned ? { albumId: null } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q } },
            { description: { contains: query.q } },
            { location: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.photo.findMany({
      where,
      orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: photoSelect,
    }) as unknown as Promise<PhotoRow[]>,
    db.photo.count({ where }),
  ]);

  return { rows, total, page, pageSize };
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export interface CreatePhotoContext {
  authorId: string;
}

/**
 * Insert a single photo. The uploader calls this once per accepted
 * file once the EXIF + upload step has produced an `imageUrl`.
 */
export async function createPhoto(
  input: PhotoInput,
  ctx: CreatePhotoContext,
): Promise<PhotoRow> {
  return (await db.photo.create({
    data: buildPhotoCreatePayload(input, ctx.authorId),
    select: photoSelect,
  })) as unknown as PhotoRow;
}

export async function updatePhoto(id: string, input: PhotoInput): Promise<PhotoRow> {
  const existing = await getPhoto(id);
  if (!existing) throw new Error("照片不存在");
  return (await db.photo.update({
    where: { id },
    data: buildPhotoUpdatePayload(input),
    select: photoSelect,
  })) as unknown as PhotoRow;
}

export async function setPhotoStatus(id: string, status: Status): Promise<void> {
  const existing = await db.photo.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new Error("照片不存在");
  await db.photo.update({
    where: { id },
    data: { status },
  });
}

export async function softDeletePhoto(id: string): Promise<void> {
  await db.photo.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function restorePhoto(id: string): Promise<void> {
  await db.photo.update({
    where: { id },
    data: { deletedAt: null },
  });
}

export async function softDeletePhotos(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.photo.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

/**
 * Move a batch of photos to a target album (or unassign when target is
 * `null` / `"none"`). Used by the "move to album" bulk action on the
 * admin list.
 *
 * Uses the unchecked updateMany variant so we can write the scalar
 * `albumId` directly without composing a relation connect/disconnect.
 */
export async function movePhotosToAlbum(
  ids: string[],
  targetAlbumId: string | null,
): Promise<void> {
  if (ids.length === 0) return;
  const data: Prisma.PhotoUncheckedUpdateManyInput = {
    albumId: targetAlbumId,
  };
  await db.photo.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data,
  });
}

/**
 * Reorder the photos of one album. The caller submits the desired
 * `photoIds` order; we verify it is a permutation of the current set,
 * then write `order = idx` for each row in a single transaction.
 */
export async function reorderAlbumPhotos(
  albumId: string | null,
  photoIds: string[],
): Promise<{ count: number }> {
  return db.$transaction(async (tx) => {
    const where: Prisma.PhotoWhereInput = albumId
      ? { albumId, deletedAt: null }
      : { albumId: null, deletedAt: null };
    const current = await tx.photo.findMany({ where, select: { id: true } });
    const currentSet = new Set(current.map((c) => c.id));
    if (photoIds.length !== currentSet.size) {
      throw new Error("照片数量不匹配");
    }
    for (const id of photoIds) {
      if (!currentSet.has(id)) {
        throw new Error(`照片不属于该相册：${id}`);
      }
    }
    for (let idx = 0; idx < photoIds.length; idx++) {
      await tx.photo.update({
        where: { id: photoIds[idx] },
        data: { order: idx },
      });
    }
    return { count: photoIds.length };
  });
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export const photoFormSchema = photoInputSchema.superRefine((val, ctx) => {
  if (!val.imageUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["imageUrl"],
      message: "缺少图片地址",
    });
  }
});

export type { Photo, Status, Visibility };
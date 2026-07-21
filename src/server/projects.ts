// Phase 5 / Day 1 server layer for Projects.
//
// Mirrors src/server/articles.ts: validation schemas, read helpers, and
// write helpers. Projects are visually heavy (Behance-style gallery of
// images) so the schema carries a separate `ProjectImage` join table;
// `coverImage` is still a single string for list-page thumbnails, and
// the gallery is the source of truth on the detail page (Day 2).
//
// Soft-delete semantics: same as articles / notes -- `deletedAt` is
// the only flag callers filter on.

import { z } from "zod";
import { Prisma, type Project, type Status, type Visibility } from "@prisma/client";

import { db } from "@/lib/db";
import { coverImageSchema } from "@/lib/media";
import { slugify, uniqueSlug } from "@/lib/slug";

/* ------------------------------------------------------------------ */
/* Schemas (shared with client forms)                                  */
/* ------------------------------------------------------------------ */

export const visibilityValues = ["PUBLIC", "PRIVATE", "PASSWORD"] as const;
export const statusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const titleSchema = z.string().trim().min(1, "标题不能为空").max(120, "标题不超过 120 字");
const slugSchema = z
  .string()
  .trim()
  .max(80, "slug 不超过 80 字")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 仅支持小写字母、数字、连字符")
  .optional()
  .or(z.literal(""));

const projectImageInputSchema = z.object({
  imageUrl: z.string().trim().min(1, "图片地址不能为空"),
  caption: z.string().trim().max(200, "图片说明不超过 200 字").optional().or(z.literal("")),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const createProjectSchema = z
  .object({
    title: titleSchema,
    slug: slugSchema,
    description: z.string().trim().min(1, "描述不能为空").max(2000, "描述不超过 2000 字"),
    coverImage: coverImageSchema,
    categoryId: z.string().trim().optional().or(z.literal("")),
    visibility: z.enum(visibilityValues),
    password: z.string().trim().optional(),
    status: z.enum(statusValues),
    tagIds: z.array(z.string()).default([]),
    images: z.array(projectImageInputSchema).default([]),
    order: z.number().int().min(0).default(999),
    featured: z.boolean().default(false),
  })
  .superRefine((val, ctx) => {
    if (val.visibility === "PASSWORD" && (!val.password || val.password.length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "密码作品至少需要 4 位密码",
      });
    }
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = CreateProjectInput;

export const listProjectsQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(statusValues).optional(),
  visibility: z.enum(visibilityValues).optional(),
  categoryId: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

/* ------------------------------------------------------------------ */
/* Select shape                                                        */
/* ------------------------------------------------------------------ */

export const projectSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  coverImage: true,
  visibility: true,
  password: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  viewCount: true,
  authorId: true,
  categoryId: true,
  order: true,
  featured: true,
  author: { select: { id: true, username: true, displayName: true, email: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: {
    select: { id: true, imageUrl: true, caption: true, order: true, width: true, height: true },
    orderBy: { order: "asc" },
  },
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true, color: true } } },
  },
} satisfies Prisma.ProjectSelect;

export type ProjectRow = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;

export function flattenProjectTags(row: ProjectRow) {
  return row.tags.map((t) => t.tag);
}

/** The select above already orders by `order asc` so we can just map. */
export function flattenProjectImages(row: ProjectRow) {
  return row.images.map((img) => ({
    id: img.id,
    imageUrl: img.imageUrl,
    caption: img.caption ?? "",
    order: img.order,
    width: img.width ?? null,
    height: img.height ?? null,
  }));
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export interface ListProjectsResult {
  rows: ProjectRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listProjects(
  query: ListProjectsQuery = {},
): Promise<ListProjectsResult> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.visibility ? { visibility: query.visibility } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q } },
            { slug: { contains: query.q } },
            { description: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: [{ featured: "desc" }, { order: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: projectSelect,
    }) as unknown as Promise<ProjectRow[]>,
    db.project.count({ where }),
  ]);

  return { rows, total, page, pageSize };
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  return db.project.findFirst({
    where: { id, deletedAt: null },
    select: projectSelect,
  }) as unknown as ProjectRow | null;
}

export function existingProjectSlugs(): Promise<Set<string>> {
  return db.project
    .findMany({ where: { deletedAt: null }, select: { slug: true } })
    .then((rows) => new Set(rows.map((r) => r.slug)));
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export class DuplicateProjectSlugError extends Error {
  constructor(public readonly slug: string) {
    super(`slug 已被使用：${slug}`);
    this.name = "DuplicateProjectSlugError";
  }
}

interface WriteOptions {
  authorId: string;
}

export async function createProject(
  input: CreateProjectInput,
  opts: WriteOptions,
): Promise<ProjectRow> {
  const baseSlug =
    input.slug && input.slug.length > 0 ? input.slug : slugify(input.title);
  if (!baseSlug) {
    throw new Error("无法从标题生成 slug，请手动填写");
  }
  const existing = await existingProjectSlugs();
  const slug = uniqueSlug(baseSlug, existing);

  const data: Prisma.ProjectCreateInput = {
    slug,
    title: input.title,
    description: input.description,
    coverImage: input.coverImage || null,
    visibility: input.visibility,
    status: input.status,
    order: input.order,
    featured: input.featured,
    publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    author: { connect: { id: opts.authorId } },
    ...(input.categoryId
      ? { category: { connect: { id: input.categoryId } } }
      : {}),
    ...(input.visibility === "PASSWORD" && input.password
      ? { password: input.password }
      : {}),
    tags:
      input.tagIds.length > 0
        ? {
            create: input.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    images:
      input.images.length > 0
        ? {
            create: input.images.map((img, idx) => ({
              imageUrl: img.imageUrl,
              caption: img.caption ? img.caption : null,
              width: img.width ?? null,
              height: img.height ?? null,
              order: idx,
            })),
          }
        : undefined,
  };

  try {
    const created = await db.project.create({ data, select: projectSelect });
    return created as unknown as ProjectRow;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateProjectSlugError(slug);
    }
    throw err;
  }
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<ProjectRow> {
  const existing = await getProject(id);
  if (!existing) throw new Error("作品不存在");

  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    const taken = await db.project.findFirst({
      where: { slug: input.slug, deletedAt: null, NOT: { id } },
      select: { id: true },
    });
    if (taken) throw new DuplicateProjectSlugError(input.slug);
    slug = input.slug;
  } else if (!input.slug) {
    if (input.title !== existing.title) {
      const all = await existingProjectSlugs();
      all.delete(existing.slug);
      slug = uniqueSlug(slugify(input.title), all);
    }
  }

  // Reset join rows; the form is the source of truth for the gallery.
  await db.projectTag.deleteMany({ where: { projectId: id } });
  await db.projectImage.deleteMany({ where: { projectId: id } });

  const data: Prisma.ProjectUpdateInput = {
    slug,
    title: input.title,
    description: input.description,
    coverImage: input.coverImage || null,
    visibility: input.visibility,
    status: input.status,
    order: input.order,
    featured: input.featured,
    publishedAt:
      input.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : null,
    ...(input.categoryId
      ? { category: { connect: { id: input.categoryId } } }
      : { category: { disconnect: true } }),
    ...(input.visibility === "PASSWORD" && input.password
      ? { password: input.password }
      : { password: null }),
    tags:
      input.tagIds.length > 0
        ? {
            create: input.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
    images:
      input.images.length > 0
        ? {
            create: input.images.map((img, idx) => ({
              imageUrl: img.imageUrl,
              caption: img.caption ? img.caption : null,
              width: img.width ?? null,
              height: img.height ?? null,
              order: idx,
            })),
          }
        : undefined,
  };

  try {
    return (await db.project.update({
      where: { id },
      data,
      select: projectSelect,
    })) as unknown as ProjectRow;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateProjectSlugError(slug);
    }
    throw err;
  }
}

export async function setProjectStatus(id: string, status: Status): Promise<void> {
  const existing = await db.project.findFirst({
    where: { id, deletedAt: null },
    select: { status: true, publishedAt: true },
  });
  if (!existing) throw new Error("作品不存在");
  const publishedAt =
    status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt;
  await db.project.update({
    where: { id },
    data: { status, publishedAt },
  });
}

export async function softDeleteProject(id: string): Promise<void> {
  await db.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function restoreProject(id: string): Promise<void> {
  await db.project.update({
    where: { id },
    data: { deletedAt: null },
  });
}

export async function softDeleteProjects(ids: string[]): Promise<void> {
  await db.project.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

/* ------------------------------------------------------------------ */
/* Image reordering                                                    */
/* ------------------------------------------------------------------ */

/**
 * Reorder the gallery of a project. The caller submits the desired
 * `imageIds` order; we verify it is a permutation of the current
 * images, then write `order = idx` for each row in a single transaction
 * so a failure midway does not leave the gallery half-sorted.
 */
export async function reorderProjectImages(
  projectId: string,
  imageIds: string[],
): Promise<{ count: number }> {
  return db.$transaction(async (tx) => {
    const current = await tx.projectImage.findMany({
      where: { projectId },
      select: { id: true },
    });
    const currentSet = new Set(current.map((c) => c.id));
    if (imageIds.length !== currentSet.size) {
      throw new Error("图片数量不匹配");
    }
    for (const id of imageIds) {
      if (!currentSet.has(id)) {
        throw new Error(`图片不属于该项目：${id}`);
      }
    }
    for (let idx = 0; idx < imageIds.length; idx++) {
      await tx.projectImage.update({
        where: { id: imageIds[idx] },
        data: { order: idx },
      });
    }
    return { count: imageIds.length };
  });
}

export type { Project, Status, Visibility };
// Phase 7 / Day 1 -- admin-side Tag CRUD + merge.

import { z } from "zod";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";

/* ------------------------------------------------------------------ */
/* Schemas (shared with client forms)                                  */
/* ------------------------------------------------------------------ */

const slugSchema = z
  .string()
  .trim()
  .max(80, "slug 不超过 80 字")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 仅支持小写字母、数字、连字符")
  .optional()
  .or(z.literal(""));

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "标签名称不能为空").max(60, "名称不超过 60 字"),
  slug: slugSchema,
  description: z.string().trim().max(500, "描述不超过 500 字").optional().or(z.literal("")),
  color: z
    .string()
    .trim()
    .max(20)
    .regex(/^#?[0-9a-fA-F]{0,8}$/, "颜色需为 hex 格式")
    .optional()
    .or(z.literal("")),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = CreateTagInput;

export const listTagsQuerySchema = z.object({
  q: z.string().trim().optional(),
});

export type ListTagsQuery = z.infer<typeof listTagsQuerySchema>;

/* ------------------------------------------------------------------ */
/* Select shape                                                        */
/* ------------------------------------------------------------------ */

const tagSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  color: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { articles: true, notes: true, projects: true } },
} satisfies Prisma.TagSelect;

export type TagRow = Prisma.TagGetPayload<{ select: typeof tagSelect }>;

/* ------------------------------------------------------------------ */
/* Slug helpers                                                        */
/* ------------------------------------------------------------------ */

async function existingTagSlugs(): Promise<Set<string>> {
  const rows = await db.tag.findMany({ select: { slug: true } });
  return new Set(rows.map((r) => r.slug));
}

export class DuplicateTagSlugError extends Error {
  constructor(slug: string) {
    super(`标签 slug 已被占用：${slug}`);
    this.name = "DuplicateTagSlugError";
  }
}

function normaliseColor(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

async function resolveSlug(input: { slug?: string; name: string }, excludeId?: string) {
  const all = await existingTagSlugs();
  if (excludeId) {
    const existing = await db.tag.findUnique({
      where: { id: excludeId },
      select: { slug: true },
    });
    if (existing) all.delete(existing.slug);
  }
  if (input.slug && input.slug.trim().length > 0) {
    const taken = await db.tag.findFirst({
      where: { slug: input.slug, NOT: excludeId ? { id: excludeId } : undefined },
      select: { id: true },
    });
    if (taken) throw new DuplicateTagSlugError(input.slug);
    return input.slug;
  }
  return uniqueSlug(slugify(input.name), all);
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function listTags(): Promise<TagRow[]> {
  return (await db.tag.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
    },
  })) as unknown as TagRow[];
}

export async function getTagsByIds(ids: readonly string[]): Promise<TagRow[]> {
  if (ids.length === 0) return [];
  return (await db.tag.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
    },
  })) as unknown as TagRow[];
}

export async function ensureTagByName(name: string): Promise<TagRow> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is empty");
  const slug = slugify(trimmed);
  const all = await db.tag.findMany({ select: { slug: true } });
  const finalSlug = all.find((x) => x.slug === slug)
    ? uniqueSlug(slug, new Set(all.map((x) => x.slug)))
    : slug;
  return (await db.tag.upsert({
    where: { slug: finalSlug },
    create: { slug: finalSlug, name: trimmed },
    update: {},
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
    },
  })) as unknown as TagRow;
}

export async function ensureTagsByNames(names: string[]): Promise<TagRow[]> {
  const out: TagRow[] = [];
  for (const raw of names) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    out.push(await ensureTagByName(trimmed));
  }
  return out;
}


export async function getTag(id: string): Promise<TagRow | null> {
  return (await db.tag.findUnique({
    where: { id },
    select: tagSelect,
  })) as unknown as TagRow | null;
}

export async function listTagsAdmin(
  query: ListTagsQuery = {},
): Promise<TagRow[]> {
  const where: Prisma.TagWhereInput = query.q
    ? {
        OR: [
          { name: { contains: query.q } },
          { slug: { contains: query.q } },
        ],
      }
    : {};

  return (await db.tag.findMany({
    where,
    orderBy: [{ name: "asc" }],
    select: tagSelect,
  })) as unknown as TagRow[];
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export async function createTag(input: CreateTagInput): Promise<TagRow> {
  const slug = await resolveSlug(input);
  const color = normaliseColor(input.color);
  try {
    return (await db.tag.create({
      data: {
        slug,
        name: input.name,
        description: input.description || null,
        color,
      },
      select: tagSelect,
    })) as unknown as TagRow;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateTagSlugError(slug);
    }
    throw err;
  }
}

export async function updateTag(id: string, input: UpdateTagInput): Promise<TagRow> {
  const existing = await getTag(id);
  if (!existing) throw new Error("标签不存在");
  const slug = await resolveSlug(input, id);
  const color = normaliseColor(input.color);
  try {
    return (await db.tag.update({
      where: { id },
      data: {
        slug,
        name: input.name,
        description: input.description || null,
        color,
      },
      select: tagSelect,
    })) as unknown as TagRow;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateTagSlugError(slug);
    }
    throw err;
  }
}

export async function deleteTag(id: string): Promise<void> {
  await db.tag.delete({ where: { id } });
}

/**
 * Merge two tags. All `ArticleTag` / `NoteTag` / `ProjectTag` rows
 * that reference `fromId` are re-pointed at `toId`. Duplicate rows
 * (the same target already linked) are deleted to keep the join
 * tables clean. The source tag is deleted last.
 *
 * Caller is responsible for confirming both ids exist; we re-check
 * inside the transaction and throw if either is missing.
 */
export async function mergeTags(
  fromId: string,
  toId: string,
): Promise<{ moved: number; dropped: number }> {
  if (fromId === toId) {
    throw new Error("源标签和目标标签相同");
  }
  return db.$transaction(async (tx) => {
    const [from, to] = await Promise.all([
      tx.tag.findUnique({ where: { id: fromId }, select: { id: true } }),
      tx.tag.findUnique({ where: { id: toId }, select: { id: true } }),
    ]);
    if (!from) throw new Error(`源标签不存在：${fromId}`);
    if (!to) throw new Error(`目标标签不存在：${toId}`);

    type TargetId = string;
    let moved = 0;
    let dropped = 0;

    // ArticleTag: rows have articleId.
    {
      const rows = await tx.articleTag.findMany({
        where: { tagId: fromId },
        select: { articleId: true, tagId: true },
      });
      for (const row of rows) {
        const targetId: TargetId = row.articleId;
        const existing = await tx.articleTag.findUnique({
          where: { articleId_tagId: { articleId: targetId, tagId: toId } },
        });
        if (existing) {
          await tx.articleTag.delete({
            where: { articleId_tagId: { articleId: row.articleId, tagId: row.tagId } },
          });
          dropped += 1;
        } else {
          await tx.articleTag.update({
            where: { articleId_tagId: { articleId: row.articleId, tagId: row.tagId } },
            data: { tagId: toId },
          });
          moved += 1;
        }
      }
    }
    // NoteTag: rows have noteId.
    {
      const rows = await tx.noteTag.findMany({
        where: { tagId: fromId },
        select: { noteId: true, tagId: true },
      });
      for (const row of rows) {
        const targetId: TargetId = row.noteId;
        const existing = await tx.noteTag.findUnique({
          where: { noteId_tagId: { noteId: targetId, tagId: toId } },
        });
        if (existing) {
          await tx.noteTag.delete({
            where: { noteId_tagId: { noteId: row.noteId, tagId: row.tagId } },
          });
          dropped += 1;
        } else {
          await tx.noteTag.update({
            where: { noteId_tagId: { noteId: row.noteId, tagId: row.tagId } },
            data: { tagId: toId },
          });
          moved += 1;
        }
      }
    }
    // ProjectTag: rows have projectId.
    {
      const rows = await tx.projectTag.findMany({
        where: { tagId: fromId },
        select: { projectId: true, tagId: true },
      });
      for (const row of rows) {
        const targetId: TargetId = row.projectId;
        const existing = await tx.projectTag.findUnique({
          where: { projectId_tagId: { projectId: targetId, tagId: toId } },
        });
        if (existing) {
          await tx.projectTag.delete({
            where: { projectId_tagId: { projectId: row.projectId, tagId: row.tagId } },
          });
          dropped += 1;
        } else {
          await tx.projectTag.update({
            where: { projectId_tagId: { projectId: row.projectId, tagId: row.tagId } },
            data: { tagId: toId },
          });
          moved += 1;
        }
      }
    }

    await tx.tag.delete({ where: { id: fromId } });
    return { moved, dropped };
  });
}
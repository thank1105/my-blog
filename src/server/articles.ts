// Phase 3 / Day 1 server layer for Articles.
//
// Pattern follows src/server/users.ts: one module owns validation schemas,
// write helpers, and read helpers. Page-level server actions live in
// `src/app/(admin)/admin/articles/actions.ts` and just call these.
//
// Note on soft delete: schema already has `deletedAt`. `listArticles` and
// `getArticle` exclude soft-deleted rows by default; `softDeleteArticle`
// sets `deletedAt = new Date()` and `restoreArticle` clears it.

import { z } from "zod";
import { Prisma, type Article, type Status, type Visibility } from "@prisma/client";

import { db } from "@/lib/db";
import { requiredCoverImageSchema } from "@/lib/media";
import { slugify, uniqueSlug } from "@/lib/slug";

/* ------------------------------------------------------------------ */
/* Schemas (shared with client forms)                                  */
/* ------------------------------------------------------------------ */

export const visibilityValues = ["PUBLIC", "PRIVATE", "PASSWORD"] as const;
export const statusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const titleSchema = z.string().trim().min(1, "标题不能为空").max(120, "标题不超过 120 字");
export const createArticleSchema = z
  .object({
    title: titleSchema,
    slug: z.string().trim().max(80).optional(),
    excerpt: z.string().trim().max(280, "摘要不超过 280 字").optional(),
    content: z.string().min(1, "正文不能为空"),
    coverImage: requiredCoverImageSchema,
    columnId: z.string().trim().optional().or(z.literal("")),
    visibility: z.enum(visibilityValues),
    password: z.string().trim().optional(),
    status: z.enum(statusValues),
    tagIds: z.array(z.string()).default([]),
  })
  .superRefine((val, ctx) => {
    if (val.visibility === "PASSWORD" && (!val.password || val.password.length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "密码文章至少需要 4 位密码",
      });
    }
  });

export type CreateArticleInput = z.infer<typeof createArticleSchema>;

// updateArticle shares the same shape as createArticle; there is no
// separate Zod schema to keep them in sync. If they diverge later,
// reintroduce updateArticleSchema here and wire actions to it.
export type UpdateArticleInput = CreateArticleInput;

export const listArticlesQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(statusValues).optional(),
  visibility: z.enum(visibilityValues).optional(),
  columnId: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;

/* ------------------------------------------------------------------ */
/* Select shape (used everywhere we read an article row)               */
/* ------------------------------------------------------------------ */

export const articleSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  coverImage: true,
  visibility: true,
  password: true,
  status: true,
  featured: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  viewCount: true,
  authorId: true,
  columnId: true,
  author: { select: { id: true, username: true, displayName: true, email: true } },
  column: {
    select: {
      id: true,
      name: true,
      slug: true,
      parent: { select: { id: true, name: true, slug: true } },
    },
  },
  tags: {
    select: {
      tag: { select: { id: true, name: true, slug: true, color: true } },
    },
  },
} satisfies Prisma.ArticleSelect;

export type ArticleRow = Prisma.ArticleGetPayload<{ select: typeof articleSelect }>;

/** Flat tag list (most callers don't care about the join shape). */
export function flattenTags(row: ArticleRow) {
  return row.tags.map((t) => t.tag);
}

/* ------------------------------------------------------------------ */
/* Reads                                                                */
/* ------------------------------------------------------------------ */

export interface ListArticlesResult {
  rows: ArticleRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listArticles(
  query: ListArticlesQuery = {},
): Promise<ListArticlesResult> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.ArticleWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.visibility ? { visibility: query.visibility } : {}),
    ...(query.columnId ? { columnId: query.columnId } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q } },
            { slug: { contains: query.q } },
            { excerpt: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: articleSelect,
    }),
    db.article.count({ where }),
  ]);

  return { rows, total, page, pageSize };
}

export async function getArticle(id: string): Promise<ArticleRow | null> {
  return db.article.findFirst({
    where: { id, deletedAt: null },
    select: articleSelect,
  });
}

export async function getArticleBySlug(slug: string): Promise<ArticleRow | null> {
  return db.article.findFirst({
    where: { slug, deletedAt: null },
    select: articleSelect,
  });
}

/** Returns the set of slugs that already exist in the table (used to dedupe). */
export async function existingSlugs(): Promise<Set<string>> {
  const rows = await db.article.findMany({
    where: { deletedAt: null },
    select: { slug: true },
  });
  return new Set(rows.map((r) => r.slug));
}

/* ------------------------------------------------------------------ */
/* Writes                                                               */
/* ------------------------------------------------------------------ */

export class DuplicateArticleSlugError extends Error {
  constructor(public readonly slug: string) {
    super(`slug 已被使用：${slug}`);
    this.name = "DuplicateArticleSlugError";
  }
}

interface WriteOptions {
  authorId: string;
}

export async function createArticle(
  input: CreateArticleInput,
  opts: WriteOptions,
): Promise<ArticleRow> {
  const baseSlug = input.slug && input.slug.length > 0 ? input.slug : slugify(input.title);
  if (!baseSlug) {
    throw new Error("无法从标题生成 slug，请手动填写");
  }
  const existing = await existingSlugs();
  const slug = uniqueSlug(baseSlug, existing);

  const data: Prisma.ArticleCreateInput = {
    slug,
    title: input.title,
    excerpt: input.excerpt || null,
    content: input.content,
    coverImage: input.coverImage,
    visibility: input.visibility,
    status: input.status,
    publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    author: { connect: { id: opts.authorId } },
    ...(input.columnId
      ? { column: { connect: { id: input.columnId } } }
      : {}),
    ...(input.visibility === "PASSWORD" && input.password
      ? { password: input.password }
      : {}),
    tags: input.tagIds.length > 0
      ? { create: input.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) }
      : undefined,
  };

  try {
    const created = await db.article.create({ data, select: articleSelect });
    return created;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateArticleSlugError(slug);
    }
    throw err;
  }
}

export async function updateArticle(
  id: string,
  input: UpdateArticleInput,
): Promise<ArticleRow> {
  const existing = await getArticle(id);
  if (!existing) throw new Error("文章不存在");

  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    // Manual slug change: validate uniqueness (excluding self).
    const taken = await db.article.findFirst({
      where: { slug: input.slug, deletedAt: null, NOT: { id } },
      select: { id: true },
    });
    if (taken) throw new DuplicateArticleSlugError(input.slug);
    slug = input.slug;
  } else if (!input.slug) {
    // Empty input slug -> regenerate from title only if title changed.
    if (input.title !== existing.title) {
      const all = await existingSlugs();
      all.delete(existing.slug);
      slug = uniqueSlug(slugify(input.title), all);
    }
  }

  // Reset ArticleTag join rows, recreate from input.
  await db.articleTag.deleteMany({ where: { articleId: id } });

  const data: Prisma.ArticleUpdateInput = {
    slug,
    title: input.title,
    excerpt: input.excerpt || null,
    content: input.content,
    coverImage: input.coverImage,
    visibility: input.visibility,
    status: input.status,
    publishedAt:
      input.status === "PUBLISHED"
        ? existing.publishedAt ?? new Date()
        : null,
    ...(input.columnId
      ? { column: { connect: { id: input.columnId } } }
      : { column: { disconnect: true } }),
    ...(input.visibility === "PASSWORD" && input.password
      ? { password: input.password }
      : { password: null }),
    tags: input.tagIds.length > 0
      ? { create: input.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) }
      : undefined,
  };

  try {
    return await db.article.update({ where: { id }, data, select: articleSelect });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateArticleSlugError(slug);
    }
    throw err;
  }
}

/**
 * Thinner "autosave" path used by the editor every 30s. Skips slug and
 * tag management so the operation is cheap and idempotent.
 */
export async function autosaveDraft(
  id: string,
  patch: { title?: string; content?: string; excerpt?: string | null },
): Promise<{ updatedAt: Date }> {
  const data: Prisma.ArticleUpdateInput = {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.content !== undefined ? { content: patch.content } : {}),
    ...(patch.excerpt !== undefined
      ? { excerpt: patch.excerpt || null }
      : {}),
  };
  const result = await db.article.update({
    where: { id },
    data,
    select: { updatedAt: true },
  });
  return result;
}

export async function setArticleStatus(
  id: string,
  status: Status,
): Promise<void> {
  const existing = await db.article.findFirst({
    where: { id, deletedAt: null },
    select: { status: true, publishedAt: true },
  });
  if (!existing) throw new Error("文章不存在");
  const publishedAt =
    status === "PUBLISHED"
      ? existing.publishedAt ?? new Date()
      : existing.publishedAt;
  await db.article.update({
    where: { id },
    data: { status, publishedAt },
  });
}

export async function softDeleteArticle(id: string): Promise<void> {
  await db.article.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function restoreArticle(id: string): Promise<void> {
  await db.article.update({
    where: { id },
    data: { deletedAt: null },
  });
}

export type { Article, Status, Visibility };

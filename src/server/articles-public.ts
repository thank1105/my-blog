// Phase 3 / Day 3 -- public-facing article reads.
//
// All helpers here ONLY return PUBLISHED + non-deleted rows. Visibility
// rules are enforced at the boundary (so the caller -- page or API route
// -- never has to remember "did I forget to check deletedAt?").

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { type ArticleRow, articleSelect } from "./articles";

export interface PublicArticleListQuery {
  q?: string;
  categorySlug?: string;
  tagSlug?: string;
  page?: number;
  pageSize?: number;
}

export interface PublicArticleListResult {
  rows: ArticleRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Listing query for the public /articles page + tag/category filters.
 * Only PUBLISHED articles are returned; everything else is hidden by
 * construction (no opt-in filter needed at the call site).
 */
export async function listPublishedArticles(
  query: PublicArticleListQuery = {},
): Promise<PublicArticleListResult> {
  const page = query.page ?? 1;
  const pageSize = Math.min(48, query.pageSize ?? 12);

  const where: Prisma.ArticleWhereInput = {
    status: "PUBLISHED",
    deletedAt: null,
    ...(query.categorySlug ? { category: { slug: query.categorySlug } } : {}),
    ...(query.tagSlug ? { tags: { some: { tag: { slug: query.tagSlug } } } } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q } },
            { excerpt: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: articleSelect,
    }) as unknown as Promise<ArticleRow[]>,
    db.article.count({ where }),
  ]);

  return { rows, total, page, pageSize };
}

/**
 * Fetch a single article by slug for the public detail page. Returns
 * `null` when no PUBLISHED article exists with that slug (so the page
 * can render notFound()).
 */
export async function getArticleBySlugForPublic(
  slug: string,
): Promise<ArticleRow | null> {
  return db.article.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    select: articleSelect,
  }) as unknown as ArticleRow | null;
}

/**
 * Bump `viewCount`. Caller is responsible for the dedupe (the cookie
 * gate lives in the page-level route handler so we can keep this fn
 * idempotent + trivially mockable).
 */
export async function incrementArticleView(id: string): Promise<void> {
  await db.article.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    select: { id: true },
  });
}

/**
 * Pick up to `limit` related articles for the given article: same
 * category first, then shared tags. Excludes the source article. Only
 * PUBLISHED + non-deleted rows.
 */
export async function listRelatedArticles(
  articleId: string,
  limit = 3,
): Promise<ArticleRow[]> {
  const source = await db.article.findUnique({
    where: { id: articleId },
    select: { id: true, categoryId: true, tags: { select: { tagId: true } } },
  });
  if (!source) return [];

  const tagIds = source.tags.map((t) => t.tagId);

  const sameCategory = source.categoryId
    ? ((await db.article.findMany({
        where: {
          status: "PUBLISHED",
          deletedAt: null,
          id: { not: source.id },
          categoryId: source.categoryId,
        },
        orderBy: [{ publishedAt: "desc" }],
        take: limit,
        select: articleSelect,
      })) as unknown as ArticleRow[])
    : [];

  if (sameCategory.length >= limit) return sameCategory;

  const need = limit - sameCategory.length;
  const takenIds = new Set([source.id, ...sameCategory.map((a) => a.id)]);
  const byTag =
    tagIds.length === 0
      ? []
      : ((await db.article.findMany({
          where: {
            status: "PUBLISHED",
            deletedAt: null,
            id: { notIn: [source.id, ...sameCategory.map((a) => a.id)] },
            tags: { some: { tagId: { in: tagIds } } },
          },
          orderBy: [{ publishedAt: "desc" }],
          take: need + takenIds.size,
          select: articleSelect,
        })) as unknown as ArticleRow[]);

  const seenIds = new Set(takenIds);
  const fillers: ArticleRow[] = [];
  for (const a of byTag) {
    if (seenIds.has(a.id)) continue;
    fillers.push(a);
    seenIds.add(a.id);
    if (fillers.length >= need) break;
  }

  return [...sameCategory, ...fillers].slice(0, limit);
}

/** Categories + published article counts, used by the public sidebar. */
export async function listCategoriesWithCount(): Promise<
  { id: string; name: string; slug: string; count: number }[]
> {
  const cats = await db.category.findMany({
    where: { type: "ARTICLE" },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });
  const counts = await db.article.groupBy({
    by: ["categoryId"],
    where: { status: "PUBLISHED", deletedAt: null, categoryId: { not: null } },
    _count: { _all: true },
  });
  const byId = new Map(counts.map((c) => [c.categoryId as string, c._count._all]));
  return cats.map((c) => ({ ...c, count: byId.get(c.id) ?? 0 }));
}

/** Tags + published article counts. Tags with 0 published articles are hidden. */
export async function listTagsWithCount(): Promise<
  { id: string; name: string; slug: string; color: string | null; count: number }[]
> {
  const tags = await db.tag.findMany({
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, slug: true, color: true },
  });
  const counts = await db.articleTag.groupBy({
    by: ["tagId"],
    where: {
      article: {
        status: "PUBLISHED",
        deletedAt: null,
      },
    },
    _count: { _all: true },
  });
  const byId = new Map(counts.map((c) => [c.tagId, c._count._all]));
  return tags
    .map((t) => ({ ...t, count: byId.get(t.id) ?? 0 }))
    .filter((t) => t.count > 0);
}

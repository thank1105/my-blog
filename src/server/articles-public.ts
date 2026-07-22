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
  columnSlug?: string;
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

export function resolveColumnScopeIds(column: {
  id: string;
  parentId: string | null;
  children: Array<{ id: string }>;
}): string[] {
  return column.parentId
    ? [column.id]
    : [column.id, ...column.children.map((child) => child.id)];
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
  const selectedColumn = query.columnSlug
    ? await db.column.findUnique({
        where: { slug: query.columnSlug },
        select: { id: true, parentId: true, children: { select: { id: true } } },
      })
    : null;

  if (query.columnSlug && !selectedColumn) {
    return { rows: [], total: 0, page, pageSize };
  }

  const columnIds = selectedColumn ? resolveColumnScopeIds(selectedColumn) : undefined;

  const where: Prisma.ArticleWhereInput = {
    status: "PUBLISHED",
    deletedAt: null,
    ...(columnIds ? { columnId: { in: columnIds } } : {}),
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
 * column first, then shared tags. Excludes the source article. Only
 * PUBLISHED + non-deleted rows.
 */
export async function listRelatedArticles(
  articleId: string,
  limit = 3,
): Promise<ArticleRow[]> {
  const source = await db.article.findUnique({
    where: { id: articleId },
    select: { id: true, columnId: true, tags: { select: { tagId: true } } },
  });
  if (!source) return [];

  const tagIds = source.tags.map((t) => t.tagId);

  const sameColumn = source.columnId
    ? ((await db.article.findMany({
        where: {
          status: "PUBLISHED",
          deletedAt: null,
          id: { not: source.id },
          columnId: source.columnId,
        },
        orderBy: [{ publishedAt: "desc" }],
        take: limit,
        select: articleSelect,
      })) as unknown as ArticleRow[])
    : [];

  if (sameColumn.length >= limit) return sameColumn;

  const need = limit - sameColumn.length;
  const takenIds = new Set([source.id, ...sameColumn.map((a) => a.id)]);
  const byTag =
    tagIds.length === 0
      ? []
      : ((await db.article.findMany({
          where: {
            status: "PUBLISHED",
            deletedAt: null,
            id: { notIn: [source.id, ...sameColumn.map((a) => a.id)] },
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

  return [...sameColumn, ...fillers].slice(0, limit);
}

/**
 * Latest N published articles (homepage grid). Optionally exclude one id
 * so the featured hero article is not repeated in the "最新文章" row.
 */
export async function listLatestArticles(
  limit = 3,
  excludeId?: string,
): Promise<ArticleRow[]> {
  return db.article.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: articleSelect,
  }) as unknown as ArticleRow[];
}

/**
 * Pick the homepage hero article: the most recent `featured` article if
 * any exist, otherwise the most recently published one. Returns null when
 * there are no published articles at all.
 */
export async function getFeaturedArticle(): Promise<ArticleRow | null> {
  const featured = (await db.article.findFirst({
    where: { status: "PUBLISHED", deletedAt: null, featured: true },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: articleSelect,
  })) as unknown as ArticleRow | null;
  if (featured) return featured;

  return db.article.findFirst({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: articleSelect,
  }) as unknown as ArticleRow | null;
}

export interface PublicColumnNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  directCount: number;
  totalCount: number;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    count: number;
  }>;
}

/** Two-level column tree with direct and aggregate published article counts. */
export async function listColumnTree(): Promise<PublicColumnNode[]> {
  const roots = await db.column.findMany({
    where: { parentId: null },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      children: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, description: true },
      },
    },
  });
  const counts = await db.article.groupBy({
    by: ["columnId"],
    where: { status: "PUBLISHED", deletedAt: null, columnId: { not: null } },
    _count: { _all: true },
  });
  const byId = new Map(counts.map((item) => [item.columnId as string, item._count._all]));
  return roots.map((root) => {
    const children = root.children.map((child) => ({ ...child, count: byId.get(child.id) ?? 0 }));
    const directCount = byId.get(root.id) ?? 0;
    return {
      ...root,
      directCount,
      totalCount: directCount + children.reduce((sum, child) => sum + child.count, 0),
      children,
    };
  });
}

export async function getPublicColumnBySlug(slug: string) {
  return db.column.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      parent: { select: { id: true, name: true, slug: true } },
      children: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, description: true },
      },
    },
  });
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

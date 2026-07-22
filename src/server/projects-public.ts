// Phase 5 / Day 2 -- public-facing project reads.
//
// Mirrors articles-public.ts / notes-public.ts: only PUBLISHED +
// non-deleted rows make it past the boundary, and visibility rules are
// applied at the data layer so the call site never has to remember to
// filter.

import { Prisma, type Visibility } from "@prisma/client";

import { db } from "@/lib/db";
import { type ProjectRow, projectSelect } from "./projects";

export interface PublicProjectListQuery {
  q?: string;
  categorySlug?: string;
  tagSlug?: string;
  page?: number;
  pageSize?: number;
}

export interface PublicProjectListResult {
  rows: ProjectRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Listing query for the public /projects page + filters.
 * Only PUBLISHED + non-deleted rows. Sorting: featured first, then
 * the manual order field, then most recently updated.
 */
export async function listPublishedProjects(
  query: PublicProjectListQuery = {},
): Promise<PublicProjectListResult> {
  const page = query.page ?? 1;
  const pageSize = Math.min(48, query.pageSize ?? 20);

  const where: Prisma.ProjectWhereInput = {
    status: "PUBLISHED",
    deletedAt: null,
    visibility: "PUBLIC",
    ...(query.categorySlug ? { category: { slug: query.categorySlug } } : {}),
    ...(query.tagSlug ? { tags: { some: { tag: { slug: query.tagSlug } } } } : {}),
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

/**
 * Fetch a single project by slug for the public detail page.
 * Returns null when no PUBLISHED project exists with that slug AND
 * visibility=PUBLIC. PRIVATE / PASSWORD are excluded here; the
 * auth-aware wrapper `getProjectBySlugForViewer` handles them.
 */
export async function getProjectBySlugForPublic(
  slug: string,
): Promise<ProjectRow | null> {
  return db.project.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null, visibility: "PUBLIC" },
    select: projectSelect,
  }) as unknown as ProjectRow | null;
}

/**
 * Visibility-aware variant: ADMINs see everything, USERs see PUBLIC +
 * PRIVATE, PASSWORD requires a matching cookie value. We accept the
 * raw password attempt here so the caller does not have to round-trip
 * through the cookie jar.
 */
export async function getProjectBySlugForViewer(
  slug: string,
  viewer: {
    role: "ADMIN" | "USER" | "GUEST";
    passwordAttempt?: string | null;
  },
): Promise<{ row: ProjectRow; visibility: Visibility } | null> {
  const row = await db.project.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    select: projectSelect,
  }) as unknown as ProjectRow | null;
  if (!row) return null;

  if (viewer.role === "ADMIN") {
    return { row, visibility: row.visibility };
  }

  if (row.visibility === "PUBLIC") {
    return { row, visibility: "PUBLIC" };
  }

  if (row.visibility === "PRIVATE") {
    if (viewer.role === "GUEST") return null;
    return { row, visibility: "PRIVATE" };
  }

  // PASSWORD
  if (!viewer.passwordAttempt) return null;
  if (!safeEqual(viewer.passwordAttempt, row.password)) return null;
  return { row, visibility: "PASSWORD" };
}

/** Bump viewCount. Caller owns the dedupe (cookie gate). */
export async function incrementProjectView(id: string): Promise<void> {
  await db.project.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    select: { id: true },
  });
}

/**
 * Pick up to `limit` related projects: same category first, then
 * shared tags. Excludes the source project. Only PUBLISHED + PUBLIC
 * + non-deleted rows.
 */
export async function listRelatedProjects(
  projectId: string,
  limit = 2,
): Promise<ProjectRow[]> {
  const source = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, categoryId: true, tags: { select: { tagId: true } } },
  });
  if (!source) return [];

  const tagIds = (source as { tags: { tagId: string }[] }).tags.map((t) => t.tagId);

  const sameCategory = (source as { categoryId: string | null }).categoryId
    ? ((await db.project.findMany({
        where: {
          status: "PUBLISHED",
          deletedAt: null,
          visibility: "PUBLIC",
          id: { not: projectId },
          categoryId: (source as { categoryId: string | null }).categoryId as string,
        },
        orderBy: [{ featured: "desc" }, { order: "asc" }, { updatedAt: "desc" }],
        take: limit,
        select: projectSelect,
      })) as unknown as ProjectRow[])
    : [];

  if (sameCategory.length >= limit) return sameCategory;

  const need = limit - sameCategory.length;
  const takenIds = new Set([projectId, ...sameCategory.map((p) => p.id)]);
  const byTag =
    tagIds.length === 0
      ? []
      : ((await db.project.findMany({
          where: {
            status: "PUBLISHED",
            deletedAt: null,
            visibility: "PUBLIC",
            id: { notIn: [projectId, ...sameCategory.map((p) => p.id)] },
            tags: { some: { tagId: { in: tagIds } } },
          },
          orderBy: [{ featured: "desc" }, { order: "asc" }, { updatedAt: "desc" }],
          take: need + takenIds.size,
          select: projectSelect,
        })) as unknown as ProjectRow[]);

  const seenIds = new Set(takenIds);
  const fillers: ProjectRow[] = [];
  for (const p of byTag) {
    if (seenIds.has(p.id)) continue;
    fillers.push(p);
    seenIds.add(p.id);
    if (fillers.length >= need) break;
  }

  return [...sameCategory, ...fillers].slice(0, limit);
}

/** Tags + published project counts. Tags with 0 published projects are hidden. */
export async function listProjectTagsWithCount(): Promise<
  { id: string; name: string; slug: string; color: string | null; count: number }[]
> {
  const tags = await db.tag.findMany({
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, slug: true, color: true },
  });
  const counts = await db.projectTag.groupBy({
    by: ["tagId"],
    where: {
      project: { status: "PUBLISHED", deletedAt: null, visibility: "PUBLIC" },
    },
    _count: { _all: true },
  });
  const byId = new Map(counts.map((c) => [c.tagId, c._count._all]));
  return tags
    .map((t) => ({ ...t, count: byId.get(t.id) ?? 0 }))
    .filter((t) => t.count > 0);
}

/** Categories of type PROJECT + published project counts. */
export async function listProjectCategoriesWithCount(): Promise<
  { id: string; name: string; slug: string; count: number }[]
> {
  const cats = await db.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });
  const counts = await db.project.groupBy({
    by: ["categoryId"],
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      visibility: "PUBLIC",
      categoryId: { not: null },
    },
    _count: { _all: true },
  });
  const byId = new Map(
    counts.map((c) => [c.categoryId as string, c._count._all]),
  );
  return cats.map((c) => ({ ...c, count: byId.get(c.id) ?? 0 }));
}

/** Latest N published projects (homepage snippet). */
export async function listLatestProjects(limit = 4): Promise<ProjectRow[]> {
  return db.project.findMany({
    where: { status: "PUBLISHED", deletedAt: null, visibility: "PUBLIC" },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { updatedAt: "desc" }],
    take: limit,
    select: projectSelect,
  }) as unknown as ProjectRow[];
}

/** Constant-time equality so we never leak the password length. */
function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Re-export so tests can mock without re-importing.
export const __internal = { safeEqual };

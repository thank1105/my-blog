// Phase 7 / Day 2 public category detail page server layer.

import { Prisma, type Status, type Visibility } from "@prisma/client";

import { db } from "@/lib/db";

export interface PublicCategoryArticleRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface PublicCategoryProjectRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface PublicCategoryDetail {
  category: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    type: "ARTICLE" | "PROJECT";
  };
  articles: PublicCategoryArticleRow[];
  projects: PublicCategoryProjectRow[];
  total: number;
}

const PUBLIC_FILTER = {
  deletedAt: null,
  status: "PUBLISHED" as Status,
  visibility: "PUBLIC" as Visibility,
};

export async function getPublicCategoryBySlug(
  slug: string,
): Promise<PublicCategoryDetail | null> {
  const category = await db.category.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      type: true,
    },
  });
  if (!category) return null;

  if (category.type === "ARTICLE") {
    const articles = await db.article.findMany({
      where: { ...PUBLIC_FILTER, categoryId: category.id },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        createdAt: true,
      },
      take: 60,
    });
    return {
      category,
      articles,
      projects: [],
      total: articles.length,
    };
  }

  const projects = await db.project.findMany({
    where: { ...PUBLIC_FILTER, categoryId: category.id },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImage: true,
      publishedAt: true,
      createdAt: true,
    },
    take: 60,
  });
  return {
    category,
    articles: [],
    projects,
    total: projects.length,
  };
}

/** Useful for the home page snippets / sidebar. */
export async function listPublicCategoriesWithCount(): Promise<
  { id: string; slug: string; name: string; description: string | null; type: "ARTICLE" | "PROJECT"; count: number }[]
> {
  const cats = await db.category.findMany({
    orderBy: [{ type: "asc" }, { order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      type: true,
    },
  });
  if (cats.length === 0) return [];

  const [articleCounts, projectCounts] = await Promise.all([
    db.article.groupBy({
      by: ["categoryId"],
      where: {
        ...PUBLIC_FILTER,
        categoryId: { not: null },
      },
      _count: { _all: true },
    }),
    db.project.groupBy({
      by: ["categoryId"],
      where: {
        ...PUBLIC_FILTER,
        categoryId: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  const byId = new Map<string, number>();
  for (const r of articleCounts) {
    if (r.categoryId) byId.set(r.categoryId, (byId.get(r.categoryId) ?? 0) + r._count._all);
  }
  for (const r of projectCounts) {
    if (r.categoryId) byId.set(r.categoryId, (byId.get(r.categoryId) ?? 0) + r._count._all);
  }

  return cats.map((c) => ({ ...c, count: byId.get(c.id) ?? 0 }));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _Unused = Prisma.NoteCountOutputTypeSelect;
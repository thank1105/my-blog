// Phase 7 / Day 2 public tag cloud + tag detail page server layer.

import { Prisma, type Visibility, type Status } from "@prisma/client";

import { db } from "@/lib/db";

export interface PublicTagListEntry {
  id: string;
  slug: string;
  name: string;
  color: string | null;
  description: string | null;
  count: number;
}

/**
 * List every tag with at least one published article / note / project.
 * Returns a stable { tag, count }[] sorted by count desc, then name.
 */
export async function listPublicTagsWithCount(): Promise<PublicTagListEntry[]> {
  const tags = await db.tag.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      color: true,
      description: true,
    },
  });
  if (tags.length === 0) return [];

  const [articleCounts, noteCounts, projectCounts] = await Promise.all([
    db.articleTag.groupBy({
      by: ["tagId"],
      where: {
        article: {
          deletedAt: null,
          status: "PUBLISHED",
          visibility: "PUBLIC",
        },
      },
      _count: { _all: true },
    }),
    db.noteTag.groupBy({
      by: ["tagId"],
      where: {
        note: {
          deletedAt: null,
          status: "PUBLISHED",
          visibility: "PUBLIC",
        },
      },
      _count: { _all: true },
    }),
    db.projectTag.groupBy({
      by: ["tagId"],
      where: {
        project: {
          deletedAt: null,
          status: "PUBLISHED",
          visibility: "PUBLIC",
        },
      },
      _count: { _all: true },
    }),
  ]);

  const byId = new Map<string, number>();
  const add = (rows: { tagId: string; _count: { _all: number } }[]) => {
    for (const r of rows) byId.set(r.tagId, (byId.get(r.tagId) ?? 0) + r._count._all);
  };
  add(articleCounts);
  add(noteCounts);
  add(projectCounts);

  const out: PublicTagListEntry[] = [];
  for (const t of tags) {
    const count = byId.get(t.id) ?? 0;
    if (count > 0) {
      out.push({
        id: t.id,
        slug: t.slug,
        name: t.name,
        color: t.color,
        description: t.description,
        count,
      });
    }
  }
  out.sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name, "zh-Hans"));
  return out;
}

export interface PublicTagDetail {
  tag: {
    id: string;
    slug: string;
    name: string;
    color: string | null;
    description: string | null;
  };
  articles: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: Date | null;
    createdAt: Date;
  }[];
  notes: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: Date | null;
    createdAt: Date;
  }[];
  projects: {
    id: string;
    slug: string;
    title: string;
    description: string;
    coverImage: string | null;
    publishedAt: Date | null;
    createdAt: Date;
  }[];
  total: number;
}

const PUBLIC_FILTER = {
  deletedAt: null,
  status: "PUBLISHED" as Status,
  visibility: "PUBLIC" as Visibility,
};

export async function getPublicTagBySlug(slug: string): Promise<PublicTagDetail | null> {
  const tag = await db.tag.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      color: true,
      description: true,
    },
  });
  if (!tag) return null;

  const [articleRows, noteRows, projectRows] = await Promise.all([
    db.article.findMany({
      where: { ...PUBLIC_FILTER, tags: { some: { tagId: tag.id } } },
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
    }),
    db.note.findMany({
      where: { ...PUBLIC_FILTER, tags: { some: { tagId: tag.id } } },
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
    }),
    db.project.findMany({
      where: { ...PUBLIC_FILTER, tags: { some: { tagId: tag.id } } },
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
    }),
  ]);

  return {
    tag,
    articles: articleRows.map((r) => ({
      ...r,
      excerpt: r.excerpt,
    })),
    notes: noteRows.map((r) => ({
      ...r,
      excerpt: r.excerpt,
    })),
    projects: projectRows,
    total: articleRows.length + noteRows.length + projectRows.length,
  };
}

// Unused but kept to validate the import group; remove if not needed.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _PrismaRef = Prisma.PhotoWhereInput;
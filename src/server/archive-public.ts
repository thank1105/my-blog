// Phase 8 / Day 2 -- archive timeline reads.
//
// The /archive page shows every public piece of content on one page,
// grouped by month. This module fetches PUBLISHED + non-deleted rows from
// articles / notes / projects, normalises them into a single entry shape,
// and groups them into a year -> month timeline (newest first).
//
// Visibility mirrors the per-type -public.ts modules: projects also require
// visibility=PUBLIC; articles/notes filter on status + deletedAt only.

import { db } from "@/lib/db";

export type ArchiveKind = "article" | "note" | "project";

export interface ArchiveEntry {
  id: string;
  kind: ArchiveKind;
  title: string;
  href: string;
  /** publishedAt when set, otherwise createdAt -- never null. */
  date: Date;
}

export interface ArchiveMonth {
  /** "YYYY-MM" sort key. */
  key: string;
  /** e.g. "七月" */
  monthLabel: string;
  entries: ArchiveEntry[];
}

export interface ArchiveYear {
  year: number;
  count: number;
  months: ArchiveMonth[];
}

const KIND_HREF: Record<ArchiveKind, (slug: string) => string> = {
  article: (slug) => `/articles/${slug}`,
  note: (slug) => `/notes/${slug}`,
  project: (slug) => `/projects/${slug}`,
};

const MONTH_LABELS = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
] as const;

/**
 * Fetch every published article / note / project and fold them into a
 * year -> month timeline, newest first. Returns an empty array when there
 * is no public content yet.
 */
export async function listArchiveTimeline(): Promise<ArchiveYear[]> {
  const [articles, notes, projects] = await Promise.all([
    db.article.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { id: true, slug: true, title: true, publishedAt: true, createdAt: true },
    }),
    db.note.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { id: true, slug: true, title: true, publishedAt: true, createdAt: true },
    }),
    db.project.findMany({
      where: { status: "PUBLISHED", deletedAt: null, visibility: "PUBLIC" },
      select: { id: true, slug: true, title: true, publishedAt: true, createdAt: true },
    }),
  ]);

  const entries: ArchiveEntry[] = [
    ...articles.map((r) => toEntry("article", r)),
    ...notes.map((r) => toEntry("note", r)),
    ...projects.map((r) => toEntry("project", r)),
  ];

  entries.sort((a, b) => b.date.getTime() - a.date.getTime());

  const years = new Map<number, Map<string, ArchiveEntry[]>>();
  for (const entry of entries) {
    const year = entry.date.getFullYear();
    const monthKey = `${year}-${String(entry.date.getMonth() + 1).padStart(2, "0")}`;
    if (!years.has(year)) years.set(year, new Map());
    const months = years.get(year)!;
    if (!months.has(monthKey)) months.set(monthKey, []);
    months.get(monthKey)!.push(entry);
  }

  return [...years.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => {
      const monthList: ArchiveMonth[] = [...months.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([key, list]) => ({
          key,
          monthLabel: MONTH_LABELS[Number(key.slice(5, 7)) - 1],
          entries: list,
        }));
      const count = monthList.reduce((sum, m) => sum + m.entries.length, 0);
      return { year, count, months: monthList };
    });
}

function toEntry(
  kind: ArchiveKind,
  row: { id: string; slug: string; title: string; publishedAt: Date | null; createdAt: Date },
): ArchiveEntry {
  return {
    id: `${kind}:${row.id}`,
    kind,
    title: row.title,
    href: KIND_HREF[kind](row.slug),
    date: row.publishedAt ?? row.createdAt,
  };
}

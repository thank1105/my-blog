// Phase 4 -- public-facing note reads.
//
// All helpers here ONLY return PUBLISHED + non-deleted rows. Visibility
// rules are enforced at the boundary (similar to articles-public.ts).

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { type NoteRow, noteSelect } from "./notes";

export interface PublicNoteListQuery {
  q?: string;
  tagSlug?: string;
  page?: number;
  pageSize?: number;
}

export interface PublicNoteListResult {
  rows: NoteRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Listing query for the public /notes page + tag filter.
 * Only PUBLISHED notes are returned.
 */
export async function listPublishedNotes(
  query: PublicNoteListQuery = {},
): Promise<PublicNoteListResult> {
  const page = query.page ?? 1;
  const pageSize = Math.min(48, query.pageSize ?? 20);

  const where: Prisma.NoteWhereInput = {
    status: "PUBLISHED",
    deletedAt: null,
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
    db.note.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: noteSelect,
    }) as unknown as Promise<NoteRow[]>,
    db.note.count({ where }),
  ]);

  return { rows, total, page, pageSize };
}

/**
 * Fetch a single note by slug for the public detail page.
 */
export async function getNoteBySlugForPublic(
  slug: string,
): Promise<NoteRow | null> {
  return db.note.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    select: noteSelect,
  }) as unknown as NoteRow | null;
}

/**
 * Bump viewCount. Caller is responsible for deduping.
 */
export async function incrementNoteView(id: string): Promise<void> {
  await db.note.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    select: { id: true },
  });
}

/**
 * Pick up to `limit` related notes for the given note: shared tags.
 * Only PUBLISHED + non-deleted rows.
 */
export async function listRelatedNotes(
  noteId: string,
  limit = 3,
): Promise<NoteRow[]> {
  const source = await db.note.findUnique({
    where: { id: noteId },
    select: { id: true, tags: { select: { tagId: true } } },
  });
  if (!source) return [];

  const tagIds = source.tags.map((t) => t.tagId);
  if (tagIds.length === 0) return [];

  const related = await db.note.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      id: { not: source.id },
      tags: { some: { tagId: { in: tagIds } } },
    },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: noteSelect,
  }) as unknown as NoteRow[];

  return related;
}

/** Get the latest N published notes (for homepage snippet). */
export async function listLatestNotes(limit = 5): Promise<NoteRow[]> {
  return db.note.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: noteSelect,
  }) as unknown as NoteRow[];
}

/** Tags + published note counts. */
export async function listNoteTagsWithCount(): Promise<
  { id: string; name: string; slug: string; color: string | null; count: number }[]
> {
  const tags = await db.tag.findMany({
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, slug: true, color: true },
  });
  const counts = await db.noteTag.groupBy({
    by: ["tagId"],
    where: {
      note: {
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

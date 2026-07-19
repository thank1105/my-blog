// Phase 6 / Day 2 -- public-facing photo reads.
//
// Mirrors articles-public.ts / notes-public.ts / projects-public.ts:
// only PUBLISHED + non-deleted rows make it past the boundary. The
// /photos page renders every published photo in a single masonry; the
// /photos/albums/[slug] page renders the photos of one album.
//
// Visibility: photos default to PUBLIC (admin can flip to PRIVATE /
// PASSWORD). PRIVATE / PASSWORD photos are excluded from the public
// masonry entirely -- the password flow is admin-only in this phase.

import { Prisma, type Visibility } from "@prisma/client";

import { db } from "@/lib/db";
import { type PhotoRow, photoSelect } from "./photos";

export interface PublicPhotoListQuery {
  /** When set, restrict to photos of a single album slug. */
  albumSlug?: string;
  /** When true, only photos without any album. */
  unassigned?: boolean;
  /** Limit for the masonry first paint (infinite scroll loads more). */
  limit?: number;
  /** Offset for pagination. */
  offset?: number;
}

export interface PublicPhotoListResult {
  rows: PhotoRow[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Listing query for the public /photos masonry and /photos/albums/[slug].
 * Only PUBLISHED + non-deleted + PUBLIC rows. Sort order:
 *   - takenAt desc (when available)
 *   - createdAt desc (fallback)
 */
export async function listPublishedPhotos(
  query: PublicPhotoListQuery = {},
): Promise<PublicPhotoListResult> {
  const limit = Math.min(120, query.limit ?? 60);
  const offset = Math.max(0, query.offset ?? 0);

  const where: Prisma.PhotoWhereInput = {
    status: "PUBLISHED",
    deletedAt: null,
    visibility: "PUBLIC",
    ...(query.unassigned ? { albumId: null } : {}),
    ...(query.albumSlug ? { album: { slug: query.albumSlug } } : {}),
  };

  const [rows, total] = await Promise.all([
    db.photo.findMany({
      where,
      orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
      select: photoSelect,
    }) as unknown as Promise<PhotoRow[]>,
    db.photo.count({ where }),
  ]);

  return { rows, total, limit, offset };
}

/**
 * Fetch a single photo by id for the lightbox metadata sidebar.
 * Returns null when the photo is not PUBLIC + PUBLISHED + non-deleted.
 */
export async function getPublicPhoto(id: string): Promise<PhotoRow | null> {
  return db.photo.findFirst({
    where: {
      id,
      status: "PUBLISHED",
      deletedAt: null,
      visibility: "PUBLIC",
    },
    select: photoSelect,
  }) as unknown as PhotoRow | null;
}

/**
 * Fetch a published album by slug (visibility=PUBLIC only) along with
 * the photo count for the masonry header.
 */
export async function getPublicAlbumBySlug(slug: string): Promise<
  | (Awaited<ReturnType<typeof db.album.findFirst>> & {
      _count: { photos: number };
    })
  | null
> {
  const row = await db.album.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      deletedAt: null,
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverImage: true,
      visibility: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      _count: {
        select: { photos: { where: { status: "PUBLISHED", deletedAt: null, visibility: "PUBLIC" } } },
      },
    },
  });
  if (!row) return null;
  return row as Awaited<ReturnType<typeof db.album.findFirst>> & {
    _count: { photos: number };
  };
}

/** All public albums for the /photos album filter tabs. */
export async function listPublicAlbums(): Promise<
  { id: string; slug: string; title: string; coverImage: string | null; count: number }[]
> {
  const albums = await db.album.findMany({
    where: { status: "PUBLISHED", deletedAt: null, visibility: "PUBLIC" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      coverImage: true,
      _count: {
        select: {
          photos: { where: { status: "PUBLISHED", deletedAt: null, visibility: "PUBLIC" } },
        },
      },
    },
  });
  return albums.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    coverImage: a.coverImage ?? null,
    count: a._count.photos,
  }));
}

/** Bump viewCount. Caller owns the dedupe (cookie gate). */
export async function incrementPhotoView(id: string): Promise<void> {
  await db.photo.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    select: { id: true },
  });
}

/** Hide the unused-var lint complaint while keeping the export around. */
export type { Visibility };
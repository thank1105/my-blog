// PhotoGallery (Phase 6 / Day 2).
//
// Server component used by both /photos (all) and /photos/albums/[slug]
// (one album). Renders an <AlbumTabs> filter row above a <PhotoMasonry>.
// The masonry is a client component that owns the lightbox state.

import type { Metadata } from "next";

import {
  listPublishedPhotos,
  listPublicAlbums,
  getPublicAlbumBySlug,
} from "@/server/photos-public";

import { AlbumTabs, type AlbumTabsItem } from "./AlbumTabs";
import { PhotoMasonry, type PhotoMasonryItem } from "./PhotoMasonry";

export interface PhotoGalleryProps {
  /** When set, restrict to one album. */
  albumSlug?: string;
  /** When true, show only photos without any album. */
  unassigned?: boolean;
  /** Heading shown above the gallery. */
  heading: string;
  /** Optional sub-heading (e.g. album description). */
  subheading?: string;
}

export async function PhotoGallery({
  albumSlug,
  unassigned,
  heading,
  subheading,
}: PhotoGalleryProps) {
  // Run independent queries in parallel: album detail (when slug given),
  // the photos themselves, and the album tab strip.
  const [{ rows, total }, albums] = await Promise.all([
    listPublishedPhotos({
      albumSlug,
      unassigned,
      limit: 120,
      offset: 0,
    }),
    listPublicAlbums(),
  ]);

  let albumForTabs: AlbumTabsItem[] = albums;
  let activeAlbum: AlbumTabsItem | null = null;
  let unassignedCount = albums.reduce((acc, a) => acc + a.count, 0) > 0 ? 0 : 0;

  // Compute unassigned count separately when /photos is rendering the
  // full set so the tab strip can show a dedicated "独立照片" pill.
  if (!albumSlug && !unassigned) {
    const [{ total: allTotal }, unassignedResult] = await Promise.all([
      listPublishedPhotos({ limit: 1 }),
      listPublishedPhotos({ unassigned: true, limit: 1 }),
    ]);
    unassignedCount = allTotal > 0 ? unassignedResult.total : 0;
    void total; // already loaded above; suppress lint
  }

  if (albumSlug) {
    const album = await getPublicAlbumBySlug(albumSlug);
    if (!album) {
      // Render an empty state below; the route file is responsible for
      // 404'ing when this is the dedicated detail page.
      activeAlbum = null;
    } else {
      activeAlbum = {
        id: album.id,
        slug: album.slug,
        title: album.title,
        coverImage: album.coverImage ?? null,
        count: album._count.photos,
      };
      // Ensure the active album appears in the tab list even if the
      // listPublicAlbums() response is stale.
      if (!albumForTabs.some((a) => a.slug === activeAlbum?.slug)) {
        albumForTabs = [activeAlbum, ...albumForTabs];
      }
    }
  }

  const items: PhotoMasonryItem[] = rows.map((p) => ({
    id: p.id,
    imageUrl: p.imageUrl,
    thumbnailUrl: p.thumbnailUrl ?? null,
    title: p.title ?? null,
    description: p.description ?? null,
    location: p.location ?? null,
    takenAt: p.takenAt,
    width: p.width ?? null,
    height: p.height ?? null,
    href: undefined,
  }));

  return (
    <section className="mx-auto max-w-container px-4 py-6 sm:py-10 sm:px-8">
      <header className="mb-4 sm:mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          Photos · {albumSlug ? `${rows.length} 张` : `${rows.length} 张`}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-ink sm:text-4xl">
          {heading}
        </h1>
        {subheading ? (
          <p className="mt-2 max-w-prose text-sm text-muted">{subheading}</p>
        ) : null}
      </header>

      <div className="mb-6">
        <AlbumTabs
          albums={albumForTabs}
          activeSlug={activeAlbum?.slug}
          unassignedCount={unassignedCount}
          showUnassigned={!!unassigned}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
          暂无照片。
        </div>
      ) : (
        <PhotoMasonry items={items} maxColumns={4} />
      )}
    </section>
  );
}

export type { Metadata };
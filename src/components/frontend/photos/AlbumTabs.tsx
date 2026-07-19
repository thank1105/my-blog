// AlbumTabs (Phase 6 / Day 2).
//
// A horizontal scrollable row of pill buttons used at the top of
// /photos and /photos/albums/[slug] to filter between "all" and a
// specific album. Server component: no state, just <Link>s.

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

export interface AlbumTabsItem {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  count: number;
}

export interface AlbumTabsProps {
  albums: readonly AlbumTabsItem[];
  /** Slug of the currently active album; `undefined` means "all photos". */
  activeSlug?: string;
  /** Total count of photos outside any album (independent photos). */
  unassignedCount?: number;
  /**
   * When true, render the "independent photos" pill as the active one
   * (used by /photos?unassigned=1).
   */
  showUnassigned?: boolean;
}

export function AlbumTabs({
  albums,
  activeSlug,
  unassignedCount = 0,
  showUnassigned = false,
}: AlbumTabsProps) {
  const isAll = !activeSlug && !showUnassigned;

  return (
    <nav
      aria-label="相册筛选"
      className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
    >
      <Link
        href="/photos"
        aria-current={isAll ? "page" : undefined}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
          isAll
            ? "border-accent bg-accent-soft text-accent"
            : "border-hair bg-surface text-ink hover:border-accent hover:text-accent",
        )}
      >
        <ImageIcon aria-hidden className="size-3.5" />
        全部
      </Link>
      {albums.map((album) => {
        const active = album.slug === activeSlug;
        return (
          <Link
            key={album.id}
            href={`/photos/albums/${album.slug}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
              active
                ? "border-accent bg-accent-soft text-accent"
                : "border-hair bg-surface text-ink hover:border-accent hover:text-accent",
            )}
          >
            {album.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={album.coverImage}
                alt=""
                aria-hidden
                className="size-5 rounded-full object-cover"
              />
            ) : (
              <ImageIcon aria-hidden className="size-3.5 text-muted" />
            )}
            <span className="max-w-[10rem] truncate">{album.title}</span>
            <span className="ml-0.5 rounded bg-hair px-1.5 py-0.5 font-mono text-[10px] text-muted">
              {album.count}
            </span>
          </Link>
        );
      })}
      {unassignedCount > 0 ? (
        <Link
          href="/photos?unassigned=1"
          aria-current={showUnassigned ? "page" : undefined}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
            showUnassigned
              ? "border-accent bg-accent-soft text-accent"
              : "border-hair bg-surface text-ink hover:border-accent hover:text-accent",
          )}
        >
          独立照片
          <span className="ml-0.5 rounded bg-hair px-1.5 py-0.5 font-mono text-[10px] text-muted">
            {unassignedCount}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
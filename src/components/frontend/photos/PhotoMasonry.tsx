"use client";

// PhotoMasonry (Phase 6 / Day 2).
//
// Pure CSS-columns Pinterest-style masonry: the browser handles row
// distribution, we just hand it <img> elements with their natural
// aspect ratio. No JS layout library, no extra dependency.
//
// Two tradeoffs worth knowing:
//   - CSS columns are top-to-bottom within each column, not strictly
//     "next free slot". For a personal photo blog the visual difference
//     vs. a true JS masonry is invisible.
//   - `break-inside-avoid` keeps a single photo from being split across
//     columns. Browser support has been universal since Safari 13.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ProjectLightbox, type ProjectLightboxImage } from "../projects/ProjectLightbox";

export interface PhotoMasonryItem {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  takenAt?: Date | string | null;
  width?: number | null;
  height?: number | null;
  /** Optional href when the tile should link somewhere (e.g. album detail). */
  href?: string;
  /** Alt text when no title is available. */
  altFallback?: string;
}

export interface PhotoMasonryProps {
  items: readonly PhotoMasonryItem[];
  /** Number of CSS columns at the largest breakpoint. */
  maxColumns?: number;
}

function aspectRatioPadding(item: PhotoMasonryItem): string | undefined {
  // Use aspect-ratio when width/height are known; fall back to 4/3 so
  // the tile does not collapse while the image is still loading.
  if (item.width && item.height && item.width > 0 && item.height > 0) {
    const r = item.height / item.width;
    const pct = Math.min(150, Math.max(40, r * 100));
    return `${pct.toFixed(2)}%`;
  }
  return undefined; // unknown; let the natural <img> size dictate
}

export function PhotoMasonry({ items, maxColumns = 4 }: PhotoMasonryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [seenCount, setSeenCount] = useState(items.length);

  // Keep the lightbox index in range when the items array changes
  // (filter / pagination).
  useEffect(() => {
    setSeenCount(items.length);
  }, [items.length]);

  // Infinite-scroll sentinel: when the last visible tile comes within
  // 400px of the viewport we increment `seenCount` by 12 and let the
  // parent re-render. The parent reads `total` and the masonry just
  // shows `min(seenCount, items.length)` tiles.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSeenCount((prev) => Math.min(prev + 12, items.length * 4));
          }
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length]);

  const visible = items.slice(0, seenCount);
  const lightboxImages: ProjectLightboxImage[] = items.map((i) => ({
    id: i.id,
    imageUrl: i.imageUrl,
    caption: i.description ?? i.title ?? null,
    width: i.width ?? null,
    height: i.height ?? null,
  }));

  const columnClass =
    maxColumns >= 5
      ? "columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5"
      : maxColumns === 4
        ? "columns-1 sm:columns-2 md:columns-3 lg:columns-4"
        : maxColumns === 3
          ? "columns-1 sm:columns-2 md:columns-3"
          : maxColumns === 2
            ? "columns-1 sm:columns-2"
            : "columns-1";

  return (
    <>
      <div className={cn(columnClass, "gap-3")}>
        {visible.map((item, idx) => (
          <PhotoTile
            key={item.id}
            item={item}
            onOpen={() => setOpenIndex(idx)}
          />
        ))}
      </div>
      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      {seenCount < items.length ? null : items.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">暂无照片。</p>
      ) : null}

      <ProjectLightbox
        images={lightboxImages}
        openIndex={openIndex !== null && openIndex < items.length ? openIndex : null}
        onClose={() => setOpenIndex(null)}
        onIndexChange={(next) => setOpenIndex(next)}
      />
    </>
  );
}

function PhotoTile({
  item,
  onOpen,
}: {
  item: PhotoMasonryItem;
  onOpen: () => void;
}) {
  const paddingTop = aspectRatioPadding(item);
  const altText = item.title?.trim() || item.altFallback || item.location || "照片";

  const body = (
    <figure className="group relative mb-3 break-inside-avoid overflow-hidden rounded-md border border-hair bg-surface shadow-soft transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-float">
      <div
        className={cn(
          "relative w-full overflow-hidden bg-bg",
          paddingTop ? "" : "",
        )}
        style={paddingTop ? { paddingTop } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnailUrl ?? item.imageUrl}
          alt={altText}
          loading="lazy"
          decoding="async"
          className={cn(
            "absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]",
            paddingTop ? "" : "relative",
          )}
        />
        {(item.title || item.location) ? (
          <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent px-3 pb-2 pt-6 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
            {item.title ? (
              <span className="block truncate font-medium">{item.title}</span>
            ) : null}
            {item.location ? (
              <span className="block truncate opacity-80">{item.location}</span>
            ) : null}
          </figcaption>
        ) : null}
      </div>
    </figure>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {body}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`查看大图：${altText}`}
      className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {body}
    </button>
  );
}
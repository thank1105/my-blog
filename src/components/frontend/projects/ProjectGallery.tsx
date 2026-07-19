"use client";

// ProjectGallery (Phase 5 / Day 3).
//
// Renders the project image stack as a single column. Width adapts to
// aspect ratio so wide shots breathe and tall shots stay readable on
// mobile:
//   - landscape (w >= h)         -> 100% width
//   - portrait  (h > w * 1.1)    -> 70% width, centered
//   - near-square (in between)   -> 80% width, centered
//
// Click on any image opens <ProjectLightbox>. Off-screen images use
// native lazy loading; the first one is eager-loaded so the user sees
// something on mount.

import { useState } from "react";

import { cn } from "@/lib/utils";
import { ProjectLightbox, type ProjectLightboxImage } from "./ProjectLightbox";

export interface ProjectGalleryImage {
  id: string;
  imageUrl: string;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface ProjectGalleryProps {
  images: readonly ProjectGalleryImage[];
  /** Alt prefix used in <img alt>; the caption is appended when present. */
  altPrefix?: string;
}

function widthClassFor(width: number | null | undefined, height: number | null | undefined): string {
  if (!width || !height || width <= 0 || height <= 0) {
    // Unknown aspect ratio: full width to be safe.
    return "w-full";
  }
  if (height > width * 1.1) {
    // Portrait: 70% width.
    return "w-[70%]";
  }
  if (Math.abs(width - height) / width <= 0.1) {
    // Square-ish: 80% width.
    return "w-[80%]";
  }
  // Landscape (or wide): 100% width.
  return "w-full";
}

export function ProjectGallery({ images, altPrefix = "作品图" }: ProjectGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-12 text-center text-sm text-muted">
        这个作品还没有图集。
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col items-center gap-4">
        {images.map((img, idx) => {
          const cls = widthClassFor(img.width, img.height);
          return (
            <li key={img.id} className={cn("flex flex-col items-center", cls)}>
              <button
                type="button"
                onClick={() => setOpenIndex(idx)}
                aria-label={`查看大图：${img.caption ?? `${altPrefix} ${idx + 1}`}`}
                className="group relative w-full overflow-hidden rounded-md bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.imageUrl}
                  alt={img.caption ?? `${altPrefix} ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="block w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                />
                {img.caption ? (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {img.caption}
                  </span>
                ) : null}
              </button>
              {img.caption ? (
                <p className="mt-2 px-2 text-center text-sm text-muted">{img.caption}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <ProjectLightbox
        images={images as readonly ProjectLightboxImage[]}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={(next) => setOpenIndex(next)}
      />
    </>
  );
}

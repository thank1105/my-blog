"use client";

// ProjectLightbox (Phase 5 / Day 3).
//
// Full-screen image viewer that mounts when the user clicks a gallery
// thumbnail. Responsibilities:
//   - Render the selected image at a sane max-size with a black
//     backdrop.
//   - Provide prev/next navigation; wrap around at the ends.
//   - Show the caption when one exists.
//   - Close on backdrop click, Escape key, or the X button.
//   - Lock body scroll while open (no underlying page scroll).
//   - Mobile: left/right swipe switches images; vertical drag-down
//     is reserved for a future "pull to dismiss" enhancement.
//
// Renders nothing when images is empty or the open index is null.

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface ProjectLightboxImage {
  id: string;
  imageUrl: string;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface ProjectLightboxProps {
  images: readonly ProjectLightboxImage[];
  /** Index of the currently-shown image; null when closed. */
  openIndex: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}

const SWIPE_THRESHOLD_PX = 50;

export function ProjectLightbox({
  images,
  openIndex,
  onClose,
  onIndexChange,
}: ProjectLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const isOpen = openIndex !== null && openIndex >= 0 && openIndex < images.length;
  const current = isOpen ? images[openIndex as number] : null;

  const goPrev = useCallback(() => {
    if (!isOpen) return;
    const len = images.length;
    onIndexChange((openIndex as number - 1 + len) % len);
  }, [isOpen, images.length, onIndexChange, openIndex]);

  const goNext = useCallback(() => {
    if (!isOpen) return;
    onIndexChange(((openIndex as number) + 1) % images.length);
  }, [isOpen, images.length, onIndexChange, openIndex]);

  // Keyboard: Esc closes; left/right navigate.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, goPrev, goNext, onClose]);

  // Body scroll lock while open.
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    // Compensate for the scrollbar disappearing to avoid layout jump.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isOpen]);

  // Reset zoom when the active image changes.
  useEffect(() => {
    setZoomed(false);
  }, [openIndex]);

  if (!isOpen || !current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.caption
        ? ` + current.caption + " · " + (openIndex as number + 1) + "/" + images.length + `
        : ` + "图片 " + (openIndex as number + 1) + " / " + images.length + `}
      className="fixed inset-0 z-50 flex flex-col bg-ink/95 text-white"
      onClick={(e) => {
        // Backdrop click closes; clicks on the image or caption do not.
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) {
          touchStartX.current = t.clientX;
          touchStartY.current = t.clientY;
        }
      }}
      onTouchEnd={(e) => {
        const startX = touchStartX.current;
        const startY = touchStartY.current;
        touchStartX.current = null;
        touchStartY.current = null;
        if (startX === null || startY === null) return;
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) goPrev();
          else goNext();
        }
      }}
    >
      {/* Top bar: counter + close */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3 text-xs">
        <span className="font-mono text-white/70">
          {openIndex as number + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭灯箱"
          className="inline-flex size-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      {/* Image area */}
      <div className="relative flex-1 overflow-hidden">
        <button
          type="button"
          onClick={goPrev}
          aria-label="上一张"
          className="absolute left-2 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/80 transition-colors hover:bg-black/60 hover:text-white sm:left-4"
        >
          <ChevronLeft aria-hidden className="size-6" />
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label="下一张"
          className="absolute right-2 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/80 transition-colors hover:bg-black/60 hover:text-white sm:right-4"
        >
          <ChevronRight aria-hidden className="size-6" />
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={current.imageUrl}
          alt={current.caption ?? `图片 ${openIndex as number + 1}`}
          onClick={() => setZoomed((z) => !z)}
          className={`absolute inset-0 m-auto max-h-full max-w-full object-contain transition-transform duration-200 ${
            zoomed ? "cursor-zoom-out scale-150" : "cursor-zoom-in"
          }`}
          draggable={false}
        />
      </div>

      {/* Caption */}
      {current.caption ? (
        <div className="border-t border-white/10 px-4 py-3 text-center text-sm text-white/80">
          {current.caption}
        </div>
      ) : (
        <div className="border-t border-white/10 px-4 py-3 text-center text-xs text-white/40">
          点击图片放大 / 缩小 · 左右方向键或滑动切换 · Esc 关闭
        </div>
      )}
    </div>
  );
}

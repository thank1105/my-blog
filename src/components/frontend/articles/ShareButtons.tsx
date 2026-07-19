"use client";

// ShareButtons (Phase 3 / Day 3).
//
// Inline social-share row rendered at the end of an article detail
// page. Uses the Web Share API when available; falls back to copying
// the URL on desktop. All links open in new tabs with noopener.

import { useState } from "react";
import { Share2, Copy, Check, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ShareButtonsProps {
  /** Canonical URL of the article. */
  url: string;
  /** Article title, used as share text / subject. */
  title: string;
  className?: string;
}

export function ShareButtons({ url, title, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled; no-op.
      }
    }
  }

  function handleCopy() {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }

  return (
    <section className={cn("space-y-3", className)} aria-label="分享文章">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
        分享
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {/* Native share (mobile) */}
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label="分享文章"
          title="分享"
          className="inline-flex items-center gap-1.5 rounded border border-hair bg-surface px-3 py-1.5 text-sm text-ink shadow-soft transition-colors hover:border-accent hover:text-accent"
        >
          <Share2 aria-hidden className="size-3.5" />
          分享
        </button>

        {/* Copy URL */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label="复制链接"
          title="复制链接"
          className="inline-flex items-center gap-1.5 rounded border border-hair bg-surface px-3 py-1.5 text-sm text-ink shadow-soft transition-colors hover:border-accent hover:text-accent"
        >
          {copied ? (
            <>
              <Check aria-hidden className="size-3.5 text-success" />
              已复制
            </>
          ) : (
            <>
              <Copy aria-hidden className="size-3.5" />
              复制链接
            </>
          )}
        </button>

        {/* Twitter / X */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            title,
          )}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="在 X 上分享"
          title="在 X 上分享"
          className="inline-flex items-center gap-1.5 rounded border border-hair bg-surface px-3 py-1.5 text-sm text-ink shadow-soft transition-colors hover:border-accent hover:text-accent"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-3.5"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X
        </a>

        {/* Telegram */}
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="在 Telegram 上分享"
          title="在 Telegram 上分享"
          className="inline-flex items-center gap-1.5 rounded border border-hair bg-surface px-3 py-1.5 text-sm text-ink shadow-soft transition-colors hover:border-accent hover:text-accent"
        >
          <MessageCircle aria-hidden className="size-3.5" />
          Telegram
        </a>
      </div>
    </section>
  );
}
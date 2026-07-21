// FeaturedHero (Phase 8 / Day 1).
//
// The homepage's top billboard: a 16:9 cover with a large serif title,
// excerpt, and meta row. Fed by `getFeaturedArticle` (featured=true first,
// otherwise the latest published article). Presentational only -- the page
// decides which article to hand in.
//
// Visual reference: docs/design-explorations/p2-homepage/homepage.png.

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";

import { estimateReadingMinutes } from "@/lib/markdown";
import { formatDateOnly } from "@/lib/format";

export interface FeaturedHeroArticle {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: { id: string; name: string; slug: string } | null;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
  content: string;
}

export interface FeaturedHeroProps {
  article: FeaturedHeroArticle;
}

export function FeaturedHero({ article }: FeaturedHeroProps) {
  const href = `/articles/${article.slug}`;
  const readingMin = estimateReadingMinutes(article.content);
  const dateStr = formatDateOnly(article.publishedAt ?? article.updatedAt);

  return (
    <section aria-label="置顶文章" className="border-b border-hair bg-surface">
      <div className="mx-auto max-w-container px-4 py-8 sm:px-8 sm:py-12">
        <Link
          href={href}
          className="group grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-stretch"
        >
          {/* Cover (16:9) */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-hair bg-bg">
            {article.coverImage ? (
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex size-full items-end bg-gradient-to-br from-hair/60 via-bg to-accent-soft/60 p-6">
                <span className="font-serif text-sm uppercase tracking-[0.3em] text-muted">
                  {article.category?.name ?? "置顶"}
                </span>
              </div>
            )}
          </div>

          {/* Copy */}
          <div className="flex flex-col justify-center gap-4 lg:py-4">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              置顶阅读 · Featured
            </p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-ink transition-colors group-hover:text-accent sm:text-4xl lg:text-5xl">
              {article.title}
            </h2>
            {article.excerpt ? (
              <p className="line-clamp-3 max-w-prose text-sm text-muted sm:text-base">
                {article.excerpt}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              {article.category ? (
                <span className="rounded bg-accent-soft px-1.5 py-0.5 text-accent">
                  {article.category.name}
                </span>
              ) : null}
              <time dateTime={String(article.publishedAt ?? article.updatedAt)}>
                {dateStr}
              </time>
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden className="size-3" />
                {readingMin} 分钟
              </span>
            </div>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-accent underline-offset-4 group-hover:underline">
              阅读全文
              <ArrowRight aria-hidden className="size-4" />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

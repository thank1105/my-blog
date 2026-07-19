// ArticleCard (Phase 3 / Day 2).
//
// Card grid item for the public article list / archive pages. The card
// shape is "magazine grid" per docs/visual-anchor.png (P3) and P4: cover
// (or gradient fallback) + title + excerpt + meta row. Day 3 wires this
// into the public /articles list + /archive.

import Link from "next/link";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { estimateReadingMinutes } from "@/lib/markdown";
import { formatDate } from "@/lib/format";

export interface ArticleCardArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: { id: string; name: string; slug: string } | null;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
  content: string;
}

export interface ArticleCardProps {
  article: ArticleCardArticle;
  /** Optional href override; defaults to /articles/<slug>. */
  href?: string;
  /** Compact variant drops the excerpt and shrinks the cover. */
  compact?: boolean;
  className?: string;
}

export function ArticleCard({ article, href, compact, className }: ArticleCardProps) {
  const link = href ?? `/articles/${article.slug}`;
  const readingMin = estimateReadingMinutes(article.content);
  const showCover = !compact;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-md border border-hair bg-surface shadow-soft transition-shadow hover:shadow-float",
        className,
      )}
    >
      {showCover ? (
        <Link href={link} className="block overflow-hidden">
          {article.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt={article.title}
              loading="lazy"
              decoding="async"
              className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-44 w-full items-end bg-gradient-to-br from-hair/60 via-bg to-accent-soft/60 p-4">
              <span className="font-serif text-xs uppercase tracking-[0.3em] text-muted">
                {article.category?.name ?? "未分类"}
              </span>
            </div>
          )}
        </Link>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs text-muted">
          {article.category ? (
            <Link
              href={`/categories/${article.category.slug}`}
              className="rounded bg-accent-soft px-1.5 py-0.5 text-accent hover:bg-accent hover:text-white"
            >
              {article.category.name}
            </Link>
          ) : (
            <span className="rounded bg-hair px-1.5 py-0.5">未分类</span>
          )}
          <time dateTime={String(article.publishedAt ?? article.updatedAt)}>
            {formatDate(article.publishedAt ?? article.updatedAt)}
          </time>
        </div>

        <Link href={link} className="block">
          <h3 className="font-serif text-xl font-bold text-ink transition-colors group-hover:text-accent">
            {article.title}
          </h3>
        </Link>

        {!compact && article.excerpt ? (
          <p className="line-clamp-3 text-sm text-muted">{article.excerpt}</p>
        ) : null}

        <div className="mt-auto flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden className="size-3" />
            {readingMin} 分钟
          </span>
          <Link
            href={link}
            className="ml-auto text-accent underline-offset-4 hover:underline"
          >
            阅读全文 →
          </Link>
        </div>
      </div>
    </article>
  );
}

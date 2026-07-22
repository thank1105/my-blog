// /articles/[slug] -- the public article detail page (Phase 3 / Day 3).
//
// Pipeline:
//   1. Fetch the PUBLISHED article by slug.
//   2. Render the MDX body via ArticleBody.
//   3. SEO meta (title / description / canonical / OG / Twitter Card).
//   4. Render related articles (3 from same category + shared tags).
//
// View-count + same-session dedupe is handled by:
//   - <ArticleViewIncrementer /> (client island, fires POST on mount)
//   - /api/articles/[id]/view (Route Handler that writes the cookie)
// Server Components cannot write cookies in Next.js 15, so the
// counter has to be split across the boundary; the page itself stays
// a pure reader.

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, Eye } from "lucide-react";

import {
  getArticleBySlugForPublic,
  listRelatedArticles,
} from "@/server/articles-public";

import { ArticleBody } from "@/components/frontend/articles/ArticleBody";
import { ArticleViewIncrementer } from "@/components/frontend/articles/ArticleViewIncrementer";
import { ShareButtons } from "@/components/frontend/articles/ShareButtons";
import { ArticleListItem } from "@/components/frontend/articles/ArticleListItem";
import { estimateReadingMinutes } from "@/lib/markdown";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await getArticleBySlugForPublic(slug);
  if (!row) {
    return { title: "文章不存在" };
  }
  const description = row.excerpt?.trim() || "小川记事";
  const ogImages = row.coverImage ? [row.coverImage] : undefined;
  const canonical = `/articles/${row.slug}`;
  return {
    title: row.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: row.title,
      description,
      type: "article",
      url: canonical,
      publishedTime: row.publishedAt ? row.publishedAt.toISOString() : undefined,
      modifiedTime: row.updatedAt.toISOString(),
      authors: row.author.displayName ?? row.author.username,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: row.title,
      description,
      images: ogImages,
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const row = await getArticleBySlugForPublic(slug);
  if (!row) notFound();

  const related = await listRelatedArticles(row.id, 3);
  const readingMin = estimateReadingMinutes(row.content);
  const tags = row.tags.map((t) => t.tag);
  const canonicalUrl = `https://xiaochuan.blog/articles/${row.slug}`;

  return (
    <article className="mx-auto max-w-container px-4 py-6 sm:py-10 sm:px-8">
      <ArticleViewIncrementer articleId={row.id} />

      <header className="mx-auto max-w-4xl rounded-lg border border-hair bg-surface px-8 py-8 shadow-soft">
        {row.column ? (
          <Link
            href={`/columns/${row.column.slug}`}
            className="inline-block rounded bg-accent-soft px-2 py-0.5 text-xs text-accent transition-colors hover:bg-accent hover:text-white"
          >
            {row.column.parent ? `${row.column.parent.name} / ` : ""}{row.column.name}
          </Link>
        ) : null}
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {row.title}
        </h1>
        {row.excerpt ? (
          <p className="mt-3 text-base text-muted">{row.excerpt}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
          {row.author.displayName ?? row.author.username ? (
            <span>作者：{row.author.displayName ?? row.author.username}</span>
          ) : null}
          {row.publishedAt ? <span>发布于 {formatDate(row.publishedAt)}</span> : null}
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden className="size-3" />
            约 {readingMin} 分钟
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye aria-hidden className="size-3" />
            {row.viewCount} 次阅读
          </span>
        </div>
      </header>

      <div className="relative mx-auto mt-6 aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-lg border border-hair bg-hair shadow-soft">
          <Image
            src={row.coverImage}
            alt={row.title}
            fill
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover"
            priority
          />
      </div>

      <div className="mx-auto mt-8 sm:mt-10 max-w-prose">
        <ArticleBody source={row.content} slug={row.slug} />
      </div>

      {/* Footer: tag cloud + share buttons */}
      <footer className="mx-auto mt-10 sm:mt-12 max-w-prose space-y-8 border-t border-hair pt-6 sm:pt-8">
        {tags.length > 0 ? (
          <section aria-label="文章标签">
            <p className="font-mono text-[11px] font-medium text-muted">
              标签
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((t) => (
                <Link
                  key={t.id}
                  href={`/tags/${t.slug}`}
                  className="rounded-md border border-accent/15 bg-accent-soft px-3 py-1 text-sm text-accent transition-colors hover:border-accent"
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <ShareButtons url={canonicalUrl} title={row.title} />
      </footer>

      {related.length > 0 ? (
        <aside className="mx-auto mt-12 sm:mt-16 max-w-container">
          <h2 className="text-2xl font-bold text-ink">相关文章</h2>
          <div className="mt-5 space-y-5">
            {related.map((a) => (
              <ArticleListItem key={a.id} article={a} />
            ))}
          </div>
        </aside>
      ) : null}

      <nav className="mx-auto mt-12 sm:mt-16 max-w-prose border-t border-hair pt-6 text-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          ← 回到所有文章
        </Link>
      </nav>
    </article>
  );
}

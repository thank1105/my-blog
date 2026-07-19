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
import { notFound } from "next/navigation";
import { Clock, Eye } from "lucide-react";

import {
  getArticleBySlugForPublic,
  listRelatedArticles,
} from "@/server/articles-public";

import { ArticleBody } from "@/components/frontend/articles/ArticleBody";
import { ArticleViewIncrementer } from "@/components/frontend/articles/ArticleViewIncrementer";
import {
  ArticleCard,
  type ArticleCardArticle,
} from "@/components/frontend/articles/ArticleCard";
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
  const description = row.excerpt?.trim() || `小川记事 · ${row.title}`;
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

  return (
    <article className="mx-auto max-w-container px-4 py-10 sm:px-8">
      <ArticleViewIncrementer articleId={row.id} />

      <header className="mx-auto max-w-prose">
        {row.category ? (
          <Link
            href={`/articles?category=${row.category.slug}`}
            className="inline-block rounded bg-accent-soft px-2 py-0.5 text-xs text-accent transition-colors hover:bg-accent hover:text-white"
          >
            {row.category.name}
          </Link>
        ) : null}
        <h1 className="mt-3 font-serif text-3xl font-bold text-ink sm:text-4xl">
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
        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {tags.map((t) => (
              <Link
                key={t.id}
                href={`/articles?tag=${t.slug}`}
                className="rounded-full border border-hair px-2 py-0.5 text-ink transition-colors hover:border-accent hover:text-accent"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      {row.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.coverImage}
          alt={row.title}
          loading="lazy"
          decoding="async"
          className="mx-auto mt-8 max-h-[480px] w-full max-w-4xl rounded-md border border-hair object-cover shadow-soft"
        />
      ) : null}

      <div className="mx-auto mt-10 max-w-prose">
        <ArticleBody source={row.content} slug={row.slug} />
      </div>

      {related.length > 0 ? (
        <aside className="mx-auto mt-16 max-w-container">
          <h2 className="font-serif text-2xl font-bold text-ink">相关文章</h2>
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <li key={a.id} className="h-full">
                <ArticleCard
                  article={
                    {
                      id: a.id,
                      slug: a.slug,
                      title: a.title,
                      excerpt: a.excerpt,
                      coverImage: a.coverImage,
                      category: a.category
                        ? { id: a.category.id, name: a.category.name, slug: a.category.slug }
                        : null,
                      publishedAt: a.publishedAt ?? a.updatedAt,
                      updatedAt: a.updatedAt,
                      content: a.excerpt ?? "",
                    } satisfies ArticleCardArticle
                  }
                />
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <nav className="mx-auto mt-16 max-w-prose border-t border-hair pt-6 text-sm">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1 text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          ← 回到所有文章
        </Link>
      </nav>
    </article>
  );
}

// Shared server component for the article-list + filter experience.
// Used by /articles, /categories/[slug], /tags/[slug] so the three
// pages stay in lockstep (filters, sidebar, pagination all derived
// from the same props).

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  listPublishedArticles,
  listCategoriesWithCount,
  listTagsWithCount,
} from "@/server/articles-public";
import type { ArticleRow } from "@/server/articles";

import {
  ArticleCard,
  type ArticleCardArticle,
} from "@/components/frontend/articles/ArticleCard";
import {
  CategorySidebar,
  type CategorySidebarItem,
} from "@/components/frontend/articles/CategorySidebar";
import { TagCloud, type TagCloudItem } from "@/components/frontend/articles/TagCloud";

export interface ArticlesListProps {
  q?: string;
  categorySlug?: string;
  tagSlug?: string;
  page: number;
  pageSize?: number;
  /** Title shown above the grid (e.g. "分类 · react"). */
  heading: string;
  /** Subline under the heading. */
  subline?: string;
  /** When set, the page is wrapped in <Link> and rendered as a banner. */
  presetCategoryLabel?: string;
  presetTagLabel?: string;
}

function pickCardProps(row: ArticleRow): ArticleCardArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.coverImage,
    category: row.category
      ? { id: row.category.id, name: row.category.name, slug: row.category.slug }
      : null,
    publishedAt: row.publishedAt ?? row.updatedAt,
    updatedAt: row.updatedAt,
    content: row.excerpt ?? "",
  };
}

export async function ArticlesList({
  q,
  categorySlug,
  tagSlug,
  page,
  pageSize = 12,
  heading,
  subline,
}: ArticlesListProps) {
  const [{ rows, total, pageSize: ps }, categories, tags] = await Promise.all([
    listPublishedArticles({ q, categorySlug, tagSlug, page, pageSize }),
    listCategoriesWithCount(),
    listTagsWithCount(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ps));
  if (page > totalPages && total > 0) notFound();

  const sidebarItems: CategorySidebarItem[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c.count,
  }));
  const tagItems: TagCloudItem[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    count: t.count,
  }));

  return (
    <section className="mx-auto max-w-container px-4 py-6 sm:py-10 sm:px-8">
      <header className="mb-6 sm:mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          Articles · {total} 篇
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-ink sm:text-4xl">
          {heading}
        </h1>
        {subline ? <p className="mt-2 max-w-prose text-sm text-muted">{subline}</p> : null}
      </header>

      <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        <div className="space-y-6">
          <form
            method="GET"
            action="/articles"
            className="rounded-md border border-hair bg-surface p-3 shadow-soft"
          >
            <label htmlFor="q" className="block text-xs font-medium text-muted">
              搜索
            </label>
            <div className="mt-1 flex gap-1">
              <input
                id="q"
                name="q"
                defaultValue={q ?? ""}
                placeholder="标题或摘要"
                className="block w-full rounded border border-hair bg-bg px-2 py-1 text-sm text-ink outline-none focus-visible:border-accent"
              />
              {categorySlug || tagSlug ? (
                <>
                  <input type="hidden" name="category" defaultValue={categorySlug ?? ""} />
                  <input type="hidden" name="tag" defaultValue={tagSlug ?? ""} />
                </>
              ) : null}
              <button
                type="submit"
                className="rounded bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent/90"
              >
                搜
              </button>
            </div>
          </form>

          <CategorySidebar
            categories={sidebarItems}
            activeSlug={categorySlug}
            title="分类"
          />

          {tagItems.length > 0 ? (
            <TagCloud tags={tagItems} activeSlug={tagSlug} title="标签" />
          ) : null}

          {categorySlug || tagSlug || q ? (
            <Link
              href="/articles"
              className="inline-flex w-fit items-center text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
            >
              清除筛选
            </Link>
          ) : null}
        </div>

        <div>
          {rows.length === 0 ? (
            <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
              {q || categorySlug || tagSlug
                ? "没有匹配的文章，试试清除筛选。"
                : "暂无已发布文章。"}
            </div>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((row) => (
                <li key={row.id} className="h-full">
                  <ArticleCard article={pickCardProps(row)} />
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              query={{ q, categorySlug, tagSlug }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function buildPageHref(
  p: number,
  basePath: string,
  q: { q?: string; categorySlug?: string; tagSlug?: string },
): string {
  const sp = new URLSearchParams();
  if (q.q) sp.set("q", q.q);
  if (q.categorySlug) sp.set("category", q.categorySlug);
  if (q.tagSlug) sp.set("tag", q.tagSlug);
  if (p > 1) sp.set("page", String(p));
  const qs = sp.toString();
  return `${basePath}${qs ? `?${qs}` : ""}`;
}

function Pagination({
  page,
  totalPages,
  query,
  basePath = "/articles",
}: {
  page: number;
  totalPages: number;
  query: { q?: string; categorySlug?: string; tagSlug?: string };
  basePath?: string;
}) {
  return (
    <nav aria-label="分页" className="mt-10 flex items-center justify-center gap-2 text-sm">
      {page > 1 ? (
        <Link
          href={buildPageHref(page - 1, basePath, query)}
          className="rounded border border-hair px-3 py-1 text-ink hover:border-accent hover:text-accent"
        >
          上一页
        </Link>
      ) : (
        <span className="rounded border border-hair px-3 py-1 text-muted opacity-50">上一页</span>
      )}
      <span className="text-muted">
        第 {page} / {totalPages} 页
      </span>
      {page < totalPages ? (
        <Link
          href={buildPageHref(page + 1, basePath, query)}
          className="rounded border border-hair px-3 py-1 text-ink hover:border-accent hover:text-accent"
        >
          下一页
        </Link>
      ) : (
        <span className="rounded border border-hair px-3 py-1 text-muted opacity-50">下一页</span>
      )}
    </nav>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";

import { ArticleListItem } from "./ArticleListItem";
import { ColumnTree } from "./ColumnTree";
import { TagCloud } from "./TagCloud";
import { listColumnTree, listPublishedArticles, listTagsWithCount } from "@/server/articles-public";
import { cn } from "@/lib/utils";

export interface ArticlesListProps {
  q?: string;
  columnSlug?: string;
  tagSlug?: string;
  page: number;
  pageSize?: number;
  heading: string;
  subline?: string;
  basePath?: string;
  showIntro?: boolean;
}

export async function ArticlesList({ q, columnSlug, tagSlug, page, pageSize = 10, heading, subline, basePath = "/", showIntro = false }: ArticlesListProps) {
  const [{ rows, total, pageSize: resolvedPageSize }, columns, tags, allArticles] = await Promise.all([
    listPublishedArticles({ q, columnSlug, tagSlug, page, pageSize }),
    listColumnTree(),
    listTagsWithCount(),
    listPublishedArticles({ page: 1, pageSize: 1 }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / resolvedPageSize));
  if (page > totalPages && total > 0) notFound();

  return (
    <section className="mx-auto w-full max-w-container px-4 py-8 sm:px-8 lg:py-10">
      <header className={cn(showIntro ? "relative overflow-hidden rounded-lg border border-hair bg-surface px-8 py-8 shadow-soft xl:px-10 xl:py-9" : "max-w-3xl py-2")}>
        {showIntro ? (
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="font-mono text-xs font-medium text-accent">技术写作</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-ink xl:text-5xl">{heading}</h1>
              {subline ? <p className="mt-4 max-w-[58ch] text-base leading-7 text-muted">{subline}</p> : null}
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div className="min-w-28 rounded-md bg-accent-soft px-4 py-3">
                <dt className="text-xs text-accent">公开文章</dt>
                <dd className="mt-1 font-mono text-2xl font-bold text-ink">{allArticles.total}</dd>
              </div>
              <div className="min-w-28 rounded-md bg-teal-soft px-4 py-3">
                <dt className="text-xs text-teal">一级专栏</dt>
                <dd className="mt-1 font-mono text-2xl font-bold text-ink">{columns.length}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{heading}</h1>
            {subline ? <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted sm:text-base">{subline}</p> : null}
          </>
        )}
      </header>

      <div className="mt-7 grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-lg border border-hair bg-surface p-4 shadow-soft">
            <form method="GET" action={basePath} className="relative">
              <label htmlFor="article-search" className="sr-only">搜索技术文章</label>
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input id="article-search" name="q" defaultValue={q ?? ""} placeholder="搜索标题或摘要" className="w-full rounded-md border border-hair bg-bg py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20" />
              {columnSlug ? <input type="hidden" name="column" value={columnSlug} /> : null}
              {tagSlug ? <input type="hidden" name="tag" value={tagSlug} /> : null}
            </form>
            <ColumnTree columns={columns} activeSlug={columnSlug} allCount={allArticles.total} />
            {tags.length > 0 ? <div className="hidden border-t border-hair pt-5 lg:block"><TagCloud tags={tags} activeSlug={tagSlug} title="常用标签" /></div> : null}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-hair bg-surface px-5 py-3 shadow-soft">
            <p className="text-sm text-muted"><span className="font-mono font-semibold text-ink">{total}</span> 篇文章</p>
            {q || columnSlug || tagSlug ? <Link href="/" className="text-sm text-accent hover:underline">清除筛选</Link> : null}
          </div>
          {rows.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-hair bg-surface py-20 text-center"><p className="font-medium text-ink">没有找到匹配的文章</p><p className="mt-2 text-sm text-muted">尝试更换关键词，或者清除当前筛选。</p></div>
          ) : (
            <div className="mt-5 space-y-5">{rows.map((article) => <ArticleListItem key={article.id} article={article} />)}</div>
          )}
          {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} basePath={basePath} query={{ q, columnSlug, tagSlug }} /> : null}
        </div>
      </div>
    </section>
  );
}

function Pagination({ page, totalPages, basePath, query }: { page: number; totalPages: number; basePath: string; query: { q?: string; columnSlug?: string; tagSlug?: string } }) {
  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.columnSlug && basePath === "/") params.set("column", query.columnSlug);
    if (query.tagSlug && basePath === "/") params.set("tag", query.tagSlug);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `${basePath}${params.size ? `?${params}` : ""}`;
  };
  return (
    <nav aria-label="文章分页" className="mt-8 flex items-center justify-between border-t border-hair pt-5 text-sm">
      {page > 1 ? <Link href={href(page - 1)} className="text-ink hover:text-accent">上一页</Link> : <span className="text-muted/50">上一页</span>}
      <span className="font-mono text-xs text-muted">{page} / {totalPages}</span>
      {page < totalPages ? <Link href={href(page + 1)} className="text-ink hover:text-accent">下一页</Link> : <span className="text-muted/50">下一页</span>}
    </nav>
  );
}

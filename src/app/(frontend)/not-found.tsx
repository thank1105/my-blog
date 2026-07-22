// Front-end 404 (Phase 8 / Day 2) -- lives inside `(frontend)` so it
// inherits the public chrome (Header + Footer). Now offers a search box
// (GET form -> /?q=) and a few recommended latest articles so a
// dead-end still points somewhere useful.

import Link from "next/link";
import { Home, Search } from "lucide-react";

import { listLatestArticles } from "@/server/articles-public";
import { formatDateOnly } from "@/lib/format";

export default async function FrontendNotFound() {
  const recommended = await listLatestArticles(4);

  return (
    <div className="mx-auto flex max-w-container flex-col items-center gap-8 px-4 py-20 text-center sm:px-8 sm:py-24">
      <div className="flex flex-col items-center gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">404</p>
        <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">
          这条小路似乎走不通了
        </h1>
        <p className="max-w-prose text-sm text-muted">
          你访问的页面不存在，或者已经被搬走了。试试搜索，或从下面的推荐文章继续。
        </p>
      </div>

      {/* Search box -> reuses the home article search */}
      <form action="/" method="get" className="flex w-full max-w-md gap-2">
        <label htmlFor="q" className="sr-only">
          搜索文章
        </label>
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            id="q"
            name="q"
            type="search"
            placeholder="搜索文章…"
            className="w-full rounded border border-hair bg-surface py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          搜索
        </button>
      </form>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-accent underline-offset-4 hover:underline"
      >
        <Home aria-hidden className="size-4" />
        返回首页
      </Link>

      {recommended.length > 0 ? (
        <div className="w-full max-w-2xl text-left">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-muted">
            推荐阅读
          </p>
          <ul className="divide-y divide-hair rounded-md border border-hair bg-surface shadow-soft">
            {recommended.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="group flex items-baseline gap-3 px-4 py-3 transition-colors hover:bg-bg/60"
                >
                  <span className="shrink-0 font-mono text-xs text-muted/70">
                    {formatDateOnly(article.publishedAt ?? article.updatedAt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-ink group-hover:text-accent">
                    {article.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

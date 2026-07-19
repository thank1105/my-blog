// Shared server component for the projects list page (Phase 5 / Day 2).
//
// Behance-style magazine grid: large cover cards, featured projects
// get a 2x span on the first row. Sidebar exposes search + tag cloud
// + category cloud so visitors can drill in.

import Link from "next/link";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";

import {
  listPublishedProjects,
  listProjectTagsWithCount,
  listProjectCategoriesWithCount,
} from "@/server/projects-public";
import type { ProjectRow } from "@/server/projects";
import { TagCloud, type TagCloudItem } from "@/components/frontend/articles/TagCloud";

import { ProjectCard } from "./ProjectCard";

export interface ProjectsListProps {
  q?: string;
  categorySlug?: string;
  tagSlug?: string;
  page: number;
  pageSize?: number;
  heading: string;
}

export async function ProjectsList({
  q,
  categorySlug,
  tagSlug,
  page,
  pageSize = 12,
  heading,
}: ProjectsListProps) {
  const [{ rows, total, pageSize: ps }, tags, categories] = await Promise.all([
    listPublishedProjects({ q, categorySlug, tagSlug, page, pageSize }),
    listProjectTagsWithCount(),
    listProjectCategoriesWithCount(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ps));
  if (page > totalPages && total > 0) notFound();

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
          Projects · {total} 个
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-ink sm:text-4xl">
          {heading}
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        <div className="space-y-6">
          <form
            method="GET"
            action="/projects"
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
                placeholder="标题或描述"
                className="block w-full rounded border border-hair bg-bg px-2 py-1 text-sm text-ink outline-none focus-visible:border-accent"
              />
              {(categorySlug || tagSlug) ? (
                <>
                  {categorySlug ? (
                    <input type="hidden" name="category" defaultValue={categorySlug} />
                  ) : null}
                  {tagSlug ? (
                    <input type="hidden" name="tag" defaultValue={tagSlug} />
                  ) : null}
                </>
              ) : null}
              <button
                type="submit"
                aria-label="搜索"
                className="inline-flex items-center justify-center rounded bg-accent px-2 py-1 text-white hover:bg-accent/90"
              >
                <Search aria-hidden className="size-3.5" />
              </button>
            </div>
          </form>

          {categories.length > 0 ? (
            <nav aria-label="作品分类" className="rounded-md border border-hair bg-surface p-3 shadow-soft">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                分类
              </p>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/projects"
                    aria-current={!categorySlug ? "page" : undefined}
                    className={`block rounded px-2 py-1 text-sm transition-colors ${
                      !categorySlug
                        ? "bg-accent-soft text-accent"
                        : "text-ink hover:bg-bg hover:text-accent"
                    }`}
                  >
                    全部 <span className="ml-1 text-xs text-muted">{total}</span>
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/projects?category=${c.slug}`}
                      aria-current={categorySlug === c.slug ? "page" : undefined}
                      className={`flex items-center justify-between rounded px-2 py-1 text-sm transition-colors ${
                        categorySlug === c.slug
                          ? "bg-accent-soft text-accent"
                          : "text-ink hover:bg-bg hover:text-accent"
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-xs text-muted">{c.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {tagItems.length > 0 ? (
            <TagCloud tags={tagItems} activeSlug={tagSlug} title="标签" />
          ) : null}

          {q || categorySlug || tagSlug ? (
            <Link
              href="/projects"
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
                ? "没有匹配的作品，试试清除筛选。"
                : "暂无已发布作品。"}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((project, idx) => (
                <ProjectCardWrap key={project.id} row={project} featured={idx === 0 && project.featured} />
              ))}
            </div>
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

function ProjectCardWrap({ row, featured }: { row: ProjectRow; featured: boolean }) {
  return (
    <div className={featured ? "sm:col-span-2 lg:col-span-2" : undefined}>
      <ProjectCard project={row as never} />
    </div>
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
  basePath = "/projects",
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
      <span className="text-muted">第 {page} / {totalPages} 页</span>
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

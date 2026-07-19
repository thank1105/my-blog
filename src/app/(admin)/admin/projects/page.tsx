// /admin/projects -- list + filter + search + batch delete (Phase 5 / Day 1).
//
// Behance-style list layout: large cover cards in a responsive grid.
// Each card shows the cover image (or first gallery image as fallback),
// the title, status pill, visibility pill, image count, and order.
// Filter form sits above the grid; batch delete lives inside a
// <BatchDeleteForm> wrapper so checkbox state stays in one place.

import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeOff, FileEdit, Lock, Plus, Trash2, Star } from "lucide-react";

import {
  listProjects,
  listProjectsQuerySchema,
  flattenProjectTags,
  flattenProjectImages,
  type ProjectRow,
} from "@/server/projects";
import { formatDate } from "@/lib/format";
import { BatchDeleteForm } from "./BatchDeleteForm";

export const metadata: Metadata = {
  title: "作品管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    visibility?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function AdminProjectsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const parsed = listProjectsQuerySchema.safeParse({
    q: sp.q || undefined,
    status: sp.status || undefined,
    visibility: sp.visibility || undefined,
    page: sp.page || undefined,
    pageSize: sp.pageSize || undefined,
  });
  const query = parsed.success ? parsed.data : listProjectsQuerySchema.parse({});

  const { rows, total, page, pageSize } = await listProjects(query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">作品管理</h1>
          <p className="mt-1 text-sm text-muted">
            共 <span className="font-medium text-ink">{total}</span> 个 · 第 {page} / {totalPages} 页
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90"
        >
          <Plus aria-hidden className="size-4" />
          新建作品
        </Link>
      </header>

      {/* Filters */}
      <form
        method="GET"
        className="flex flex-wrap items-end gap-2 rounded-md border border-hair bg-surface p-3 shadow-soft"
      >
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="q" className="block text-xs font-medium text-muted">搜索</label>
          <input
            id="q"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="按标题 / slug / 描述 搜索"
            className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-muted">状态</label>
          <select
            id="status"
            name="status"
            defaultValue={query.status ?? ""}
            className="mt-1 block rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
          >
            <option value="">全部</option>
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已发布</option>
            <option value="ARCHIVED">已归档</option>
          </select>
        </div>
        <div>
          <label htmlFor="visibility" className="block text-xs font-medium text-muted">可见性</label>
          <select
            id="visibility"
            name="visibility"
            defaultValue={query.visibility ?? ""}
            className="mt-1 block rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
          >
            <option value="">全部</option>
            <option value="PUBLIC">公开</option>
            <option value="PRIVATE">私密</option>
            <option value="PASSWORD">密码</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          筛选
        </button>
        <Link href="/admin/projects" className="text-sm text-muted underline-offset-4 hover:underline">
          重置
        </Link>
      </form>

      {/* Big-card grid wrapped in a batch-delete controller */}
      {rows.length > 0 ? (
        <BatchDeleteForm rows={rows.map((r) => ({ id: r.id, title: r.title }))}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <ProjectCard key={row.id} row={row} />
            ))}
          </div>
        </BatchDeleteForm>
      ) : (
        <div className="rounded-md border border-dashed border-hair bg-surface p-10 text-center text-sm text-muted">
          暂无作品。点击右上角「新建作品」开始。
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} query={query} />
      ) : null}
    </section>
  );
}

function ProjectCard({ row }: { row: ProjectRow }) {
  const tags = flattenProjectTags(row);
  const images = flattenProjectImages(row);
  const cover = row.coverImage || images[0]?.imageUrl || null;
  return (
    <article className="group relative overflow-hidden rounded-md border border-hair bg-surface shadow-soft transition-shadow hover:shadow-float">
      <label className="absolute left-2 top-2 z-10 inline-flex size-5 cursor-pointer items-center justify-center rounded bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100 has-[:checked]:opacity-100">
        <input
          type="checkbox"
          name="ids"
          value={row.id}
          aria-label={`选择 ${row.title}`}
          className="size-4 cursor-pointer accent-accent"
        />
      </label>
      {row.featured ? (
        <span
          className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white shadow-soft"
          title="精选"
        >
          <Star aria-hidden className="size-3" />
          精选
        </span>
      ) : null}
      <Link
        href={`/admin/projects/${row.id}/edit`}
        className="block aspect-[4/3] w-full overflow-hidden bg-bg"
        aria-label={`编辑 ${row.title}`}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={row.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted">
            暂无图片
          </div>
        )}
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/admin/projects/${row.id}/edit`}
            className="font-serif text-lg font-semibold text-ink underline-offset-4 hover:text-accent hover:underline"
          >
            {row.title}
          </Link>
          <span className="font-mono text-[10px] text-muted">/{row.slug}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={row.status} />
          <VisibilityPill visibility={row.visibility} />
          <span className="inline-flex items-center gap-1 rounded bg-hair px-2 py-0.5 text-xs text-muted">
            <FileEdit aria-hidden className="size-3" />
            {images.length} 张图
          </span>
        </div>
        <p className="line-clamp-2 text-xs text-muted">{row.description}</p>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-hair px-2 py-0.5 text-[11px] text-ink"
              >
                {t.name}
              </span>
            ))}
            {tags.length > 4 ? (
              <span className="text-[11px] text-muted">+{tags.length - 4}</span>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>更新于 {formatDate(row.updatedAt)}</span>
          <Link
            href={`/admin/projects/${row.id}/edit`}
            className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
          >
            <FileEdit aria-hidden className="size-3" />
            编辑
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: ProjectRow["status"] }) {
  const cls =
    status === "PUBLISHED"
      ? "bg-success/10 text-success"
      : status === "ARCHIVED"
        ? "bg-hair text-muted"
        : "bg-accent-soft text-accent";
  const label =
    status === "PUBLISHED" ? "已发布" : status === "ARCHIVED" ? "已归档" : "草稿";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
  );
}

function VisibilityPill({ visibility }: { visibility: ProjectRow["visibility"] }) {
  if (visibility === "PUBLIC") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        <Eye aria-hidden className="size-3" /> 公开
      </span>
    );
  }
  if (visibility === "PRIVATE") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
        <Lock aria-hidden className="size-3" /> 私密
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-hair px-2 py-0.5 text-xs font-medium text-muted">
      <EyeOff aria-hidden className="size-3" /> 密码
    </span>
  );
}

function Pagination({
  page,
  totalPages,
  query,
}: {
  page: number;
  totalPages: number;
  query: { q?: string; status?: string; visibility?: string; pageSize?: number };
}) {
  const link = (p: number) => {
    const sp = new URLSearchParams();
    if (query.q) sp.set("q", query.q);
    if (query.status) sp.set("status", query.status);
    if (query.visibility) sp.set("visibility", query.visibility);
    if (query.pageSize) sp.set("pageSize", String(query.pageSize));
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/admin/projects${qs ? `?${qs}` : ""}`;
  };
  return (
    <nav aria-label="分页" className="flex items-center justify-center gap-2 text-sm">
      {page > 1 ? (
        <Link href={link(page - 1)} className="rounded border border-hair px-3 py-1 text-ink hover:border-accent hover:text-accent">
          上一页
        </Link>
      ) : (
        <span className="rounded border border-hair px-3 py-1 text-muted opacity-50">上一页</span>
      )}
      <span className="text-muted">第 {page} / {totalPages} 页</span>
      {page < totalPages ? (
        <Link href={link(page + 1)} className="rounded border border-hair px-3 py-1 text-ink hover:border-accent hover:text-accent">
          下一页
        </Link>
      ) : (
        <span className="rounded border border-hair px-3 py-1 text-muted opacity-50">下一页</span>
      )}
    </nav>
  );
}

// Unused symbol reference to keep the import from being tree-shaken
// if we ever inline the BatchDeleteForm into this file.
void Trash2;
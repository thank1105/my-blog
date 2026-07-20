// /admin/photos/albums -- album list (Phase 6 / Day 1, Chinese UI).

import type { Metadata } from "next";
import Link from "next/link";
import {
  Eye,
  Lock,
  Plus,
  Star,
} from "lucide-react";

import {
  listAlbums,
  listAlbumsQuerySchema,
  type AlbumRow,
} from "@/server/albums";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "相册管理",
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

export default async function AdminAlbumsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const parsed = listAlbumsQuerySchema.safeParse({
    q: sp.q || undefined,
    status: sp.status || undefined,
    visibility: sp.visibility || undefined,
    page: sp.page || undefined,
    pageSize: sp.pageSize || undefined,
  });
  const query = parsed.success ? parsed.data : listAlbumsQuerySchema.parse({});

  const { rows, total, page, pageSize } = await listAlbums(query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">相册管理</h1>
          <p className="mt-1 text-sm text-muted">
            共 <span className="font-medium text-ink">{total}</span> 个 · 第 {page} / {totalPages} 页
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/photos"
            className="inline-flex items-center gap-1.5 rounded border border-hair bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <Star aria-hidden className="size-4" />
            返回照片管理
          </Link>
          <Link
            href="/admin/photos/albums/new"
            className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90"
          >
            <Plus aria-hidden className="size-4" />
            新建相册
          </Link>
        </div>
      </header>

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
            placeholder="按标题 / 描述 搜索"
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
          </select>
        </div>
        <button
          type="submit"
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          筛选
        </button>
        <Link href="/admin/photos/albums" className="text-sm text-muted underline-offset-4 hover:underline">
          重置
        </Link>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
          暂无相册，<Link href="/admin/photos/albums/new" className="text-accent underline-offset-4 hover:underline">立刻创建</Link>。
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <AlbumCard key={row.id} row={row} />
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          query={{
            q: query.q,
            status: query.status,
            visibility: query.visibility,
            pageSize: query.pageSize,
          }}
        />
      ) : null}
    </section>
  );
}

function AlbumCard({ row }: { row: AlbumRow }) {
  return (
    <li className="group overflow-hidden rounded-md border border-hair bg-surface shadow-soft transition-colors hover:border-accent/50">
      <Link
        href={`/admin/photos/albums/${row.id}/edit`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="relative aspect-[16/9] w-full bg-bg">
          {row.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.coverImage}
              alt={row.title}
              className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted">
              暂无封面
            </div>
          )}
          <div className="absolute right-1 top-1">
            <StatusPill status={row.status} />
          </div>
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 font-serif text-lg font-semibold text-ink">
              {row.title}
            </p>
            <span className="font-mono text-[10px] text-muted">/{row.slug}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <VisibilityPill visibility={row.visibility} />
            <span className="inline-flex items-center gap-1 rounded bg-hair px-2 py-0.5 text-xs text-muted">
              {row._count.photos} 张照片
            </span>
          </div>
          {row.description ? (
            <p className="line-clamp-2 text-xs text-muted">{row.description}</p>
          ) : null}
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>更新于 {formatDate(row.updatedAt)}</span>
            <span className="text-accent">编辑 →</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function StatusPill({ status }: { status: AlbumRow["status"] }) {
  const cls =
    status === "PUBLISHED"
      ? "bg-success text-white"
      : status === "ARCHIVED"
        ? "bg-muted text-white"
        : "bg-accent text-white";
  const label =
    status === "PUBLISHED" ? "已发布" : status === "ARCHIVED" ? "已归档" : "草稿";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium shadow-soft ${cls}`}>
      {label}
    </span>
  );
}

function VisibilityPill({ visibility }: { visibility: AlbumRow["visibility"] }) {
  if (visibility === "PUBLIC") {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        <Eye aria-hidden className="size-3" /> 公开
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
      <Lock aria-hidden className="size-3" /> 私密
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
    return `/admin/photos/albums${qs ? `?${qs}` : ""}`;
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
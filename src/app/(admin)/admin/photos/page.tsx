// /admin/photos -- list + filter + search + batch delete + batch move
// (Phase 6 / Day 1).
//
// Pinterest-style thumbnails inside a responsive grid. Each card has
// a checkbox that participates in the BatchDeleteForm toolbar; the
// toolbar also exposes a "move to album" picker so an entire batch
// can be reassigned without opening each photo.

import type { Metadata } from "next";
import Link from "next/link";
import {
  Eye,
  Lock,
  Plus,
  MapPin,
  Calendar,
  Star,
} from "lucide-react";

import {
  listPhotos,
  listPhotosQuerySchema,
  type PhotoRow,
} from "@/server/photos";
import { listAlbums } from "@/server/albums";
import { formatDate } from "@/lib/format";
import { BatchDeleteForm } from "./BatchDeleteForm";

export const metadata: Metadata = {
  title: "照片管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    visibility?: string;
    albumId?: string;
    unassigned?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function AdminPhotosPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const parsed = listPhotosQuerySchema.safeParse({
    q: sp.q || undefined,
    status: sp.status || undefined,
    visibility: sp.visibility || undefined,
    albumId: sp.albumId || undefined,
    unassigned: sp.unassigned === "1" ? true : undefined,
    page: sp.page || undefined,
    pageSize: sp.pageSize || undefined,
  });
  const query = parsed.success ? parsed.data : listPhotosQuerySchema.parse({});

  const [{ rows, total, page, pageSize }, { rows: albums }] = await Promise.all([
    listPhotos(query),
    listAlbums({ pageSize: 100 }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const albumsForToolbar = albums.map((a) => ({ id: a.id, title: a.title }));

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">照片管理</h1>
          <p className="mt-1 text-sm text-muted">
            共 <span className="font-medium text-ink">{total}</span> 张 · 第 {page} / {totalPages} 页
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/photos/albums"
            className="inline-flex items-center gap-1.5 rounded border border-hair bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <Star aria-hidden className="size-4" />
            相册管理
          </Link>
          <Link
            href="/admin/photos/new"
            className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90"
          >
            <Plus aria-hidden className="size-4" />
            上传照片
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
            placeholder="按标题 / 描述 / 地点 搜索"
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
        <div>
          <label htmlFor="albumId" className="block text-xs font-medium text-muted">相册</label>
          <select
            id="albumId"
            name="albumId"
            defaultValue={query.albumId ?? ""}
            className="mt-1 block rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
          >
            <option value="">全部</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            name="unassigned"
            value="1"
            defaultChecked={!!query.unassigned}
            className="size-3.5 rounded border-hair accent-accent"
          />
          只看独立照片
        </label>
        <button
          type="submit"
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          筛选
        </button>
        <Link href="/admin/photos" className="text-sm text-muted underline-offset-4 hover:underline">
          重置
        </Link>
      </form>

      {rows.length > 0 ? (
        <BatchDeleteForm
          rows={rows.map((r) => ({ id: r.id, title: r.title ?? "(无标题)" }))}
          albums={albumsForToolbar}
        >
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((row) => (
              <PhotoCard key={row.id} row={row} />
            ))}
          </ul>
        </BatchDeleteForm>
      ) : (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
          暂无照片，去 <Link href="/admin/photos/new" className="text-accent underline-offset-4 hover:underline">上传页面</Link> 添加吧。
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          query={{
            q: query.q,
            status: query.status,
            visibility: query.visibility,
            albumId: query.albumId,
            unassigned: query.unassigned,
            pageSize: query.pageSize,
          }}
        />
      ) : null}
    </section>
  );
}

function PhotoCard({ row }: { row: PhotoRow }) {
  const dim =
    row.width && row.height
      ? `${row.width} × ${row.height}`
      : null;
  return (
    <li className="group relative overflow-hidden rounded-md border border-hair bg-surface shadow-soft">
      <Link
        href={`/admin/photos/${row.id}/edit`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="relative aspect-square w-full bg-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.thumbnailUrl ?? row.imageUrl}
            alt={row.title ?? row.album?.title ?? "照片"}
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <span className="pointer-events-none absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-ink/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
            {row.album ? row.album.title : "独立"}
          </span>
          <div className="pointer-events-none absolute right-1 top-1 flex flex-col gap-1">
            <StatusPill status={row.status} />
          </div>
        </div>
        <div className="space-y-1 p-2">
          <p className="line-clamp-1 text-sm font-medium text-ink">
            {row.title ?? "(无标题)"}
          </p>
          <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted">
            {row.takenAt ? (
              <span className="inline-flex items-center gap-0.5">
                <Calendar aria-hidden className="size-3" />
                {new Intl.DateTimeFormat("zh-CN", { dateStyle: "short" }).format(new Date(row.takenAt))}
              </span>
            ) : null}
            {row.location ? (
              <span className="inline-flex items-center gap-0.5">
                <MapPin aria-hidden className="size-3" />
                <span className="line-clamp-1">{row.location}</span>
              </span>
            ) : null}
            {dim ? <span>· {dim}</span> : null}
          </div>
          <div className="flex items-center justify-between pt-1">
            <VisibilityPill visibility={row.visibility} />
            <span className="text-[10px] text-muted">
              {formatDate(row.updatedAt)}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function StatusPill({ status }: { status: PhotoRow["status"] }) {
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

function VisibilityPill({ visibility }: { visibility: PhotoRow["visibility"] }) {
  if (visibility === "PUBLIC") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-success">
        <Eye aria-hidden className="size-3" /> 公开
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-accent">
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
  query: {
    q?: string;
    status?: string;
    visibility?: string;
    albumId?: string;
    unassigned?: boolean;
    pageSize?: number;
  };
}) {
  const link = (p: number) => {
    const sp = new URLSearchParams();
    if (query.q) sp.set("q", query.q);
    if (query.status) sp.set("status", query.status);
    if (query.visibility) sp.set("visibility", query.visibility);
    if (query.albumId) sp.set("albumId", query.albumId);
    if (query.unassigned) sp.set("unassigned", "1");
    if (query.pageSize) sp.set("pageSize", String(query.pageSize));
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/admin/photos${qs ? `?${qs}` : ""}`;
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
// /admin/notes -- list + filter + search + batch delete (Phase 4).

import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeOff, FileEdit, Lock, Plus } from "lucide-react";

import { listNotes, listNotesQuerySchema, flattenNoteTags, type NoteRow } from "@/server/notes";
import { formatDate } from "@/lib/format";
import { BatchDeleteForm } from "./BatchDeleteForm";

export const metadata: Metadata = {
  title: "笔记管理",
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

export default async function AdminNotesPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const parsed = listNotesQuerySchema.safeParse({
    q: sp.q || undefined,
    status: sp.status || undefined,
    visibility: sp.visibility || undefined,
    page: sp.page || undefined,
    pageSize: sp.pageSize || undefined,
  });
  const query = parsed.success
    ? parsed.data
    : listNotesQuerySchema.parse({});

  const { rows, total, page, pageSize } = await listNotes(query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">笔记管理</h1>
          <p className="mt-1 text-sm text-muted">
            共 <span className="font-medium text-ink">{total}</span> 篇 · 第 {page} / {totalPages} 页
          </p>
        </div>
        <Link
          href="/admin/notes/new"
          className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90"
        >
          <Plus aria-hidden className="size-4" />
          新建笔记
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
            placeholder="按标题 / slug / 摘要 搜索"
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
        <Link href="/admin/notes" className="text-sm text-muted underline-offset-4 hover:underline">
          重置
        </Link>
      </form>

      {/* Table with batch delete */}
      {rows.length > 0 ? (
        <BatchDeleteForm rows={rows}>
          <div className="overflow-x-auto rounded-md border border-hair bg-surface shadow-soft">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="border-b border-hair px-3 py-2 font-medium w-8">
                    <span className="sr-only">选择</span>
                  </th>
                  <th className="border-b border-hair px-3 py-2 font-medium">标题</th>
                  <th className="border-b border-hair px-3 py-2 font-medium">slug</th>
                  <th className="border-b border-hair px-3 py-2 font-medium">状态</th>
                  <th className="border-b border-hair px-3 py-2 font-medium">可见性</th>
                  <th className="border-b border-hair px-3 py-2 font-medium">标签</th>
                  <th className="border-b border-hair px-3 py-2 font-medium">更新时间</th>
                  <th className="border-b border-hair px-3 py-2 font-medium"><span className="sr-only">操作</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <NoteRowView key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </BatchDeleteForm>
      ) : (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
          暂无笔记，点击右上角`新建笔记`开始写。
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} query={query} />
      ) : null}
    </section>
  );
}

function NoteRowView({ row }: { row: NoteRow }) {
  const tags = flattenNoteTags(row);
  return (
    <tr className="hover:bg-bg/40">
      <td className="border-b border-hair px-3 py-2 align-middle">
        <input
          type="checkbox"
          name="ids"
          value={row.id}
          className="size-4 rounded border-hair accent-accent"
        />
      </td>
      <td className="border-b border-hair px-3 py-2 align-top">
        <Link
          href={`/admin/notes/${row.id}/edit`}
          className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline"
        >
          {row.title}
        </Link>
        {row.excerpt ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted">{row.excerpt}</p>
        ) : null}
      </td>
      <td className="border-b border-hair px-3 py-2 align-top font-mono text-xs text-muted">
        /{row.slug}
      </td>
      <td className="border-b border-hair px-3 py-2 align-top">
        <StatusPill status={row.status} />
      </td>
      <td className="border-b border-hair px-3 py-2 align-top">
        <VisibilityPill visibility={row.visibility} />
      </td>
      <td className="border-b border-hair px-3 py-2 align-top">
        <div className="flex flex-wrap gap-1">
          {tags.length === 0 ? (
            <span className="text-xs text-muted">—</span>
          ) : (
            tags.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-hair px-2 py-0.5 text-xs text-ink"
              >
                {t.name}
              </span>
            ))
          )}
        </div>
      </td>
      <td className="border-b border-hair px-3 py-2 align-top text-xs text-muted">
        {formatDate(row.updatedAt)}
      </td>
      <td className="border-b border-hair px-3 py-2 align-top text-right">
        <Link
          href={`/admin/notes/${row.id}/edit`}
          className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
        >
          <FileEdit aria-hidden className="size-3.5" />
          编辑
        </Link>
      </td>
    </tr>
  );
}

function StatusPill({ status }: { status: NoteRow["status"] }) {
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

function VisibilityPill({ visibility }: { visibility: NoteRow["visibility"] }) {
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
    return `/admin/notes${qs ? `?${qs}` : ""}`;
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
      <span className="text-muted">
        第 {page} / {totalPages} 页
      </span>
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

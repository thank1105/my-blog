// /admin/tags -- Phase 7 / Day 1 (Chinese UI)

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Tag as TagIcon } from "lucide-react";

import {
  listTagsAdmin,
  type TagRow,
} from "@/server/tags";
import { DeleteTagButton } from "@/components/admin/tags/DeleteTagButton";

export const metadata: Metadata = {
  title: "标签管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    q?: string;
  }>;
}

export default async function AdminTagsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const q = sp.q?.trim() || undefined;
  const rows = await listTagsAdmin({ q });

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">标签管理</h1>
          <p className="mt-1 text-sm text-muted">
            共 <span className="font-medium text-ink">{rows.length}</span> 个 ·{" "}
            <Link href="/admin/categories" className="text-accent underline-offset-4 hover:underline">
              分类管理
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded border border-hair bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <TagIcon aria-hidden className="size-4" />
            返回后台
          </Link>
          <Link
            href="/admin/tags/new"
            className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90"
          >
            <Plus aria-hidden className="size-4" />
            新建标签
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
            defaultValue={q ?? ""}
            placeholder="按名称 / slug 搜索"
            className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          搜索
        </button>
        <Link href="/admin/tags" className="text-sm text-muted underline-offset-4 hover:underline">
          重置
        </Link>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
          暂无标签，<Link href="/admin/tags/new" className="text-accent underline-offset-4 hover:underline">立刻创建</Link>。
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-hair bg-surface shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-bg text-left text-xs uppercase tracking-[0.3em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">标签</th>
                <th className="px-4 py-3 font-medium">slug</th>
                <th className="px-4 py-3 font-medium">关联数</th>
                <th className="px-4 py-3 font-medium">颜色</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {rows.map((row) => (
                <TagRowEl key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TagRowEl({ row }: { row: TagRow }) {
  const total = row._count.articles + row._count.notes + row._count.projects;
  return (
    <tr className="hover:bg-bg/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {row.color ? (
            <span
              className="inline-block size-3 shrink-0 rounded-full border border-hair"
              style={{ background: row.color }}
              aria-hidden
            />
          ) : null}
          <div>
            <div className="font-medium text-ink">{row.name}</div>
            {row.description ? (
              <div className="line-clamp-1 text-xs text-muted">{row.description}</div>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted">/{row.slug}</td>
      <td className="px-4 py-3 text-xs text-muted">
        {total}
        <span className="ml-2 text-[10px] text-muted/70">
          (文 {row._count.articles} / 笔 {row._count.notes} / 作 {row._count.projects})
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted">
        {row.color ?? <span className="text-muted/50">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-wrap justify-end gap-3">
          <Link
            href={`/admin/tags/${row.id}/edit`}
            className="text-xs text-accent underline-offset-4 hover:underline"
          >
            编辑
          </Link>
          <DeleteTagButton id={row.id} name={row.name} />
        </div>
      </td>
    </tr>
  );
}
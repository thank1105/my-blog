// /admin/categories -- Phase 7 / Day 1 (Chinese UI)

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FolderTree } from "lucide-react";

import {
  listCategoriesAdmin,
  type CategoryRow,
} from "@/server/categories";

export const metadata: Metadata = {
  title: "分类管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    type?: string;
    q?: string;
  }>;
}

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const type = sp.type === "ARTICLE" || sp.type === "PROJECT" ? sp.type : undefined;
  const q = sp.q?.trim() || undefined;
  const rows = await listCategoriesAdmin({ type, q });

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">分类管理</h1>
          <p className="mt-1 text-sm text-muted">
            共 <span className="font-medium text-ink">{rows.length}</span> 个
            · 当前筛选：{type ? `type=${type}` : "全部"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 rounded border border-hair bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <FolderTree aria-hidden className="size-4" />
            返回后台
          </Link>
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90"
          >
            <Plus aria-hidden className="size-4" />
            新建分类
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
        <div>
          <label htmlFor="type" className="block text-xs font-medium text-muted">类型</label>
          <select
            id="type"
            name="type"
            defaultValue={type ?? ""}
            className="mt-1 block rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
          >
            <option value="">全部</option>
            <option value="ARTICLE">文章分类</option>
            <option value="PROJECT">作品分类</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          筛选
        </button>
        <Link href="/admin/categories" className="text-sm text-muted underline-offset-4 hover:underline">
          重置
        </Link>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
          暂无分类，<Link href="/admin/categories/new" className="text-accent underline-offset-4 hover:underline">立刻创建</Link>。
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-hair bg-surface shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-bg text-left text-xs uppercase tracking-[0.3em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">名称</th>
                <th className="px-4 py-3 font-medium">slug</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">排序</th>
                <th className="px-4 py-3 font-medium">已发布</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {rows.map((row) => (
                <CategoryRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CategoryRow({ row }: { row: CategoryRow }) {
  const total = row._count.articles + row._count.projects;
  return (
    <tr className="hover:bg-bg/50">
      <td className="px-4 py-3">
        <div className="font-medium text-ink">{row.name}</div>
        {row.description ? (
          <div className="line-clamp-1 text-xs text-muted">{row.description}</div>
        ) : null}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted">/{row.slug}</td>
      <td className="px-4 py-3">
        <span
          className={
            row.type === "ARTICLE"
              ? "rounded bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
              : "rounded bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
          }
        >
          {row.type === "ARTICLE" ? "文章" : "作品"}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted">{row.order}</td>
      <td className="px-4 py-3 text-xs text-muted">{total}</td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/admin/categories/${row.id}/edit`}
          className="text-xs text-accent underline-offset-4 hover:underline"
        >
          编辑
        </Link>
      </td>
    </tr>
  );
}
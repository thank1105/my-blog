import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { listRootColumns } from "@/server/columns";

export const metadata: Metadata = { title: "专栏管理", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminColumnsPage() {
  const roots = await listRootColumns();
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">专栏管理</h1>
          <p className="mt-1 text-sm text-muted">技术文章采用固定两级专栏结构。</p>
        </div>
        <Link href="/admin/columns/new" className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90">
          <Plus aria-hidden className="size-4" />新建专栏
        </Link>
      </header>

      {roots.length === 0 ? (
        <div className="rounded-md border border-dashed border-hair px-6 py-14 text-center text-sm text-muted">暂无专栏，请先创建一个一级专栏。</div>
      ) : (
        <div className="overflow-hidden rounded-md border border-hair bg-surface">
          {roots.map((root, index) => (
            <div key={root.id} className={index > 0 ? "border-t border-hair" : ""}>
              <ColumnRow id={root.id} name={root.name} slug={root.slug} count={root._count.articles} childCount={root.children.length} />
              {root.children.length > 0 ? (
                <div className="border-t border-hair bg-bg/60 px-4 py-2 sm:pl-10">
                  {root.children.map((child) => (
                    <ColumnRow key={child.id} id={child.id} name={child.name} slug={child.slug} count={child._count.articles} nested />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ColumnRow({ id, name, slug, count, childCount, nested }: { id: string; name: string; slug: string; count: number; childCount?: number; nested?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className={`truncate font-medium text-ink ${nested ? "text-sm" : ""}`}>{nested ? "↳ " : ""}{name}</p>
        <p className="font-mono text-xs text-muted">/{slug}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4 text-xs text-muted">
        <span>{count} 篇{childCount ? `，${childCount} 个子专栏` : ""}</span>
        <Link href={`/admin/columns/${id}/edit`} className="text-accent hover:underline">编辑</Link>
      </div>
    </div>
  );
}

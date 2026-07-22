import type { Metadata } from "next";
import Link from "next/link";

import { listColumnTree } from "@/server/articles-public";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "专栏", description: "按主题浏览小川记事的技术文章。" };

const TONES = [
  "border-t-accent bg-accent-soft/35",
  "border-t-indigo bg-indigo-soft/35",
  "border-t-teal bg-teal-soft/35",
] as const;

export default async function ColumnsPage() {
  const columns = await listColumnTree();
  return (
    <section className="mx-auto max-w-container px-4 py-10 sm:px-8">
      <header className="rounded-lg border border-hair bg-surface px-8 py-8 shadow-soft">
        <h1 className="text-4xl font-bold tracking-tight text-ink">技术专栏</h1>
        <p className="mt-3 max-w-[58ch] text-base leading-7 text-muted">从主题进入，连续阅读同一方向的实现、问题与复盘。</p>
      </header>
      {columns.length === 0 ? (
        <div className="mt-7 rounded-lg border border-dashed border-hair bg-surface py-16 text-center text-sm text-muted">暂时还没有专栏。</div>
      ) : (
        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          {columns.map((column, index) => (
            <section key={column.id} className={cn("rounded-lg border border-hair border-t-[3px] p-6 shadow-soft", TONES[index % TONES.length])}>
              <div className="flex items-start justify-between gap-5">
                <div>
                  <Link href={`/columns/${column.slug}`} className="text-xl font-bold text-ink transition-colors hover:text-accent">{column.name}</Link>
                  {column.description ? <p className="mt-2 text-sm leading-6 text-muted">{column.description}</p> : null}
                </div>
                <span className="shrink-0 font-mono text-xs text-muted">{column.totalCount} 篇</span>
              </div>
              {column.children.length > 0 ? (
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {column.children.map((child) => (
                    <li key={child.id}>
                      <Link href={`/columns/${child.slug}`} className="flex items-center justify-between gap-3 rounded-md border border-hair bg-surface px-3 py-2.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent">
                        <span>{child.name}</span>
                        <span className="font-mono text-[11px] text-muted">{child.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

import Link from "next/link";

import type { PublicColumnNode } from "@/server/articles-public";
import { cn } from "@/lib/utils";

export function ColumnTree({ columns, activeSlug, allCount }: { columns: PublicColumnNode[]; activeSlug?: string; allCount: number }) {
  const content = <TreeContent columns={columns} activeSlug={activeSlug} allCount={allCount} />;
  return (
    <>
      <details className="group rounded-md border border-hair bg-surface lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink marker:content-none">
          <span className="flex items-center justify-between">
            选择专栏
            <span aria-hidden className="text-muted transition-transform group-open:rotate-180">⌄</span>
          </span>
        </summary>
        <div className="border-t border-hair p-2">{content}</div>
      </details>
      <nav aria-label="专栏导航" className="hidden lg:block">
        <p className="mb-3 font-mono text-[10px] font-medium text-muted">浏览专栏</p>
        {content}
      </nav>
    </>
  );
}

function TreeContent({ columns, activeSlug, allCount }: { columns: PublicColumnNode[]; activeSlug?: string; allCount: number }) {
  return (
    <ul className="space-y-1 text-sm">
      <li>
        <TreeLink href="/" active={!activeSlug} label="全部文章" count={allCount} />
      </li>
      {columns.map((column, index) => (
        <li key={column.id} className="pt-1">
          <TreeLink href={`/columns/${column.slug}`} active={activeSlug === column.slug} label={column.name} count={column.totalCount} strong tone={index % 3} />
          {column.children.length > 0 ? (
            <ul className="ml-3 mt-1 border-l border-hair pl-2">
              {column.children.map((child) => (
                <li key={child.id}>
                  <TreeLink href={`/columns/${child.slug}`} active={activeSlug === child.slug} label={child.name} count={child.count} />
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function TreeLink({ href, active, label, count, strong, tone = 0 }: { href: string; active: boolean; label: string; count: number; strong?: boolean; tone?: number }) {
  const toneClass = tone === 1 ? "border-l-2 border-indigo/35" : tone === 2 ? "border-l-2 border-teal/40" : "border-l-2 border-accent/35";
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-between gap-3 rounded px-2 py-2 transition-colors active:translate-y-px",
        active ? "bg-accent-soft text-accent" : "text-ink hover:bg-bg hover:text-accent",
        strong && cn("font-medium", toneClass),
      )}
    >
      <span className="truncate">{label}</span>
      <span className="font-mono text-[11px] text-muted">{count}</span>
    </Link>
  );
}

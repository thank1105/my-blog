// /archive -- Phase 8 / Day 2. A single timeline of every public article,
// note, and project, grouped by year and month (newest first).

import type { Metadata } from "next";
import Link from "next/link";
import { Archive as ArchiveIcon, FileText, NotebookPen, FolderGit2 } from "lucide-react";

import { listArchiveTimeline, type ArchiveKind } from "@/server/archive-public";
import { formatDateOnly } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "归档",
  description: "按时间线浏览所有公开的文章、笔记与作品。",
  openGraph: {
    title: "归档 · 小川记事",
    description: "按时间线浏览所有公开的文章、笔记与作品。",
    type: "website",
  },
};

const KIND_META: Record<
  ArchiveKind,
  { label: string; icon: typeof FileText; className: string }
> = {
  article: { label: "文章", icon: FileText, className: "text-accent" },
  note: { label: "笔记", icon: NotebookPen, className: "text-success" },
  project: { label: "作品", icon: FolderGit2, className: "text-ink" },
};

export default async function ArchivePage() {
  const timeline = await listArchiveTimeline();
  const total = timeline.reduce((sum, y) => sum + y.count, 0);

  return (
    <section className="mx-auto max-w-container px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Archive</p>
        <h1 className="mt-1 flex items-center gap-2 font-serif text-3xl font-bold text-ink sm:text-4xl">
          <ArchiveIcon aria-hidden className="size-6" />
          归档
        </h1>
        <p className="mt-2 text-sm text-muted">
          共 {total} 条公开内容，按时间倒序排列。
        </p>
      </header>

      {timeline.length === 0 ? (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
          <p>还没有已发布的内容。</p>
          <p className="mt-2 text-xs">先去后台写一篇文章或笔记吧。</p>
        </div>
      ) : (
        <div className="space-y-12">
          {timeline.map((yearGroup) => (
            <div key={yearGroup.year}>
              <div className="mb-4 flex items-baseline gap-3 border-b border-hair pb-2">
                <h2 className="font-serif text-2xl font-bold text-ink">
                  {yearGroup.year}
                </h2>
                <span className="font-mono text-xs text-muted">
                  {yearGroup.count} 条
                </span>
              </div>

              <div className="space-y-6">
                {yearGroup.months.map((month) => (
                  <div
                    key={month.key}
                    className="grid gap-3 sm:grid-cols-[6rem_1fr] sm:gap-6"
                  >
                    <p className="pt-1 font-serif text-sm text-muted sm:text-right">
                      {month.monthLabel}
                    </p>
                    <ul className="space-y-1 border-l border-hair pl-4 sm:pl-6">
                      {month.entries.map((entry) => {
                        const meta = KIND_META[entry.kind];
                        const Icon = meta.icon;
                        return (
                          <li key={entry.id}>
                            <Link
                              href={entry.href}
                              className="group flex items-baseline gap-3 rounded px-2 py-1.5 transition-colors hover:bg-bg/60"
                            >
                              <span className="shrink-0 font-mono text-xs text-muted/70">
                                {formatDateOnly(entry.date)}
                              </span>
                              <span
                                className={`inline-flex shrink-0 items-center gap-1 text-[11px] ${meta.className}`}
                                title={meta.label}
                              >
                                <Icon aria-hidden className="size-3" />
                                {meta.label}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-medium text-ink group-hover:text-accent">
                                {entry.title}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

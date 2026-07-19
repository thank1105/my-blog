// Server component: latest N notes digest for the homepage (Phase 4 / Day 2).
//
// Reads the latest published notes via the public server helper and
// renders a dense list. Reuses the row layout from the dedicated
// /notes page so the two surfaces feel identical.

import Link from "next/link";
import { CalendarDays, NotebookPen } from "lucide-react";

import { listLatestNotes } from "@/server/notes-public";
import { markdownExcerpt } from "@/lib/markdown";
import { formatDateOnly } from "@/lib/format";

export interface NotesDigestProps {
  /** How many notes to show. Default 5 (per DEVELOPMENT.md Phase 4 / Day 2). */
  limit?: number;
  /** Optional heading override. Defaults to the Chinese eyebrow label. */
  heading?: string;
  /** Optional description shown beneath the heading. */
  description?: string;
  /** Whether to render the heading. False when embedded inside another section. */
  showHeader?: boolean;
}

export async function NotesDigest({
  limit = 5,
  heading = "最新笔记",
  description = "随手记 / 想法 / 拾遗",
  showHeader = true,
}: NotesDigestProps) {
  const rows = await listLatestNotes(limit);

  if (rows.length === 0) {
    return (
      <section className="space-y-4">
        {showHeader ? (
          <header className="flex items-end justify-between gap-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
                Notes
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-ink">
                {heading}
              </h2>
              <p className="mt-1 text-sm text-muted">{description}</p>
            </div>
          </header>
        ) : null}
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-10 text-center text-sm text-muted">
          <NotebookPen aria-hidden className="mx-auto mb-2 size-5 text-muted" />
          暂无已发布笔记。先去后台写一篇吧。
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {showHeader ? (
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
              Notes
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-ink">
              {heading}
            </h2>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
          <Link
            href="/notes"
            className="text-sm text-accent underline-offset-4 hover:underline"
          >
            查看全部笔记 →
          </Link>
        </header>
      ) : null}
      <ul className="divide-y divide-hair rounded-md border border-hair bg-surface shadow-soft">
        {rows.map((note) => {
          const excerpt =
            note.excerpt && note.excerpt.length > 0
              ? note.excerpt
              : markdownExcerpt(note.content, 100);
          const dateStr = formatDateOnly(note.publishedAt ?? note.createdAt);
          return (
            <li key={note.id}>
              <Link
                href={` + "/notes/" + note.slug + `}
                className="group flex items-baseline gap-3 px-4 py-3 transition-colors hover:bg-bg/60"
              >
                <span className="shrink-0 font-mono text-xs text-muted/60">
                  {dateStr}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink group-hover:text-accent">
                  {note.title}
                </span>
                {excerpt ? (
                  <span className="hidden min-w-0 flex-1 truncate text-xs text-muted md:inline">
                    — {excerpt}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="flex items-center gap-1 text-xs text-muted">
        <CalendarDays aria-hidden className="size-3" />
        按发布时间倒序，最多显示 {limit} 条。
      </p>
    </section>
  );
}

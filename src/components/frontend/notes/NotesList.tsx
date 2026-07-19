// Shared server component for the notes list page (Phase 4).
//
// One-row-per-note dense layout, grouped by month. Reuses the tag cloud
// pattern from articles for the sidebar.

import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";

import {
  listPublishedNotes,
  listNoteTagsWithCount,
} from "@/server/notes-public";
import type { NoteRow } from "@/server/notes";
import { markdownExcerpt } from "@/lib/markdown";
import { formatDateOnly } from "@/lib/format";
import { TagCloud, type TagCloudItem } from "@/components/frontend/articles/TagCloud";

export interface NotesListProps {
  q?: string;
  tagSlug?: string;
  page: number;
  pageSize?: number;
  heading: string;
}

/** Group notes by year+month for the month-grouped list. */
function groupByMonth(notes: NoteRow[]): Map<string, NoteRow[]> {
  const map = new Map<string, NoteRow[]>();
  for (const note of notes) {
    const d = note.publishedAt ?? note.updatedAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const arr = map.get(key);
    if (arr) arr.push(note);
    else map.set(key, [note]);
  }
  return map;
}

const MONTH_NAMES = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${y} 年 ${MONTH_NAMES[parseInt(m, 10) - 1]}`;
}

export async function NotesList({
  q,
  tagSlug,
  page,
  pageSize = 20,
  heading,
}: NotesListProps) {
  const [{ rows, total, pageSize: ps }, tags] = await Promise.all([
    listPublishedNotes({ q, tagSlug, page, pageSize }),
    listNoteTagsWithCount(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ps));
  if (page > totalPages && total > 0) notFound();

  const tagItems: TagCloudItem[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    count: t.count,
  }));

  const grouped = groupByMonth(rows);

  return (
    <section className="mx-auto max-w-container px-4 py-6 sm:py-10 sm:px-8">
      <header className="mb-6 sm:mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          Notes · {total} 篇
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-ink sm:text-4xl">
          {heading}
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        <div className="space-y-6">
          <form
            method="GET"
            action="/notes"
            className="rounded-md border border-hair bg-surface p-3 shadow-soft"
          >
            <label htmlFor="q" className="block text-xs font-medium text-muted">
              搜索
            </label>
            <div className="mt-1 flex gap-1">
              <input
                id="q"
                name="q"
                defaultValue={q ?? ""}
                placeholder="标题或摘要"
                className="block w-full rounded border border-hair bg-bg px-2 py-1 text-sm text-ink outline-none focus-visible:border-accent"
              />
              {tagSlug ? (
                <input type="hidden" name="tag" defaultValue={tagSlug} />
              ) : null}
              <button
                type="submit"
                className="rounded bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent/90"
              >
                搜
              </button>
            </div>
          </form>

          {tagItems.length > 0 ? (
            <TagCloud tags={tagItems} activeSlug={tagSlug} title="标签" />
          ) : null}

          {tagSlug || q ? (
            <Link
              href="/notes"
              className="inline-flex w-fit items-center text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
            >
              清除筛选
            </Link>
          ) : null}
        </div>

        <div>
          {rows.length === 0 ? (
            <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
              {q || tagSlug
                ? "没有匹配的笔记，试试清除筛选。"
                : "暂无已发布笔记。"}
            </div>
          ) : (
            <div className="space-y-8">
              {Array.from(grouped.entries()).map(([key, notes]) => (
                <div key={key}>
                  <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold text-ink">
                    <CalendarDays aria-hidden className="size-4 text-muted" />
                    {monthLabel(key)}
                  </h2>
                  <ul className="space-y-0.5">
                    {notes.map((note) => (
                      <li key={note.id}>
                        <NoteRowItem note={note} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              query={{ q, tagSlug }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function NoteRowItem({ note }: { note: NoteRow }) {
  const excerpt =
    note.excerpt && note.excerpt.length > 0
      ? note.excerpt
      : markdownExcerpt(note.content, 100);
  const tags = note.tags.map((t) => t.tag);
  const dateStr = formatDateOnly(note.publishedAt ?? note.createdAt);

  return (
    <Link
      href={`/notes/${note.slug}`}
      className="block rounded px-2 py-1.5 -mx-2 transition-colors hover:bg-bg/60 group"
    >
      <div className="flex items-baseline gap-3">
        <span className="shrink-0 font-mono text-xs text-muted/60">
          {dateStr}
        </span>
        <span className="font-medium text-ink group-hover:text-accent transition-colors truncate">
          {note.title}
        </span>
        {excerpt ? (
          <span className="hidden sm:inline text-xs text-muted truncate">
            — {excerpt}
          </span>
        ) : null}
        {tags.length > 0 ? (
          <span className="ml-auto hidden sm:flex items-center gap-1 shrink-0">
            {tags.slice(0, 2).map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-hair px-1.5 py-0.5 text-[10px] text-muted"
              >
                {t.name}
              </span>
            ))}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function buildPageHref(
  p: number,
  basePath: string,
  q: { q?: string; tagSlug?: string },
): string {
  const sp = new URLSearchParams();
  if (q.q) sp.set("q", q.q);
  if (q.tagSlug) sp.set("tag", q.tagSlug);
  if (p > 1) sp.set("page", String(p));
  const qs = sp.toString();
  return `${basePath}${qs ? `?${qs}` : ""}`;
}

function Pagination({
  page,
  totalPages,
  query,
  basePath = "/notes",
}: {
  page: number;
  totalPages: number;
  query: { q?: string; tagSlug?: string };
  basePath?: string;
}) {
  return (
    <nav aria-label="分页" className="mt-10 flex items-center justify-center gap-2 text-sm">
      {page > 1 ? (
        <Link
          href={buildPageHref(page - 1, basePath, query)}
          className="rounded border border-hair px-3 py-1 text-ink hover:border-accent hover:text-accent"
        >
          上一页
        </Link>
      ) : (
        <span className="rounded border border-hair px-3 py-1 text-muted opacity-50">上一页</span>
      )}
      <span className="text-muted">
        第 {page} / {totalPages} 页
      </span>
      {page < totalPages ? (
        <Link
          href={buildPageHref(page + 1, basePath, query)}
          className="rounded border border-hair px-3 py-1 text-ink hover:border-accent hover:text-accent"
        >
          下一页
        </Link>
      ) : (
        <span className="rounded border border-hair px-3 py-1 text-muted opacity-50">下一页</span>
      )}
    </nav>
  );
}

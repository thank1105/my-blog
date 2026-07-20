// /tags -- 标签云 (Phase 7 / Day 2)

import type { Metadata } from "next";
import Link from "next/link";
import { Tag as TagIcon } from "lucide-react";

import { listPublicTagsWithCount } from "@/server/tags-public";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "标签云",
  description: "按标签浏览所有公开内容。",
};

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await listPublicTagsWithCount();

  return (
    <section className="mx-auto max-w-container px-4 py-6 sm:py-10 sm:px-8">
      <header className="mb-6 sm:mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Tags</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-ink sm:text-4xl">标签云</h1>
        <p className="mt-2 max-w-prose text-sm text-muted">
          共 <span className="font-medium text-ink">{tags.length}</span> 个标签 · 点击进入查看相关文章 / 笔记 / 作品
        </p>
      </header>

      {tags.length === 0 ? (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
          还没有任何标签。
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link
              key={t.id}
              href={`/tags/${t.slug}`}
              className="group inline-flex items-center gap-1.5 rounded-full border border-hair bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
              style={t.color ? ({ ["--tag-color" as string]: t.color } as React.CSSProperties) : undefined}
            >
              <span
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ background: t.color ?? "var(--color-accent)" }}
                aria-hidden
              />
              <span className="font-medium">{t.name}</span>
              <span className="rounded-full bg-hair px-1.5 py-0.5 font-mono text-[10px] text-muted group-hover:bg-accent-soft">
                {t.count}
              </span>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-muted">
        最近更新 {formatDate(new Date())}
      </p>
    </section>
  );
}
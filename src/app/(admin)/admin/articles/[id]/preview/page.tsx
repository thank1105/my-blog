// /admin/articles/[id]/preview -- admin-only preview of the article body
// rendered through the same MDX pipeline the public page will use on Day 3.
// Useful for "what will the reader see?" sanity checks before publishing.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";

import { getArticle, flattenTags } from "@/server/articles";
import { ArticleBody } from "@/components/frontend/articles/ArticleBody";
import { formatDate } from "@/lib/format";
import { estimateReadingMinutes } from "@/lib/markdown";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await getArticle(id);
  return {
    title: row ? `预览 · ${row.title}` : "文章预览",
    robots: { index: false, follow: false },
  };
}

export default async function AdminArticlePreviewPage({ params }: PageProps) {
  const { id } = await params;
  const row = await getArticle(id);
  if (!row) notFound();

  const tags = flattenTags(row);
  const reading = estimateReadingMinutes(row.content);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
            预览 · 仅后台
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-ink">{row.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>状态：{labelForStatus(row.status)}</span>
            <span>可见性：{labelForVisibility(row.visibility)}</span>
            <span>阅读时长：约 {reading} 分钟</span>
            <span>更新于 {formatDate(row.updatedAt)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/articles/${row.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            返回编辑
          </Link>
        </div>
      </header>

      {row.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.coverImage}
          alt={row.title}
          loading="lazy"
          decoding="async"
          className="w-full rounded-md border border-hair object-cover shadow-soft"
        />
      ) : null}

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">标签：</span>
          {tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full bg-hair px-2 py-0.5 text-ink"
            >
              {t.name}
            </span>
          ))}
        </div>
      ) : null}

      <article className="mx-auto max-w-prose">
        <div className="mb-3 inline-flex items-center gap-1 rounded bg-accent-soft px-2 py-1 text-xs text-accent">
          <Eye aria-hidden className="size-3.5" />
          这是后台预览，最终阅读体验在 Phase 3 / Day 3 上线时对齐
        </div>
        <ArticleBody source={row.content} slug={row.slug} />
      </article>
    </section>
  );
}

function labelForStatus(s: string): string {
  return s === "PUBLISHED" ? "已发布" : s === "ARCHIVED" ? "已归档" : "草稿";
}
function labelForVisibility(v: string): string {
  return v === "PUBLIC" ? "公开" : v === "PRIVATE" ? "登录后可见" : "凭密码可见";
}

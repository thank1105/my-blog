// /categories/[slug] -- 分类详情 (Phase 7 / Day 2)

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ArrowUpRight, FileText, FolderKanban } from "lucide-react";

import { getPublicCategoryBySlug } from "@/server/categories-public";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPublicCategoryBySlug(slug);
  if (!detail) return { title: "分类不存在" };
  return {
    title: `${detail.category.name} · 分类`,
    description: detail.category.description ?? `所有属于「${detail.category.name}」分类的公开内容。`,
  };
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const detail = await getPublicCategoryBySlug(slug);
  if (!detail) notFound();

  const isArticle = detail.category.type === "ARTICLE";

  return (
    <section className="mx-auto max-w-container px-4 py-6 sm:py-10 sm:px-8">
      <header className="mb-6 sm:mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
          Category · {isArticle ? "文章" : "作品"}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-ink sm:text-4xl">
          {detail.category.name}
        </h1>
        {detail.category.description ? (
          <p className="mt-2 max-w-prose text-sm text-muted">{detail.category.description}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted">
          共 <span className="font-medium text-ink">{detail.total}</span> 项公开内容
        </p>
      </header>

      {detail.total === 0 ? (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
          该分类下还没有公开内容。
        </div>
      ) : isArticle ? (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {detail.articles.map((a) => (
            <li key={a.id}>
              <Link
                href={`/articles/${a.slug}`}
                className="group flex items-start gap-3 rounded-md border border-hair bg-surface p-3 transition-colors hover:border-accent"
              >
                <div className="size-16 shrink-0 rounded bg-bg" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 flex items-center gap-1.5 font-medium text-ink group-hover:text-accent">
                    <FileText aria-hidden className="size-3.5" />
                    {a.title}
                  </p>
                  {a.excerpt ? (
                    <p className="line-clamp-2 text-xs text-muted">{a.excerpt}</p>
                  ) : null}
                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted">
                    <Calendar aria-hidden className="size-3" />
                    {formatDate(a.publishedAt ?? a.createdAt)}
                    <ArrowUpRight aria-hidden className="ml-1 size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {detail.projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.slug}`}
                className="group block overflow-hidden rounded-md border border-hair bg-surface transition-colors hover:border-accent"
              >
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.coverImage}
                    alt={p.title}
                    className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                ) : (
                  <div className="aspect-[16/9] w-full bg-bg" aria-hidden />
                )}
                <div className="space-y-1 p-3">
                  <p className="line-clamp-1 flex items-center gap-1.5 font-medium text-ink group-hover:text-accent">
                    <FolderKanban aria-hidden className="size-3.5" />
                    {p.title}
                  </p>
                  <p className="line-clamp-2 text-xs text-muted">{p.description}</p>
                  <p className="inline-flex items-center gap-1 text-[10px] text-muted">
                    <Calendar aria-hidden className="size-3" />
                    {formatDate(p.publishedAt ?? p.createdAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
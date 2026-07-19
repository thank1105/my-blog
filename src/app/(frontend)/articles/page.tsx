// /articles -- public article list. Body delegates to the shared
// ArticlesList so /categories/[slug] and /tags/[slug] stay in sync.

import type { Metadata } from "next";

import { ArticlesList } from "@/components/frontend/articles/ArticlesList";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    tag?: string;
    page?: string;
  }>;
}

function safePage(s: string | undefined): number {
  const n = parseInt(s ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = (await searchParams) ?? {};
  const segments = [sp.category, sp.tag, sp.q].filter(Boolean) as string[];
  const title = segments.length > 0 ? `${segments.join(" · ")} · 文章` : "文章";
  const description = "小川记事 · 写作 / 观察 / 项目 的所有公开文章。";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const page = safePage(sp.page);
  const q = sp.q?.trim() || undefined;
  const categorySlug = sp.category?.trim() || undefined;
  const tagSlug = sp.tag?.trim() || undefined;
  const heading = q
    ? `搜索 · "${q}"`
    : categorySlug
      ? `分类 · ${categorySlug}`
      : tagSlug
        ? `标签 · ${tagSlug}`
        : "写作 / 观察 / 项目";

  return (
    <ArticlesList
      q={q}
      categorySlug={categorySlug}
      tagSlug={tagSlug}
      page={page}
      heading={heading}
    />
  );
}

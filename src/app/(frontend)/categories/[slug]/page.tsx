// /categories/[slug] -- category-filtered article list (Phase 3 / Day 3).
//
// Reuses the shared ArticlesList. If the category has 0 published
// articles we still render the page (it just shows the empty state);
// the page only 404s when the slug itself is unknown.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { ArticlesList } from "@/components/frontend/articles/ArticlesList";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

function safePage(s: string | undefined): number {
  const n = parseInt(s ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = await db.category.findUnique({
    where: { slug },
    select: { name: true, description: true, type: true },
  });
  if (!cat) return { title: "分类不存在" };
  return {
    title: `分类 · ${cat.name}`,
    description: cat.description ?? `小川记事 · ${cat.name} 分类下的所有公开文章。`,
    openGraph: { title: `分类 · ${cat.name}`, type: "website" },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const page = safePage(sp.page);

  const cat = await db.category.findUnique({
    where: { slug },
    select: { id: true, name: true, description: true },
  });
  if (!cat) notFound();

  return (
    <ArticlesList
      categorySlug={slug}
      page={page}
      heading={`分类 · ${cat.name}`}
      subline={cat.description ?? `${cat.name} 分类下的所有公开文章。`}
    />
  );
}

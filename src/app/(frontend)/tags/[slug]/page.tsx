// /tags/[slug] -- tag-filtered article list (Phase 3 / Day 3).

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
  const tag = await db.tag.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!tag) return { title: "标签不存在" };
  return {
    title: `标签 · ${tag.name}`,
    description: tag.description ?? `小川记事 · #${tag.name} 标签下的所有公开文章。`,
    openGraph: { title: `标签 · ${tag.name}`, type: "website" },
  };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const page = safePage(sp.page);

  const tag = await db.tag.findUnique({
    where: { slug },
    select: { id: true, name: true, description: true },
  });
  if (!tag) notFound();

  return (
    <ArticlesList
      tagSlug={slug}
      page={page}
      heading={`标签 · #${tag.name}`}
      subline={tag.description ?? `#${tag.name} 标签下的所有公开文章。`}
    />
  );
}

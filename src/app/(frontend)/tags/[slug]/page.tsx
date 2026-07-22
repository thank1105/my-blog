import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlesList } from "@/components/frontend/articles/ArticlesList";
import { getPublicTagBySlug } from "@/server/tags-public";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<{ q?: string; page?: string }> };
const safePage = (value?: string) => { const page = Number.parseInt(value ?? "1", 10); return Number.isFinite(page) && page > 0 ? page : 1; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const detail = await getPublicTagBySlug((await params).slug);
  return detail ? { title: `#${detail.tag.name}`, description: detail.tag.description ?? `带有「${detail.tag.name}」标签的技术文章。` } : { title: "标签不存在" };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [detail, query] = await Promise.all([
    getPublicTagBySlug(slug),
    searchParams ?? Promise.resolve<{ q?: string; page?: string }>({}),
  ]);
  if (!detail) notFound();
  return <ArticlesList q={query.q?.trim() || undefined} tagSlug={slug} page={safePage(query.page)} heading={`#${detail.tag.name}`} subline={detail.tag.description ?? undefined} basePath={`/tags/${slug}`} />;
}

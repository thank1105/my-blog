import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticlesList } from "@/components/frontend/articles/ArticlesList";
import { getPublicColumnBySlug } from "@/server/articles-public";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<{ q?: string; page?: string }> };
const safePage = (value?: string) => { const page = Number.parseInt(value ?? "1", 10); return Number.isFinite(page) && page > 0 ? page : 1; };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const column = await getPublicColumnBySlug((await params).slug);
  if (!column) return { title: "专栏不存在" };
  return { title: `${column.name} | 专栏`, description: column.description ?? `浏览「${column.name}」专栏的技术文章。` };
}

export default async function ColumnPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [column, query] = await Promise.all([
    getPublicColumnBySlug(slug),
    searchParams ?? Promise.resolve<{ q?: string; page?: string }>({}),
  ]);
  if (!column) notFound();
  const path = column.parent ? `${column.parent.name} / ${column.name}` : column.name;
  return <ArticlesList q={query.q?.trim() || undefined} columnSlug={slug} page={safePage(query.page)} heading={path} subline={column.description ?? undefined} basePath={`/columns/${slug}`} />;
}

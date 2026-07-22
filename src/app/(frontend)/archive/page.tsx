import type { Metadata } from "next";

import { ArticlesList } from "@/components/frontend/articles/ArticlesList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "文章归档", description: "按发布时间浏览全部技术文章。" };

const safePage = (value?: string) => {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

export default async function ArchivePage({ searchParams }: { searchParams?: Promise<{ q?: string; page?: string }> }) {
  const query = (await searchParams) ?? {};
  return <ArticlesList q={query.q?.trim() || undefined} page={safePage(query.page)} pageSize={20} heading="文章归档" subline="按发布时间倒序浏览全部技术文章。" basePath="/archive" />;
}

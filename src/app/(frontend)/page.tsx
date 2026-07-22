import type { Metadata } from "next";

import { ArticlesList } from "@/components/frontend/articles/ArticlesList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "小川记事 | 技术文章与工程实践",
  description: "记录后端、前端、数据库与工程实践的个人技术博客。",
};

function safePage(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function HomePage({ searchParams }: { searchParams?: Promise<{ q?: string; column?: string; tag?: string; page?: string }> }) {
  const params = (await searchParams) ?? {};
  return (
    <ArticlesList
      q={params.q?.trim() || undefined}
      columnSlug={params.column?.trim() || undefined}
      tagSlug={params.tag?.trim() || undefined}
      page={safePage(params.page)}
      heading="把问题写清楚，把经验留下来"
      subline="这里记录技术实现、排查过程和项目复盘。文章按专栏组织，内容持续更新。"
      showIntro
    />
  );
}

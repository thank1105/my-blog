// /projects -- public projects list (Phase 5 / Day 2).
//
// Magazine grid + sidebar (search / category / tag) + pagination.

import type { Metadata } from "next";

import { ProjectsList } from "@/components/frontend/projects/ProjectsList";

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
  const segments = [sp.tag, sp.category, sp.q].filter(Boolean) as string[];
  const title = segments.length > 0 ? `${segments.join(" · ")} · 作品` : "作品";
  const description = "小川作品集 · 所有公开发布的作品。";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProjectsPage({ searchParams }: PageProps) {
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
        : "作品集";

  return (
    <ProjectsList
      q={q}
      categorySlug={categorySlug}
      tagSlug={tagSlug}
      page={page}
      heading={heading}
    />
  );
}

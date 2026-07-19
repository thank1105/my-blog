// /notes -- public notes list (Phase 4).
//
// One-row-per-note dense layout, grouped by month.

import type { Metadata } from "next";

import { NotesList } from "@/components/frontend/notes/NotesList";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    q?: string;
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
  const segments = [sp.tag, sp.q].filter(Boolean) as string[];
  const title = segments.length > 0 ? `${segments.join(" · ")} · 笔记` : "笔记";
  const description = "小川记事 · 随手记 / 想法 / 拾遗 的所有公开笔记。";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function NotesPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const page = safePage(sp.page);
  const q = sp.q?.trim() || undefined;
  const tagSlug = sp.tag?.trim() || undefined;
  const heading = q
    ? `搜索 · "${q}"`
    : tagSlug
      ? `标签 · ${tagSlug}`
      : "随手记 / 想法 / 拾遗";

  return (
    <NotesList
      q={q}
      tagSlug={tagSlug}
      page={page}
      heading={heading}
    />
  );
}

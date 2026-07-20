// /admin/tags/[id]/edit (Phase 7 / Day 1)

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { getTag } from "@/server/tags";
import { TagForm } from "@/components/admin/tags/TagForm";

export const metadata: Metadata = {
  title: "编辑标签",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTagEditPage({ params }: PageProps) {
  const { id } = await params;
  const tag = await getTag(id);
  if (!tag) notFound();

  return (
    <section className="space-y-6">
      <header>
        <Link
          href="/admin/tags"
          className="inline-flex items-center gap-1 text-xs text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          <ChevronLeft aria-hidden className="size-3.5" />
          返回标签列表
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-bold text-ink">{tag.name}</h1>
        <p className="mt-1 text-sm text-muted">
          slug <code className="font-mono text-ink">/{tag.slug}</code> ·{" "}
          {tag._count.articles + tag._count.notes + tag._count.projects} 个关联
        </p>
      </header>

      <TagForm
        mode="edit"
        tagId={tag.id}
        initial={{
          name: tag.name,
          slug: tag.slug,
          description: tag.description ?? "",
          color: tag.color ?? "",
        }}
      />
    </section>
  );
}
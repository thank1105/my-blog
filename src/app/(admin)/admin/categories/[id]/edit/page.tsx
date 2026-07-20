// /admin/categories/[id]/edit (Phase 7 / Day 1)

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { getCategory } from "@/server/categories";
import { CategoryForm } from "@/components/admin/categories/CategoryForm";

export const metadata: Metadata = {
  title: "编辑分类",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCategoryEditPage({ params }: PageProps) {
  const { id } = await params;
  const cat = await getCategory(id);
  if (!cat) notFound();

  return (
    <section className="space-y-6">
      <header>
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-1 text-xs text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          <ChevronLeft aria-hidden className="size-3.5" />
          返回分类列表
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-bold text-ink">{cat.name}</h1>
        <p className="mt-1 text-sm text-muted">
          类型：{cat.type === "ARTICLE" ? "文章分类" : "作品分类"} · slug
          <code className="ml-1 font-mono text-ink">/{cat.slug}</code>
        </p>
      </header>

      <CategoryForm
        mode="edit"
        categoryId={cat.id}
        initial={{
          name: cat.name,
          slug: cat.slug,
          description: cat.description ?? "",
          type: cat.type,
          order: cat.order,
        }}
      />
    </section>
  );
}
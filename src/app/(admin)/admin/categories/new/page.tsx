// /admin/categories/new (Phase 7 / Day 1)

import type { Metadata } from "next";

import { CategoryForm } from "@/components/admin/categories/CategoryForm";

export const metadata: Metadata = {
  title: "新建分类",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminCategoryNewPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-ink">新建分类</h1>
        <p className="mt-1 text-sm text-muted">
          给文章或作品分类。type 决定它出现在哪一处的分类筛选里。
        </p>
      </header>
      <CategoryForm
        mode="create"
        initial={{
          name: "",
          slug: "",
          description: "",
          type: "ARTICLE",
          order: 0,
        }}
      />
    </section>
  );
}
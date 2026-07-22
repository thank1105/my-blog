// /admin/categories/new (Phase 7 / Day 1)

import type { Metadata } from "next";

import { CategoryForm } from "@/components/admin/categories/CategoryForm";

export const metadata: Metadata = {
  title: "新建项目分类",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminCategoryNewPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">新建项目分类</h1>
        <p className="mt-1 text-sm text-muted">
          项目分类只用于组织作品；技术文章请使用专栏。
        </p>
      </header>
      <CategoryForm
        mode="create"
        initial={{
          name: "",
          slug: "",
          description: "",
          order: 0,
        }}
      />
    </section>
  );
}

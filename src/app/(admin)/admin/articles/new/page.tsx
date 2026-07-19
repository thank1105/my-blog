// /admin/articles/new -- create a new article.

import type { Metadata } from "next";

import { listCategories } from "@/server/categories";
import { listTags } from "@/server/tags";
import { ArticleForm } from "@/components/admin/articles/ArticleForm";

export const metadata: Metadata = {
  title: "新建文章",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminArticleNewPage() {
  const [categories, tags] = await Promise.all([listCategories("ARTICLE"), listTags()]);
  const tagOptions = tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, color: t.color }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-ink">新建文章</h1>
        <p className="mt-1 text-sm text-muted">
          写下第一段话。Phase 3 仅做后台 CRUD；前台阅读体验在 Day 2 + Day 3 接入。
        </p>
      </header>

      <ArticleForm
        mode="create"
        initial={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          coverImage: "",
          categoryId: "",
          visibility: "PUBLIC",
          password: "",
          status: "DRAFT",
          tagIds: [],
        }}
        categories={categoryOptions}
        tags={tagOptions}
      />
    </section>
  );
}

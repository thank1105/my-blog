// /admin/articles/[id]/edit -- edit an existing article.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getArticle, flattenTags } from "@/server/articles";
import { listCategories } from "@/server/categories";
import { listTags } from "@/server/tags";
import { ArticleForm } from "@/components/admin/articles/ArticleForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await getArticle(id);
  return {
    title: row ? `编辑 · ${row.title}` : "编辑文章",
    robots: { index: false, follow: false },
  };
}

export default async function AdminArticleEditPage({ params }: PageProps) {
  const { id } = await params;
  const [row, categories, tags] = await Promise.all([
    getArticle(id),
    listCategories("ARTICLE"),
    listTags(),
  ]);
  if (!row) notFound();

  const tagOptions = tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, color: t.color }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  const initialTagIds = flattenTags(row).map((t) => t.id);

  return (
    <section className="space-y-6">
      <ArticleForm
        mode="edit"
        articleId={row.id}
        initial={{
          title: row.title,
          slug: row.slug,
          excerpt: row.excerpt ?? "",
          content: row.content,
          coverImage: row.coverImage ?? "",
          categoryId: row.categoryId ?? "",
          visibility: row.visibility,
          password: row.password ?? "",
          status: row.status,
          tagIds: initialTagIds,
        }}
        categories={categoryOptions}
        tags={tagOptions}
      />
    </section>
  );
}

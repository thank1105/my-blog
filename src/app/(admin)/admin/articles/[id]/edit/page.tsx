// /admin/articles/[id]/edit -- edit an existing article.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getArticle, flattenTags } from "@/server/articles";
import { listColumns } from "@/server/columns";
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
  const [row, columns, tags] = await Promise.all([
    getArticle(id),
    listColumns(),
    listTags(),
  ]);
  if (!row) notFound();

  const tagOptions = tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, color: t.color }));
  const columnOptions = columns.map((column) => ({
    id: column.id,
    name: column.name,
    slug: column.slug,
    parentId: column.parentId,
  }));
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
          columnId: row.columnId ?? "",
          visibility: row.visibility,
          password: row.password ?? "",
          status: row.status,
          tagIds: initialTagIds,
        }}
        columns={columnOptions}
        tags={tagOptions}
      />
    </section>
  );
}

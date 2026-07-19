// /admin/projects/[id]/edit -- edit an existing project (Phase 5 / Day 1).

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getProject,
  flattenProjectTags,
  flattenProjectImages,
} from "@/server/projects";
import { listCategories } from "@/server/categories";
import { listTags } from "@/server/tags";
import { ProjectForm } from "@/components/admin/projects/ProjectForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await getProject(id);
  return {
    title: row ? `编辑 · ${row.title}` : "编辑作品",
    robots: { index: false, follow: false },
  };
}

export default async function AdminProjectEditPage({ params }: PageProps) {
  const { id } = await params;
  const [row, categories, tags] = await Promise.all([
    getProject(id),
    listCategories("PROJECT"),
    listTags(),
  ]);
  if (!row) notFound();

  const tagOptions = tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, color: t.color }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  const initialTagIds = flattenProjectTags(row).map((t) => t.id);
  const initialImages = flattenProjectImages(row).map((img) => ({
    id: img.id,
    imageUrl: img.imageUrl,
    caption: img.caption ?? "",
    width: img.width ?? null,
    height: img.height ?? null,
  }));

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">{row.title}</h1>
          <p className="mt-1 text-sm text-muted">
            /{row.slug} · {initialImages.length} 张图 · 更新于{" "}
            {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(row.updatedAt)}
          </p>
        </div>
      </header>

      <ProjectForm
        mode="edit"
        projectId={row.id}
        initial={{
          title: row.title,
          slug: row.slug,
          description: row.description,
          coverImage: row.coverImage ?? "",
          categoryId: row.categoryId ?? "",
          visibility: row.visibility,
          password: row.password ?? "",
          status: row.status,
          tagIds: initialTagIds,
          images: initialImages,
          order: row.order,
          featured: row.featured,
        }}
        categories={categoryOptions}
        tags={tagOptions}
      />
    </section>
  );
}

// /admin/projects/new -- create a new project (Phase 5 / Day 1).

import type { Metadata } from "next";

import { listCategories } from "@/server/categories";
import { listTags } from "@/server/tags";
import { ProjectForm } from "@/components/admin/projects/ProjectForm";

export const metadata: Metadata = {
  title: "新建作品",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminProjectNewPage() {
  const [categories, tags] = await Promise.all([
    listCategories("PROJECT"),
    listTags(),
  ]);
  const tagOptions = tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, color: t.color }));
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-ink">新建作品</h1>
        <p className="mt-1 text-sm text-muted">
          按图集组织。先上传几张大图，再补充描述、分类和标签。
          Day 2 会在前台 <code>/projects/&lt;slug&gt;</code> 做 Behance 风的纵向沉浸式展示。
        </p>
      </header>

      <ProjectForm
        mode="create"
        initial={{
          title: "",
          slug: "",
          description: "",
          coverImage: "",
          categoryId: "",
          visibility: "PUBLIC",
          password: "",
          status: "DRAFT",
          tagIds: [],
          images: [],
          order: 999,
          featured: false,
        }}
        categories={categoryOptions}
        tags={tagOptions}
      />
    </section>
  );
}
// /admin/notes/new -- create a new note (Phase 4).

import type { Metadata } from "next";

import { listTags } from "@/server/tags";
import { NoteForm } from "@/components/admin/notes/NoteForm";

export const metadata: Metadata = {
  title: "新建笔记",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminNoteNewPage() {
  const tags = await listTags();
  const tagOptions = tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, color: t.color }));

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-ink">新建笔记</h1>
        <p className="mt-1 text-sm text-muted">
          随手记录。笔记无封面、无分类，适合快速记录想法。
        </p>
      </header>

      <NoteForm
        mode="create"
        initial={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          visibility: "PUBLIC",
          password: "",
          status: "DRAFT",
          tagIds: [],
        }}
        tags={tagOptions}
      />
    </section>
  );
}

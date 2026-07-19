// /admin/notes/[id]/edit -- edit an existing note (Phase 4).

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getNote, flattenNoteTags } from "@/server/notes";
import { listTags } from "@/server/tags";
import { NoteForm } from "@/components/admin/notes/NoteForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await getNote(id);
  return {
    title: row ? `编辑 · ${row.title}` : "编辑笔记",
    robots: { index: false, follow: false },
  };
}

export default async function AdminNoteEditPage({ params }: PageProps) {
  const { id } = await params;
  const [row, tags] = await Promise.all([
    getNote(id),
    listTags(),
  ]);
  if (!row) notFound();

  const tagOptions = tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, color: t.color }));
  const initialTagIds = flattenNoteTags(row).map((t) => t.id);

  return (
    <section className="space-y-6">
      <NoteForm
        mode="edit"
        noteId={row.id}
        initial={{
          title: row.title,
          slug: row.slug,
          excerpt: row.excerpt ?? "",
          content: row.content,
          visibility: row.visibility,
          password: row.password ?? "",
          status: row.status,
          tagIds: initialTagIds,
        }}
        tags={tagOptions}
      />
    </section>
  );
}

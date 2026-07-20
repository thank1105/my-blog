// /admin/pages/about (Phase 7 / Day 2)

import type { Metadata } from "next";

import { getPageByType, listPageRevisions } from "@/server/pages";
import { formatDate } from "@/lib/format";
import { PageEditor } from "@/components/admin/pages/PageEditor";

export const metadata: Metadata = {
  title: "编辑 · 关于我",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAboutEditPage() {
  const page = await getPageByType("ABOUT");
  const revisions = await listPageRevisions("ABOUT", 30);

  return (
    <PageEditor
      type="ABOUT"
      initialContent={page?.content ?? ""}
      initialMeta={page?.meta ?? ""}
      updatedAt={formatDate(page?.updatedAt ?? new Date())}
      revisions={revisions.map((r) => ({
        id: r.id,
        createdAt: formatDate(r.createdAt),
        excerpt: r.content.replace(/\s+/g, " ").slice(0, 80) || "(空)",
      }))}
    />
  );
}
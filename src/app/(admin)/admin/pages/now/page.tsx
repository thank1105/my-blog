// /admin/pages/now (Phase 7 / Day 2)

import type { Metadata } from "next";

import { getPageByType, listPageRevisions } from "@/server/pages";
import { formatDate } from "@/lib/format";
import { PageEditor } from "@/components/admin/pages/PageEditor";

export const metadata: Metadata = {
  title: "编辑 · Now",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminNowEditPage() {
  const page = await getPageByType("NOW");
  const revisions = await listPageRevisions("NOW", 30);

  return (
    <PageEditor
      type="NOW"
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
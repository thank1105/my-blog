import type { Metadata } from "next";

import { ColumnForm } from "@/components/admin/columns/ColumnForm";
import { listRootColumns } from "@/server/columns";

export const metadata: Metadata = { title: "新建专栏", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewColumnPage() {
  const roots = await listRootColumns();
  return (
    <section className="space-y-6">
      <header><h1 className="text-2xl font-bold text-ink">新建专栏</h1><p className="mt-1 text-sm text-muted">一级专栏可以包含多个二级专栏。</p></header>
      <ColumnForm mode="create" initial={{ name: "", slug: "", description: "", parentId: "", order: 0 }} rootOptions={roots.map((root) => ({ id: root.id, name: root.name }))} />
    </section>
  );
}

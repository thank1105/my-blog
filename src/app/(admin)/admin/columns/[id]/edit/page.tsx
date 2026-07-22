import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ColumnForm } from "@/components/admin/columns/ColumnForm";
import { getColumn, listRootColumns } from "@/server/columns";

export const metadata: Metadata = { title: "编辑专栏", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditColumnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [column, roots] = await Promise.all([getColumn(id), listRootColumns()]);
  if (!column) notFound();
  return (
    <section className="space-y-6">
      <header><h1 className="text-2xl font-bold text-ink">{column.name}</h1><p className="mt-1 text-sm text-muted">调整专栏层级、描述和同级排序。</p></header>
      <ColumnForm mode="edit" columnId={column.id} initial={{ name: column.name, slug: column.slug, description: column.description ?? "", parentId: column.parentId ?? "", order: column.order }} rootOptions={roots.map((root) => ({ id: root.id, name: root.name }))} />
    </section>
  );
}

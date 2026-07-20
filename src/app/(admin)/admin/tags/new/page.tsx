// /admin/tags/new (Phase 7 / Day 1)

import type { Metadata } from "next";

import { TagForm } from "@/components/admin/tags/TagForm";

export const metadata: Metadata = {
  title: "新建标签",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminTagNewPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-ink">新建标签</h1>
        <p className="mt-1 text-sm text-muted">
          标签可被文章 / 笔记 / 作品共用，留空 slug 会自动生成。
        </p>
      </header>
      <TagForm
        mode="create"
        initial={{ name: "", slug: "", description: "", color: "" }}
      />
    </section>
  );
}
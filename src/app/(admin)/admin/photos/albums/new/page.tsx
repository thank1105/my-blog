// /admin/photos/albums/new (Phase 6 / Day 1).

import type { Metadata } from "next";

import { AlbumForm } from "@/components/admin/albums/AlbumForm";

export const metadata: Metadata = {
  title: "新建相册",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminAlbumNewPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-ink">新建相册</h1>
        <p className="mt-1 text-sm text-muted">
          创建一个空相册，再去照片管理里把已有照片移进来，或直接上传新照片。
        </p>
      </header>

      <AlbumForm
        mode="create"
        initial={{
          title: "",
          slug: "",
          description: "",
          coverImage: "",
          visibility: "PUBLIC",
          status: "DRAFT",
        }}
      />
    </section>
  );
}
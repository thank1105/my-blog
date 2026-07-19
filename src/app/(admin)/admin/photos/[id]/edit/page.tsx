// /admin/photos/[id]/edit (Phase 6 / Day 1).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { getPhoto, photoRowToForm } from "@/server/photos";
import { listAlbums } from "@/server/albums";
import { PhotoForm } from "@/components/admin/photos/PhotoForm";

export const metadata: Metadata = {
  title: "编辑照片",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPhotoEditPage({ params }: PageProps) {
  const { id } = await params;
  const [photo, { rows: albums }] = await Promise.all([
    getPhoto(id),
    listAlbums({ pageSize: 100 }),
  ]);
  if (!photo) notFound();

  return (
    <section className="space-y-6">
      <header>
        <Link
          href="/admin/photos"
          className="inline-flex items-center gap-1 text-xs text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          <ChevronLeft aria-hidden className="size-3.5" />
          返回照片管理
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-bold text-ink">
          {photo.title || "(无标题)"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          修改元数据、调整所属相册或可见性。EXIF 拍摄时间也可以手动覆写。
        </p>
      </header>

      <PhotoForm
        photoId={photo.id}
        initial={photoRowToForm(photo)}
        albums={albums.map((a) => ({ id: a.id, title: a.title, slug: a.slug }))}
      />
    </section>
  );
}
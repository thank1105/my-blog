// /admin/photos/albums/[id]/edit (Phase 6 / Day 1).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ImagePlus } from "lucide-react";

import { getAlbum } from "@/server/albums";
import { AlbumForm } from "@/components/admin/albums/AlbumForm";

export const metadata: Metadata = {
  title: "编辑相册",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAlbumEditPage({ params }: PageProps) {
  const { id } = await params;
  const album = await getAlbum(id);
  if (!album) notFound();

  return (
    <section className="space-y-6">
      <header>
        <Link
          href="/admin/photos/albums"
          className="inline-flex items-center gap-1 text-xs text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          <ChevronLeft aria-hidden className="size-3.5" />
          返回相册列表
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink">{album.title}</h1>
            <p className="mt-1 text-sm text-muted">
              共 <span className="font-medium text-ink">{album._count.photos}</span> 张照片 ·
              slug <code className="font-mono text-ink">/{album.slug}</code>
            </p>
          </div>
          <Link
            href={`/admin/photos/new?albumId=${album.id}`}
            className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90"
          >
            <ImagePlus aria-hidden className="size-4" />
            上传照片到此相册
          </Link>
        </div>
      </header>

      <AlbumForm
        mode="edit"
        albumId={album.id}
        initial={{
          title: album.title,
          slug: album.slug,
          description: album.description ?? "",
          coverImage: album.coverImage ?? "",
          visibility: album.visibility === "PASSWORD" ? "PRIVATE" : album.visibility,
          status: album.status,
        }}
      />
    </section>
  );
}
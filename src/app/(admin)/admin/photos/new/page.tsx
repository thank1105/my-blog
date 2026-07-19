// /admin/photos/new -- bulk upload page (Phase 6 / Day 1).

import type { Metadata } from "next";
import { listAlbums } from "@/server/albums";

import { PhotoUploadPage } from "@/components/admin/photos/UploadPage";

export const metadata: Metadata = {
  title: "上传照片",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    albumId?: string;
  }>;
}

export default async function AdminPhotoNewPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const { rows: albums } = await listAlbums({ pageSize: 100 });
  const albumOptions = albums.map((a) => ({ id: a.id, title: a.title, slug: a.slug }));
  const defaultAlbumId =
    sp.albumId && albums.some((a) => a.id === sp.albumId) ? sp.albumId : undefined;

  return (
    <PhotoUploadPage
      albums={albumOptions}
      defaultAlbumId={defaultAlbumId}
    />
  );
}
// /photos/albums/[slug] -- single album masonry (Phase 6 / Day 2).
//
// Uses the same PhotoGallery component as /photos, narrowing the
// query by album slug. When the slug does not match a PUBLIC +
// PUBLISHED album we render notFound() so the URL 404s instead of
// showing an empty page.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicAlbumBySlug } from "@/server/photos-public";
import { PhotoGallery } from "@/components/frontend/photos/PhotoGallery";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getPublicAlbumBySlug(slug);
  if (!album) {
    return { title: "相册不存在" };
  }
  const title = `${album.title} · 相册`;
  const description =
    album.description?.trim() || `小川记事 · 「${album.title}」相册的瀑布流。`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AlbumDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const album = await getPublicAlbumBySlug(slug);
  if (!album) notFound();

  return (
    <PhotoGallery
      albumSlug={slug}
      heading={album.title}
      subheading={album.description ?? undefined}
    />
  );
}
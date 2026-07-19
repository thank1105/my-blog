// /photos -- public photo overview (Phase 6 / Day 2).
//
// Server-rendered masonry of every PUBLIC + PUBLISHED photo. The album
// filter strip at the top is part of the same page so visitors can
// drill into a single album without leaving the /photos section.

import type { Metadata } from "next";

import { PhotoGallery } from "@/components/frontend/photos/PhotoGallery";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{
    unassigned?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = (await searchParams) ?? {};
  const unassigned = sp.unassigned === "1";
  const title = unassigned ? "独立照片 · 相册" : "相册";
  const description = unassigned
    ? "小川记事 · 没有归入任何相册的独立照片。"
    : "小川记事 · 所有公开照片的瀑布流总览。";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PhotosPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const unassigned = sp.unassigned === "1";

  return (
    <PhotoGallery
      unassigned={unassigned}
      heading={unassigned ? "独立照片" : "相册"}
      subheading={
        unassigned
          ? "没有归入任何相册的零散照片，按拍摄时间倒序展示。"
          : "用瀑布流的方式看一组照片。点击进入灯箱，点相册名查看一组。"
      }
    />
  );
}
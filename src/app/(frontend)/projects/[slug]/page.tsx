// /projects/[slug] -- public detail page (Phase 5 / Day 2 + Day 3).
//
// Server component. The view counter is bumped by a client island
// (<ProjectViewIncrementer />) so the 30-min cookie dedupe mirrors the
// articles / notes UX. Related projects (same category, then shared
// tags) sit at the bottom as a magazine grid.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Eye, Images, Star } from "lucide-react";

import {
  getProjectBySlugForPublic,
  listRelatedProjects,
  listProjectTagsWithCount,
} from "@/server/projects-public";
import { flattenProjectImages, flattenProjectTags } from "@/server/projects";
import { renderMarkdown, Prose } from "@/lib/mdx";
import { formatDate } from "@/lib/format";
import { TagCloud, type TagCloudItem } from "@/components/frontend/articles/TagCloud";

import { ProjectViewIncrementer } from "@/components/frontend/projects/ProjectViewIncrementer";
import { ProjectGallery } from "@/components/frontend/projects/ProjectGallery";
import { ProjectCard } from "@/components/frontend/projects/ProjectCard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await getProjectBySlugForPublic(slug);
  if (!row) {
    return { title: "作品不存在" };
  }
  const description = row.description.slice(0, 160);
  const ogImages = row.coverImage
    ? [row.coverImage]
    : row.images[0]?.imageUrl
      ? [row.images[0].imageUrl]
      : undefined;
  const canonical = `/projects/${row.slug}`;
  return {
    title: row.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: row.title,
      description,
      type: "article",
      url: canonical,
      publishedTime: row.publishedAt ? row.publishedAt.toISOString() : undefined,
      modifiedTime: row.updatedAt.toISOString(),
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: row.title,
      description,
      images: ogImages,
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const row = await getProjectBySlugForPublic(slug);
  if (!row) notFound();

  const [mdxSource, related, tags] = await Promise.all([
    renderMarkdown(row.description),
    listRelatedProjects(row.id, 2),
    listProjectTagsWithCount(),
  ]);

  const projectTags = flattenProjectTags(row);
  const images = flattenProjectImages(row);
  const tagItems: TagCloudItem[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    count: t.count,
  }));
  const imageCount = images.length;

  return (
    <article className="mx-auto max-w-container px-4 py-6 sm:py-10 sm:px-8">
      <ProjectViewIncrementer projectId={row.id} />

      {/* Header (magazine) */}
      <header className="mb-10">
        <Link
          href="/projects"
          className="mb-4 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.3em] text-muted hover:text-accent"
        >
          <ArrowLeft aria-hidden className="size-3" />
          Projects
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_14rem] lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              {row.category ? (
                <Link
                  href={`/projects?category=${row.category.slug}`}
                  className="rounded bg-accent-soft px-2 py-0.5 text-accent hover:bg-accent hover:text-white"
                >
                  {row.category.name}
                </Link>
              ) : null}
              {row.featured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] text-white">
                  <Star aria-hidden className="size-3" />
                  精选
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 text-muted">
                <Images aria-hidden className="size-3" />
                {imageCount} 张图
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink sm:text-5xl">
              {row.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <CalendarDays aria-hidden className="size-3.5" />
                {formatDate(row.publishedAt ?? row.createdAt)}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Eye aria-hidden className="size-3.5" />
                {row.viewCount} 次浏览
              </span>
            </div>
            {projectTags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {projectTags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/projects?tag=${t.slug}`}
                    className="rounded-full bg-hair px-2.5 py-0.5 text-xs text-ink hover:bg-accent hover:text-white"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {tagItems.length > 0 ? (
            <aside className="lg:max-w-[14rem]">
              <TagCloud tags={tagItems} title="作品标签" />
            </aside>
          ) : null}
        </div>
      </header>

      {/* Gallery (Behance-style, full-bleed column) */}
      <section className="mb-12">
        <ProjectGallery
          images={images.map((i) => ({
            id: i.id,
            imageUrl: i.imageUrl,
            caption: i.caption,
            width: i.width,
            height: i.height,
          }))}
          altPrefix={row.title}
        />
      </section>

      {/* Description rendered as Markdown (Day 3 acceptance). */}
      <section className="mx-auto mb-12 max-w-prose">
        <h2 className="mb-3 font-serif text-xl font-semibold text-ink">关于这个作品</h2>
        <Prose>{mdxSource}</Prose>
      </section>

      {/* Related projects (previous / next) */}
      {related.length > 0 ? (
        <footer className="border-t border-hair pt-8">
          <h2 className="mb-4 font-serif text-lg font-semibold text-ink">相关作品</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {related.map((r) => (
              <ProjectCard key={r.id} project={r as never} />
            ))}
          </div>
        </footer>
      ) : null}
    </article>
  );
}

// ProjectCard (Phase 5 / Day 2).
//
// Magazine card for the public /projects list. Behance-style: large
// cover, title, description, image-count + tag chips. Hovering
// surfaces a thin caption on the cover (mirrors the admin card so
// the two surfaces feel related).

import Link from "next/link";
import { Images, Star } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ProjectCardProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string | null;
  category: { id: string; name: string; slug: string } | null;
  featured: boolean;
  images: { id: string; imageUrl: string; caption: string | null }[];
  tags: { tag: { id: string; name: string; slug: string; color: string | null } }[];
}

export interface ProjectCardProps {
  project: ProjectCardProject;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const href = `/projects/${project.slug}`;
  const tags = project.tags.map((t) => t.tag);
  const cover = project.coverImage ?? project.images[0]?.imageUrl ?? null;
  const coverCaption = project.images[0]?.caption ?? null;
  const imageCount = project.images.length;
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-md border border-hair bg-surface shadow-soft transition-shadow hover:shadow-float",
        className,
      )}
    >
      <Link href={href} className="relative block aspect-[4/3] w-full overflow-hidden bg-bg">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={project.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted">
            暂无图片
          </div>
        )}
        {project.featured ? (
          <span
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white shadow-soft"
            title="精选"
          >
            <Star aria-hidden className="size-3" />
            精选
          </span>
        ) : null}
        {coverCaption ? (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            {coverCaption}
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs text-muted">
          {project.category ? (
            <Link
              href={`/projects?category=${project.category.slug}`}
              className="rounded bg-accent-soft px-1.5 py-0.5 text-accent hover:bg-accent hover:text-white"
            >
              {project.category.name}
            </Link>
          ) : (
            <span className="rounded bg-hair px-1.5 py-0.5">未分类</span>
          )}
          <span className="inline-flex items-center gap-1">
            <Images aria-hidden className="size-3" />
            {imageCount} 张图
          </span>
        </div>
        <Link href={href} className="block">
          <h3 className="font-serif text-xl font-bold text-ink transition-colors group-hover:text-accent">
            {project.title}
          </h3>
        </Link>
        <p className="line-clamp-3 text-sm text-muted">{project.description}</p>
        {tags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-1">
            {tags.slice(0, 4).map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-hair px-2 py-0.5 text-[11px] text-ink"
              >
                {t.name}
              </span>
            ))}
            {tags.length > 4 ? (
              <span className="text-[11px] text-muted">+{tags.length - 4}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

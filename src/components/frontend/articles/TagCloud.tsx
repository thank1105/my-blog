// TagCloud (Phase 3 / Day 2).
//
// Compact tag chips with stable category tints and explicit counts.

import Link from "next/link";

import { cn } from "@/lib/utils";

export interface TagCloudItem {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface TagCloudProps {
  tags: readonly TagCloudItem[];
  activeSlug?: string;
  /** Title shown above the cloud. */
  title?: string;
  className?: string;
}

export function TagCloud({ tags, activeSlug, title = "标签", className }: TagCloudProps) {
  if (tags.length === 0) {
    return (
      <aside className={cn("space-y-3", className)} aria-label="标签">
        <p className="text-xs font-semibold text-ink">{title}</p>
        <p className="text-sm text-muted">还没有标签。</p>
      </aside>
    );
  }

  return (
    <aside className={cn("space-y-3", className)} aria-label="标签">
      <p className="text-xs font-semibold text-ink">{title}</p>
      <ul className="flex flex-wrap gap-2">
        {tags.map((t, index) => {
          const active = activeSlug === t.slug;
          const tone = index % 3 === 0
            ? "border-accent/15 bg-accent-soft text-accent"
            : index % 3 === 1
              ? "border-indigo/15 bg-indigo-soft text-indigo"
              : "border-teal/15 bg-teal-soft text-teal";
          return (
            <li key={t.id}>
              <Link
                href={`/tags/${t.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-accent bg-accent text-white"
                    : cn(tone, "hover:border-accent hover:text-accent"),
                )}
              >
                <span>{t.name}</span>
                <span className={cn("text-[10px]", active ? "text-white/80" : "text-muted")}>
                  {t.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

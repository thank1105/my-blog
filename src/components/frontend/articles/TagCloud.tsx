// TagCloud (Phase 3 / Day 2).
//
// Cloud of tag chips. Tag font size scales logarithmically with the
// article count so the most-used tags read loudest without dwarfing
// the long tail.

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
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">{title}</p>
        <p className="text-sm text-muted">还没有标签。</p>
      </aside>
    );
  }

  const counts = tags.map((t) => t.count);
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  // Map count -> 12px..18px (logarithmic so we do not get giant outliers).
  function sizeFor(count: number): string {
    if (max === min) return "text-sm";
    const ratio = Math.log(count - min + 1) / Math.log(max - min + 1);
    if (ratio > 0.66) return "text-lg font-medium";
    if (ratio > 0.33) return "text-base";
    return "text-sm";
  }

  return (
    <aside className={cn("space-y-3", className)} aria-label="标签">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">{title}</p>
      <ul className="flex flex-wrap gap-2">
        {tags.map((t) => {
          const active = activeSlug === t.slug;
          return (
            <li key={t.id}>
              <Link
                href={`/tags/${t.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 transition-colors",
                  sizeFor(t.count),
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-hair text-ink hover:border-accent hover:text-accent",
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

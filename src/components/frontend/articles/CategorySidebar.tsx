// CategorySidebar (Phase 3 / Day 2).
//
// Vertical list of categories with article counts. Used on the public
// /articles listing and /categories/[slug] pages.

import Link from "next/link";

import { cn } from "@/lib/utils";

export interface CategorySidebarItem {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface CategorySidebarProps {
  categories: readonly CategorySidebarItem[];
  /** Currently active slug (the page the user is on). */
  activeSlug?: string;
  /** Title shown above the list. */
  title?: string;
  className?: string;
}

export function CategorySidebar({
  categories,
  activeSlug,
  title = "分类",
  className,
}: CategorySidebarProps) {
  return (
    <aside className={cn("space-y-3", className)} aria-label="分类">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
        {title}
      </p>
      <ul className="space-y-1">
        <li>
          <Link
            href="/articles"
            aria-current={activeSlug == null ? "page" : undefined}
            className={cn(
              "flex items-center justify-between rounded px-3 py-1.5 text-sm transition-colors",
              activeSlug == null
                ? "bg-accent-soft text-accent"
                : "text-ink hover:bg-bg hover:text-accent",
            )}
          >
            <span>全部</span>
          </Link>
        </li>
        {categories.map((c) => {
          const active = activeSlug === c.slug;
          return (
            <li key={c.id}>
              <Link
                href={`/categories/${c.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-ink hover:bg-bg hover:text-accent",
                )}
              >
                <span>{c.name}</span>
                <span className="text-xs text-muted">{c.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

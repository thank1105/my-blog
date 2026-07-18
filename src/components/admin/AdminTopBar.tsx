"use client";

import { usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Admin top bar (Phase 2 / Day 2).
 *
 * Responsibilities:
 *   1. Hamburger button on mobile to open the sidebar drawer.
 *   2. Auto-derived breadcrumb from the current pathname.
 *      (Pages no longer pass `crumbs` themselves; the top bar does it.)
 *   3. Right-side actions slot -- Phase 1's SignOutButton reuses this slot.
 *
 * The component is a client component because it needs `usePathname()` to
 * build crumbs reactively on SPA navigation.
 */

interface Crumb {
  label: string;
  href?: string;
}

export interface AdminTopBarProps {
  onMenuClick: () => void;
}

export function AdminTopBar({ onMenuClick }: AdminTopBarProps) {
  const pathname = usePathname() ?? "";
  const crumbs = buildCrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-hair bg-surface/80 px-4 backdrop-blur lg:px-8">
      {/* Hamburger (mobile only) */}
      <button
        type="button"
        aria-label="打开后台导航"
        onClick={onMenuClick}
        className="flex size-9 items-center justify-center rounded text-muted transition-colors hover:bg-bg hover:text-accent lg:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="面包屑" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1 truncate text-sm text-muted">
          {crumbs.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {c.href ? (
                <a
                  href={c.href}
                  className="rounded px-1 transition-colors hover:text-accent"
                >
                  {c.label}
                </a>
              ) : (
                <span className="px-1 text-ink">{c.label}</span>
              )}
              {i < crumbs.length - 1 ? (
                <ChevronRight aria-hidden className="size-3.5 text-hair" />
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      {/* Right-side actions slot */}
      <div className={cn("flex items-center gap-2")}>
        {/* Pages can pass actions via children in the layout; for Day 2 the
            SignOutButton is rendered from the admin layout directly so the
            top bar stays chrome-agnostic. */}
      </div>
    </header>
  );
}

/**
 * Map a pathname like "/admin/users/123/edit" into:
 *   后台 / 用户 / 123 / 编辑
 *
 * We translate known segments (`/users` -> 用户) and leave unknown IDs
 * (the numeric segment) verbatim so they stay identifiable.
 */
const KNOWN: Record<string, string> = {
  admin: "后台",
  users: "用户",
  new: "新建",
  edit: "编辑",
  articles: "文章",
  notes: "笔记",
  projects: "项目",
  albums: "相册",
  pages: "页面",
  settings: "设置",
};

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "后台" }];

  const crumbs: Crumb[] = [];
  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    acc += `/${seg}`;
    const label = KNOWN[seg] ?? seg;
    // Last segment is the current page (no link), all earlier ones link
    // up to that point.
    const isLast = i === segments.length - 1;
    crumbs.push(isLast ? { label } : { label, href: acc });
  }
  return crumbs;
}

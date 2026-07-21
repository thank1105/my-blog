"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  NotebookPen,
  FolderKanban,
  Images,
  FileCode,
  FolderTree,
  Settings,
  Tags,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Admin sidebar (Phase 2 / Day 2; articles row promoted in Phase 3 / Day 1,
 * albums entry upgraded in Phase 6 / Day 1).
 *
 * Two visual modes:
 *   - desktop  (>= lg): fixed left column, 240px, always visible.
 *   - mobile   (< lg) : hidden by default; slides in as a drawer when
 *                       the top-bar hamburger toggles `open`. A backdrop
 *                       covers the rest of the viewport for focus.
 *
 * The current pathname picks up an `accent` left border + accent text on
 * the matching nav item.
 */

export interface SidebarProps {
  /** Mobile drawer open state (controlled by AdminTopBar). */
  open: boolean;
  onClose: () => void;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ "aria-hidden"?: boolean; className?: string }>;
  /** Optional badge shown to the right (e.g. "soon" for Phase 3+ items). */
  badge?: string;
}

const NAV_GROUPS: readonly NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "仪表盘", icon: LayoutDashboard },
    ],
  },
  {
    label: "内容",
    items: [
      // Phase 3 / Day 1: articles CRUD shipped -> P3 badge dropped.
      { href: "/admin/articles", label: "文章", icon: FileText },
      { href: "/admin/notes", label: "笔记", icon: NotebookPen, badge: "P4" },
      { href: "/admin/projects", label: "项目", icon: FolderKanban },
      // Phase 6 / Day 1: albums + photos CRUD shipped -> P6 badge dropped.
      { href: "/admin/photos", label: "相册", icon: Images },
      { href: "/admin/pages", label: "页面", icon: FileCode, badge: "P7" },
      { href: "/admin/categories", label: "分类", icon: FolderTree },
      { href: "/admin/tags", label: "标签", icon: Tags },
    ],
  },
  {
    label: "系统",
    items: [
      { href: "/admin/users", label: "用户", icon: Users },
      { href: "/admin/settings", label: "设置", icon: Settings, badge: "P10" },
    ],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname() ?? "";

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Drawer / fixed column */}
      <aside
        aria-label="后台导航"
        data-open={open}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-hair bg-surface shadow-float transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand row (mirrors the public Header logo + a close button on mobile) */}
        <div className="flex h-14 items-center justify-between border-b border-hair px-5">
          <Link
            href="/admin"
            onClick={onClose}
            className="font-serif text-base font-bold text-ink transition-colors hover:text-accent"
          >
            小川 · 后台
          </Link>
          <button
            type="button"
            aria-label="关闭导航"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded text-muted transition-colors hover:bg-bg hover:text-ink lg:hidden"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>

        {/* Nav scroll area */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-4">
            {NAV_GROUPS.map((group, gi) => (
              <li key={gi}>
                {group.label ? (
                  <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                    {group.label}
                  </p>
                ) : null}
                <ul className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded px-3 py-2 text-sm transition-colors",
                            active
                              ? "border-l-2 border-accent bg-accent-soft text-accent"
                              : "border-l-2 border-transparent text-ink hover:bg-bg hover:text-accent",
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <Icon aria-hidden className="size-4" />
                            {item.label}
                          </span>
                          {item.badge ? (
                            <span className="rounded bg-hair px-1.5 py-0.5 font-mono text-[10px] text-muted">
                              {item.badge}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-hair px-5 py-3 text-xs text-muted">
          <p>v0.7.0-photos · Day 1</p>
        </div>
      </aside>
    </>
  );
}

/**
 * Active-route matcher.
 *   - "/admin" matches "/admin" exactly (dashboard), not "/admin/users".
 *   - "/admin/users" matches "/admin/users" and any descendant
 *     (e.g. "/admin/users/123/edit").
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
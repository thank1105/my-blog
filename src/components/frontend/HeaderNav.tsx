"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Header nav + auth switch (Phase 2 / Day 2; albums entry added in
 * Phase 6 / Day 2).
 *
 * Lives in a client component so we can hold the mobile drawer open
 * state. The server component (`Header.tsx`) reads `getServerSession`
 * and passes the session down to us -- we never call auth APIs here.
 *
 * Desktop (>= sm): inline horizontal nav + search + login state.
 * Mobile (< sm) : hamburger button. Tapping it slides down a full-width
 * drawer that lists the same nav + auth actions stacked vertically.
 *
 * Drawer a11y:
 *   - toggle button uses aria-expanded + aria-controls
 *   - escape key + backdrop click close the drawer
 *   - body scroll is locked while the drawer is open
 */
export interface HeaderNavProps {
  user: {
    email: string | null;
    name: string | null;
    role: "ADMIN" | "USER" | null;
  } | null;
}

interface NavItem {
  label: string;
  href: string;
}

const PRIMARY_NAV: readonly NavItem[] = [
  { label: "首页", href: "/" },
  { label: "专栏", href: "/columns" },
  { label: "归档", href: "/archive" },
  { label: "关于", href: "/about" },
];

const SECONDARY_NAV: readonly NavItem[] = [
  { label: "笔记", href: "/notes" },
  { label: "项目", href: "/projects" },
  { label: "相册", href: "/photos" },
];

export function HeaderNav({ user }: HeaderNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = user?.role === "ADMIN";

  // Close drawer on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Desktop nav (>= sm) */}
      <nav
        aria-label="主导航"
        className="hidden items-center gap-1 sm:flex sm:gap-2"
      >
        <ul className="flex items-center gap-1">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`)) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-ink hover:bg-bg hover:text-accent",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <details className="group relative">
          <summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm text-ink transition-colors marker:content-none hover:bg-bg hover:text-accent">
            更多
          </summary>
          <div className="absolute right-0 top-full z-20 mt-2 w-32 rounded-md border border-hair bg-surface p-1 shadow-float">
            {SECONDARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded px-3 py-2 text-sm text-ink hover:bg-bg hover:text-accent">{item.label}</Link>
            ))}
          </div>
        </details>

        <Link
          href="/#article-search"
          aria-label="搜索文章"
          title="搜索文章"
          className="ml-1 flex size-9 items-center justify-center rounded text-muted transition-colors hover:bg-bg hover:text-accent"
        >
          <Search aria-hidden className="size-4" />
        </Link>

        {user ? (
          <div className="ml-1 flex items-center gap-2 border-l border-hair pl-3">
            {isAdmin ? (
              <Link
                href="/admin"
                className="rounded px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
              >
                后台
              </Link>
            ) : null}
            <span className="hidden text-sm text-muted lg:inline" title={user.email ?? ""}>
              {user.name ?? user.email}
            </span>
            <Link
              href="/api/auth/signout"
              className="rounded border border-hair px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
            >
              退出
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="ml-1 rounded border border-hair px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
          >
            登入
          </Link>
        )}
      </nav>

      {/* Mobile hamburger (< sm) */}
      <button
        type="button"
        aria-label="打开导航"
        aria-expanded={open}
        aria-controls="primary-mobile-nav"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded text-muted transition-colors hover:bg-bg hover:text-accent sm:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      {/* Backdrop + drawer */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity sm:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        id="primary-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="移动端导航"
        aria-hidden={!open}
        className={cn(
          "fixed inset-x-0 top-0 z-50 origin-top transform border-b border-hair bg-surface shadow-float transition-transform sm:hidden",
          open ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="text-base font-bold text-ink"
          >
            小川记事
          </Link>
          <button
            type="button"
            aria-label="关闭导航"
            onClick={() => setOpen(false)}
            className="flex size-9 items-center justify-center rounded text-muted transition-colors hover:bg-bg hover:text-accent"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-2 pb-6 pt-2">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded px-4 py-3 text-base text-ink transition-colors hover:bg-bg hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
          <p className="px-4 pt-3 text-xs font-medium text-muted">更多内容</p>
          {SECONDARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded px-4 py-3 text-base text-ink transition-colors hover:bg-bg hover:text-accent">{item.label}</Link>
          ))}
          <Link href="/#article-search" onClick={() => setOpen(false)} className="rounded px-4 py-3 text-base text-ink transition-colors hover:bg-bg hover:text-accent">搜索文章</Link>
          <div className="my-2 h-px bg-hair" />
          {user ? (
            <>
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="rounded px-4 py-3 text-base font-medium text-accent hover:bg-accent-soft"
                >
                  后台
                </Link>
              ) : null}
              <span className="px-4 py-1 text-xs text-muted">
                已登入：{user.email ?? user.name}
              </span>
              <Link
                href="/api/auth/signout"
                onClick={() => setOpen(false)}
                className="rounded px-4 py-3 text-base text-ink hover:bg-bg hover:text-accent"
              >
                退出
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded px-4 py-3 text-base font-medium text-accent hover:bg-accent-soft"
            >
              登入
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}

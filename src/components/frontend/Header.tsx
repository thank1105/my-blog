import Link from "next/link";
import { getServerSession } from "next-auth";
import { Search } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Front-end Header (Phase 2 / Day 1).
 *
 * Visual reference: docs/design-explorations/p1-style/01.png
 *   - left  : logo (brand title + tagline)
 *   - right : primary nav (writing / observe / projects / about / archive) + search icon
 *
 * The Header is a Server Component so it can read the active session and
 * surface a sensible login affordance. The search affordance is just a
 * presentational button for now — Phase 5 (full-text search) wires up the
 * real behaviour. We deliberately avoid any third-party font CDN so the
 * whole route stays free of outbound network calls.
 */

interface NavItem {
  label: string;
  href: string;
}

const PRIMARY_NAV: readonly NavItem[] = [
  { label: "写作", href: "/articles" },
  { label: "观察", href: "/notes" },
  { label: "项目", href: "/projects" },
  { label: "关于", href: "/about" },
  { label: "归档", href: "/archive" },
];

interface HeaderProps {
  /** Hide the tagline beneath the brand title (used on inner pages). */
  compact?: boolean;
  className?: string;
}

export async function Header({ compact = false, className }: HeaderProps) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header
      className={cn(
        "border-b border-hair bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60",
        className,
      )}
    >
      <div className="mx-auto flex max-w-container items-center justify-between gap-6 px-8 py-5">
        {/* Brand */}
        <Link href="/" className="group flex items-baseline gap-3">
          <span className="font-serif text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-accent">
            小川记事
          </span>
          {!compact ? (
            <span className="hidden text-xs text-muted sm:inline">
              一个独立创作者的日常与记录
            </span>
          ) : null}
        </Link>

        {/* Primary nav + actions */}
        <nav aria-label="主导航" className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 sm:flex">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded px-3 py-1.5 text-sm text-ink transition-colors hover:bg-bg hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            aria-label="搜索（占位，Phase 5 接入）"
            title="搜索（占位）"
            className="ml-1 flex size-9 items-center justify-center rounded text-muted transition-colors hover:bg-bg hover:text-accent"
          >
            <Search aria-hidden className="size-4" />
          </button>

          {session?.user ? (
            <div className="ml-1 flex items-center gap-2 pl-2 sm:border-l sm:border-hair">
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="rounded px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
                >
                  后台
                </Link>
              ) : null}
              <span
                className="hidden text-sm text-muted sm:inline"
                title={session.user.email ?? ""}
              >
                {session.user.name ?? session.user.email}
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
      </div>
    </header>
  );
}

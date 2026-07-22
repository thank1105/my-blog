import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { HeaderNav } from "@/components/frontend/HeaderNav";
import { cn } from "@/lib/utils";

/**
 * Front-end Header (Phase 2 / Day 2).
 *
 * Day 1: rendered Header / Hero / Footer inline on the home page.
 * Day 2: chrome moved to `app/(frontend)/layout.tsx`; Header is now a
 * server component that only fetches the session and hands it to the
 * client subcomponent `HeaderNav`, which owns the desktop nav + mobile
 * drawer + auth switch.
 *
 * Visual reference: docs/design-explorations/p1-style/01.png.
 * Mobile behaviour: under `sm` the inline nav collapses into a hamburger
 * button; tapping it slides down a full-width drawer (a11y: Escape +
 * backdrop click close; body scroll locked while open).
 */
interface HeaderProps {
  /** Hide the tagline beneath the brand title (used on inner pages). */
  compact?: boolean;
  className?: string;
}

export async function Header({ compact = false, className }: HeaderProps) {
  const session = await getServerSession(authOptions);
  const user = session?.user
    ? {
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        role: (session.user.role as "ADMIN" | "USER" | null) ?? null,
      }
    : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-hair bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85",
        className,
      )}
    >
      <div className="mx-auto flex max-w-container items-center justify-between gap-6 px-4 py-4 sm:px-8">
        {/* Brand */}
        <Link href="/" className="group flex min-w-0 items-baseline gap-3 border-l-[3px] border-accent pl-3">
          <span className="text-lg font-bold tracking-tight text-ink transition-colors group-hover:text-accent sm:text-xl">
            小川记事
          </span>
          {!compact ? (
            <span className="hidden truncate text-xs text-muted sm:inline">
              技术文章与工程实践
            </span>
          ) : null}
        </Link>

        <HeaderNav user={user} />
      </div>
    </header>
  );
}

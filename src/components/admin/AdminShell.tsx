// Phase 1 / Day 2 placeholder shell for /admin/* pages.
//
// The proper sidebar / top bar is delivered in Phase 2 (design system);
// for Day 2 we keep this a minimal breadcrumb + sign-out header so the
// list/new/edit pages render with consistent framing.

import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/admin/SignOutButton";

interface AdminShellProps {
  crumbs: { label: string; href?: string }[];
  children: ReactNode;
}

export function AdminShell({ crumbs, children }: AdminShellProps) {
  return (
    <div className="mx-auto max-w-container px-8 py-10">
      <header className="mb-8 flex items-end justify-between gap-4 border-b border-hair pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Phase 1 · Admin</p>
          <nav aria-label="breadcrumb" className="mt-2 text-sm text-muted">
            {crumbs.map((c, i) => (
              <span key={c.label + i}>
                {c.href ? (
                  <Link href={c.href} className="hover:text-ink">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink">{c.label}</span>
                )}
                {i < crumbs.length - 1 ? <span className="px-2 text-hair">/</span> : null}
              </span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            返回首页
          </Link>
          <SignOutButton callbackUrl="/login" />
        </div>
      </header>
      {children}
    </div>
  );
}

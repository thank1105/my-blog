"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Sidebar } from "@/components/admin/Sidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { SignOutButton } from "@/components/admin/SignOutButton";

/**
 * Admin chrome shell (Phase 2 / Day 2).
 *
 * Composes Sidebar + AdminTopBar around the route content, and exposes
 * a single `open` state so the mobile hamburger button can toggle the
 * sidebar drawer. Desktop users always see both; mobile users see only
 * the top bar until they tap the hamburger.
 *
 * The shell used to live inside each page (Phase 1 / Day 2) and took a
 * `crumbs` prop. With Day 2's route-group layout in place, every
 * /admin/* page renders inside this shell automatically -- the breadcrumb
 * is now derived from the URL inside AdminTopBar.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg lg:pl-72">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className="flex min-h-screen flex-col">
        <div className="flex h-14 items-center justify-between border-b border-hair bg-surface pl-3 pr-4 lg:hidden">
          <button
            type="button"
            aria-label="打开后台导航"
            onClick={() => setOpen(true)}
            className="flex size-9 items-center justify-center rounded text-muted transition-colors hover:bg-bg hover:text-accent"
          >
            <span aria-hidden className="font-serif text-sm font-bold text-ink">
              ☰
            </span>
          </button>
          <span className="font-serif text-sm font-bold text-ink">小川 · 后台</span>
        </div>
        <AdminTopBar onMenuClick={() => setOpen(true)} />

        <div className="flex flex-1 flex-col">
          <main className="flex-1 px-4 py-8 lg:px-10">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>

          <footer className="border-t border-hair bg-surface px-4 py-3 text-xs text-muted lg:px-10">
            <div className="mx-auto flex max-w-5xl items-center justify-between">
              <span>© {new Date().getFullYear()} 小川记事 · 后台</span>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 underline-offset-4 hover:text-ink hover:underline"
                >
                  <ExternalLink aria-hidden className="size-3.5" />
                  返回前台
                </Link>
                <SignOutButton callbackUrl="/login" />
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

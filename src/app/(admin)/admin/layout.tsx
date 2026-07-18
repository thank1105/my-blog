import { AdminShell } from "@/components/admin/AdminShell";

/**
 * Admin route group layout (Phase 2 / Day 2).
 *
 * Wraps every /admin/* page with the chrome (Sidebar + TopBar + footer).
 * Phase 1 / Day 2 used `AdminShell` per page; that import is now gone
 * because chrome is hoisted to this layout. Pages just return their body.
 *
 * Access control still lives in src/middleware.ts (ADMIN-only gate),
 * so this layout does not need to re-check.
 *
 * Mobile behaviour: AdminShell holds the sidebar drawer open state and
 * renders a hamburger on screens narrower than `lg`. The desktop
 * sidebar is a fixed left column (240px) and the main area is offset.
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}

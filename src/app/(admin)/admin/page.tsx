// Phase 1 Day 1 admin landing page (placeholder).
//
// The real sidebar-driven admin shell is delivered in Phase 2 (design system
// + layouts). For Day 1 we only need a server component that proves the JWT
// session works: it shows the currently signed-in user and exposes a SignOut
// button. Day 2 will add the middleware that bounces unauthenticated users;
// today we redirect manually inside the page so the verification flow is
// self-contained.
//
// Stepping stone for the Phase 1 acceptance test: login via /login, land
// here, see your email + role, sign out and confirm you get bounced back to
// /login again.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/admin/SignOutButton";

export const metadata: Metadata = {
  title: "后台首页",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  const { email, name, role } = session.user;

  return (
    <main className="mx-auto max-w-container px-8 py-16">
      <div className="rounded-md border border-hair bg-surface p-10 shadow-soft">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Phase 1 · Auth</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-ink">后台首页</h1>
        <p className="mt-4 text-sm text-muted">
          远程 placeholder, 仅用于验证 JWT session 可用。左侧侧边栏与完整后台在 Phase 2 提供。
        </p>

        <dl className="mt-8 grid gap-3 text-sm">
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <dt className="text-muted">邮箱</dt>
            <dd className="text-ink">{email}</dd>
          </div>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <dt className="text-muted">名称</dt>
            <dd className="text-ink">{name ?? "—"}</dd>
          </div>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <dt className="text-muted">角色</dt>
            <dd>
              <span
                className={
                  "inline-block rounded px-2 py-0.5 text-xs font-medium " +
                  (role === "ADMIN" ? "bg-accent/10 text-accent" : "bg-hair text-muted")
                }
              >
                {role}
              </span>
            </dd>
          </div>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <dt className="text-muted">会话 ID</dt>
            <dd className="font-mono text-xs text-muted">{session.user.id}</dd>
          </div>
        </dl>

        <div className="mt-10 flex items-center justify-end gap-3">
          <Link
            href="/"
            className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            返回首页
          </Link>
          <SignOutButton callbackUrl="/login" />
        </div>
      </div>
    </main>
  );
}

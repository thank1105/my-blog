// /admin -- Phase 1 / Day 2 dashboard.
//
// Phase 2 / Day 2 hoists the chrome (Sidebar + TopBar) into
// `(admin)/admin/layout.tsx`, so this page just returns its body.

import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { listUsers } from "@/server/users";

export const metadata: Metadata = {
  title: "后台首页",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  // Middleware enforces ADMIN at the edge; this is defence in depth and a
  // convenient place to short-circuit if the session disappears.
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user) return null;

  const users = await listUsers();
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const disabledCount = users.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="当前账号" value={user.email ?? ""} hint={user.role ?? ""} />
        <StatCard label="账号总数" value={String(users.length)} hint={`${adminCount} ADMIN`} />
        <StatCard
          label="已禁用"
          value={String(disabledCount)}
          hint={disabledCount === 0 ? "无" : "需关注"}
        />
      </div>

      <section className="rounded-md border border-hair bg-surface p-8 shadow-soft">
        <h2 className="font-serif text-lg font-bold text-ink">快捷入口</h2>
        <p className="mt-1 text-sm text-muted">
          Phase 2 已接上侧边栏；侧边栏「内容」分组下的 P3-P7 项会随对应阶段点亮。
        </p>
        <ul className="mt-6 space-y-3">
          <li>
            <Link
              href="/admin/users"
              className="flex items-center justify-between rounded border border-hair px-4 py-3 transition-colors hover:border-accent"
            >
              <span>
                <span className="block font-medium text-ink">用户管理</span>
                <span className="block text-sm text-muted">新建 / 编辑 / 禁用账号、重置密码</span>
              </span>
              <span className="text-muted">→</span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  hint?: string | null;
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-md border border-hair bg-surface p-5 shadow-soft">
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-2 font-serif text-2xl font-bold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

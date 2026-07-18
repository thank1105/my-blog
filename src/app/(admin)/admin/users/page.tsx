// /admin/users -- Day 2 user management list.
//
// Phase 1 / Day 2 task list (DEVELOPMENT.md) calls for a list page that
// shows email / username / role / last-login / disabled status, plus a
// shortcut to create a new user.

import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/AdminShell";
import { listUsers } from "@/server/users";

export const metadata: Metadata = {
  title: "用户管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <AdminShell
      crumbs={[{ label: "后台首页", href: "/admin" }, { label: "用户管理" }]}
    >
      <section className="rounded-md border border-hair bg-surface p-8 shadow-soft">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink">用户管理</h1>
            <p className="mt-1 text-sm text-muted">共 {users.length} 个账号</p>
          </div>
          <Link
            href="/admin/users/new"
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
          >
            + 新建用户
          </Link>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="border-b border-hair px-3 py-2 font-medium">邮箱</th>
              <th className="border-b border-hair px-3 py-2 font-medium">用户名</th>
              <th className="border-b border-hair px-3 py-2 font-medium">角色</th>
              <th className="border-b border-hair px-3 py-2 font-medium">状态</th>
              <th className="border-b border-hair px-3 py-2 font-medium">最后登录</th>
              <th className="border-b border-hair px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-bg/40">
                <td className="border-b border-hair px-3 py-2 text-ink">{u.email}</td>
                <td className="border-b border-hair px-3 py-2 text-ink">
                  {u.username}
                  {u.displayName ? (
                    <span className="ml-1 text-muted">({u.displayName})</span>
                  ) : null}
                </td>
                <td className="border-b border-hair px-3 py-2">
                  <span
                    className={
                      "inline-block rounded px-2 py-0.5 text-xs font-medium " +
                      (u.role === "ADMIN"
                        ? "bg-accent/10 text-accent"
                        : "bg-hair text-muted")
                    }
                  >
                    {u.role}
                  </span>
                </td>
                <td className="border-b border-hair px-3 py-2">
                  {u.isActive ? (
                    <span className="text-success">启用</span>
                  ) : (
                    <span className="text-danger">已禁用</span>
                  )}
                </td>
                <td className="border-b border-hair px-3 py-2 text-muted">{formatDate(u.lastLoginAt)}</td>
                <td className="border-b border-hair px-3 py-2 text-right">
                  <Link
                    href={`/admin/users/${u.id}/edit`}
                    className="text-sm text-accent underline-offset-4 hover:underline"
                  >
                    编辑
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}

// /admin/users/new -- create a new user account.

import type { Metadata } from "next";

import { UserCreateForm } from "@/components/admin/UserCreateForm";

export const metadata: Metadata = {
  title: "新建用户",
  robots: { index: false, follow: false },
};

export default function AdminUserNewPage() {
  return (
    <section className="rounded-md border border-hair bg-surface p-8 shadow-soft">
      <h1 className="font-serif text-2xl font-bold text-ink">新建用户</h1>
      <p className="mt-1 text-sm text-muted">
        用户必须能登录。把初始密码私下告知对方即可，对方登录后可自行修改。
      </p>
      <div className="mt-6">
        <UserCreateForm />
      </div>
    </section>
  );
}

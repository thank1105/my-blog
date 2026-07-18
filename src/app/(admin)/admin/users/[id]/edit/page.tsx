// /admin/users/[id]/edit

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UserEditForm } from "@/components/admin/UserEditForm";
import { getUser } from "@/server/users";

export const metadata: Metadata = {
  title: "编辑用户",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserEditPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) {
    notFound();
  }

  return (
    <section className="rounded-md border border-hair bg-surface p-8 shadow-soft">
      <h1 className="font-serif text-2xl font-bold text-ink">{user.email}</h1>
      <p className="mt-1 text-sm text-muted">
        {user.username}
        {user.displayName ? `（${user.displayName}）` : ""} · {user.role}
      </p>
      <div className="mt-6">
        <UserEditForm
          id={user.id}
          initial={{
            displayName: user.displayName,
            role: user.role,
            isActive: user.isActive,
          }}
        />
      </div>
    </section>
  );
}

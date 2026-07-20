// /admin/pages -- Phase 7 / Day 2 (Chinese UI)

import type { Metadata } from "next";
import Link from "next/link";
import { FileCode, User, Clock, ArrowUpRight } from "lucide-react";

import { listPages } from "@/server/pages";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "页面管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const pages = await listPages();
  const about = pages.find((p) => p.type === "ABOUT") ?? null;
  const now = pages.find((p) => p.type === "NOW") ?? null;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-ink">页面管理</h1>
        <p className="mt-1 text-sm text-muted">
          管理「关于我」与「Now」两个单页内容。
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PageCard
          href="/admin/pages/about"
          icon={<User aria-hidden className="size-5" />}
          title="关于我"
          description="自我介绍、社交链接、技能、时间线等。"
          updatedAt={about?.updatedAt}
          empty={!about}
        />
        <PageCard
          href="/admin/pages/now"
          icon={<Clock aria-hidden className="size-5" />}
          title="Now"
          description="最近在做什么、关注什么、想找什么。每次保存留一份历史。"
          updatedAt={now?.updatedAt}
          empty={!now}
        />
      </div>

      <p className="text-xs text-muted">
        <FileCode aria-hidden className="mr-1 inline size-3" />
        内容可以是 Markdown / 纯文本。前台渲染器将按 Markdown 解析并保留换行。
      </p>
    </section>
  );
}

function PageCard({
  href,
  icon,
  title,
  description,
  updatedAt,
  empty,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  updatedAt: Date | null | undefined;
  empty: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-md border border-hair bg-surface p-5 shadow-soft transition-colors hover:border-accent"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded bg-accent-soft text-accent">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-bold text-ink group-hover:text-accent">
            {title}
          </h2>
          <ArrowUpRight aria-hidden className="size-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted">{description}</p>
        <p className="mt-2 text-[10px] text-muted">
          {updatedAt
            ? `最后更新 ${formatDate(updatedAt)}`
            : empty
              ? "尚未创建，去编写吧"
              : "—"}
        </p>
      </div>
    </Link>
  );
}
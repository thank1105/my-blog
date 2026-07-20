// /about -- Phase 7 / Day 2 (public)

import type { Metadata } from "next";
import Link from "next/link";
import { User } from "lucide-react";

import { getPublicAbout, renderPageMarkdown } from "@/server/pages-public";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "关于我",
  description: "关于我 — 自述、社交链接、技能、时间线。",
};

export default async function AboutPage() {
  const about = await getPublicAbout();

  return (
    <section className="mx-auto max-w-prose px-4 py-8 sm:py-12 sm:px-8">
      <header className="mb-6 sm:mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">About</p>
        <h1 className="mt-1 flex items-center gap-2 font-serif text-3xl font-bold text-ink sm:text-4xl">
          <User aria-hidden className="size-6" />
          关于我
        </h1>
        {about ? (
          <p className="mt-1 text-xs text-muted">最后更新 {formatDate(about.updatedAt)}</p>
        ) : null}
      </header>

      {about ? (
        <article
          className="prose-page"
          dangerouslySetInnerHTML={{ __html: renderPageMarkdown(about.content) }}
        />
      ) : (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
          <p>「关于我」页面还在打磨中。</p>
          <p className="mt-2 text-xs">
            想了解这个站点？直接看
            <Link href="/articles" className="mx-1 text-accent underline-offset-4 hover:underline">
              文章
            </Link>
            或
            <Link href="/now" className="mx-1 text-accent underline-offset-4 hover:underline">
              Now
            </Link>
            吧。
          </p>
        </div>
      )}
    </section>
  );
}
// /now -- Phase 7 / Day 2 (public, with prominent last-updated time)

import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";

import { getPublicNow, renderPageMarkdown } from "@/server/pages-public";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Now",
  description: "我最近在做什么、关注什么、想找什么。",
};

export default async function NowPage() {
  const now = await getPublicNow();

  return (
    <section className="mx-auto max-w-prose px-4 py-8 sm:py-12 sm:px-8">
      <header className="mb-6 sm:mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Now</p>
        <h1 className="mt-1 flex items-center gap-2 font-serif text-3xl font-bold text-ink sm:text-4xl">
          <Clock aria-hidden className="size-6" />
          Now
        </h1>
        {now ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs text-accent">
            <Sparkles aria-hidden className="size-3" />
            最后更新 {formatDate(now.updatedAt)}
          </div>
        ) : null}
      </header>

      {now ? (
        <article
          className="prose-page"
          dangerouslySetInnerHTML={{ __html: renderPageMarkdown(now.content) }}
        />
      ) : (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted shadow-soft">
          <p>Now 页面还在打磨中。</p>
          <p className="mt-2 text-xs">
            想了解这个站点？直接看
            <Link href="/about" className="mx-1 text-accent underline-offset-4 hover:underline">
              关于我
            </Link>
            吧。
          </p>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted">
        灵感来自 <a href="https://nownownow.com/about" className="underline-offset-4 hover:underline" rel="noreferrer">nownownow.com</a>。
      </p>
    </section>
  );
}
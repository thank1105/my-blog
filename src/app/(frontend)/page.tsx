import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NotesDigest } from "@/components/frontend/notes/NotesDigest";

/**
 * Home page (Phase 2 / Day 2 + Phase 4 / Day 2 notes digest).
 *
 * Phase 0 landed a one-line 「PHASE 0 · FOUNDATION」card here.
 * Day 1 wired the chrome manually (Header + Footer inline) to demo the
 * new components.
 * Day 2 moves the chrome into `app/(frontend)/layout.tsx`, so this page
 * returns just the body.
 *
 * Phase 4 / Day 2 added the real "最新笔记 (latest 5)" digest at the
 * bottom, fed by `notes-public.ts::listLatestNotes`. The four stream
 * cards above still carry hard-coded placeholders for the streams that
 * are not yet wired (articles, projects, albums) -- those land in their
 * respective phases.
 */
export default function HomePage() {
  return (
    <>
      {/* Hero -- full-bleed placeholder. Real 16:9 photo lands in Phase 3. */}
      <section
        aria-label="首页 hero 占位"
        className="relative isolate flex h-[42vh] min-h-[320px] items-end overflow-hidden border-b border-hair bg-gradient-to-br from-hair/60 via-bg to-accent-soft/60"
      >
        <div className="mx-auto w-full max-w-container px-8 pb-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
            Phase 4 · Notes + Phase 5 · Projects
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-ink sm:text-5xl">
            写作 / 观察 / 项目
          </h1>
          <p className="mt-2 max-w-prose text-sm text-muted sm:text-base">
            记录日常，探索思考，把灵感变成作品。
          </p>
        </div>
      </section>

      {/* Intro + CTA */}
      <section className="mx-auto grid max-w-container gap-10 px-8 py-16 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div>
          <p className="text-sm text-muted">
            这里将展示最新的文章、项目与笔记。先把视觉骨架搭起来，
            真实数据流在后续 Phase 接入。
          </p>
        </div>
        <aside className="flex flex-col items-start gap-3 lg:items-end">
          <p className="font-serif text-base text-ink">
            你好，我是小川。一名独立创作者，写字、做项目、拍照，
            在自由与秩序之间寻找平衡。
          </p>
          <Link href="/projects" className={buttonVariants({ variant: "default", size: "lg" })}>
            查看作品
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </aside>
      </section>

      {/* 4 streams -- placeholders */}
      <section className="mx-auto max-w-container px-8 pb-16">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STREAMS.map((stream) => (
            <li key={stream.title}>
              <Card className="h-full">
                <CardHeader>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    {stream.eyebrow}
                  </p>
                  <CardTitle className="mt-2">{stream.title}</CardTitle>
                  <CardDescription>{stream.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Link
                    href={stream.href}
                    className="text-sm text-accent underline-offset-4 hover:underline"
                  >
                    {stream.cta}
                  </Link>
                  <span className="font-mono text-xs text-muted">{stream.meta}</span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* Phase 4 / Day 2 -- latest notes digest */}
      <section className="mx-auto max-w-container px-8 pb-20">
        <NotesDigest limit={5} />
      </section>
    </>
  );
}

interface Stream {
  eyebrow: string;
  title: string;
  summary: string;
  href: string;
  cta: string;
  meta: string;
}

const STREAMS: readonly Stream[] = [
  {
    eyebrow: "最新文章",
    title: "在安静中积蓄力量",
    summary: "关于专注、节奏与长期主义的一些想法。",
    href: "/articles",
    cta: "阅读全文 →",
    meta: "2026.05.18",
  },
  {
    eyebrow: "项目记录",
    title: "城市角落观察计划",
    summary: "用 30 天记录熟悉的城市与陌生的细节。",
    href: "/projects",
    cta: "查看项目 →",
    meta: "进行中",
  },
  {
    eyebrow: "创作笔记",
    title: "如何建立个人知识库",
    summary: "从收集到整理，构建属于自己的思考系统。",
    href: "/notes",
    cta: "阅读笔记 →",
    meta: "2026.05.10",
  },
  {
    eyebrow: "影像记录",
    title: "胶片里的日常碎片",
    summary: "一些随手拍下的画面与短暂的心情。",
    href: "/albums",
    cta: "查看相册 →",
    meta: "2026.05.03",
  },
];

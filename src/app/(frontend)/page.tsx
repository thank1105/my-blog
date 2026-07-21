// Home page (Phase 8 / Day 1 -- full assembly).
//
// Replaces the Phase 2/4 scaffold (placeholder hero + 4 hard-coded stream
// cards) with the real magazine layout:
//   1. FeaturedHero    -- featured article, or the latest if none flagged
//   2. 最新文章 (3-col)  -- listLatestArticles, hero article excluded
//   3. 作品精选 (3 大图)  -- listLatestProjects
//   4. 最新笔记          -- NotesDigest (latest 5)
//   5. 关于我摘要        -- getPublicAbout excerpt
//
// Visual reference: docs/design-explorations/p2-homepage/homepage.png.

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, User } from "lucide-react";

import { getFeaturedArticle, listLatestArticles } from "@/server/articles-public";
import { listLatestProjects } from "@/server/projects-public";
import { getPublicAbout } from "@/server/pages-public";
import { ArticleCard } from "@/components/frontend/articles/ArticleCard";
import { ProjectCard } from "@/components/frontend/projects/ProjectCard";
import { NotesDigest } from "@/components/frontend/notes/NotesDigest";
import { FeaturedHero } from "@/components/frontend/FeaturedHero";
import { markdownExcerpt } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "小川记事 · 写作 / 观察 / 项目",
  description: "一个独立创作者的日常与记录：文章、笔记、项目与影像。",
  openGraph: {
    title: "小川记事",
    description: "一个独立创作者的日常与记录：文章、笔记、项目与影像。",
    type: "website",
  },
};

const FALLBACK_BIO =
  "你好，我是小川。一名独立创作者，写字、做项目、拍照，在自由与秩序之间寻找平衡。";

export default async function HomePage() {
  const [featured, projects, about] = await Promise.all([
    getFeaturedArticle(),
    listLatestProjects(3),
    getPublicAbout(),
  ]);
  const latest = await listLatestArticles(3, featured?.id);
  const aboutSummary = about ? markdownExcerpt(about.content, 140) : "";

  return (
    <>
      {/* 1. Featured hero (or graceful placeholder when no article exists yet) */}
      {featured ? (
        <FeaturedHero article={featured} />
      ) : (
        <section className="border-b border-hair bg-gradient-to-br from-hair/60 via-bg to-accent-soft/60">
          <div className="mx-auto max-w-container px-4 py-16 sm:px-8 sm:py-24">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
              小川记事
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-ink sm:text-5xl">
              写作 / 观察 / 项目
            </h1>
            <p className="mt-2 max-w-prose text-sm text-muted sm:text-base">
              记录日常，探索思考，把灵感变成作品。第一篇文章发布后，这里会展示置顶大图。
            </p>
          </div>
        </section>
      )}

      {/* 2. 最新文章 */}
      {latest.length > 0 ? (
        <section className="mx-auto max-w-container px-4 py-12 sm:px-8 sm:py-16">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-2 sm:mb-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
                Articles
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-ink sm:text-3xl">
                最新文章
              </h2>
            </div>
            <Link
              href="/articles"
              className="text-sm text-accent underline-offset-4 hover:underline"
            >
              查看全部文章 →
            </Link>
          </header>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 3. 作品精选 */}
      {projects.length > 0 ? (
        <section className="border-y border-hair bg-surface/50">
          <div className="mx-auto max-w-container px-4 py-12 sm:px-8 sm:py-16">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-2 sm:mb-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
                  Projects
                </p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-ink sm:text-3xl">
                  作品精选
                </h2>
              </div>
              <Link
                href="/projects"
                className="text-sm text-accent underline-offset-4 hover:underline"
              >
                查看全部作品 →
              </Link>
            </header>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* 4. 最新笔记 */}
      <section className="mx-auto max-w-container px-4 py-12 sm:px-8 sm:py-16">
        <NotesDigest limit={5} />
      </section>

      {/* 5. 关于我摘要 */}
      <section className="border-t border-hair bg-surface/50">
        <div className="mx-auto flex max-w-container flex-col gap-4 px-4 py-12 sm:px-8 sm:py-16">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
            About
          </p>
          <p className="max-w-prose font-serif text-lg text-ink sm:text-xl">
            {aboutSummary || FALLBACK_BIO}
          </p>
          <Link
            href="/about"
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            <User aria-hidden className="size-4" />
            了解更多
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

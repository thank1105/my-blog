// /notes/[slug] -- public note detail page (Phase 4).
//
// Minimal single-column layout, no cover image. Reuses the MDX pipeline
// from the ArticleBody pattern.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Eye } from "lucide-react";

import { getNoteBySlugForPublic, listRelatedNotes, incrementNoteView } from "@/server/notes-public";

import { renderMarkdown, Prose } from "@/lib/mdx";
import { formatDate } from "@/lib/format";
import { estimateReadingMinutes } from "@/lib/markdown";
import { TagCloud, type TagCloudItem } from "@/components/frontend/articles/TagCloud";
import { listNoteTagsWithCount } from "@/server/notes-public";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function markdownExcerptShort(content: string, maxLen: number): string {
  const plain = content
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_`~>\[\]()!]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen).replace(/\s+\S*$/, "") + "..." : plain;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const note = await getNoteBySlugForPublic(slug);
  if (!note) notFound();
  return {
    title: note.title,
    description: note.excerpt ?? markdownExcerptShort(note.content, 160),
    openGraph: {
      title: note.title,
      description: note.excerpt ?? markdownExcerptShort(note.content, 160),
      type: "article",
      publishedTime: note.publishedAt?.toISOString(),
    },
    twitter: { card: "summary", title: note.title },
  };
}

export default async function NoteDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const note = await getNoteBySlugForPublic(slug);
  if (!note) notFound();

  const [mdxSource, related, tags] = await Promise.all([
    renderMarkdown(note.content),
    listRelatedNotes(note.id, 3),
    listNoteTagsWithCount(),
  ]);

  // View count bump.
  await incrementNoteView(note.id);

  const readingTime = estimateReadingMinutes(note.content);
  const noteTags = note.tags.map((t) => t.tag);
  const tagItems: TagCloudItem[] = tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    count: t.count,
  }));

  return (
    <section className="mx-auto max-w-container px-4 py-6 sm:py-10 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        {/* Sidebar */}
        <aside className="space-y-6">
          <Link
            href="/notes"
            className="inline-flex items-center gap-1 text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
          >
            <ArrowLeft aria-hidden className="size-3.5" />
            返回笔记列表
          </Link>

          {tagItems.length > 0 ? (
            <TagCloud tags={tagItems} title="标签" />
          ) : null}
        </aside>

        {/* Main content */}
        <article className="min-w-0">
          <header className="mb-8">
            <Link
              href="/notes"
              className="mb-4 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.3em] text-muted hover:text-accent"
            >
              <ArrowLeft aria-hidden className="size-3" />
              Notes
            </Link>
            <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">
              {note.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <CalendarDays aria-hidden className="size-3.5" />
                {formatDate(note.publishedAt ?? note.createdAt)}
              </span>
              <span>·</span>
              <span>{readingTime} 分钟</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Eye aria-hidden className="size-3.5" />
                {note.viewCount} 次阅读
              </span>
            </div>
            {noteTags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {noteTags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/notes?tag=${t.slug}`}
                    className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-accent hover:underline"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          {/* Note body (no cover image - minimal) */}
          <Prose>{mdxSource}</Prose>

          {/* Related notes */}
          {related.length > 0 ? (
            <footer className="mt-12 border-t border-hair pt-8">
              <h2 className="font-serif text-lg font-semibold text-ink">相关笔记</h2>
              <ul className="mt-3 space-y-1">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/notes/${r.slug}`}
                      className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent hover:underline"
                    >
                      <span className="truncate">{r.title}</span>
                      <span className="font-mono text-xs text-muted/50">
                        {formatDate(r.publishedAt ?? r.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </footer>
          ) : null}
        </article>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { listTagsWithCount } from "@/server/articles-public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "文章标签", description: "按技术标签浏览文章。" };

export default async function TagsPage() {
  const tags = await listTagsWithCount();
  return (
    <section className="mx-auto max-w-container px-4 py-10 sm:px-8 sm:py-14">
      <header><h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">文章标签</h1><p className="mt-3 text-sm text-muted">用于跨专栏关联具体技术点。</p></header>
      {tags.length === 0 ? <div className="mt-10 rounded-md border border-dashed border-hair py-16 text-center text-sm text-muted">还没有文章标签。</div> : (
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => <li key={tag.id}><Link href={`/tags/${tag.slug}`} className="flex items-center justify-between gap-4 rounded-md border border-hair bg-surface px-4 py-3 text-ink hover:border-accent hover:text-accent"><span>#{tag.name}</span><span className="font-mono text-xs text-muted">{tag.count}</span></Link></li>)}
        </ul>
      )}
    </section>
  );
}

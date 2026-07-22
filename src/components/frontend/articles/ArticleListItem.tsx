import Image from "next/image";
import Link from "next/link";
import { Clock3, Eye } from "lucide-react";

import type { ArticleRow } from "@/server/articles";
import { estimateReadingMinutes } from "@/lib/markdown";
import { formatDate } from "@/lib/format";

export function ArticleListItem({ article }: { article: ArticleRow }) {
  const published = article.publishedAt ?? article.updatedAt;
  const tags = article.tags.slice(0, 2).map((item) => item.tag);
  return (
    <article className="group grid overflow-hidden rounded-lg border border-hair bg-surface shadow-soft transition-[border-color,box-shadow] hover:border-accent/35 hover:shadow-float lg:grid-cols-[32%_minmax(0,1fr)]">
      <Link href={`/articles/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-hair lg:h-full lg:min-h-52 lg:aspect-auto">
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          sizes="(min-width: 1280px) 340px, (min-width: 1024px) 30vw, 100vw"
          className="object-cover transition-transform duration-200 motion-reduce:transition-none group-hover:scale-[1.018]"
        />
      </Link>
      <div className="flex min-w-0 flex-col justify-center px-6 py-6 xl:px-8 xl:py-7">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          {article.column ? (
            <span className="flex items-center gap-1 rounded-md bg-accent-soft px-2 py-1 text-accent">
              {article.column.parent ? (
                <>
                  <Link href={`/columns/${article.column.parent.slug}`} className="hover:underline">{article.column.parent.name}</Link>
                  <span aria-hidden>/</span>
                </>
              ) : null}
              <Link href={`/columns/${article.column.slug}`} className="font-medium hover:underline">{article.column.name}</Link>
            </span>
          ) : null}
          {tags.map((tag, index) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className={index % 2 === 0 ? "rounded-md bg-indigo-soft px-2 py-1 text-indigo hover:underline" : "rounded-md bg-teal-soft px-2 py-1 text-teal hover:underline"}
            >
              #{tag.name}
            </Link>
          ))}
        </div>
        <Link href={`/articles/${article.slug}`} className="block">
          <h2 className="line-clamp-2 text-2xl font-bold leading-snug tracking-tight text-ink transition-colors group-hover:text-accent xl:text-[1.7rem]">{article.title}</h2>
        </Link>
        {article.excerpt ? <p className="mt-3 line-clamp-2 max-w-[62ch] text-[15px] leading-7 text-muted">{article.excerpt}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-muted">
          <time dateTime={new Date(published).toISOString()}>{formatDate(published)}</time>
          <span className="inline-flex items-center gap-1"><Clock3 aria-hidden className="size-3" />{estimateReadingMinutes(article.content)} 分钟</span>
          <span className="inline-flex items-center gap-1"><Eye aria-hidden className="size-3" />{article.viewCount} 阅读</span>
        </div>
      </div>
    </article>
  );
}

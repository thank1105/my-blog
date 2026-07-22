// /about -- About page with structured profile metadata.

import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Link2, User } from "lucide-react";

import { parseAboutMeta, type AboutMeta } from "@/lib/about-meta";
import { formatDate } from "@/lib/format";
import { getPublicAbout, renderPageMarkdown } from "@/server/pages-public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "关于我",
  description: "关于我 · 自述、社交链接、技能、时间线。",
};

export default async function AboutPage() {
  const about = await getPublicAbout();
  const profile = parseAboutMeta(about?.meta);
  const hasProfile = Boolean(
    profile.avatar || profile.displayName || profile.tagline || profile.socialLinks.length,
  );

  return (
    <section className="mx-auto max-w-prose px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">About</p>
        <h1 className="mt-1 flex items-center gap-2 font-serif text-3xl font-bold text-ink sm:text-4xl">
          <User aria-hidden className="size-6" />
          关于我
        </h1>
        {about ? (
          <p className="mt-1 text-xs text-muted">最后更新：{formatDate(about.updatedAt)}</p>
        ) : null}
      </header>

      {hasProfile ? <AboutProfile profile={profile} /> : null}

      {about ? (
        <article
          className="prose-page"
          dangerouslySetInnerHTML={{ __html: renderPageMarkdown(about.content) }}
        />
      ) : (
        <div className="rounded-md border border-dashed border-hair bg-surface px-6 py-16 text-center text-muted">
          <p>“关于我”页面还在打磨中。</p>
          <p className="mt-2 text-xs">
            想了解这个站点？直接看
            <Link href="/" className="mx-1 text-accent underline-offset-4 hover:underline">
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

      {profile.skills.length > 0 ? (
        <section className="mt-10 border-t border-hair pt-8">
          <h2 className="font-serif text-xl font-bold text-ink">技能</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-accent-soft px-3 py-1 text-xs text-accent"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {profile.timeline.length > 0 ? (
        <section className="mt-10 border-t border-hair pt-8">
          <h2 className="font-serif text-xl font-bold text-ink">经历</h2>
          <ol className="mt-4 space-y-5 border-l border-hair pl-5">
            {profile.timeline.map((item) => (
              <li key={`${item.year}-${item.title}`} className="relative">
                <span className="absolute -left-[1.65rem] top-1 flex size-5 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <CalendarDays aria-hidden className="size-3" />
                </span>
                <p className="font-mono text-xs text-muted">{item.year}</p>
                <h3 className="mt-1 font-serif text-base font-bold text-ink">{item.title}</h3>
                {item.description ? (
                  <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </section>
  );
}

function AboutProfile({ profile }: { profile: AboutMeta }) {
  return (
    <section className="mb-10 rounded-md border border-hair bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {profile.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar}
            alt={profile.displayName ? `${profile.displayName} 的头像` : "头像"}
            className="size-24 shrink-0 rounded-full object-cover ring-1 ring-hair"
          />
        ) : null}
        <div className="min-w-0">
          {profile.displayName ? (
            <h2 className="font-serif text-2xl font-bold text-ink">{profile.displayName}</h2>
          ) : null}
          {profile.tagline ? <p className="mt-1 text-sm text-muted">{profile.tagline}</p> : null}
          {profile.socialLinks.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {profile.socialLinks.map((link) => (
                <a
                  key={`${link.label}-${link.url}`}
                  href={link.url}
                  target={link.url.startsWith("mailto:") ? undefined : "_blank"}
                  rel={link.url.startsWith("mailto:") ? undefined : "noreferrer"}
                  className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
                >
                  <Link2 aria-hidden className="size-3.5" />
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Mail, Rss, AtSign } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Front-end Footer (Phase 2 / Day 1).
 *
 * Visual reference: docs/design-explorations/p1-style/01.png
 *   - left  : tag cloud (归档标签)
 *   - mid   : tagline 「生活本身就是最好的素材。」
 *   - right : signature 「— 小川」 + social icons
 *
 * Static content today (Phase 2 Day 1). Tags become clickable once the
 * tag taxonomy lands in Phase 3 (articles module).
 */

interface FooterLink {
  label: string;
  href: string;
}

const ARCHIVE_TAGS: readonly FooterLink[] = [
  { label: "写作", href: "/tags/writing" },
  { label: "观察", href: "/tags/observe" },
  { label: "项目", href: "/tags/projects" },
  { label: "摄影", href: "/tags/photo" },
  { label: "设计", href: "/tags/design" },
  { label: "生活", href: "/tags/life" },
  { label: "思考", href: "/tags/thinking" },
];

interface SocialLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ "aria-hidden"?: boolean; className?: string }>;
}

const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: "微博", href: "https://weibo.com/", icon: AtSign },
  { label: "邮件", href: "mailto:hello@example.com", icon: Mail },
  { label: "RSS", href: "/rss.xml", icon: Rss },
];

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        "mt-24 border-t border-hair bg-surface",
        className,
      )}
    >
      <div className="mx-auto flex max-w-container flex-col gap-10 px-8 py-12 lg:flex-row lg:items-start lg:justify-between">
        {/* 归档标签 */}
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">归档标签</p>
          <ul className="flex flex-wrap items-center gap-2">
            {ARCHIVE_TAGS.map((tag) => (
              <li key={tag.href}>
                <Link
                  href={tag.href}
                  className="rounded border border-hair px-3 py-1 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {tag.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 标语 */}
        <div className="lg:max-w-xs lg:text-center">
          <p className="font-serif text-base text-ink">生活本身就是最好的素材。</p>
        </div>

        {/* 署名 + 社交 */}
        <div className="flex flex-col items-start gap-3 lg:items-end">
          <p className="text-sm text-muted">— 小川</p>
          <ul className="flex items-center gap-2">
            {SOCIAL_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    title={item.label}
                    className="flex size-9 items-center justify-center rounded text-muted transition-colors hover:bg-bg hover:text-accent"
                  >
                    <Icon aria-hidden className="size-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-hair">
        <p className="mx-auto max-w-container px-8 py-4 text-center text-xs text-muted">
          © {new Date().getFullYear()} 小川记事 · 由 Next.js + Tailwind 驱动
        </p>
      </div>
    </footer>
  );
}

import Link from "next/link";

import { cn } from "@/lib/utils";

const LINKS = [
  { label: "专栏", href: "/columns" },
  { label: "归档", href: "/archive" },
  { label: "标签", href: "/tags" },
  { label: "关于", href: "/about" },
] as const;

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-20 border-t border-hair bg-surface", className)}>
      <div className="mx-auto flex max-w-container flex-col gap-5 px-4 py-10 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div><p className="font-bold text-ink">小川记事</p><p className="mt-1 text-muted">记录技术实现、问题排查和工程实践。</p></div>
        <nav aria-label="页脚导航"><ul className="flex flex-wrap gap-x-5 gap-y-2">{LINKS.map((item) => <li key={item.href}><Link href={item.href} className="text-muted hover:text-accent">{item.label}</Link></li>)}</ul></nav>
      </div>
      <div className="border-t border-hair"><p className="mx-auto max-w-container px-4 py-4 font-mono text-[11px] text-muted sm:px-8">© {new Date().getFullYear()} 小川记事</p></div>
    </footer>
  );
}

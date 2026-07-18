// Top-level 404 fallback (lives outside any route group, so it is wrapped
// only by the root layout -- no Header / Footer / Sidebar). Next.js will
// use this when no more specific not-found.tsx matches (e.g. inside
// /admin, the admin one wins).

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-container flex-col items-center justify-center gap-6 px-8 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">404</p>
      <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">
        这条小路似乎走不通了
      </h1>
      <p className="max-w-prose text-sm text-muted">
        你访问的页面不存在，或者已经被搬走了。回到首页，也许能找到想去的地方。
      </p>
      <Link
        href="/"
        className="rounded bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
      >
        返回首页
      </Link>
    </div>
  );
}

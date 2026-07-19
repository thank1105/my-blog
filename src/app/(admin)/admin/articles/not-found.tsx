// /admin/articles/* 404. Different from the global 404 -- it inherits the
// admin chrome (Sidebar + TopBar) so the operator can keep navigating
// after a typo'd id.

import Link from "next/link";

export default function AdminArticleNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">404</p>
      <h1 className="font-serif text-2xl font-bold text-ink">找不到这篇文章</h1>
      <p className="max-w-prose text-sm text-muted">
        文章 id 可能已被删除，或者链接已失效。
      </p>
      <Link
        href="/admin/articles"
        className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
      >
        回到文章列表
      </Link>
    </div>
  );
}

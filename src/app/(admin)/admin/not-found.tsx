// Admin 404 -- rendered when `notFound()` is called inside /admin/*
// or the user navigates to an unknown admin route.

import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">404</p>
      <h1 className="font-serif text-2xl font-bold text-ink">后台页面不存在</h1>
      <p className="max-w-prose text-sm text-muted">
        你访问的后台路径可能尚未实现，或者已经被移除。
      </p>
      <Link
        href="/admin"
        className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
      >
        回到后台首页
      </Link>
    </div>
  );
}

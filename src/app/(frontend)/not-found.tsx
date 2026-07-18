// Front-end 404 -- lives inside `(frontend)` so it inherits the public
// chrome (Header + Footer) and gives visitors a way to keep navigating
// instead of dead-ending on a blank page.

import Link from "next/link";
import { Home } from "lucide-react";

export default function FrontendNotFound() {
  return (
    <div className="mx-auto flex max-w-container flex-col items-center justify-center gap-6 px-8 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">404</p>
      <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">
        这条小路似乎走不通了
      </h1>
      <p className="max-w-prose text-sm text-muted">
        你访问的页面不存在，或者已经被搬走了。回到首页，或者从顶部的导航继续逛逛。
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
      >
        <Home aria-hidden className="size-4" />
        返回首页
      </Link>
    </div>
  );
}

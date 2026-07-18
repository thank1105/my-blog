"use client";

// Global error boundary (Phase 2 / Day 2). Required to be a client
// component so the reset handler can call into the React runtime.
// Lives at app root so it catches errors from every route; the
// `(frontend)/error.tsx` variant wraps it inside the public chrome.

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Phase 10: wire to Sentry / pino. Today we log so a dev console
    // session still surfaces the failure.
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-container flex-col items-center justify-center gap-6 px-8 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-danger">出错了</p>
      <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">
        页面渲染遇到了问题
      </h1>
      <p className="max-w-prose text-sm text-muted">
        刷新一下通常就能恢复。如果一直看到这个画面，可以回到首页。
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted">错误码：{error.digest}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          重试
        </button>
        <Link
          href="/"
          className="rounded border border-hair px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

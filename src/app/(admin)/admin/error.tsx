"use client";

// Admin error boundary -- wraps the recovery UI inside the admin chrome
// so the operator still has navigation when something blows up server-side.

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[AdminError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-danger">出错了</p>
      <h1 className="font-serif text-2xl font-bold text-ink">后台页面渲染失败</h1>
      <p className="max-w-prose text-sm text-muted">
        重试通常就能恢复。如果一直看到这个画面，可以回到后台首页。
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted">错误码：{error.digest}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          重试
        </button>
        <Link
          href="/admin"
          className="rounded border border-hair px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          回到后台首页
        </Link>
      </div>
    </div>
  );
}

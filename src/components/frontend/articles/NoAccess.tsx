// NoAccess (Phase 3 / Day 2).
//
// Inline placeholder used when:
//   - visibility === PRIVATE and the visitor is not signed in;
//   - visibility === PASSWORD and the visitor has not entered the
//     password yet (handled separately by PasswordPrompt).
//
// Pure server component: no state, no client JS.

import Link from "next/link";
import { Lock, LogIn } from "lucide-react";

export interface NoAccessProps {
  reason: "PRIVATE" | "PASSWORD";
  /** Where the login flow should bounce back to. */
  callbackUrl?: string;
}

export function NoAccess({ reason, callbackUrl }: NoAccessProps) {
  if (reason === "PRIVATE") {
    const target = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/login";
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-md border border-hair bg-surface p-8 text-center shadow-soft">
        <Lock aria-hidden className="size-6 text-accent" />
        <h2 className="font-serif text-xl font-bold text-ink">登录后查看</h2>
        <p className="text-sm text-muted">
          这是一篇私密文章，需要先登录才能阅读全文。
        </p>
        <Link
          href={target}
          className="inline-flex items-center gap-2 rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90"
        >
          <LogIn aria-hidden className="size-4" />
          去登录
        </Link>
      </div>
    );
  }
  // PASSWORD but no password supplied -- PasswordPrompt should be used
  // instead, but we render a defensive fallback for safety.
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-md border border-hair bg-surface p-8 text-center shadow-soft">
      <Lock aria-hidden className="size-6 text-accent" />
      <h2 className="font-serif text-xl font-bold text-ink">这是一篇密码文章</h2>
      <p className="text-sm text-muted">需要输入正确的密码才能阅读全文。</p>
    </div>
  );
}

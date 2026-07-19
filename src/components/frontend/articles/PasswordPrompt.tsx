"use client";

// PasswordPrompt (Phase 3 / Day 2).
//
// Client island shown when a visitor lands on a PASSWORD-visibility
// article. Submits the password to the server via a server action that
// the parent page wires up; on success the page re-fetches the article
// body with the password cookie, on failure it shows an inline error.

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";

export interface PasswordPromptProps {
  /** Server action that accepts a password and returns ok/err. */
  onSubmit: (password: string) => Promise<{ ok: boolean; error?: string }>;
  /** Slug for screen-reader announcement. */
  slug?: string;
}

export function PasswordPrompt({ onSubmit, slug }: PasswordPromptProps) {
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password) return;
    setError(null);
    startTransition(async () => {
      const res = await onSubmit(password);
      if (!res.ok) setError(res.error ?? "密码错误");
    });
  }

  return (
    <form
      onSubmit={handle}
      aria-label={`输入阅读密码：${slug ?? "该文章"}`}
      className="mx-auto flex w-full max-w-sm flex-col gap-3 rounded-md border border-hair bg-surface p-6 shadow-soft"
    >
      <div className="flex items-center gap-2 text-accent">
        <Lock aria-hidden className="size-5" />
        <h2 className="font-serif text-lg font-bold text-ink">这是一篇密码文章</h2>
      </div>
      <p className="text-sm text-muted">请输入作者设置的密码来阅读全文。</p>
      <label htmlFor="article-password" className="sr-only">
        阅读密码
      </label>
      <input
        id="article-password"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-invalid={error ? "true" : "false"}
        className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
      />
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !password}
        className="rounded bg-accent px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "验证中…" : "解锁"}
      </button>
    </form>
  );
}

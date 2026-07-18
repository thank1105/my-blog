"use client";

// Renders the NextAuth error banner on top of the login form.
//
// NextAuth redirects back to /login?error=<code> on failure. We translate
// the handful of codes we care about into Chinese; generic codes fall
// through to a neutral message so the API never exposes internals (the
// rate-limit / not-found / wrong-password cases all collapse to the same
// line).

import { useSearchParams } from "next/navigation";

const MESSAGE_MAP: Record<string, string> = {
  CredentialsSignin: "邮箱或密码错误，请重试。",
  RateLimited: "登录尝试次数过多，请 15 分钟后再试。",
  SessionRequired: "请先登入后再访问该页面。",
  Verification: "链接已过期，请重新登录。",
  Default: "登录遇到问题，请稍后再试。",
};

interface LoginPageErrorProps {
  code?: string;
}

export function LoginPageError({ code }: LoginPageErrorProps) {
  // useSearchParams survives the SSR->CSR streaming handoff. The prop is a
  // server-side hint, so we prefer it when present.
  const params = useSearchParams();
  const value = code ?? params.get("error") ?? undefined;

  if (!value) return null;
  const message = MESSAGE_MAP[value] ?? MESSAGE_MAP.Default;

  return (
    <p
      role="alert"
      className="mb-5 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      {message}
    </p>
  );
}

// Phase 1 Day 1 login page (per DEVELOPMENT.md).
//
// Visual references:
//   - docs/visual-anchor.png (paper-like minimal cards, source-han-serif title)
//   - docs/design-decisions.md (accent #E85A2C, hairline border, soft shadow)
//   - Phase 2 will introduce the global Header / Footer on top of this.
//
// The form uses react-hook-form + Zod (technology-baseline § 2.5) and submits
// through NextAuth v4 signIn(), which is responsible for all rate-limiting,
// bcrypt verification, and JWT cookie handling. The server component simply
// fetches any error from the URL (?error=...) so the failure UX stays in the
// framework’s hands.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginPageError } from "@/components/auth/LoginPageError";

export const metadata: Metadata = {
  title: "登入",
  robots: { index: false, follow: false },
};

// Disable static prerendering: the page relies on the active session cookie at
// request time, and the search params drive the error banner.
export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams?: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    // Already signed in -- bounce home rather than show the form again.
    redirect("/");
  }

  const params = (await searchParams) ?? {};
  const callbackUrl = params.callbackUrl ?? "/";
  const errorCode = params.error;

  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center bg-bg px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">Phase 1 · Auth</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-ink">小川记事</h1>
          <p className="mt-2 text-sm text-muted">请使用邮箱和密码登入后台。</p>
        </div>

        <section className="rounded-md border border-hair bg-surface p-8 shadow-soft">
          <LoginPageError code={errorCode} />
          <LoginForm callbackUrl={callbackUrl} />
        </section>

        <p className="mt-6 text-center text-xs text-muted">
          还不是那个织帆者？
          <Link
            href="/"
            className="ml-1 text-ink underline decoration-hair underline-offset-4 transition-colors hover:decoration-accent"
          >
            返回首页
          </Link>
        </p>
      </div>
    </main>
  );
}

// Sign out button for the Day 1 admin placeholder.
//
// Uses NextAuth.js signOut() which clears the HTTP-only JWT cookie. The full
// admin chrome (sidebar / top bar) replaces this on Phase 2.

"use client";

import { signOut } from "next-auth/react";

interface SignOutButtonProps {
  callbackUrl?: string;
}

export function SignOutButton({ callbackUrl = "/login" }: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl })}
      className="rounded border border-hair px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
    >
      退出登录
    </button>
  );
}

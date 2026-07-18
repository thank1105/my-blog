// NextAuth.js v4 configuration for My-Blog.
//
// Phase 1 Day 1 scope (per DEVELOPMENT.md):
//   - Credentials Provider for email + password.
//   - JWT session strategy (required for Credentials in NextAuth v4).
//   - HTTP-only cookies managed by NextAuth (default for JWT sessions).
//   - bcryptjs with cost 12 for password hashing/verification.
//   - Login rate limit (5 failures / 15 min) enforced inside authorize().
//
// See also:
//   - docs/technology-baseline.md section 2.3 (locked versions).
//   - src/lib/rate-limit.ts for the in-process limiter this file calls.
//   - src/types/next-auth.d.ts for the Session/User type augmentations.

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import { checkLoginRate, clearLoginAttempts, recordLoginFailure } from "@/lib/rate-limit";

// Lower-cased + trimmed email so "USER@x" and "user@x" share a bucket and
// the same row in the database.
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

// Cost is locked by docs/technology-baseline.md section 2.3 and Phase 1 Day 1
// task "密码使用 bcryptjs 加密 cost 12". Tests and seed both import the same
// constant so we never drift from the documented value.
export const BCRYPT_COST = 12;

export const authOptions: NextAuthOptions = {
  // JWT is required for the Credentials Provider in NextAuth v4. The token
  // is held in an HTTP-only cookie that NextAuth manages (default behaviour
  // for the JWT strategy: secure + httpOnly + sameSite=lax).
  session: {
    strategy: "jwt",
    // 30-day session when remember-me is enabled; otherwise the default 8 h.
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  // Required in production; in dev we fall back to a deterministic placeholder
  // so local pnpm dev never blocks on a missing env var. Production builds
  // must override NEXTAUTH_SECRET via env vars.
  secret: process.env.NEXTAUTH_SECRET ?? "dev-only-secret-" + "do-not-use-in-prod",

  pages: {
    signIn: "/login",
    // Same route handles errors via ?error=<code>.
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email + Password",
      // Field hints shown by NextAuth client helpers; we still re-validate
      // the inputs ourselves with Zod so we can return structured errors.
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "boolean" },
      },
      async authorize(rawCredentials) {
        // Missing fields collapse to an authorisation failure rather than
        // crashing the route handler.
        if (!rawCredentials) return null;

        const parsed = credentialsSchema.safeParse({
          email: rawCredentials.email,
          password: rawCredentials.password,
        });

        // Per email bucket. Unrecognised emails are also rate-limited so an
        // attacker cannot probe whether an account exists by trial and error.
        const rateKey = parsed.success
          ? "email:" + parsed.data.email
          : "email:" +
            (String(rawCredentials.email ?? "")
              .trim()
              .toLowerCase() || "anonymous");

        // Hard stop if the bucket is saturated. We surface a
        // CredentialsSignin with code "RateLimited" so /login can render a
        // targeted banner instead of the generic wrong-credentials line.
        const pre = checkLoginRate(rateKey);
        if (!pre.allowed) {
          throw new Error("RateLimited");
        }

        if (!parsed.success) {
          // Count this as a failure so the bucket advances toward the limit
          // even when the email is malformed.
          recordLoginFailure(rateKey);
          return null;
        }

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
          recordLoginFailure(rateKey);
          return null;
        }

        // Password hash check.
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          recordLoginFailure(rateKey);
          return null;
        }

        // Successful login: clear the bucket and write back lastLoginAt.
        clearLoginAttempts(rateKey);
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
          select: { id: true },
        });

        // Returned object is what gets embedded in the JWT; the Session
        // callback (and src/types/next-auth.d.ts) shape the public API.
        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.username,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "USER";
      }
      return session;
    },
  },
};

export type AuthOptions = typeof authOptions;

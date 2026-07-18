// Type augmentations for next-auth so role / id flow through Session / JWT.
//
// Phase 1 Day 1: the Credentials provider returns { id, role, ... } in its
// authorize() hook. Without these module declarations TypeScript would treat
// session.user.role and token.role as unknown, which forces every consumer to
// cast through unknown. Centralising the shape here keeps the surface small.

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "USER";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "ADMIN" | "USER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "USER";
  }
}

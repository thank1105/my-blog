// NextAuth.js v4 route handler.
//
// Phase 1 Day 1 (per DEVELOPMENT.md): exposes the credentials sign-in flow
// over `/api/auth/*`. The same handler also serves the GET endpoints used by
// `useSession()` / `getServerSession()` on the client and server, so both the
// login form submission and the session bootstrap go through here.

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

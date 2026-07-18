// Phase 1 / Day 2 middleware.
//
// Guards /admin/* per REQUIREMENTS § 3.3:
//   - GUEST  (no session)  -> /login?callbackUrl=<original>
//   - USER                 -> / (visible 404 if a USER hits a route they
//                             cannot access; here we just bounce them home
//                             since there is nothing else to do yet)
//   - ADMIN                -> pass through
//
// We use NextAuth.js withAuth({...}) with an augmented token. The token
// callback in src/lib/auth.ts already injects id + role, so the middleware
// reads them directly.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

// Pure helper used by both the middleware and the route handlers -- keeps
// the redirect decision in one place and unit-testable.
export function decideAdminRedirect(req: NextRequest, role: "ADMIN" | "USER" | undefined) {
  // 1. Unauthenticated -> /login with callbackUrl.
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // 2. Non-admin authenticated user -> / (they have no admin privileges).
  if (role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 3. ADMIN: fall through to the protected route.
  return NextResponse.next();
}

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    return decideAdminRedirect(req, role);
  },
  {
    // withAuth would otherwise redirect unauthenticated users to pages.signIn
    // (which we already set to /login). We turn that off so our function
    // runs for every request and we control the redirect URL.
    callbacks: {
      authorized: () => true,
    },
  },
);

// Limit the middleware to /admin/* as per Day 2 task list. Phase 3 will add
// a matcher that also gates private content routes (e.g. /articles/[slug]
// when visibility=PRIVATE).
export const config = {
  matcher: ["/admin/:path*"],
};

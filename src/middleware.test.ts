// Unit tests for src/middleware.ts decideAdminRedirect helper.
//
// We avoid spinning up the full withAuth wrapper -- that one is covered by
// Day 2 acceptance verification, which boots `pnpm dev` and probes the
// three roles. The pure helper below is the bit worth pinning down.

import { describe, expect, it } from "vitest";
import { decideAdminRedirect } from "./middleware";

// Lightweight NextRequest stand-in: enough of the API surface for the helper.
function makeReq(path: string, search = "") {
  const url = new URL("http://example.com" + path + (search ? "?" + search : ""));
  return {
    nextUrl: {
      clone() {
        return new URL(url.toString());
      },
      pathname: url.pathname,
      search: url.search,
    },
  } as unknown as import("next/server").NextRequest;
}

describe("decideAdminRedirect", () => {
  it("unauthenticated -> /login with callbackUrl", () => {
    const res = decideAdminRedirect(makeReq("/admin/users"), undefined);
    expect(res.headers.get("location")).toBe(
      "http://example.com/login?callbackUrl=%2Fadmin%2Fusers",
    );
  });

  it("unauthenticated preserves original query inside the callbackUrl param", () => {
    const res = decideAdminRedirect(makeReq("/admin/users", "page=2"), undefined);
    const loc = res.headers.get("location") ?? "";
    const parsed = new URL(loc);
    // query string should still have page=2 (it was on the admin URL).
    expect(parsed.searchParams.get("page")).toBe("2");
    // callbackUrl should encode the FULL incoming URL.
    expect(decodeURIComponent(parsed.searchParams.get("callbackUrl") ?? "")).toBe(
      "/admin/users?page=2",
    );
  });

  it("USER -> / (no callbackUrl)", () => {
    const res = decideAdminRedirect(makeReq("/admin/users/new"), "USER");
    expect(res.headers.get("location")).toBe("http://example.com/");
  });

  it("ADMIN -> passes through (no redirect headers)", () => {
    const res = decideAdminRedirect(makeReq("/admin/users"), "ADMIN");
    expect(res.headers.get("location")).toBeNull();
  });
});

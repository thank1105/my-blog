// Unit tests for src/lib/visibility.ts.
//
// Covers every cell of the role x visibility matrix plus the password
// happy path, mismatch path, and the safeEqual helper.

import { describe, expect, it } from "vitest";
import {
  canListInPublicIndex,
  canViewContent,
  viewerRoleOf,
  __internal,
} from "./visibility";

describe("viewerRoleOf", () => {
  it("returns GUEST when viewer is null", () => {
    expect(viewerRoleOf(null)).toBe("GUEST");
  });

  it("returns GUEST when viewer is unauthenticated", () => {
    expect(viewerRoleOf({ authenticated: false, role: "USER" })).toBe("GUEST");
  });

  it("returns USER when authenticated non-admin", () => {
    expect(viewerRoleOf({ authenticated: true, role: "USER" })).toBe("USER");
  });

  it("returns ADMIN when authenticated admin", () => {
    expect(viewerRoleOf({ authenticated: true, role: "ADMIN" })).toBe("ADMIN");
  });
});

describe("canViewContent", () => {
  const GUEST = null;
  const USER = { authenticated: true, role: "USER" as const };
  const ADMIN = { authenticated: true, role: "ADMIN" as const };

  it("PUBLIC is accessible to everyone", () => {
    expect(canViewContent(GUEST, { visibility: "PUBLIC" })).toEqual({ allowed: true });
    expect(canViewContent(USER, { visibility: "PUBLIC" })).toEqual({ allowed: true });
    expect(canViewContent(ADMIN, { visibility: "PUBLIC" })).toEqual({ allowed: true });
  });

  it("PRIVATE blocks GUEST", () => {
    expect(canViewContent(GUEST, { visibility: "PRIVATE" })).toEqual({
      allowed: false,
      reason: "GUEST_PRIVATE",
    });
  });

  it("PRIVATE allows authenticated USER", () => {
    expect(canViewContent(USER, { visibility: "PRIVATE" })).toEqual({ allowed: true });
  });

  it("PASSWORD blocks GUEST unconditionally", () => {
    expect(
      canViewContent(GUEST, { visibility: "PASSWORD", contentPassword: "x" }),
    ).toEqual({ allowed: false, reason: "GUEST_PASSWORD" });
  });

  it("PASSWORD blocks USER without password attempt", () => {
    expect(
      canViewContent(USER, { visibility: "PASSWORD", contentPassword: "x" }),
    ).toEqual({ allowed: false, reason: "USER_PASSWORD_REQUIRED" });
  });

  it("PASSWORD blocks USER when password mismatches", () => {
    expect(
      canViewContent(USER, {
        visibility: "PASSWORD",
        passwordProvided: "wrong",
        contentPassword: "right",
      }),
    ).toEqual({ allowed: false, reason: "USER_PASSWORD_MISMATCH" });
  });

  it("PASSWORD allows USER when password matches", () => {
    expect(
      canViewContent(USER, {
        visibility: "PASSWORD",
        passwordProvided: "right",
        contentPassword: "right",
      }),
    ).toEqual({ allowed: true });
  });

  it("ADMIN always passes (even PASSWORD without a password)", () => {
    expect(canViewContent(ADMIN, { visibility: "PASSWORD" })).toEqual({ allowed: true });
    expect(canViewContent(ADMIN, { visibility: "PRIVATE" })).toEqual({ allowed: true });
    expect(canViewContent(ADMIN, { visibility: "PUBLIC" })).toEqual({ allowed: true });
  });
});

describe("canListInPublicIndex", () => {
  const USER = { authenticated: true, role: "USER" as const };
  const ADMIN = { authenticated: true, role: "ADMIN" as const };

  it("PUBLIC is always indexable", () => {
    expect(canListInPublicIndex(null, "PUBLIC")).toBe(true);
    expect(canListInPublicIndex(USER, "PUBLIC")).toBe(true);
  });

  it("PRIVATE is hidden from GUESTs but visible to authenticated viewers", () => {
    expect(canListInPublicIndex(null, "PRIVATE")).toBe(false);
    expect(canListInPublicIndex(USER, "PRIVATE")).toBe(true);
    expect(canListInPublicIndex(ADMIN, "PRIVATE")).toBe(true);
  });

  it("PASSWORD entries are never indexable, regardless of role", () => {
    expect(canListInPublicIndex(null, "PASSWORD")).toBe(false);
    expect(canListInPublicIndex(USER, "PASSWORD")).toBe(false);
    expect(canListInPublicIndex(ADMIN, "PASSWORD")).toBe(false);
  });
});

describe("safeEqual", () => {
  const eq = __internal.safeEqual;
  it("returns true for identical non-empty strings", () => {
    expect(eq("hello", "hello")).toBe(true);
  });

  it("returns false for different strings of equal length", () => {
    expect(eq("hello", "world")).toBe(false);
  });

  it("returns false for strings of different length", () => {
    expect(eq("hello", "helloo")).toBe(false);
  });

  it("returns false when either side is nullish", () => {
    expect(eq(null, "x")).toBe(false);
    expect(eq("x", undefined)).toBe(false);
  });
});

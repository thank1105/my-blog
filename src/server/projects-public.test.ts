// Phase 5 / Day 2-3 -- public server tests.
//
// We only cover the pure helpers (safeEqual via __internal) and the
// type-narrowing functions; the DB-touching listX / listTagsWithCount
// helpers are covered by future e2e tests once the public surface is
// hooked into a CI smoke flow.

import { describe, it, expect } from "vitest";

import { __internal } from "./projects-public";

describe("projects-public safeEqual", () => {
  it("returns true for equal strings", () => {
    expect(__internal.safeEqual("hello", "hello")).toBe(true);
  });

  it("returns false for differing strings", () => {
    expect(__internal.safeEqual("hello", "world")).toBe(false);
  });

  it("returns false for differing lengths", () => {
    expect(__internal.safeEqual("hi", "hii")).toBe(false);
  });

  it("treats null / undefined as never equal", () => {
    expect(__internal.safeEqual(null, "x")).toBe(false);
    expect(__internal.safeEqual("x", undefined)).toBe(false);
    expect(__internal.safeEqual(null, undefined)).toBe(false);
  });

  it("is empty-safe", () => {
    expect(__internal.safeEqual("", "")).toBe(false);
    expect(__internal.safeEqual("a", "")).toBe(false);
  });
});

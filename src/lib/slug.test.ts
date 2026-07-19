// Unit tests for src/lib/slug.ts (Phase 3 / Day 4).

import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("returns empty string for falsy input", () => {
    expect(slugify("")).toBe("");
  });

  it("converts English title to lowercase hyphenated slug", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("transliterates CJK into pinyin", () => {
    const result = slugify("关于散步这件小事");
    expect(result).toBe("guan-yu-san-bu-zhe-jian-xiao-shi");
  });

  it("mixes CJK and ASCII", () => {
    expect(slugify("React 19 来了")).toBe("react-19-lai-le");
  });

  it("collapses multiple punctuation into single hyphen", () => {
    expect(slugify("foo!!!bar???baz")).toBe("foo-bar-baz");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("!!!hello!!!")).toBe("hello");
  });

  it("strips diacritics from Latin text", () => {
    expect(slugify("café naïve")).toBe("cafe-naive");
  });

  it("truncates to 80 characters max", () => {
    const long = "a".repeat(100);
    const result = slugify(long);
    expect(result.length).toBeLessThanOrEqual(80);
    expect(result).not.toMatch(/-$/);
  });

  it("handles pure ASCII numbers and letters only", () => {
    expect(slugify("GoLang 1.21")).toBe("golang-1-21");
  });
});

describe("uniqueSlug", () => {
  it("returns desired when not in existing set", () => {
    expect(uniqueSlug("hello-world", new Set(["foo", "bar"]))).toBe("hello-world");
  });

  it("appends -2 when desired collides", () => {
    expect(uniqueSlug("hello-world", new Set(["hello-world"]))).toBe("hello-world-2");
  });

  it("appends -3 when -2 also collides", () => {
    expect(
      uniqueSlug("hello-world", new Set(["hello-world", "hello-world-2"])),
    ).toBe("hello-world-3");
  });

  it("strips existing numeric suffix of desired before appending", () => {
    // uniqueSlug's regex strips the trailing -N from `desired` so that
    // "hello-world-5" becomes base "hello-world", then appends -2.
    expect(
      uniqueSlug("hello-world-5", new Set(["hello-world-5", "hello-world"])),
    ).toBe("hello-world-2");
  });

  it("finds next available number after collisions", () => {
    expect(
      uniqueSlug("my-post", new Set(["my-post", "my-post-2", "my-post-3"])),
    ).toBe("my-post-4");
  });
});
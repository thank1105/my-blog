// Phase 7 / Day 2 -- pages server + renderPageMarkdown tests.

import { describe, it, expect } from "vitest";

import { upsertPageSchema, pageTypeValues } from "./pages";
import { renderPageMarkdown } from "./pages-public";

describe("upsertPageSchema", () => {
  it("accepts ABOUT", () => {
    const r = upsertPageSchema.safeParse({ type: "ABOUT", content: "hi" });
    expect(r.success).toBe(true);
  });

  it("accepts NOW", () => {
    const r = upsertPageSchema.safeParse({ type: "NOW", content: "now hi" });
    expect(r.success).toBe(true);
  });

  it("rejects unknown type", () => {
    const r = upsertPageSchema.safeParse({ type: "FOO", content: "x" });
    expect(r.success).toBe(false);
  });

  it("rejects empty content", () => {
    const r = upsertPageSchema.safeParse({ type: "ABOUT", content: "  " });
    expect(r.success).toBe(false);
  });

  it("trims content", () => {
    const r = upsertPageSchema.safeParse({ type: "ABOUT", content: "  hello  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.content).toBe("hello");
  });

  it("accepts empty meta (nullish in storage)", () => {
    const r = upsertPageSchema.safeParse({
      type: "ABOUT",
      content: "x",
      meta: "",
    });
    expect(r.success).toBe(true);
  });
});

describe("pageTypeValues", () => {
  it("exposes ABOUT and NOW", () => {
    expect(pageTypeValues).toEqual(["ABOUT", "NOW"]);
  });
});

describe("renderPageMarkdown", () => {
  it("renders paragraphs", () => {
    const html = renderPageMarkdown("hello world");
    expect(html).toContain("<p>hello world</p>");
  });

  it("renders headings and closes lists between them", () => {
    const md = "- a\n- b\n\n# Title\n\nbody";
    const html = renderPageMarkdown(md);
    expect(html).toContain("<ul>");
    expect(html).toContain("</ul>");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<p>body</p>");
  });

  it("renders ordered list", () => {
    const html = renderPageMarkdown("1. one\n2. two");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<li>two</li>");
    expect(html).toContain("</ol>");
  });

  it("renders bold and italic", () => {
    const html = renderPageMarkdown("**bold** and *italic*");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("renders inline code", () => {
    const html = renderPageMarkdown("use `pnpm dev`");
    expect(html).toContain("<code>pnpm dev</code>");
  });

  it("escapes raw HTML", () => {
    const html = renderPageMarkdown("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("renders blockquote", () => {
    const html = renderPageMarkdown("> quoted");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("quoted");
    expect(html).toContain("</blockquote>");
  });
});
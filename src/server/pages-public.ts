// Phase 7 / Day 2 -- Page public reads.

import { db } from "@/lib/db";

/** Get the single About page row (or null if not yet written). */
export async function getPublicAbout() {
  return db.page.findUnique({
    where: { type: "ABOUT" },
    select: {
      id: true,
      type: true,
      content: true,
      meta: true,
      updatedAt: true,
    },
  });
}

/** Get the single Now page row (or null if not yet written). */
export async function getPublicNow() {
  return db.page.findUnique({
    where: { type: "NOW" },
    select: {
      id: true,
      type: true,
      content: true,
      meta: true,
      updatedAt: true,
    },
  });
}

/**
 * Light-weight Markdown renderer that handles the subset we expect
 * admins to write: paragraphs, blank lines, `# / ## / ###` headings,
 * `- bullet`, `1. ordered`, `**bold**`, `*italic*`, `` `code` ``,
 * and `> quote`. Anything else is passed through as plain text.
 *
 * No dependencies; the admin can always switch to a heavier renderer
 * later without touching the data.
 */
export function renderPageMarkdown(input: string): string {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let inBlockquote = false;
  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
    if (inBlockquote) {
      out.push("</blockquote>");
      inBlockquote = false;
    }
  };
  const inline = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.length === 0) {
      closeLists();
      continue;
    }
    if (line.startsWith("### ")) {
      closeLists();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeLists();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      closeLists();
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("> ")) {
      if (inUl || inOl) closeLists();
      if (!inBlockquote) {
        out.push("<blockquote>");
        inBlockquote = true;
      }
      out.push(`<p>${inline(line.slice(2))}</p>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (inOl || inBlockquote) closeLists();
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inUl || inBlockquote) closeLists();
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inline(olMatch[1])}</li>`);
      continue;
    }
    closeLists();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeLists();
  return out.join("\n");
}
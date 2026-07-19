// Markdown utility helpers (Phase 3 / Day 1).
//
// Kept dependency-free so the editor / preview side never has to wait on
// the heavier `next-mdx-remote` pipeline (which lands on Day 2 for the
// public article page). The whole file is < 80 lines.

const HEADING_RE = /^#{1,6}\s+/;
const BLOCKQUOTE_RE = /^>\s*/;
const LIST_RE = /^\s*([-*+]|\d+\.)\s+/;
const FENCE_RE = /^```/;
const LINK_OR_IMAGE_RE = /!?\[([^\]]*)\]\([^)]+\)/g;
const HTML_TAG_RE = /<[^>]+>/g;
const PUNCT_RE = /[!"#$%&()*+,\-./:;<=>?@[\\\]^_`{|}~]/g;
const WHITESPACE_RE = /\s+/g;

/**
 * Build a short, plain-text excerpt from a Markdown body.
 *   - Strips headings markers, blockquote, list, fence, link / image syntax,
 *     and HTML tags.
 *   - Collapses whitespace.
 *   - Truncates at `maxLen` characters with a trailing ellipsis when longer.
 */
export function markdownExcerpt(input: string, maxLen = 160): string {
  if (!input) return "";
  const lines = input.split(/\r?\n/);
  const out: string[] = [];
  let inFence = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!line) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      continue;
    }
    let cleaned = line;
    cleaned = cleaned.replace(HEADING_RE, "");
    cleaned = cleaned.replace(BLOCKQUOTE_RE, "");
    cleaned = cleaned.replace(LIST_RE, "");
    cleaned = cleaned.replace(LINK_OR_IMAGE_RE, (_m, alt: string) => alt);
    cleaned = cleaned.replace(HTML_TAG_RE, "");
    cleaned = cleaned.replace(PUNCT_RE, "");
    cleaned = cleaned.replace(WHITESPACE_RE, " ").trim();
    if (cleaned) out.push(cleaned);
  }
  const flat = out.join(" ").trim();
  if (flat.length <= maxLen) return flat;
  return flat.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

/**
 * Cheap "read time" estimate: 350 Chinese characters / minute, plus a
 * minimum of 1 minute so even tiny drafts render "1 分钟".
 */
export function estimateReadingMinutes(content: string): number {
  if (!content) return 1;
  const cjkCount = (content.match(/[\u3400-\u9fff]/g) ?? []).length;
  const asciiCount = (content.match(/[\x20-\x7e]/g) ?? []).length;
  // 350 CJK chars/min; 5 ASCII words/min (rough approximation).
  const asciiWords = Math.ceil(asciiCount / 5);
  const minutes = Math.ceil(cjkCount / 350 + asciiWords / 220);
  return Math.max(1, minutes);
}

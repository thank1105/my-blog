// Slug generation utilities (Phase 3 / Day 1).
//
// Source: DEVELOPMENT.md Day 1 -- "slug 自动生成（基于标题拼音），可手动修改".
// Library: `pinyin-pro` converts Chinese to pinyin without tones; we then
// normalise the result to a URL-safe slug. The slugger is deterministic
// for the same input (no random suffix), so users can rely on
// `/articles/foo-bar` being stable across edits. A `uniqueSlug` helper
// appends a numeric suffix when the chosen slug already exists in the
// table -- callers in src/server/articles.ts own the DB-side check.

import { pinyin } from "pinyin-pro";

const SLUG_MAX = 80;

/**
 * Convert a free-form title into a URL slug.
 *
 *   "关于散步这件小事"     -> "guan-yu-san-bu-zhe-jian-xiao-shi"
 *   "Hello, World!"        -> "hello-world"
 *   "React 19 来了"        -> "react-19-lai-le"
 *
 * Behaviour notes:
 *   - Non-letter, non-digit ASCII (except hyphens) is replaced with `-`.
 *   - Collapses runs of `-` and trims leading / trailing `-`.
 *   - All-CJK titles produce an all-pinyin slug (no fallback to a hash).
 *     If you want a shorter / readable slug for an all-CJK title, pass
 *     the desired string in via `existing` instead of relying on auto-gen.
 */
export function slugify(input: string): string {
  if (!input) return "";

  // First, transliterate any CJK runs into pinyin (space-separated).
  // `pinyin-pro` returns an array of strings per CJK run; we join them.
  let working = input;
  if (/[\u3400-\u9fff]/.test(working)) {
    working = working.replace(
      /[\u3400-\u9fff]+/g,
      (match) => pinyin(match, { toneType: "none", type: "array" }).join(" "),
    );
  }

  // Lowercase + replace anything outside [a-z0-9-] with `-`.
  let slug = working
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length > SLUG_MAX) slug = slug.slice(0, SLUG_MAX).replace(/-+$/g, "");
  return slug;
}

/**
 * Produce a unique slug by appending `-2`, `-3`, ... when `desired`
 * collides with `existing`. The input `existing` should already include
 * `desired` (we test it first to avoid an unnecessary bump).
 */
export function uniqueSlug(desired: string, existing: ReadonlySet<string>): string {
  if (!existing.has(desired)) return desired;
  const base = desired.replace(/-(\d+)$/g, "");
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!existing.has(candidate)) return candidate;
  }
  // Extremely unlikely -- fall back to a short random suffix.
  return `${base}-${Date.now().toString(36)}`;
}

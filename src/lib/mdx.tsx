// MDX / Markdown rendering pipeline (Phase 3 / Day 2).
//
// Goals:
//   - Render article content server-side with proper GFM support.
//   - Syntax highlighting via Shiki (light + dark themes, kept in sync
//     with the project accent / muted tokens).
//   - Heading anchors + autolink so the [slug] page can build a TOC
//     and link directly into sections (Phase 3 / Day 3 will pick this up).
//   - Lazy images: any <img> emitted by MDX gets loading="lazy" +
//     decoding="async" so we do not block the main thread.
//
// This file is a Server Component module: it must only be imported from
// the server (MDX compilation requires node, and we want the syntax
// highlight bundle built at build time rather than shipped to the
// client). The compiled output is pure React so it can be embedded
// inside any server component / page.

import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";

interface HastEl {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastEl[];
}

/**
 * Shared rehype/remark pipeline.
 */
const prettyCodeOptions: PrettyCodeOptions = {
  // Keep both light + dark so the highlight survives theme switches.
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: true,
  defaultLang: "plaintext",
  // Emit a data attribute that CopyButton.tsx keys off of to read the
  // code text out of the rendered <pre>.
  onVisitLine(node) {
    if (node.children.length === 0) {
      node.children = [{ type: "text", value: " " } as never];
    }
  },
  onVisitHighlightedLine(node) {
    const props = (node.properties ?? {}) as Record<string, unknown>;
    node.properties = {
      ...props,
      "data-highlighted-line": "true",
    };
  },
};

/**
 * Rehype plugin that:
 *   - adds `loading="lazy"` + `decoding="async"` to every <img>;
 *   - decorates external <a> with target + rel.
 *
 * Cheap, no external deps; runs in O(n) over the tree.
 */
function walk(node: HastEl) {
  if (node.type === "element") {
    const tag = (node.tagName ?? node.type) as string;
    const props = (node.properties ?? {}) as Record<string, unknown>;

    if (tag === "img") {
      if (props["loading"] === undefined) props["loading"] = "lazy";
      if (props["decoding"] === undefined) props["decoding"] = "async";
    } else if (tag === "a") {
      const href = typeof props["href"] === "string" ? (props["href"] as string) : "";
      if (/^https?:\/\//.test(href)) {
        if (props["target"] === undefined) props["target"] = "_blank";
        if (props["rel"] === undefined) props["rel"] = "noopener noreferrer";
      }
    }
    node.properties = props;
  }
  for (const child of node.children ?? []) {
    walk(child);
  }
}

function rehypeEnhance() {
  return (tree: HastEl) => walk(tree);
}

export interface RenderMarkdownOptions {
  /** Optional: React components exposed to MDX via <Component />. */
  components?: Record<string, React.ComponentType<Record<string, unknown>>>;
}

/**
 * Server-side renderer. Use it from a Server Component:
 *
 *   import { renderMarkdown } from "@/lib/mdx";
 *   const node = await renderMarkdown(article.content);
 *
 * Wrap the result in <Prose>...</Prose> for the article-body styling.
 */
export async function renderMarkdown(
  source: string,
  options: RenderMarkdownOptions = {},
) {
  return (
    <MDXRemote
      source={source}
      components={options.components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              {
                behavior: "append",
                properties: {
                  className: ["heading-anchor"],
                  ariaLabel: "Link to section",
                },
                content: { type: "text", value: " #" },
              },
            ],
            [rehypePrettyCode, prettyCodeOptions],
            rehypeEnhance,
          ],
        },
        parseFrontmatter: false,
      }}
    />
  );
}

/**
 * Wrapper component that styles the compiled output with the project's
 * `prose` look. Apply this around `renderMarkdown(...)`'s return value.
 */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose prose-sm sm:prose-base max-w-none text-ink prose-headings:font-serif prose-headings:text-ink prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-accent prose-strong:text-ink prose-code:rounded prose-code:bg-bg prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.9em] prose-pre:bg-bg prose-pre:text-ink prose-blockquote:border-l-2 prose-blockquote:border-accent prose-blockquote:text-muted prose-img:rounded-md prose-img:shadow-soft prose-li:my-1">
      {children}
    </div>
  );
}

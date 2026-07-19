// ArticleBody wrapper (Phase 3 / Day 2).
//
// Server component that combines the MDX pipeline with the project
// typography styles and a copy button rendered into every <pre>.
//
// We cannot put <CopyButton> inside the MDX output directly because
// the MDX renderer is server-only and CopyButton is client-only.
// Instead we ship the rendered HTML, then on the same page a tiny
// client-side effect finds every <pre data-copy-target> and injects
// a copy button into it (see CodeBlockEnhancer).

import { Prose, renderMarkdown } from "@/lib/mdx";

import { CodeBlockEnhancer } from "./CodeBlockEnhancer";

export interface ArticleBodyProps {
  /** Raw markdown source from the Article row. */
  source: string;
  /** Optional: slug for anchor de-duplication when multiple bodies share headings. */
  slug?: string;
}

export async function ArticleBody({ source }: ArticleBodyProps) {
  const compiled = await renderMarkdown(source, {
    components: {
      // Map the lowercase tag rehype-pretty-code emits (`pre`) to a
      // server-side slot that the CodeBlockEnhancer hydrates with the
      // CopyButton client island.
      pre: (props: Record<string, unknown>) => (
        <pre
          {...(props as Record<string, unknown>)}
          data-copy-target=""
          className="group relative"
        />
      ),
    },
  });
  return (
    <>
      <Prose>{compiled}</Prose>
      <CodeBlockEnhancer />
    </>
  );
}

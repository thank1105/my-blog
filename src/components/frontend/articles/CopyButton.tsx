"use client";

// Copy-to-clipboard button rendered into every <pre> emitted by the
// MDX pipeline. It walks the parent <pre>'s .line spans (Shiki wraps
// each line in <span class="line">) and copies the concatenated text.
//
// We use the Clipboard API directly; on failure we silently no-op so
// the page still works in insecure / permission-denied contexts.

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface Props {
  className?: string;
}

export function CopyButton({ className }: Props) {
  const [copied, setCopied] = useState(false);

  async function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = e.currentTarget;
    const pre = btn.closest("pre");
    if (!pre) return;
    const code = Array.from(pre.querySelectorAll<HTMLElement>(".line"))
      .map((n) => n.textContent ?? "")
      .join("\n");
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // silent
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "已复制" : "复制代码"}
      title={copied ? "已复制" : "复制代码"}
      className={
        "absolute right-2 top-2 inline-flex items-center gap-1 rounded border border-hair bg-surface px-2 py-1 text-xs text-muted opacity-0 transition-opacity hover:text-ink group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 " +
        (className ?? "")
      }
    >
      {copied ? (
        <>
          <Check aria-hidden className="size-3.5" />
          已复制
        </>
      ) : (
        <>
          <Copy aria-hidden className="size-3.5" />
          复制
        </>
      )}
    </button>
  );
}

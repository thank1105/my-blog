"use client";

// Phase 3 / Day 1 markdown editor: split-pane (textarea + preview).
//
// Design choices
//   - Pure react-hook-form controlled field: the parent owns the value
//     (forwarded as `value` / `onChange`) so autosave and server actions
//     can both read it without DOM lookups.
//   - Preview side renders through `react-markdown` + `remark-gfm`. We
//     deliberately skip `rehype-pretty-code` / `Shiki` here -- those
//     are Day 2 scope for the public article page.
//   - Toolbar buttons wrap a selection with the matching Markdown
//     syntax; if no selection, the cursor jumps between paired markers
//     (e.g. **|cursor|**).
//   - IME guard: when the user is composing CJK (compositionstart..end),
//     toolbar shortcuts are skipped so they do not shred in-progress text.

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface MarkdownEditorHandle {
  /** Returns the textarea DOM node (used by tests + IME observers). */
  focus: () => void;
  /** Insert a snippet at the cursor (used by the autosave diff hunk UI). */
  insertAtCursor: (snippet: string) => void;
}

export interface MarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  /** Disabled state propagates to the textarea + toolbar. */
  disabled?: boolean;
  /** Optional className for the outer wrapper. */
  className?: string;
  /** Placeholder shown when the textarea is empty. */
  placeholder?: string;
  /** id for the underlying textarea (accessibility). */
  id?: string;
  /** Label for screen readers. */
  ariaLabel?: string;
}

interface ToolbarAction {
  label: string;
  icon: React.ComponentType<{ "aria-hidden"?: boolean; className?: string }>;
  /** Wrap or insert. Returns the new (value, selectionStart, selectionEnd). */
  apply: (sel: string) => { text: string; offset?: { start: number; end: number } };
}

const wrap = (before: string, after: string): ToolbarAction["apply"] => {
  return (sel) => {
    if (!sel) return { text: `${before}${after}`, offset: { start: before.length, end: before.length } };
    return { text: `${before}${sel}${after}`, offset: { start: before.length, end: before.length + sel.length } };
  };
};

const prefixLines = (prefix: string): ToolbarAction["apply"] => {
  return (sel) => {
    if (!sel) return { text: `${prefix} `, offset: { start: prefix.length + 1, end: prefix.length + 1 } };
    const lines = sel.split("\n");
    const out = lines.map((l) => `${prefix} ${l}`).join("\n");
    return { text: out, offset: { start: 0, end: out.length } };
  };
};

const insertLink: ToolbarAction["apply"] = (sel) => {
  const text = sel || "链接文字";
  return { text: `[${text}](https://)`, offset: { start: text.length + 3, end: text.length + 11 } };
};

const ACTIONS: ToolbarAction[] = [
  { label: "加粗", icon: Bold, apply: wrap("**", "**") },
  { label: "斜体", icon: Italic, apply: wrap("*", "*") },
  { label: "行内代码", icon: Code, apply: wrap("`", "`") },
  { label: "代码块", icon: Code, apply: wrap("\n```\n", "\n```\n") },
  { label: "标题 1", icon: Heading1, apply: prefixLines("#") },
  { label: "标题 2", icon: Heading2, apply: prefixLines("##") },
  { label: "引用", icon: Quote, apply: prefixLines(">") },
  { label: "无序列表", icon: List, apply: prefixLines("-") },
  { label: "有序列表", icon: ListOrdered, apply: prefixLines("1.") },
  { label: "链接", icon: LinkIcon, apply: insertLink },
];

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor(props, ref) {
    const { value, onChange, disabled, className, placeholder, id, ariaLabel } = props;
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const composingRef = useRef(false);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      insertAtCursor: (snippet) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        const next = value.slice(0, start) + snippet + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          el.focus();
          el.setSelectionRange(start + snippet.length, start + snippet.length);
        });
      },
    }));

    const runAction = useCallback(
      (action: ToolbarAction) => {
        const el = textareaRef.current;
        if (!el || disabled || composingRef.current) return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const sel = value.slice(start, end);
        const result = action.apply(sel);
        const next = value.slice(0, start) + result.text + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          el.focus();
          if (result.offset) {
            const cursor = start + result.offset.end;
            const anchor = start + result.offset.start;
            el.setSelectionRange(anchor, cursor);
          } else {
            const cursor = start + result.text.length;
            el.setSelectionRange(cursor, cursor);
          }
        });
      },
      [value, onChange, disabled],
    );

    const [tab, setTab] = useState<"write" | "preview" | "split">("split");

    return (
      <div
        className={cn(
          "rounded-md border border-hair bg-surface shadow-soft",
          className,
        )}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-0.5">
            {ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  type="button"
                  disabled={disabled}
                  aria-label={a.label}
                  title={a.label}
                  onClick={() => runAction(a)}
                  className="flex size-8 items-center justify-center rounded text-muted transition-colors hover:bg-bg hover:text-accent disabled:opacity-50"
                >
                  <Icon aria-hidden className="size-4" />
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-0.5 rounded border border-hair p-0.5 text-xs">
            {(
              [
                { v: "write", label: "写作" },
                { v: "split", label: "分屏" },
                { v: "preview", label: "预览" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                aria-pressed={tab === opt.v}
                onClick={() => setTab(opt.v)}
                className={cn(
                  "rounded px-2 py-1 transition-colors",
                  tab === opt.v ? "bg-accent text-white" : "text-muted hover:bg-bg hover:text-ink",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editor body */}
        <div
          className={cn(
            "grid",
            tab === "split" ? "grid-cols-1 md:grid-cols-2 md:divide-x md:divide-hair" : "grid-cols-1",
          )}
        >
          {(tab === "write" || tab === "split") && (
            <textarea
              id={id}
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onCompositionStart={() => (composingRef.current = true)}
              onCompositionEnd={() => (composingRef.current = false)}
              disabled={disabled}
              placeholder={placeholder ?? "在这里写正文，支持 Markdown（GFM）..."}
              aria-label={ariaLabel ?? "Markdown 正文"}
              spellCheck={false}
              className={cn(
                "min-h-[420px] w-full resize-y bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-ink outline-none",
                "focus-visible:bg-bg",
                tab === "split" ? "md:min-h-[520px]" : "",
              )}
            />
          )}
          {(tab === "preview" || tab === "split") && (
            <div
              role="region"
              aria-label="Markdown 预览"
              className={cn(
                "min-h-[420px] overflow-auto bg-surface px-6 py-4 text-base text-ink",
                tab === "split" ? "md:min-h-[520px]" : "",
              )}
            >
              {value.trim() === "" ? (
                <p className="text-sm text-muted">暂无内容预览。</p>
              ) : (
                <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-ink prose-a:text-accent prose-strong:text-ink prose-code:rounded prose-code:bg-bg prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.9em] prose-pre:bg-bg prose-blockquote:border-l-2 prose-blockquote:border-accent prose-blockquote:text-muted">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-hair px-3 py-1.5 text-xs text-muted">
          <span>{value.length.toLocaleString()} 字符</span>
          <span>支持 GFM（表格、任务列表、删除线）</span>
        </div>
      </div>
    );
  },
);

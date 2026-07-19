"use client";

// Multi-select tag chips. Users can pick from existing tags or type a
// new name + Enter to create one inline. The page-level server action
// resolves the final `tagIds` array via `ensureTagsByNames`.

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TagOption {
  id: string;
  name: string;
  slug?: string;
  color?: string | null;
}

export interface TagSelectorProps {
  selected: readonly string[]; // tag ids
  onChange: (nextIds: string[]) => void;
  available: readonly TagOption[];
  onCreate?: (name: string) => Promise<TagOption | null>;
  disabled?: boolean;
  error?: string | null;
}

export function TagSelector({
  selected,
  onChange,
  available,
  onCreate,
  disabled,
  error,
}: TagSelectorProps) {
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const selectedSet = new Set(selected);
  const selectedTags = available.filter((t) => selectedSet.has(t.id));
  const candidates = available.filter((t) => !selectedSet.has(t.id));
  const exactMatch = candidates.find((t) => t.name.toLowerCase() === input.trim().toLowerCase());

  function toggle(id: string) {
    if (disabled) return;
    if (selectedSet.has(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  async function commit() {
    const name = input.trim();
    if (!name || disabled) return;
    if (exactMatch) {
      toggle(exactMatch.id);
      setInput("");
      return;
    }
    if (!onCreate) return;
    setPending(true);
    try {
      const created = await onCreate(name);
      if (created) {
        toggle(created.id);
        setInput("");
      }
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      void commit();
    } else if (e.key === "Backspace" && input === "" && selected.length > 0) {
      // Convenience: backspace on an empty input pops the last chip.
      onChange(selected.slice(0, -1));
    }
  }

  return (
    <div>
      <label htmlFor="article-tag-input" className="text-sm font-medium text-ink">
        标签
      </label>
      <div
        className={cn(
          "mt-1 flex flex-wrap items-center gap-1.5 rounded border border-hair bg-surface px-2 py-1.5",
          "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30",
          disabled && "opacity-60",
        )}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent"
          >
            {tag.name}
            <button
              type="button"
              aria-label={`移除标签 ${tag.name}`}
              disabled={disabled}
              onClick={() => toggle(tag.id)}
              className="rounded-full p-0.5 hover:bg-accent/20 disabled:cursor-not-allowed"
            >
              <X aria-hidden className="size-3" />
            </button>
          </span>
        ))}
        <input
          id="article-tag-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            // Defer so clicks on candidate buttons still register.
            setTimeout(() => {
              if (input.trim()) void commit();
            }, 150);
          }}
          disabled={disabled || pending}
          placeholder={
            selected.length > 0 ? "" : candidates.length === 0 ? "输入新标签后回车" : "输入或选择标签..."
          }
          className="min-w-[10ch] flex-1 bg-transparent px-1 py-1 text-sm text-ink outline-none disabled:cursor-not-allowed"
        />
      </div>

      {candidates.length > 0 && input.trim().length === 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {candidates.slice(0, 12).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              disabled={disabled}
              className="rounded-full border border-hair bg-surface px-2 py-0.5 text-xs text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed"
            >
              + {tag.name}
            </button>
          ))}
        </div>
      ) : null}

      {input.trim().length > 0 && !exactMatch && onCreate ? (
        <p className="mt-1 text-xs text-muted">
          按 Enter 创建新标签 <span className="rounded bg-hair px-1.5 py-0.5 font-mono">{input.trim()}</span>
        </p>
      ) : null}

      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

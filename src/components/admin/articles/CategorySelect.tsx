"use client";

// Single-select category dropdown. Reads from the categories table via
// the page (passed in as props) so the client never has to talk to Prisma
// directly.

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface CategorySelectProps {
  value: string;
  onChange: (next: string) => void;
  options: readonly CategoryOption[];
  disabled?: boolean;
  error?: string | null;
}

export function CategorySelect({
  value,
  onChange,
  options,
  disabled,
  error,
}: CategorySelectProps) {
  return (
    <div>
      <label htmlFor="article-category" className="text-sm font-medium text-ink">
        分类
      </label>
      <select
        id="article-category"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? "true" : "false"}
        className="mt-1 block w-full rounded border border-hair bg-surface px-3 py-2 text-base text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">未分类</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-muted">
          Phase 7 会在「页面 & 分类」后台提供完整的分类 CRUD；当前只读现有数据。
        </p>
      )}
    </div>
  );
}

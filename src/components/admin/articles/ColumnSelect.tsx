export interface ColumnOption {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface ColumnSelectProps {
  value: string;
  onChange: (next: string) => void;
  options: readonly ColumnOption[];
  disabled?: boolean;
  error?: string | null;
}

export function ColumnSelect({ value, onChange, options, disabled, error }: ColumnSelectProps) {
  const roots = options.filter((option) => option.parentId == null);
  const childrenByParent = new Map<string, ColumnOption[]>();
  for (const option of options) {
    if (!option.parentId) continue;
    const siblings = childrenByParent.get(option.parentId) ?? [];
    siblings.push(option);
    childrenByParent.set(option.parentId, siblings);
  }

  return (
    <div>
      <label htmlFor="article-column" className="text-sm font-medium text-ink">
        专栏
      </label>
      <select
        id="article-column"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? "true" : "false"}
        className="mt-1 block w-full rounded border border-hair bg-surface px-3 py-2 text-base text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">无专栏</option>
        {roots.map((root) => {
          const children = childrenByParent.get(root.id) ?? [];
          return children.length > 0 ? (
            <optgroup key={root.id} label={root.name}>
              <option value={root.id}>{root.name}（一级专栏）</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={root.id} value={root.id}>
              {root.name}
            </option>
          );
        })}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-muted">可选择一级专栏、二级专栏，或保持无专栏。</p>
      )}
    </div>
  );
}

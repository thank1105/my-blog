"use client";

// Status (DRAFT / PUBLISHED / ARCHIVED) selector. Mirrors VisibilitySelect's
// pattern: radio-button cards so the user sees the consequence next to
// the choice instead of in a separate tooltip.

export type StatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface Option {
  value: StatusValue;
  label: string;
  hint: string;
}

const OPTIONS: readonly Option[] = [
  { value: "DRAFT", label: "草稿", hint: "前台不可见" },
  { value: "PUBLISHED", label: "已发布", hint: "前台可见（受可见性限制）" },
  { value: "ARCHIVED", label: "已归档", hint: "前台隐藏但保留数据" },
];

export interface StatusSelectProps {
  value: StatusValue;
  onChange: (next: StatusValue) => void;
  disabled?: boolean;
}

export function StatusSelect({ value, onChange, disabled }: StatusSelectProps) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">发布状态</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex cursor-pointer flex-col rounded border bg-surface px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-hair text-ink hover:border-accent"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name="status"
                value={opt.value}
                checked={active}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span className="font-medium">{opt.label}</span>
              <span className="text-xs text-muted">{opt.hint}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

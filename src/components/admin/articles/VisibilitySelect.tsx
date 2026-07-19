"use client";

// Visibility (PUBLIC / PRIVATE / PASSWORD) + optional password input.

import { Eye, EyeOff, Lock, Globe } from "lucide-react";

import { cn } from "@/lib/utils";

export type VisibilityValue = "PUBLIC" | "PRIVATE" | "PASSWORD";

interface Option {
  value: VisibilityValue;
  label: string;
  hint: string;
  icon: React.ComponentType<{ "aria-hidden"?: boolean; className?: string }>;
}

const OPTIONS: readonly Option[] = [
  {
    value: "PUBLIC",
    label: "公开",
    hint: "任何人可读",
    icon: Globe,
  },
  {
    value: "PRIVATE",
    label: "私密",
    hint: "登录后可读",
    icon: Lock,
  },
  {
    value: "PASSWORD",
    label: "密码",
    hint: "凭密码可读",
    icon: EyeOff,
  },
];

export interface VisibilitySelectProps {
  value: VisibilityValue;
  onChange: (next: VisibilityValue) => void;
  password: string;
  onPasswordChange: (next: string) => void;
  passwordError?: string | null;
  disabled?: boolean;
}

export function VisibilitySelect({
  value,
  onChange,
  password,
  onPasswordChange,
  passwordError,
  disabled,
}: VisibilitySelectProps) {
  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="text-sm font-medium text-ink">可见性</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = value === opt.value;
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded border bg-surface px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-hair text-ink hover:border-accent",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={active}
                  disabled={disabled}
                  onChange={() => onChange(opt.value)}
                  className="sr-only"
                />
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span className="flex flex-col">
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-muted">{opt.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {value === "PASSWORD" ? (
        <div>
          <label htmlFor="article-password" className="text-sm font-medium text-ink">
            阅读密码
          </label>
          <input
            id="article-password"
            type="text"
            inputMode="text"
            autoComplete="off"
            value={password}
            disabled={disabled}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="至少 4 位"
            aria-invalid={passwordError ? "true" : "false"}
            className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
          {passwordError ? (
            <p className="mt-1 text-xs text-danger">{passwordError}</p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              <Eye aria-hidden className="mr-1 inline size-3" />
              密码会在数据库里以明文形式保存（Phase 3 不做哈希）；读者在前台输入密码后即可阅读全文。
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

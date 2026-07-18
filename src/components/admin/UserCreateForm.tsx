"use client";

// Phase 1 / Day 2 client component that drives the /admin/users/new form.
// It owns its own submitting state, calls createUserAction via a server
// action, and surfaces validation errors inline next to each field.

import { useState, useTransition } from "react";

import { createUserAction } from "@/app/(admin)/admin/users/actions";

export function UserCreateForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await createUserAction(formData);
      if (res && res.ok === false) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  }

  return (
    <form className="space-y-5" action={onSubmit} noValidate>
      {error ? (
        <p
          role="alert"
          className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      <Field label="邮箱" name="email" type="email" autoComplete="email" error={fieldErrors.email} />
      <Field label="用户名" name="username" error={fieldErrors.username} />
      <Field label="昵称（可选）" name="displayName" error={fieldErrors.displayName} />
      <Field label="初始密码" name="password" type="password" autoComplete="new-password" error={fieldErrors.password} hint="至少 8 位" />

      <div className="space-y-1.5">
        <label htmlFor="role" className="text-sm font-medium text-ink">角色</label>
        <select
          id="role"
          name="role"
          defaultValue="USER"
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          <option value="USER">USER（普通朋友）</option>
          <option value="ADMIN">ADMIN（站点所有者）</option>
        </select>
        {fieldErrors.role ? <p className="text-xs text-danger">{fieldErrors.role}</p> : null}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "正在创建…" : "创建账号"}
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
  error?: string;
}

function Field({ label, name, type = "text", autoComplete, hint, error }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? "true" : "false"}
        className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

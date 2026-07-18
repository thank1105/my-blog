"use client";

// /admin/users/new -- client component driven by react-hook-form.
//
// Why react-hook-form here? Two product-quality reasons:
//  * uncontrolled-by-default via the native form / input flow, but the state
//    is owned by RHF, so React 19s automatic form reset on action completion
//    (the Day-2 bug: "admin" less-than 8 chars wipes the whole form) no longer
//    throws away the users typed inputs.
//  * `mode: "onTouched"` runs Zod on first blur, so the password rule
//    "at least 8 chars" appears BEFORE submit; we also keep a permanent hint
//    under the password field so the rule is visible from the moment the page
//    loads.
//
// Server fallback: server actions still run their own Zod check, and any
// fieldError they return is mapped back through `setError(...)` so the same
// field shows its server reason without clearing the form.

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createUserAction } from "@/app/(admin)/admin/users/actions";
import { createUserSchema } from "@/server/users";

type FormValues = z.infer<typeof createUserSchema>;

export function UserCreateForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(createUserSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      username: "",
      displayName: "",
      password: "",
      role: "USER",
    },
  });

  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  function onValid(values: FormValues) {
    setServerError(null);
    const fd = new FormData();
    for (const [k, v] of Object.entries(values)) {
      if (v === undefined || v === null) continue;
      fd.append(k, typeof v === "string" ? v : String(v));
    }

    startTransition(async () => {
      const res = await createUserAction(fd);
      if (!res || res.ok) return;
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          setError(key as keyof FormValues, { type: "server", message });
        }
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onValid)} noValidate>
      {serverError ? (
        <p
          role="alert"
          className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {serverError}
        </p>
      ) : null}

      <Field label={"邮箱"} htmlFor="email" error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? "true" : "false"}
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          {...register("email")}
        />
      </Field>

      <Field label={"用户名"} htmlFor="username" error={errors.username?.message}>
        <input
          id="username"
          type="text"
          aria-invalid={errors.username ? "true" : "false"}
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          {...register("username")}
        />
      </Field>

      <Field label={"昵称（可选）"} htmlFor="displayName" error={errors.displayName?.message}>
        <input
          id="displayName"
          type="text"
          aria-invalid={errors.displayName ? "true" : "false"}
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          {...register("displayName")}
        />
      </Field>

      <Field
        label={"初始密码"}
        htmlFor="password"
        error={errors.password?.message}
        hint={"至少 8 位"}
      >
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.password ? "true" : "false"}
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          {...register("password")}
        />
      </Field>

      <Field label={"角色"} htmlFor="role" error={errors.role?.message}>
        <select
          id="role"
          aria-invalid={errors.role ? "true" : "false"}
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          {...register("role")}
        >
          <option value="USER">USER（普通朋友）</option>
          <option value="ADMIN">ADMIN（站点所有者）</option>
        </select>
      </Field>

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
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

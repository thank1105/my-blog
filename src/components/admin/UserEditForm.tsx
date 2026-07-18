"use client";

// /admin/users/[id]/edit -- two independent sub-forms (profile + reset
// password), each driven by its own react-hook-form instance. Each field
// shows a hint under it by default and switches to a danger error message
// once validation actually fails on that field. Server-side errors are
// mapped back through `setError(...)` so a failing update does not wipe
// the typed values.

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { resetPasswordAction, updateUserAction } from "@/app/(admin)/admin/users/actions";
import { resetPasswordSchema, updateUserSchema } from "@/server/users";

type ProfileValues = z.infer<typeof updateUserSchema>;
type ResetValues = z.infer<typeof resetPasswordSchema>;

interface UserEditFormProps {
  id: string;
  initial: {
    displayName: string | null;
    role: "ADMIN" | "USER";
    isActive: boolean;
  };
}

export function UserEditForm({ id, initial }: UserEditFormProps) {
  return (
    <div className="space-y-8">
      <ProfileCard id={id} initial={initial} />
      <PasswordCard id={id} />
    </div>
  );
}

function ProfileCard({ id, initial }: UserEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset: resetForm,
    setError,
  } = useForm<ProfileValues>({
    resolver: zodResolver(updateUserSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: initial.displayName ?? "",
      role: initial.role,
      isActive: initial.isActive,
    },
  });

  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function onValid(values: ProfileValues) {
    setServerError(null);
    setSavedAt(null);
    const fd = new FormData();
    fd.set("displayName", values.displayName ?? "");
    fd.set("role", values.role);
    fd.set("isActive", values.isActive ? "on" : "");
    startTransition(async () => {
      const res = await updateUserAction(id, fd);
      if (!res || res.ok) {
        setSavedAt(new Date());
        resetForm({
          displayName: values.displayName ?? "",
          role: values.role,
          isActive: values.isActive,
        });
        return;
      }
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          setError(key as keyof ProfileValues, { type: "server", message });
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-5" noValidate>
      {serverError ? (
        <p
          role="alert"
          className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {serverError}
        </p>
      ) : null}
      {savedAt ? (
        <p
          role="status"
          className="rounded border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {"已保存"} {savedAt.toLocaleTimeString("zh-CN")}
        </p>
      ) : null}

      <Field
        label={"昵称"}
        htmlFor="displayName"
        error={errors.displayName?.message}
        hint={"最多 60 个字符，可留空"}
      >
        <input
          id="displayName"
          type="text"
          aria-invalid={errors.displayName ? "true" : "false"}
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          {...register("displayName")}
        />
      </Field>

      <Field label={"角色"} htmlFor="role" error={errors.role?.message}>
        <select
          id="role"
          aria-invalid={errors.role ? "true" : "false"}
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          {...register("role")}
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </Field>

      <div className="space-y-1.5">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            aria-invalid={errors.isActive ? "true" : "false"}
            className="size-4 rounded border-hair accent-accent"
            {...register("isActive")}
          />
          <span>{"启用账号"}</span>
          <span className="text-xs text-muted">{"(取消勾选即禁用，该账号将无法登录)"}</span>
        </label>
        {errors.isActive?.message ? (
          <p className="text-xs text-danger">{errors.isActive.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !isDirty}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "保存中…" : "保存修改"}
        </button>
      </div>
    </form>
  );
}

function PasswordCard({ id }: { id: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
    setError,
  } = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { newPassword: "" },
  });

  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [resetAt, setResetAt] = useState<Date | null>(null);

  function onValid(values: ResetValues) {
    setServerError(null);
    setResetAt(null);
    const fd = new FormData();
    fd.set("newPassword", values.newPassword);
    startTransition(async () => {
      const res = await resetPasswordAction(id, fd);
      if (!res || res.ok) {
        setResetAt(new Date());
        resetForm({ newPassword: "" });
        return;
      }
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          setError(key as keyof ResetValues, { type: "server", message });
        }
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onValid)}
      className="space-y-3 rounded-md border border-hair bg-bg/40 p-6"
      noValidate
    >
      <h2 className="font-serif text-lg font-bold text-ink">{"重置密码"}</h2>
      {serverError ? (
        <p
          role="alert"
          className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {serverError}
        </p>
      ) : null}
      {resetAt ? (
        <p
          role="status"
          className="rounded border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {"密码已更新"} {resetAt.toLocaleTimeString("zh-CN")}
        </p>
      ) : null}

      <Field
        label={"新密码"}
        htmlFor="newPassword"
        error={errors.newPassword?.message}
        hint={"至少 8 位，修改后该用户需使用新密码登录"}
      >
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.newPassword ? "true" : "false"}
          className="block w-full rounded border border-hair bg-surface px-3 py-2 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          {...register("newPassword")}
        />
      </Field>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded border border-hair px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "更新中…" : "更新密码"}
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

"use client";

// /admin/users/[id]/edit -- multi-action form: update profile + reset password.
// Two server actions share this client component; each is owned by its own
// card to make submit scope unambiguous.

import { useState, useTransition } from "react";

import { resetPasswordAction, updateUserAction } from "@/app/(admin)/admin/users/actions";

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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    setSavedAt(null);
    startTransition(async () => {
      const res = await updateUserAction(id, formData);
      if (res && res.ok === false) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      } else {
        setSavedAt(new Date());
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-5" noValidate>
      {error ? (
        <p role="alert" className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {savedAt ? (
        <p role="status" className="rounded border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          已保存 {savedAt.toLocaleTimeString("zh-CN")}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="displayName" className="text-sm font-medium text-ink">
          昵称
        </label>
        <input
          id="displayName"
          name="displayName"
          defaultValue={initial.displayName ?? ""}
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {fieldErrors.displayName ? <p className="text-xs text-danger">{fieldErrors.displayName}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="role" className="text-sm font-medium text-ink">
          角色
        </label>
        <select
          id="role"
          name="role"
          defaultValue={initial.role}
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        {fieldErrors.role ? <p className="text-xs text-danger">{fieldErrors.role}</p> : null}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial.isActive}
          className="size-4 rounded border-hair accent-accent"
        />
        <span>启用账号</span>
        <span className="text-xs text-muted">(取消勾选即禁用，禁止该账号登录)</span>
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "保存中…" : "保存修改"}
        </button>
      </div>
    </form>
  );
}

function PasswordCard({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resetAt, setResetAt] = useState<Date | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    setResetAt(null);
    startTransition(async () => {
      const res = await resetPasswordAction(id, formData);
      if (res && res.ok === false) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      } else {
        setResetAt(new Date());
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-3 rounded-md border border-hair bg-bg/40 p-6" noValidate>
      <h2 className="font-serif text-lg font-bold text-ink">重置密码</h2>
      <p className="text-xs text-muted">至少 8 位，修改后该用户需要使用新密码登录。</p>
      {error ? (
        <p role="alert" className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {resetAt ? (
        <p role="status" className="rounded border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          密码已更新 {resetAt.toLocaleTimeString("zh-CN")}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <label htmlFor="newPassword" className="text-sm font-medium text-ink">
          新密码
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          className="block w-full rounded border border-hair bg-surface px-3 py-2 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {fieldErrors.newPassword ? <p className="text-xs text-danger">{fieldErrors.newPassword}</p> : null}
      </div>
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

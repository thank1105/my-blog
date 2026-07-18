// Client-side login form (Phase 1 Day 1).
//
// react-hook-form owns input state; Zod owns validation; NextAuth's signIn()
// (from next-auth/react) handles the network call and any redirect. We keep
// the component dumb on purpose -- it does not track server-side failures,
// because the server already renders ?error= when NextAuth signals failure and
// LoginPageError formats that in the page chrome.

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
  remember: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  callbackUrl: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [pending, startTransition] = useTransition();
  const [topError, setTopError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  function onSubmit(values: LoginValues) {
    setTopError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        ...values,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setTopError("邮箱或密码错误，请稍后再试。");
        return;
      }
      if (res?.ok && res.url) {
        window.location.href = res.url;
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      {topError ? (
        <p
          role="alert"
          className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {topError}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={errors.email ? "true" : "false"}
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          {...register("email")}
        />
        {errors.email ? <p className="text-xs text-danger">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          密码
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={errors.password ? "true" : "false"}
          className="block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          {...register("password")}
        />
        {errors.password ? <p className="text-xs text-danger">{errors.password.message}</p> : null}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          className="size-4 rounded border-hair accent-accent"
          {...register("remember")}
        />
        <span>记住我</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "正在登入…" : "登入"}
      </button>
    </form>
  );
}

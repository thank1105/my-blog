"use client";

// PageEditor (Phase 7 / Day 2) -- About / Now unified editor.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, ChevronLeft, History, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

import {
  upsertPageAction,
  restoreRevisionAction,
} from "./actions";

const pageFormSchema = z.object({
  content: z.string().trim().min(1, "内容不能为空"),
  meta: z.string().trim().max(2000, "meta 不超过 2000 字").optional().or(z.literal("")),
  saveRevision: z.boolean().default(true),
});

export type PageFormValues = z.infer<typeof pageFormSchema>;

export interface PageEditorProps {
  type: "ABOUT" | "NOW";
  initialContent: string;
  initialMeta: string;
  updatedAt: string;
  revisions: {
    id: string;
    createdAt: string;
    excerpt: string;
  }[];
}

export function PageEditor({
  type,
  initialContent,
  initialMeta,
  updatedAt,
  revisions,
}: PageEditorProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isAbout = type === "ABOUT";
  const backHref = isAbout ? "/admin/pages" : "/admin/pages";
  const previewHref = isAbout ? "/about" : "/now";

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { isSubmitting },
  } = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      content: initialContent,
      meta: initialMeta,
      saveRevision: true,
    },
  });
  const content = watch("content");

  const onValid = handleSubmit(async (values) => {
    setServerError(null);
    const result = await upsertPageAction({ type, ...values });
    if (!result.ok) {
      setServerError(result.error);
      if (result.fieldErrors) {
        for (const [k, msg] of Object.entries(result.fieldErrors)) {
          setError(k as keyof PageFormValues, { message: msg });
        }
      }
      return;
    }
    if (result.redirectTo) router.push(result.redirectTo);
  });

  const handleRestore = useCallback(
    async (revisionId: string) => {
      if (!window.confirm("确定要恢复到这个历史版本吗？当前内容会自动保存为新版本。")) return;
      const result = await restoreRevisionAction(type, revisionId);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      if (result.redirectTo) router.push(result.redirectTo);
    },
    [router, type],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-xs text-muted underline-offset-4 hover:text-accent hover:underline"
          >
            <ChevronLeft aria-hidden className="size-3.5" />
            返回页面管理
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-bold text-ink">
            {isAbout ? "关于我" : "Now"} 页面编辑器
          </h1>
          <p className="mt-1 text-sm text-muted">
            最后更新：{updatedAt}
            {!isAbout
              ? " · Now 页面每次保存都会留一份历史版本，可在右侧恢复。"
              : " · 关于我页使用 Markdown / 自由文本（前台渲染层按 markdown 解析）。"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={previewHref}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded border border-hair bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
          >
            预览前台 →
          </Link>
        </div>
      </header>

      <form onSubmit={onValid} className="space-y-4">
        <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
          <label htmlFor="page-content" className="block text-sm font-medium text-ink">
            内容
          </label>
          <textarea
            id="page-content"
            rows={18}
            {...register("content")}
            placeholder={
              isAbout
                ? "在这里写自我介绍、社交链接、技能、时间线…"
                : "我在做什么、关注什么、想找什么…\n\n保持更新，每次保存都会留一份历史。"
            }
            className="mt-2 block w-full resize-y rounded border border-hair bg-bg px-3 py-2 font-mono text-sm text-ink outline-none focus-visible:border-accent"
          />
          <p className="mt-2 text-[11px] text-muted">当前 {content?.length ?? 0} 字</p>
        </div>

        <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
          <label htmlFor="page-meta" className="block text-sm font-medium text-ink">
            元数据（JSON / 自由文本）
          </label>
          <textarea
            id="page-meta"
            rows={4}
            {...register("meta")}
            placeholder='例如 {"avatar": "/uploads/me.jpg", "social": [...]}'
            className="mt-2 block w-full resize-y rounded border border-hair bg-bg px-3 py-2 font-mono text-xs text-ink outline-none focus-visible:border-accent"
          />
          <p className="mt-2 text-[11px] text-muted">
            留空则使用默认。结构由前台渲染器决定（Phase 7 / Day 2 默认渲染纯文本）。
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            {...register("saveRevision")}
            className="size-3.5 rounded border-hair accent-accent"
          />
          保存前先把当前内容存为历史版本
        </label>

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 rounded-md border border-hair bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
          <Link href={backHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
            取消
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save aria-hidden className="size-4" />
            {isSubmitting ? "保存中…" : "保存"}
          </button>
        </div>

        {serverError ? (
          <div className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {serverError}
          </div>
        ) : null}
      </form>

      <section className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-ink">
          <History aria-hidden className="size-4" />
          历史版本
        </h2>
        {revisions.length === 0 ? (
          <p className="mt-2 text-sm text-muted">暂无历史版本；下次保存时勾选「保存历史」即可留下快照。</p>
        ) : (
          <ul className="mt-3 divide-y divide-hair">
            {revisions.map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{r.createdAt}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{r.excerpt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(r.id)}
                  className="inline-flex items-center gap-1 rounded border border-hair bg-bg px-2 py-1 text-xs text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  <RotateCcw aria-hidden className="size-3" />
                  恢复
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
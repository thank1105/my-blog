"use client";

// TagForm (Phase 7 / Day 1) -- Chinese version.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Trash2, Tag as TagIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

import {
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from "./actions";

export const tagFormSchema = z.object({
  name: z.string().trim().min(1, "标签名称不能为空").max(60, "名称不超过 60 字"),
  slug: z
    .string()
    .trim()
    .max(80, "slug 不超过 80 字")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 仅支持小写字母、数字、连字符")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(500, "描述不超过 500 字").optional().or(z.literal("")),
  color: z
    .string()
    .trim()
    .max(20)
    .regex(/^#?[0-9a-fA-F]{0,8}$/, "颜色需为 hex 格式")
    .optional()
    .or(z.literal("")),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;

export interface TagFormProps {
  mode: "create" | "edit";
  tagId?: string;
  initial: TagFormValues;
}

export function TagForm(props: TagFormProps) {
  const { mode, tagId, initial } = props;
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: initial,
  });

  const onValid = handleSubmit(async (values) => {
    setServerError(null);
    const result = tagId
      ? await updateTagAction(tagId, values)
      : await createTagAction(values);
    if (!result.ok) {
      setServerError(result.error);
      if (result.fieldErrors) {
        for (const [k, msg] of Object.entries(result.fieldErrors)) {
          setError(k as keyof TagFormValues, { message: msg });
        }
      }
      return;
    }
    if (result.redirectTo) router.push(result.redirectTo);
  });

  const handleDelete = useCallback(async () => {
    if (!tagId) return;
    if (!window.confirm("确定要删除这个标签吗？所有 tag 关联会被清掉。")) return;
    const result = await deleteTagAction(tagId);
    if (result.ok && result.redirectTo) router.push(result.redirectTo);
  }, [tagId, router]);

  return (
    <form onSubmit={onValid} className="space-y-6" aria-label={mode === "create" ? "新建标签" : "编辑标签"}>
      <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="tag-name" className="block text-sm font-medium text-ink">
              名称 <span className="text-danger">*</span>
            </label>
            <input
              id="tag-name"
              type="text"
              {...register("name")}
              placeholder="例如：react"
              className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-base text-ink outline-none focus-visible:border-accent"
            />
          </div>
          <div>
            <label htmlFor="tag-slug" className="block text-sm font-medium text-ink">slug</label>
            <input
              id="tag-slug"
              type="text"
              {...register("slug")}
              placeholder="留空则从名称自动生成"
              className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 font-mono text-sm text-ink outline-none focus-visible:border-accent"
            />
          </div>
          <div>
            <label htmlFor="tag-color" className="block text-sm font-medium text-ink">颜色</label>
            <input
              id="tag-color"
              type="text"
              {...register("color")}
              placeholder="#e85a2c 或 e85a2c"
              className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 font-mono text-sm text-ink outline-none focus-visible:border-accent"
            />
            <p className="mt-1 text-xs text-muted">hex 格式，可带或不带 #。</p>
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="tag-desc" className="block text-sm font-medium text-ink">描述</label>
          <textarea
            id="tag-desc"
            rows={3}
            {...register("description")}
            placeholder="一句话解释这个标签的语境。"
            className="mt-1 block w-full resize-y rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
          />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-hair bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
        <Link
          href="/admin/tags"
          className="inline-flex items-center gap-1 text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          <TagIcon aria-hidden className="size-3.5" />
          返回列表
        </Link>
        <div className="flex items-center gap-2">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded border border-hair px-3 py-1.5 text-sm text-ink transition-colors hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 aria-hidden className="size-4" />
              删除
            </button>
          ) : null}
          <Link href="/admin/tags" className={buttonVariants({ variant: "outline", size: "sm" })}>
            取消
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save aria-hidden className="size-4" />
            {isSubmitting ? "保存中…" : mode === "create" ? "创建" : "保存"}
          </button>
        </div>
      </div>

      {serverError ? (
        <div className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {serverError}
        </div>
      ) : null}
    </form>
  );
}
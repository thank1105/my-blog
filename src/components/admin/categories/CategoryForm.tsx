"use client";

// CategoryForm (Phase 7 / Day 1) -- Chinese version.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Trash2, FolderTree } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "./actions";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "分类名称不能为空").max(80, "名称不超过 80 字"),
  slug: z
    .string()
    .trim()
    .max(80, "slug 不超过 80 字")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 仅支持小写字母、数字、连字符")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(500, "描述不超过 500 字").optional().or(z.literal("")),
  type: z.enum(["ARTICLE", "PROJECT"]),
  order: z.number().int().min(0).default(0),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export interface CategoryFormProps {
  mode: "create" | "edit";
  categoryId?: string;
  initial: CategoryFormValues;
}

export function CategoryForm(props: CategoryFormProps) {
  const { mode, categoryId, initial } = props;
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initial,
  });

  const onValid = handleSubmit(async (values) => {
    setServerError(null);
    const result = categoryId
      ? await updateCategoryAction(categoryId, values)
      : await createCategoryAction(values);
    if (!result.ok) {
      setServerError(result.error);
      if (result.fieldErrors) {
        for (const [k, msg] of Object.entries(result.fieldErrors)) {
          setError(k as keyof CategoryFormValues, { message: msg });
        }
      }
      return;
    }
    if (result.redirectTo) router.push(result.redirectTo);
  });

  const handleDelete = useCallback(async () => {
    if (!categoryId) return;
    if (!window.confirm("确定要删除这个分类吗？相关文章 / 作品会失去分类关联。")) return;
    const result = await deleteCategoryAction(categoryId);
    if (result.ok && result.redirectTo) router.push(result.redirectTo);
  }, [categoryId, router]);

  return (
    <form onSubmit={onValid} className="space-y-6" aria-label={mode === "create" ? "新建分类" : "编辑分类"}>
      <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="cat-name" className="block text-sm font-medium text-ink">
              名称 <span className="text-danger">*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              {...register("name")}
              placeholder="例如：随笔"
              className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-base text-ink outline-none focus-visible:border-accent"
            />
          </div>
          <div>
            <label htmlFor="cat-slug" className="block text-sm font-medium text-ink">slug</label>
            <input
              id="cat-slug"
              type="text"
              {...register("slug")}
              placeholder="留空则从名称自动生成"
              className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 font-mono text-sm text-ink outline-none focus-visible:border-accent"
            />
            <p className="mt-1 text-xs text-muted">留空将按名称自动生成。</p>
          </div>
          <div>
            <label htmlFor="cat-type" className="block text-sm font-medium text-ink">类型</label>
            <select
              id="cat-type"
              {...register("type")}
              className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
            >
              <option value="ARTICLE">文章分类</option>
              <option value="PROJECT">作品分类</option>
            </select>
            <p className="mt-1 text-xs text-muted">文章与作品的分类分开管理。</p>
          </div>
          <div>
            <label htmlFor="cat-order" className="block text-sm font-medium text-ink">排序</label>
            <input
              id="cat-order"
              type="number"
              min={0}
              step={1}
              {...register("order", { valueAsNumber: true })}
              className="mt-1 block w-32 rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
            />
            <p className="mt-1 text-xs text-muted">数字越小越靠前；同值时按名称升序。</p>
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="cat-desc" className="block text-sm font-medium text-ink">描述</label>
          <textarea
            id="cat-desc"
            rows={3}
            {...register("description")}
            placeholder="几句话说明这个分类收纳什么内容。"
            className="mt-1 block w-full resize-y rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
          />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-hair bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-1 text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          <FolderTree aria-hidden className="size-3.5" />
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
          <Link href="/admin/categories" className={buttonVariants({ variant: "outline", size: "sm" })}>
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
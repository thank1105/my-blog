"use client";

// /admin/projects/new + /admin/projects/[id]/edit form (Phase 5 / Day 1).
//
// Mirrors ArticleForm / NoteForm -- uses react-hook-form + zod and
// reuses the shared visibility / status / category / tag primitives.
// The only Day-1-specific field is the gallery, which lives behind a
// <Controller> on the `images` array.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

import { VisibilitySelect, type VisibilityValue } from "@/components/admin/articles/VisibilitySelect";
import { StatusSelect, type StatusValue } from "@/components/admin/articles/StatusSelect";
import { CategorySelect, type CategoryOption } from "@/components/admin/articles/CategorySelect";
import { TagSelector, type TagOption } from "@/components/admin/articles/TagSelector";
import { CoverImageUploader } from "@/components/admin/articles/CoverImageUploader";
import { ensureTagByNameAction } from "@/components/admin/articles/actions";

import {
  createProjectAction,
  reorderProjectImagesAction,
  softDeleteProjectAction,
  updateProjectAction,
} from "./actions";
import {
  MultiImageUploader,
  type ProjectImageValue,
} from "./MultiImageUploader";

export const projectFormSchema = z
  .object({
    title: z.string().trim().min(1, "标题不能为空").max(120, "标题不超过 120 字"),
    slug: z
      .string()
      .trim()
      .max(80, "slug 不超过 80 字")
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 仅支持小写字母、数字、连字符")
      .optional()
      .or(z.literal("")),
    description: z.string().trim().min(1, "描述不能为空").max(2000, "描述不超过 2000 字"),
    coverImage: z.string().trim().optional().or(z.literal("")),
    categoryId: z.string().optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE", "PASSWORD"]),
    password: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    tagIds: z.array(z.string()),
    images: z.array(
      z.object({
        id: z.string().optional(),
        imageUrl: z.string().min(1),
        caption: z.string().optional().or(z.literal("")),
        width: z.number().nullable().optional(),
        height: z.number().nullable().optional(),
      }),
    ),
    order: z.number().int().min(0),
    featured: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (val.visibility === "PASSWORD" && (!val.password || val.password.length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "密码作品至少需要 4 位密码",
      });
    }
  });

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export interface ProjectFormProps {
  mode: "create" | "edit";
  projectId?: string;
  initial: ProjectFormValues;
  categories: readonly CategoryOption[];
  tags: readonly TagOption[];
  onSubmit?: (values: ProjectFormValues) => Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: Record<string, string>;
    redirectTo?: string;
  }>;
  onCreateTag?: (name: string) => Promise<TagOption | null>;
  onDelete?: () => Promise<{ ok: boolean; error?: string }>;
}

export function ProjectForm(props: ProjectFormProps) {
  const { mode, projectId, initial, categories, tags } = props;
  const router = useRouter();

  const handleSubmit = useCallback(
    async (values: ProjectFormValues) => {
      if (projectId) return updateProjectAction(projectId, values);
      return createProjectAction(values);
    },
    [projectId],
  );

  const handleDelete = useCallback(async () => {
    if (!projectId) return { ok: false, error: "未指定作品 id" };
    const result = await softDeleteProjectAction(projectId);
    if (result.ok && result.redirectTo) router.push(result.redirectTo);
    return { ok: result.ok, error: result.ok ? undefined : result.error };
  }, [projectId, router]);

  const handleCreateTag: (name: string) => Promise<TagOption | null> = useCallback(
    async (name: string) => {
      const t = await ensureTagByNameAction(name);
      return t ? { id: t.id, name: t.name, slug: t.slug, color: t.color } : null;
    },
    [],
  );

  const handleReorder = useCallback(
    async (imageIds: string[]) => {
      if (!projectId) return;
      await reorderProjectImagesAction(projectId, imageIds);
    },
    [projectId],
  );

  const {
    control,
    handleSubmit: rhfSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: initial,
    mode: "onChange",
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const status = watch("status");
  const visibility = watch("visibility");

  const onFormSubmit: SubmitHandler<ProjectFormValues> = async (values) => {
    setServerError(null);
    const fn = props.onSubmit ?? handleSubmit;
    const result = await fn(values);
    if (!result.ok) {
      setServerError(result.error ?? null);
      if (result.fieldErrors) {
        for (const [path, msg] of Object.entries(result.fieldErrors)) {
          setError(path as keyof ProjectFormValues, { message: msg });
        }
      }
      return;
    }
    if (result.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    }
  };

  const onCreateTag = props.onCreateTag ?? handleCreateTag;
  const onDelete = props.onDelete ?? handleDelete;

  return (
    <form onSubmit={rhfSubmit(onFormSubmit)} className="space-y-6">
      {/* Title + slug + cover */}
      <div className="rounded-md border border-hair bg-surface p-6 shadow-soft space-y-4">
        <div>
          <label htmlFor="project-title" className="text-sm font-medium text-ink">标题</label>
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <>
                <input
                  id="project-title"
                  {...field}
                  placeholder="为这个作品起一个名字"
                  aria-invalid={fieldState.error ? "true" : "false"}
                  className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
                />
                {fieldState.error ? (
                  <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
                ) : null}
              </>
            )}
          />
        </div>
        <div>
          <label htmlFor="project-slug" className="text-sm font-medium text-ink">slug（URL 段）</label>
          <Controller
            control={control}
            name="slug"
            render={({ field, fieldState }) => (
              <>
                <input
                  id="project-slug"
                  {...field}
                  placeholder="留空则按标题自动生成"
                  aria-invalid={fieldState.error ? "true" : "false"}
                  className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-2 font-mono text-sm text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
                />
                {fieldState.error ? (
                  <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted">仅支持小写字母、数字、连字符；用于 <code>/projects/&lt;slug&gt;</code></p>
                )}
              </>
            )}
          />
        </div>
        <Controller
          control={control}
          name="coverImage"
          render={({ field, fieldState }) => (
            <CoverImageUploader
              value={field.value ?? ""}
              onChange={(v) => field.onChange(v)}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      {/* Description */}
      <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <label htmlFor="project-description" className="text-sm font-medium text-ink">
          描述
        </label>
        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <>
              <textarea
                id="project-description"
                {...field}
                rows={3}
                placeholder="用一两段话介绍这个作品（背景、过程、链接等）"
                aria-invalid={fieldState.error ? "true" : "false"}
                className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-2 text-sm text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 resize-y"
              />
              {fieldState.error ? (
                <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
              ) : (
                <p className="mt-1 text-xs text-muted">
                  支持纯文本。Day 2 会接入与文章一致的 Markdown 渲染。
                </p>
              )}
            </>
          )}
        />
      </div>

      {/* Gallery */}
      <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <Controller
          control={control}
          name="images"
          render={({ field, fieldState }) => (
            <MultiImageUploader
              value={(field.value ?? []) as ProjectImageValue[]}
              onChange={(next) => field.onChange(next)}
              onReorder={mode === "edit" ? handleReorder : undefined}
              error={fieldState.error?.message as string | null}
            />
          )}
        />
      </div>

      {/* Category + tags + order + featured */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border border-hair bg-surface p-6 shadow-soft space-y-4">
          <Controller
            control={control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <CategorySelect
                value={field.value ?? ""}
                onChange={(v) => field.onChange(v)}
                options={categories}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="order"
            render={({ field, fieldState }) => (
              <div>
                <label htmlFor="project-order" className="text-sm font-medium text-ink">
                  排序
                </label>
                <input
                  id="project-order"
                  type="number"
                  min={0}
                  step={1}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  className="mt-1 block w-32 rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                />
                <p className="mt-1 text-xs text-muted">
                  数字越小越靠前；同值时按更新时间倒序。
                </p>
                {fieldState.error ? (
                  <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
                ) : null}
              </div>
            )}
          />
          <Controller
            control={control}
            name="featured"
            render={({ field }) => (
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="size-4 rounded border-hair accent-accent"
                />
                设为精选作品（在列表页置顶）
              </label>
            )}
          />
        </div>
        <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
          <Controller
            control={control}
            name="tagIds"
            render={({ field, fieldState }) => (
              <TagSelector
                selected={field.value ?? []}
                onChange={(v) => field.onChange(v)}
                available={tags}
                onCreate={onCreateTag}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Visibility + status */}
      <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <div className="grid gap-6 md:grid-cols-2">
          <Controller
            control={control}
            name="visibility"
            render={({ field }) => (
              <VisibilitySelect
                value={field.value}
                onChange={(v: VisibilityValue) => field.onChange(v)}
                password={watch("password") ?? ""}
                onPasswordChange={(v) => setValue("password", v, { shouldDirty: true })}
                passwordError={errors.password?.message ?? null}
              />
            )}
          />
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <StatusSelect
                value={field.value}
                onChange={(v: StatusValue) => field.onChange(v)}
              />
            )}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-hair bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
        <span className="text-xs text-muted">
          {visibility === "PUBLIC"
            ? status === "PUBLISHED"
              ? "前台可见"
              : "前台不可见（草稿 / 归档）"
            : visibility === "PRIVATE"
              ? "登录后可读"
              : "凭密码可读"}
        </span>
        <div className="flex items-center gap-2">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={async () => { await onDelete(); }}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded border border-hair px-3 py-1.5 text-sm text-ink transition-colors hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 aria-hidden className="size-4" />
              移入回收站
            </button>
          ) : null}
          <Link href="/admin/projects" className={buttonVariants({ variant: "outline", size: "sm" })}>
            取消
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save aria-hidden className="size-4" />
            {isSubmitting ? "保存中…" : mode === "create" ? "发布" : "保存"}
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
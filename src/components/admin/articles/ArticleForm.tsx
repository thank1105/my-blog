"use client";

// /admin/articles/new + /admin/articles/[id]/edit form (Phase 3 / Day 1).
//
// Top-level form composed of:
//   - title + slug (slug auto-derived from title via debounced effect)
//   - excerpt + cover image
//   - Markdown editor (split / write / preview tabs)
//   - category select + tag selector
//   - visibility (PUBLIC / PRIVATE / PASSWORD) + status (DRAFT / PUBLISHED / ARCHIVED)
//   - submit + autosave indicator
//
// Server actions are imported directly from "./actions" so we do not need
// to thread callback props through the server-component page boundary
// (Next.js 15 rejects inline functions crossing that boundary).
// Tests / alternative flows can still override the four actions via the
// `onSubmit` / `onAutosave` / `onCreateTag` / `onDelete` props.
//
// Autosave: a 30s interval writes the current title / content / excerpt
// back to the server when the form is dirty. The form also mirrors a
// localStorage snapshot keyed by `id` so the user does not lose the
// in-progress draft if they close the tab before the next autosave tick.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Trash2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { coverImageSchema } from "@/lib/media";

import {
  autosaveArticleAction,
  createArticleAction,
  ensureTagByNameAction,
  softDeleteArticleAction,
  updateArticleAction,
} from "./actions";
import { MarkdownEditor } from "./MarkdownEditor";
import { VisibilitySelect, type VisibilityValue } from "./VisibilitySelect";
import { StatusSelect, type StatusValue } from "./StatusSelect";
import { CategorySelect, type CategoryOption } from "./CategorySelect";
import { TagSelector, type TagOption } from "./TagSelector";
import { CoverImageUploader } from "./CoverImageUploader";

export const articleFormSchema = z
  .object({
    title: z.string().trim().min(1, "标题不能为空").max(120, "标题不超过 120 字"),
    slug: z
      .string()
      .trim()
      .max(80, "slug 不超过 80 字")
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 仅支持小写字母、数字、连字符")
      .optional()
      .or(z.literal("")),
    excerpt: z.string().trim().max(280, "摘要不超过 280 字").optional().or(z.literal("")),
    content: z.string().min(1, "正文不能为空"),
    coverImage: coverImageSchema,
    categoryId: z.string().optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE", "PASSWORD"]),
    password: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    tagIds: z.array(z.string()),
  })
  .superRefine((val, ctx) => {
    if (val.visibility === "PASSWORD" && (!val.password || val.password.length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "密码文章至少需要 4 位密码",
      });
    }
  });

export type ArticleFormValues = z.infer<typeof articleFormSchema>;

export interface ArticleFormProps {
  mode: "create" | "edit";
  /** Existing article id when mode === "edit"; required for autosave to work. */
  articleId?: string;
  initial: ArticleFormValues;
  categories: readonly CategoryOption[];
  tags: readonly TagOption[];
  /**
   * Optional override hooks. The form defaults to calling its built-in
   * server actions; pass overrides only for tests / alternative flows.
   */
  onSubmit?: (values: ArticleFormValues) => Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: Record<string, string>;
    redirectTo?: string;
  }>;
  onAutosave?: (patch: {
    title: string;
    content: string;
    excerpt: string | null;
  }) => Promise<{ ok: boolean }>;
  onCreateTag?: (name: string) => Promise<TagOption | null>;
  /** Optional: soft-delete handler (edit mode only). */
  onDelete?: () => Promise<{ ok: boolean; error?: string }>;
}

const AUTOSAVE_INTERVAL_MS = 30_000;

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; message: string };

export function ArticleForm(props: ArticleFormProps) {
  const { mode, articleId, initial, categories, tags } = props;
  const router = useRouter();

  // Default bindings pull from the imported server actions. mode +
  // articleId determine whether we route through create or update.
  const handleSubmit = useCallback(
    async (values: ArticleFormValues) => {
      if (articleId) return updateArticleAction(articleId, values);
      return createArticleAction(values);
    },
    [articleId],
  );
  const handleAutosave = useCallback(
    async (patch: { title: string; content: string; excerpt: string | null }) => {
      if (!articleId) return { ok: false };
      return autosaveArticleAction(articleId, patch);
    },
    [articleId],
  );
  const handleCreateTag = useCallback(
    async (name: string) => ensureTagByNameAction(name),
    [],
  );

  const onSubmit = props.onSubmit ?? handleSubmit;
  const onAutosave = props.onAutosave ?? handleAutosave;
  const onCreateTag = props.onCreateTag ?? handleCreateTag;
  const handleDeleteDefault = useCallback(async () => {
    if (!articleId) return { ok: false, error: "缺少文章 id" };
    return softDeleteArticleAction(articleId);
  }, [articleId]);
  const onDelete = props.onDelete ?? handleDeleteDefault;

  const defaultValues: ArticleFormValues = useMemo(
    () => ({
      title: initial.title ?? "",
      slug: initial.slug ?? "",
      excerpt: initial.excerpt ?? "",
      content: initial.content ?? "",
      coverImage: initial.coverImage ?? "",
      categoryId: initial.categoryId ?? "",
      visibility: initial.visibility ?? "PUBLIC",
      password: initial.password ?? "",
      status: initial.status ?? "DRAFT",
      tagIds: initial.tagIds ?? [],
    }),
    [initial],
  );

  const {
    register,
    handleSubmit: rhfSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const title = watch("title");
  const slugValue = watch("slug");
  const content = watch("content");
  const excerpt = watch("excerpt");
  const visibility = watch("visibility");
  const status = watch("status");

  // -------- slug auto-derive (only when user has not overridden it) -----
  const slugDirtyRef = useRef(false);
  useEffect(() => {
    if (slugDirtyRef.current) return;
    if (!title) {
      if (slugValue) setValue("slug", "", { shouldDirty: false });
      return;
    }
    const handle = setTimeout(async () => {
      const mod = await import("@/lib/slug");
      const next = mod.slugify(title);
      if (!slugDirtyRef.current && next !== slugValue) {
        setValue("slug", next, { shouldDirty: false });
      }
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // -------- autosave -----------------------------------------------
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    if (!onAutosave || !articleId || mode !== "edit") return;
    const handle = setInterval(async () => {
      if (!dirtyRef.current) return;
      setSaveState({ kind: "saving" });
      const res = await onAutosave({
        title,
        content,
        excerpt: excerpt || null,
      });
      if (res.ok) {
        setSaveState({ kind: "saved", at: Date.now() });
      } else {
        setSaveState({ kind: "error", message: "自动保存失败" });
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(handle);
  }, [onAutosave, articleId, mode, title, content, excerpt]);

  // -------- localStorage snapshot (resilient to crashes) ---------
  useEffect(() => {
    if (!articleId) return;
    const key = `article-draft:${articleId}`;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ArticleFormValues> & { at: number };
      const ageMs = Date.now() - parsed.at;
      if (ageMs < 24 * 60 * 60 * 1000) {
        const ok = window.confirm(
          `检测到 ${Math.round(ageMs / 60_000)} 分钟前保存的本地草稿。\n\n是否用本地草稿覆盖当前内容？\n（取消则保留当前内容，丢弃本地草稿。）`,
        );
        if (ok) {
          setValue("title", parsed.title ?? title, { shouldDirty: true });
          setValue("content", parsed.content ?? content, { shouldDirty: true });
          setValue("excerpt", parsed.excerpt ?? excerpt, { shouldDirty: true });
        } else {
          window.localStorage.removeItem(key);
        }
      }
    } catch {
      /* ignore corrupt entries */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  useEffect(() => {
    if (!articleId) return;
    const key = `article-draft:${articleId}`;
    const t = setInterval(() => {
      try {
        window.localStorage.setItem(
          key,
          JSON.stringify({ title, content, excerpt, at: Date.now() }),
        );
      } catch {
        /* quota exceeded etc. -- silent */
      }
    }, 5_000);
    return () => clearInterval(t);
  }, [articleId, title, content, excerpt]);

  // -------- submit -------------------------------------------------
  const [serverError, setServerError] = useState<string | null>(null);
  const onValid: SubmitHandler<ArticleFormValues> = async (values) => {
    setServerError(null);
    const res = await onSubmit(values);
    if (!res.ok) {
      setServerError(res.error ?? "保存失败");
      for (const [field, message] of Object.entries(res.fieldErrors ?? {})) {
        if (field !== "form") {
          setError(field as keyof ArticleFormValues, {
            type: "server",
            message,
          });
        }
      }
      return;
    }
    if (res.redirectTo) {
      router.push(res.redirectTo);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("确认移入回收站？前台将不再可见，可在「已归档」筛选里找回。")) return;
    const res = await onDelete();
    if (res.ok) router.push("/admin/articles");
    else alert(res.error ?? "删除失败");
  };

  return (
    <form onSubmit={rhfSubmit(onValid)} className="space-y-6">
      {/* Title + slug */}
      <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
        <div className="grid gap-4">
          <div>
            <label htmlFor="article-title" className="text-sm font-medium text-ink">
              标题 <span className="text-danger">*</span>
            </label>
            <input
              id="article-title"
              type="text"
              autoComplete="off"
              {...register("title")}
              aria-invalid={errors.title ? "true" : "false"}
              placeholder="给文章起一个名字"
              className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-2 text-lg text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
            />
            {errors.title ? <p className="mt-1 text-xs text-danger">{errors.title.message}</p> : null}
          </div>

          <div>
            <label htmlFor="article-slug" className="text-sm font-medium text-ink">
              slug
              <span className="ml-2 text-xs font-normal text-muted">
                自动从标题生成（基于拼音）；手动修改后会停止自动覆盖
              </span>
            </label>
            <input
              id="article-slug"
              type="text"
              autoComplete="off"
              spellCheck={false}
              {...register("slug", {
                onChange: () => {
                  slugDirtyRef.current = true;
                },
              })}
              aria-invalid={errors.slug ? "true" : "false"}
              placeholder="例如：guan-yu-san-bu"
              className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-2 font-mono text-sm text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
            />
            {errors.slug ? (
              <p className="mt-1 text-xs text-danger">{errors.slug.message}</p>
            ) : (
              <p className="mt-1 text-xs text-muted">
                最终 URL：<code className="font-mono">/articles/{slugValue || "<auto>"}</code>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="article-excerpt" className="text-sm font-medium text-ink">
              摘要 <span className="text-xs font-normal text-muted">（≤ 280 字，可留空）</span>
            </label>
            <textarea
              id="article-excerpt"
              rows={2}
              {...register("excerpt")}
              placeholder="一句话讲清这篇文章在写什么；空则由正文自动截取"
              aria-invalid={errors.excerpt ? "true" : "false"}
              className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-2 text-base text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
            />
            {errors.excerpt ? (
              <p className="mt-1 text-xs text-danger">{errors.excerpt.message}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Cover image */}
      <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
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

      {/* Markdown editor */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          正文 <span className="text-danger">*</span>
        </label>
        <Controller
          control={control}
          name="content"
          render={({ field, fieldState }) => (
            <>
              <MarkdownEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="在这里写正文，支持 GFM 表格 / 任务列表 / 删除线..."
              />
              {fieldState.error ? (
                <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
              ) : null}
            </>
          )}
        />
      </div>

      {/* Category + tags */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
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

      {/* Sticky footer (status + submit) */}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-hair bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
        <SaveIndicator state={saveState} visibility={visibility} status={status} />
        <div className="flex items-center gap-2">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded border border-hair px-3 py-1.5 text-sm text-ink transition-colors hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 aria-hidden className="size-4" />
              移入回收站
            </button>
          ) : null}
          <Link href="/admin/articles" className={buttonVariants({ variant: "outline", size: "sm" })}>
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

function SaveIndicator({
  state,
  visibility,
  status,
}: {
  state: SaveState;
  visibility: VisibilityValue;
  status: StatusValue;
}) {
  const summary =
    visibility === "PUBLIC"
      ? status === "PUBLISHED"
        ? "前台可见"
        : status === "ARCHIVED"
          ? "前台隐藏（已归档）"
          : "前台不可见（草稿）"
      : visibility === "PRIVATE"
        ? "登录后可读"
        : "凭密码可读";

  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-hair bg-bg px-2 py-0.5",
          status === "PUBLISHED" ? "text-success" : status === "ARCHIVED" ? "text-muted" : "text-accent",
        )}
      >
        {status === "PUBLISHED" ? "已发布" : status === "ARCHIVED" ? "已归档" : "草稿"} · {summary}
      </span>
      <span aria-live="polite">
        {state.kind === "idle" && "尚未自动保存"}
        {state.kind === "saving" && "自动保存中…"}
        {state.kind === "saved" && `已自动保存 · ${new Date(state.at).toLocaleTimeString()}`}
        {state.kind === "error" && <span className="text-danger">{state.message}</span>}
      </span>
    </div>
  );
}

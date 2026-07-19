"use client";
// /admin/notes/new + /admin/notes/[id]/edit form (Phase 4).
//
// Simplified version of ArticleForm: no cover image, no category.
// Reuses MarkdownEditor, VisibilitySelect, StatusSelect, and TagSelector
// from the article components directly.
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  createNoteAction,
  softDeleteNoteAction,
  updateNoteAction,
} from "./actions";
import { MarkdownEditor } from "@/components/admin/articles/MarkdownEditor";
import { VisibilitySelect, type VisibilityValue } from "@/components/admin/articles/VisibilitySelect";
import { StatusSelect, type StatusValue } from "@/components/admin/articles/StatusSelect";
import { TagSelector, type TagOption } from "@/components/admin/articles/TagSelector";
import { ensureTagByNameAction } from "@/components/admin/articles/actions";
export const noteFormSchema = z
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
export type NoteFormValues = z.infer<typeof noteFormSchema>;
export interface NoteFormProps {
  mode: "create" | "edit";
  noteId?: string;
  initial: NoteFormValues;
  tags: readonly TagOption[];
  onSubmit?: (values: NoteFormValues) => Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: Record<string, string>;
    redirectTo?: string;
  }>;
  onCreateTag?: (name: string) => Promise<TagOption | null>;
  onDelete?: () => Promise<{ ok: boolean; error?: string }>;
}
export function NoteForm(props: NoteFormProps) {
  const { mode, noteId, initial, tags } = props;
  const router = useRouter();
  const handleSubmit = useCallback(
    async (values: NoteFormValues) => {
      if (noteId) return updateNoteAction(noteId, values);
      return createNoteAction(values);
    },
    [noteId],
  );
  const handleDelete = useCallback(async () => {
    if (!noteId) return;
    const result = await softDeleteNoteAction(noteId);
    if (result.ok && result.redirectTo) router.push(result.redirectTo);
  }, [noteId, router]);
  const handleCreateTag: (name: string) => Promise<TagOption | null> = useCallback(
    async (name: string) => {
      const t = await ensureTagByNameAction(name);
      return t ? { id: t.id, name: t.name, slug: t.slug, color: t.color } : null;
    },
    [],
  );
  const {
    control,
    handleSubmit: rhfSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: initial,
    mode: "onChange",
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const status = watch("status");
  const onFormSubmit: SubmitHandler<NoteFormValues> = async (values) => {
    setServerError(null);
    const fn = props.onSubmit ?? handleSubmit;
    const result = await fn(values);
    if (!result.ok) {
      setServerError(result.error ?? null);
      if (result.fieldErrors) {
        for (const [path, msg] of Object.entries(result.fieldErrors)) {
          setError(path as keyof NoteFormValues, { message: msg });
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
  return (
    <form onSubmit={rhfSubmit(onFormSubmit)} className="space-y-6">
      {/* Title + slug */}
      <div className="rounded-md border border-hair bg-surface p-6 shadow-soft space-y-4">
        <div>
          <label htmlFor="note-title" className="text-sm font-medium text-ink">标题</label>
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <>
                <input
                  id="note-title"
                  type="text"
                  {...field}
                  placeholder="笔记标题"
                  autoFocus
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
          <Controller
            control={control}
            name="slug"
            render={({ field, fieldState }) => (
              <>
                <label htmlFor="note-slug" className="text-xs font-medium text-muted">
                  slug（留空从标题自动生成）
                </label>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xs text-muted">/notes/</span>
                  <input
                    id="note-slug"
                    type="text"
                    {...field}
                    placeholder="auto"
                    aria-invalid={fieldState.error ? "true" : "false"}
                    className="block flex-1 rounded border border-hair bg-bg px-2 py-1.5 font-mono text-sm text-ink outline-none transition-colors focus-visible:border-accent"
                  />
                </div>
                {fieldState.error ? (
                  <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
                ) : null}
              </>
            )}
          />
        </div>
        <div>
          <label htmlFor="note-excerpt" className="text-sm font-medium text-ink">摘要</label>
          <Controller
            control={control}
            name="excerpt"
            render={({ field, fieldState }) => (
              <>
                <textarea
                  id="note-excerpt"
                  {...field}
                  rows={2}
                  placeholder="一段简短的摘要，留空则自动从正文截取"
                  aria-invalid={fieldState.error ? "true" : "false"}
                  className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-2 text-sm text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 resize-y"
                />
                {fieldState.error ? (
                  <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
                ) : null}
              </>
            )}
          />
        </div>
      </div>
      {/* Content */}
      <div>
        <Controller
          control={control}
          name="content"
          render={({ field, fieldState }) => (
            <div>
              <label className="text-sm font-medium text-ink">正文</label>
              <div className="mt-1">
                <MarkdownEditor
                  id="note-content"
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  ariaLabel="笔记正文"
                />
              </div>
              {fieldState.error ? (
                <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
              ) : null}
            </div>
          )}
        />
      </div>
      {/* Tags */}
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
          {status === "PUBLISHED" ? "前台可见" : status === "ARCHIVED" ? "前台隐藏（已归档）" : "前台不可见（草稿）"}
        </span>
        <div className="flex items-center gap-2">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={async () => { await handleDelete(); }}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded border border-hair px-3 py-1.5 text-sm text-ink transition-colors hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 aria-hidden className="size-4" />
              移入回收站
            </button>
          ) : null}
          <Link href="/admin/notes" className={buttonVariants({ variant: "outline", size: "sm" })}>
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

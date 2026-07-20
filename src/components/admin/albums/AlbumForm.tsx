"use client";

// AlbumForm (Phase 6 / Day 1) -- Chinese version

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

import { CoverImageUploader } from "@/components/admin/articles/CoverImageUploader";

import {
  createAlbumAction,
  updateAlbumAction,
  softDeleteAlbumAction,
} from "./actions";

export const albumFormSchema = z.object({
  title: z.string().trim().min(1, "相册标题不能为空").max(120, "标题不超过 120 字"),
  slug: z
    .string()
    .trim()
    .max(80, "slug 不超过 80 字")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 仅支持小写字母、数字、连字符")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(2000, "描述不超过 2000 字").optional().or(z.literal("")),
  coverImage: z.string().trim().optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export type AlbumFormValues = z.infer<typeof albumFormSchema>;

export interface AlbumFormProps {
  mode: "create" | "edit";
  albumId?: string;
  initial: AlbumFormValues;
  onDelete?: () => Promise<{ ok: boolean; error?: string }>;
}

export function AlbumForm(props: AlbumFormProps) {
  const { mode, albumId, initial } = props;
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { isSubmitting },
  } = useForm<AlbumFormValues>({
    resolver: zodResolver(albumFormSchema),
    defaultValues: initial,
  });

  const onValid = handleSubmit(async (values) => {
    setServerError(null);
    const result = albumId
      ? await updateAlbumAction(albumId, values)
      : await createAlbumAction(values);
    if (!result.ok) {
      setServerError(result.error);
      if (result.fieldErrors) {
        for (const [k, msg] of Object.entries(result.fieldErrors)) {
          setError(k as keyof AlbumFormValues, { message: msg });
        }
      }
      return;
    }
    if (result.redirectTo) router.push(result.redirectTo);
  });

  const handleDelete = useCallback(async () => {
    if (!albumId) return;
    if (!window.confirm("确定要把这个相册移入回收站吗？照片不会被删除。")) return;
    const result = await softDeleteAlbumAction(albumId);
    if (result.ok && result.redirectTo) router.push(result.redirectTo);
  }, [albumId, router]);

  const visibility = watch("visibility");
  const status = watch("status");

  return (
    <form onSubmit={onValid} className="space-y-6" aria-label={mode === "create" ? "新建相册" : "编辑相册"}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <div>
              <label htmlFor="album-title" className="block text-sm font-medium text-ink">
                相册标题 <span className="text-danger">*</span>
              </label>
              <input
                id="album-title"
                type="text"
                {...register("title")}
                placeholder="例如：2024 东京之旅"
                className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-base text-ink outline-none focus-visible:border-accent"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="album-slug" className="block text-sm font-medium text-ink">
                slug
              </label>
              <input
                id="album-slug"
                type="text"
                {...register("slug")}
                placeholder="留空则从标题自动生成"
                className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 font-mono text-sm text-ink outline-none focus-visible:border-accent"
              />
              <p className="mt-1 text-xs text-muted">
                将出现在 <code>/photos/albums/&lt;slug&gt;</code>；留空将按标题自动生成。
              </p>
            </div>
            <div className="mt-4">
              <label htmlFor="album-description" className="block text-sm font-medium text-ink">
                描述
              </label>
              <textarea
                id="album-description"
                rows={4}
                {...register("description")}
                placeholder="几句关于这次拍摄背景的描述，公开相册会显示在前台。"
                className="mt-1 block w-full resize-y rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
              />
            </div>
          </div>

          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">封面图</h2>
            <p className="mt-1 text-xs text-muted">
              留空时，前台相册页会使用最新的一张照片作为封面。
            </p>
            <div className="mt-4">
              <CoverImageUploader
                value={initial.coverImage ?? ""}
                onChange={() => {}}
              />
              <input type="hidden" {...register("coverImage")} defaultValue={initial.coverImage ?? ""} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">可见性 / 状态</h2>
            <div className="mt-4 space-y-3">
              <div>
                <span className="block text-sm font-medium text-ink">可见性</span>
                <select
                  {...register("visibility")}
                  className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                >
                  <option value="PUBLIC">公开</option>
                  <option value="PRIVATE">私密</option>
                </select>
              </div>
              <div>
                <span className="block text-sm font-medium text-ink">状态</span>
                <select
                  {...register("status")}
                  className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                >
                  <option value="DRAFT">草稿</option>
                  <option value="PUBLISHED">已发布</option>
                  <option value="ARCHIVED">已归档</option>
                </select>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              {visibility === "PUBLIC"
                ? status === "PUBLISHED"
                  ? "前台 /photos/albums/<slug> 公开访问。"
                  : "前台不可见（草稿 / 归档）。"
                : "前台相册页不可见，但照片仍按相册归类。"}
            </p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-hair bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
        <span className="text-xs text-muted">
          {visibility === "PUBLIC"
            ? status === "PUBLISHED"
              ? "前台可见"
              : "前台不可见（草稿 / 归档）"
            : "登录后可读"}
        </span>
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
          <Link href="/admin/photos/albums" className={buttonVariants({ variant: "outline", size: "sm" })}>
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
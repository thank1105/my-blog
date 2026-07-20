"use client";

// PhotoForm (Phase 6 / Day 1) -- Chinese version

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Trash2, MoveLeft, Calendar, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

import { VisibilitySelect, type VisibilityValue } from "@/components/admin/articles/VisibilitySelect";
import { StatusSelect, type StatusValue } from "@/components/admin/articles/StatusSelect";

import {
  photoFormSchema,
  type PhotoFormValues,
} from "@/server/photos";
import {
  updatePhotoAction,
  softDeletePhotoAction,
} from "./actions";

export interface PhotoFormProps {
  photoId: string;
  initial: PhotoFormValues;
  albums: { id: string; title: string; slug: string }[];
}

export function PhotoForm({ photoId, initial, albums }: PhotoFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (values: PhotoFormValues) => updatePhotoAction(photoId, values),
    [photoId],
  );

  const handleDelete = useCallback(async () => {
    if (!window.confirm("确定要把这张照片移入回收站吗？")) return { ok: false };
    const result = await softDeletePhotoAction(photoId);
    if (result.ok && result.redirectTo) router.push(result.redirectTo);
    return { ok: result.ok, error: result.ok ? undefined : result.error };
  }, [photoId, router]);

  const {
    control,
    handleSubmit: rhfSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PhotoFormValues>({
    resolver: zodResolver(photoFormSchema as unknown as z.ZodType<PhotoFormValues>),
    defaultValues: initial,
    mode: "onChange",
  });

  const visibility = watch("visibility");
  const status = watch("status");

  const onValid: SubmitHandler<PhotoFormValues> = async (values) => {
    setServerError(null);
    const result = await handleSubmit(values);
    if (!result.ok) {
      setServerError(result.error);
      if (result.fieldErrors) {
        for (const [k, msg] of Object.entries(result.fieldErrors)) {
          setError(k as keyof PhotoFormValues, { message: msg });
        }
      }
      return;
    }
    if (result.redirectTo) router.push(result.redirectTo);
  };

  return (
    <form onSubmit={rhfSubmit(onValid)} className="space-y-6" aria-label="编辑照片">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-md border border-hair bg-surface shadow-soft">
            <div className="relative aspect-[4/3] w-full bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={initial.imageUrl}
                alt={initial.title || "照片预览"}
                className="absolute inset-0 size-full object-contain"
              />
            </div>
            <div className="border-t border-hair p-3 font-mono text-[11px] text-muted">
              {initial.imageUrl}
              {initial.width && initial.height ? (
                <span className="ml-2">· {initial.width} × {initial.height}</span>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <Controller
              control={control}
              name="title"
              render={({ field, fieldState }) => (
                <div>
                  <label htmlFor="photo-title" className="block text-sm font-medium text-ink">
                    标题
                  </label>
                  <input
                    id="photo-title"
                    type="text"
                    {...field}
                    placeholder="可选"
                    className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                  />
                  {fieldState.error ? (
                    <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
                  ) : null}
                </div>
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field, fieldState }) => (
                <div className="mt-4">
                  <label htmlFor="photo-description" className="block text-sm font-medium text-ink">
                    描述
                  </label>
                  <textarea
                    id="photo-description"
                    rows={3}
                    {...field}
                    placeholder="关于这张照片的背景、心情、技术参数…"
                    className="mt-1 block w-full resize-y rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                  />
                  {fieldState.error ? (
                    <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">拍摄信息</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Controller
                control={control}
                name="location"
                render={({ field, fieldState }) => (
                  <div>
                    <label htmlFor="photo-location" className="block text-sm font-medium text-ink">
                      <MapPin aria-hidden className="mr-1 inline size-3" />
                      地点
                    </label>
                    <input
                      id="photo-location"
                      type="text"
                      {...field}
                      placeholder="例如：杭州 / 西湖"
                      className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                    />
                    {fieldState.error ? (
                      <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
                    ) : null}
                  </div>
                )}
              />
              <Controller
                control={control}
                name="takenAt"
                render={({ field, fieldState }) => (
                  <div>
                    <label htmlFor="photo-taken-at" className="block text-sm font-medium text-ink">
                      <Calendar aria-hidden className="mr-1 inline size-3" />
                      拍摄时间
                    </label>
                    <input
                      id="photo-taken-at"
                      type="datetime-local"
                      {...field}
                      className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                    />
                    {fieldState.error ? (
                      <p className="mt-1 text-xs text-danger">{fieldState.error.message}</p>
                    ) : null}
                  </div>
                )}
              />
              <Controller
                control={control}
                name="width"
                render={({ field }) => (
                  <div>
                    <label htmlFor="photo-width" className="block text-sm font-medium text-ink">
                      宽度 (px)
                    </label>
                    <input
                      id="photo-width"
                      type="number"
                      min={0}
                      step={1}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                    />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="height"
                render={({ field }) => (
                  <div>
                    <label htmlFor="photo-height" className="block text-sm font-medium text-ink">
                      高度 (px)
                    </label>
                    <input
                      id="photo-height"
                      type="number"
                      min={0}
                      step={1}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                    />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="order"
                render={({ field }) => (
                  <div>
                    <label htmlFor="photo-order" className="block text-sm font-medium text-ink">
                      相册内排序
                    </label>
                    <input
                      id="photo-order"
                      type="number"
                      min={0}
                      step={1}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      className="mt-1 block w-32 rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">所属相册</h2>
            <Controller
              control={control}
              name="albumId"
              render={({ field }) => (
                <select
                  {...field}
                  className="mt-4 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                >
                  <option value="none">独立照片（不属于任何相册）</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              )}
            />
            <p className="mt-2 text-xs text-muted">
              把照片搬到另一个相册，或独立成一张照片。照片本身不会被删除。
            </p>
          </div>

          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">可见性 / 状态</h2>
            <div className="mt-4 space-y-4">
              <Controller
                control={control}
                name="visibility"
                render={({ field }) => (
                  <VisibilitySelect
                    value={field.value}
                    onChange={(v: VisibilityValue) => field.onChange(v)}
                    hidePassword
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
            <p className="mt-3 text-xs text-muted">
              {visibility === "PUBLIC"
                ? status === "PUBLISHED"
                  ? "前台 /photos 公开访问。"
                  : "前台不可见（草稿 / 归档）。"
                : "登录用户可在前台查看。"}
            </p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-hair bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
        <Link
          href="/admin/photos"
          className="inline-flex items-center gap-1 text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          <MoveLeft aria-hidden className="size-3.5" />
          返回列表
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => { await handleDelete(); }}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded border border-hair px-3 py-1.5 text-sm text-ink transition-colors hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 aria-hidden className="size-4" />
            移入回收站
          </button>
          <Link href="/admin/photos" className={buttonVariants({ variant: "outline", size: "sm" })}>
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
      </div>

      {serverError ? (
        <div className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {serverError}
        </div>
      ) : null}
    </form>
  );
}
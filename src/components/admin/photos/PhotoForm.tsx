"use client";

// PhotoForm (Phase 6 / Day 1) -- English stub.
//
// The full multi-section form is being delivered iteratively; this
// stub keeps the admin route compilable while Phase 6 ships. It
// exposes the same `PhotoFormProps` / form values so callers do not
// have to change.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Trash2, MoveLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

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

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<PhotoFormValues>({
    resolver: zodResolver(photoFormSchema as unknown as z.ZodType<PhotoFormValues>),
    defaultValues: initial,
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await updatePhotoAction(photoId, values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    if (result.redirectTo) router.push(result.redirectTo);
  });

  const handleDelete = useCallback(async () => {
    if (!window.confirm("Move this photo to trash?")) return;
    const result = await softDeletePhotoAction(photoId);
    if (result.ok && result.redirectTo) router.push(result.redirectTo);
  }, [photoId, router]);

  return (
    <form onSubmit={onSubmit} className="space-y-6" aria-label="Edit photo">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-md border border-hair bg-surface shadow-soft">
            <div className="relative aspect-[4/3] w-full bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={initial.imageUrl}
                alt={initial.title || "Photo preview"}
                className="absolute inset-0 size-full object-contain"
              />
            </div>
            <div className="border-t border-hair p-3 font-mono text-[11px] text-muted">
              {initial.imageUrl}
              {initial.width && initial.height ? (
                <span className="ml-2">
                  {" "}- {initial.width} x {initial.height}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <div>
              <label htmlFor="photo-title" className="block text-sm font-medium text-ink">
                Title
              </label>
              <input
                id="photo-title"
                type="text"
                {...register("title")}
                placeholder="Optional"
                className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="photo-description" className="block text-sm font-medium text-ink">
                Description
              </label>
              <textarea
                id="photo-description"
                rows={3}
                {...register("description")}
                placeholder="Background, mood, technical parameters..."
                className="mt-1 block w-full resize-y rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
              />
            </div>
            {errors.title ? <p className="mt-2 text-xs text-danger">{errors.title.message}</p> : null}
            {errors.description ? <p className="mt-2 text-xs text-danger">{errors.description.message}</p> : null}
          </div>

          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Capture info</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="photo-location" className="block text-sm font-medium text-ink">
                  Location
                </label>
                <input
                  id="photo-location"
                  type="text"
                  {...register("location")}
                  placeholder="e.g. Hangzhou / West Lake"
                  className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                />
              </div>
              <div>
                <label htmlFor="photo-taken-at" className="block text-sm font-medium text-ink">
                  Taken at
                </label>
                <input
                  id="photo-taken-at"
                  type="datetime-local"
                  {...register("takenAt")}
                  className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Album</h2>
            <select
              {...register("albumId")}
              className="mt-4 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
            >
              <option value="none">Standalone (not in any album)</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted">
              Move the photo to another album or make it standalone.
            </p>
          </div>

          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Visibility / status</h2>
            <div className="mt-4 space-y-3">
              <div>
                <span className="block text-sm font-medium text-ink">Visibility</span>
                <select
                  {...register("visibility")}
                  className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
              <div>
                <span className="block text-sm font-medium text-ink">Status</span>
                <select
                  {...register("status")}
                  className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-hair bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
        <Link
          href="/admin/photos"
          className="inline-flex items-center gap-1 text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          <MoveLeft aria-hidden className="size-3.5" />
          Back to list
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded border border-hair px-3 py-1.5 text-sm text-ink transition-colors hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 aria-hidden className="size-4" />
            Move to trash
          </button>
          <Link href="/admin/photos" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save aria-hidden className="size-4" />
            {isSubmitting ? "Saving..." : "Save"}
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
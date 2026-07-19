"use client";

// AlbumForm (Phase 6 / Day 1) -- English stub.
//
// The full multi-section form is being delivered iteratively; this
// stub keeps the admin route compilable while Phase 6 ships.

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
  title: z.string().trim().min(1, "Title is required").max(120, "Title <= 120 chars"),
  slug: z
    .string()
    .trim()
    .max(80, "Slug <= 80 chars")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase letters, digits, hyphens")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(2000, "Description <= 2000 chars").optional().or(z.literal("")),
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
    formState: { errors, isSubmitting },
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
    if (!window.confirm("Move this album to trash? Photos will not be deleted.")) return;
    const result = await softDeleteAlbumAction(albumId);
    if (result.ok && result.redirectTo) router.push(result.redirectTo);
  }, [albumId, router]);

  const visibility = watch("visibility");
  const status = watch("status");

  return (
    <form onSubmit={onValid} className="space-y-6" aria-label={mode === "create" ? "New album" : "Edit album"}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <div>
              <label htmlFor="album-title" className="block text-sm font-medium text-ink">
                Album title <span className="text-danger">*</span>
              </label>
              <input
                id="album-title"
                type="text"
                {...register("title")}
                placeholder="e.g. Tokyo trip 2024"
                className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 text-base text-ink outline-none focus-visible:border-accent"
              />
              {errors.title ? <p className="mt-1 text-xs text-danger">{errors.title.message}</p> : null}
            </div>
            <div className="mt-4">
              <label htmlFor="album-slug" className="block text-sm font-medium text-ink">
                slug
              </label>
              <input
                id="album-slug"
                type="text"
                {...register("slug")}
                placeholder="leave blank to auto-generate"
                className="mt-1 block w-full rounded border border-hair bg-bg px-3 py-1.5 font-mono text-sm text-ink outline-none focus-visible:border-accent"
              />
              <p className="mt-1 text-xs text-muted">
                Appears at <code>/photos/albums/&lt;slug&gt;</code>.
              </p>
              {errors.slug ? <p className="mt-1 text-xs text-danger">{errors.slug.message}</p> : null}
            </div>
            <div className="mt-4">
              <label htmlFor="album-description" className="block text-sm font-medium text-ink">
                Description
              </label>
              <textarea
                id="album-description"
                rows={4}
                {...register("description")}
                placeholder="A few sentences about the trip / shoot."
                className="mt-1 block w-full resize-y rounded border border-hair bg-bg px-3 py-1.5 text-sm text-ink outline-none focus-visible:border-accent"
              />
              {errors.description ? (
                <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border border-hair bg-surface p-6 shadow-soft">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Cover image</h2>
            <p className="mt-1 text-xs text-muted">
              When empty, the public album page falls back to the latest photo.
            </p>
            <div className="mt-4">
              <CoverImageUploader
                value={initial.coverImage ?? ""}
                onChange={(v) =>
                  setError("coverImage", { message: "" })
                }
              />
              <input type="hidden" {...register("coverImage")} defaultValue={initial.coverImage ?? ""} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
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
            <p className="mt-3 text-xs text-muted">
              {visibility === "PUBLIC"
                ? status === "PUBLISHED"
                  ? "Public: visible at /photos/albums/<slug>."
                  : "Not visible on the public site (draft / archived)."
                : "Private: hidden from the public site."}
            </p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-hair bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
        <span className="text-xs text-muted">
          {visibility === "PUBLIC"
            ? status === "PUBLISHED"
              ? "Visible on public site"
              : "Not visible on public site (draft / archived)"
            : "Login required"}
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
              Move to trash
            </button>
          ) : null}
          <Link href="/admin/photos/albums" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save aria-hidden className="size-4" />
            {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
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
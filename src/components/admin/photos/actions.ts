"use server";

// Phase 6 / Day 1 -- server actions for /admin/photos/*.
//
// The form posts these from the client component. They re-validate
// the JSON payload, call into src/server/photos.ts, and revalidate
// the affected paths.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  createPhoto,
  photoFormSchema,
  softDeletePhoto,
  softDeletePhotos,
  updatePhoto,
  movePhotosToAlbum,
} from "@/server/photos";

export type ActionResult =
  | { ok: true; redirectTo?: string; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function flattenZodError(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "form";
    out[path] = issue.message;
  }
  return out;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function createPhotoAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = photoFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    const row = await createPhoto(parsed.data, { authorId: session.user.id });
    revalidatePath("/admin/photos");
    revalidatePath(`/admin/photos/${row.id}/edit`);
    return { ok: true, id: row.id, redirectTo: `/admin/photos/${row.id}/edit` };
  } catch (err) {
    console.error("[createPhotoAction]", err);
    return { ok: false, error: err instanceof Error ? err.message : "创建失败" };
  }
}

export async function updatePhotoAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = photoFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    await updatePhoto(id, parsed.data);
    revalidatePath("/admin/photos");
    revalidatePath(`/admin/photos/${id}/edit`);
    return { ok: true, redirectTo: `/admin/photos/${id}/edit` };
  } catch (err) {
    console.error("[updatePhotoAction]", err);
    return { ok: false, error: err instanceof Error ? err.message : "保存失败" };
  }
}

export async function softDeletePhotoAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await softDeletePhoto(id);
  revalidatePath("/admin/photos");
  return { ok: true, redirectTo: "/admin/photos" };
}

export async function softDeletePhotosAction(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (ids.length === 0) {
    return { ok: false, error: "请至少选择一项" };
  }
  await softDeletePhotos(ids);
  revalidatePath("/admin/photos");
  return { ok: true, redirectTo: "/admin/photos" };
}

const moveSchema = z.object({
  ids: z.array(z.string()).min(1),
  /**
   * Album id to move into, or one of the literal strings "none" / "" /
   * null-ish equivalents meaning "remove from album".
   */
  targetAlbumId: z.string().nullable().optional(),
});

export async function movePhotosAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "请求参数错误" };
  }
  const raw = parsed.data.targetAlbumId;
  const target = !raw || raw === "none" ? null : raw;
  await movePhotosToAlbum(parsed.data.ids, target);
  revalidatePath("/admin/photos");
  revalidatePath("/admin/photos/albums");
  return { ok: true, redirectTo: "/admin/photos" };
}
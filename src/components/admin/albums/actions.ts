"use server";

// Phase 6 / Day 1 -- server actions for /admin/photos/albums/*.
//
// Mirrors src/components/admin/projects/actions.ts. Client forms call
// these directly; pages never pass inline functions across the
// server/client boundary.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  createAlbum,
  createAlbumSchema,
  DuplicateAlbumSlugError,
  softDeleteAlbum,
  softDeleteAlbums,
  updateAlbum,
} from "@/server/albums";

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

export async function createAlbumAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = createAlbumSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    const row = await createAlbum(parsed.data, { authorId: session.user.id });
    revalidatePath("/admin/photos");
    revalidatePath("/admin/photos/albums");
    return { ok: true, id: row.id, redirectTo: `/admin/photos/albums/${row.id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateAlbumSlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    throw err;
  }
}

export async function updateAlbumAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createAlbumSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    await updateAlbum(id, parsed.data);
    revalidatePath("/admin/photos");
    revalidatePath("/admin/photos/albums");
    revalidatePath(`/admin/photos/albums/${id}/edit`);
    return { ok: true, redirectTo: `/admin/photos/albums/${id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateAlbumSlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    throw err;
  }
}

export async function softDeleteAlbumAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await softDeleteAlbum(id);
  revalidatePath("/admin/photos");
  revalidatePath("/admin/photos/albums");
  return { ok: true, redirectTo: "/admin/photos/albums" };
}

export async function softDeleteAlbumsAction(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (ids.length === 0) {
    return { ok: false, error: "请至少选择一项" };
  }
  await softDeleteAlbums(ids);
  revalidatePath("/admin/photos");
  revalidatePath("/admin/photos/albums");
  return { ok: true, redirectTo: "/admin/photos/albums" };
}
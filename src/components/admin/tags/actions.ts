"use server";

// Phase 7 / Day 1 server actions for /admin/tags/*

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  createTag,
  createTagSchema,
  DuplicateTagSlugError,
  updateTag,
  deleteTag,
  mergeTags,
} from "@/server/tags";

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

export async function createTagAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    const row = await createTag(parsed.data);
    revalidatePath("/admin/tags");
    return { ok: true, id: row.id, redirectTo: `/admin/tags/${row.id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateTagSlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    throw err;
  }
}

export async function updateTagAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    await updateTag(id, parsed.data);
    revalidatePath("/admin/tags");
    revalidatePath(`/admin/tags/${id}/edit`);
    return { ok: true, redirectTo: `/admin/tags/${id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateTagSlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    throw err;
  }
}

export async function deleteTagAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await deleteTag(id);
  revalidatePath("/admin/tags");
  return { ok: true, redirectTo: "/admin/tags" };
}

export async function mergeTagsAction(
  fromId: string,
  toId: string,
): Promise<{ ok: true; moved: number; dropped: number } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const r = await mergeTags(fromId, toId);
    revalidatePath("/admin/tags");
    return { ok: true, moved: r.moved, dropped: r.dropped };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "合并失败" };
  }
}
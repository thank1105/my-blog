"use server";

// Phase 7 / Day 1 server actions for /admin/categories/*

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  createCategory,
  createCategorySchema,
  DuplicateCategorySlugError,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "@/server/categories";

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

export async function createCategoryAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    const row = await createCategory(parsed.data);
    revalidatePath("/admin/categories");
    return { ok: true, id: row.id, redirectTo: `/admin/categories/${row.id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateCategorySlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    throw err;
  }
}

export async function updateCategoryAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    await updateCategory(id, parsed.data);
    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}/edit`);
    return { ok: true, redirectTo: `/admin/categories/${id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateCategorySlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    throw err;
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await deleteCategory(id);
  revalidatePath("/admin/categories");
  return { ok: true, redirectTo: "/admin/categories" };
}

export async function reorderCategoriesAction(
  type: "ARTICLE" | "PROJECT",
  ids: string[],
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    await reorderCategories(type, ids);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "排序失败" };
  }
}
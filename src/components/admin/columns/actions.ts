"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import {
  ColumnHasChildrenError,
  createColumn,
  createColumnSchema,
  deleteColumn,
  DuplicateColumnSlugError,
  InvalidColumnParentError,
  updateColumn,
} from "@/server/columns";

export type ColumnActionResult =
  | { ok: true; id?: string; redirectTo?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") throw new Error("FORBIDDEN");
}

function fieldErrors(error: z.ZodError) {
  const result: Record<string, string> = {};
  for (const issue of error.issues) result[issue.path.join(".") || "form"] = issue.message;
  return result;
}

function knownError(error: unknown): ColumnActionResult | null {
  if (error instanceof DuplicateColumnSlugError) {
    return { ok: false, error: error.message, fieldErrors: { slug: "slug 已被占用" } };
  }
  if (error instanceof InvalidColumnParentError) {
    return { ok: false, error: error.message, fieldErrors: { parentId: error.message } };
  }
  if (error instanceof ColumnHasChildrenError) return { ok: false, error: error.message };
  return null;
}

export async function createColumnAction(input: unknown): Promise<ColumnActionResult> {
  await requireAdmin();
  const parsed = createColumnSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "表单校验失败", fieldErrors: fieldErrors(parsed.error) };
  try {
    const row = await createColumn(parsed.data);
    revalidatePath("/");
    revalidatePath("/columns");
    revalidatePath("/admin/columns");
    return { ok: true, id: row.id, redirectTo: `/admin/columns/${row.id}/edit` };
  } catch (error) {
    const result = knownError(error);
    if (result) return result;
    throw error;
  }
}

export async function updateColumnAction(id: string, input: unknown): Promise<ColumnActionResult> {
  await requireAdmin();
  const parsed = createColumnSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "表单校验失败", fieldErrors: fieldErrors(parsed.error) };
  try {
    await updateColumn(id, parsed.data);
    revalidatePath("/");
    revalidatePath("/columns");
    revalidatePath("/admin/columns");
    revalidatePath(`/admin/columns/${id}/edit`);
    return { ok: true, redirectTo: `/admin/columns/${id}/edit` };
  } catch (error) {
    const result = knownError(error);
    if (result) return result;
    throw error;
  }
}

export async function deleteColumnAction(id: string): Promise<ColumnActionResult> {
  await requireAdmin();
  try {
    await deleteColumn(id);
    revalidatePath("/");
    revalidatePath("/columns");
    revalidatePath("/admin/columns");
    return { ok: true, redirectTo: "/admin/columns" };
  } catch (error) {
    const result = knownError(error);
    if (result) return result;
    throw error;
  }
}

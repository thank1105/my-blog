"use server";

// Phase 4 server actions for /admin/notes/*.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  createNote,
  createNoteSchema,
  DuplicateNoteSlugError,
  softDeleteNote,
  softDeleteNotes,
  updateNote,
} from "@/server/notes";

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

export async function createNoteAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    const row = await createNote(parsed.data, { authorId: session.user.id });
    revalidatePath("/admin/notes");
    return { ok: true, id: row.id, redirectTo: `/admin/notes/${row.id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateNoteSlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    if (err instanceof Error && err.message.includes("无法从标题生成 slug")) {
      return { ok: false, error: err.message, fieldErrors: { slug: err.message } };
    }
    throw err;
  }
}

export async function updateNoteAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    await updateNote(id, parsed.data);
    revalidatePath("/admin/notes");
    revalidatePath(`/admin/notes/${id}/edit`);
    return { ok: true, redirectTo: `/admin/notes/${id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateNoteSlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    throw err;
  }
}

export async function softDeleteNoteAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await softDeleteNote(id);
  revalidatePath("/admin/notes");
  return { ok: true, redirectTo: "/admin/notes" };
}

export async function softDeleteNotesAction(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (ids.length === 0) {
    return { ok: false, error: "请至少选择一项" };
  }
  await softDeleteNotes(ids);
  revalidatePath("/admin/notes");
  return { ok: true, redirectTo: "/admin/notes" };
}

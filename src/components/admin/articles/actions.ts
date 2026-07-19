"use server";

// Phase 3 / Day 1 server actions for /admin/articles/*.
//
// This module is colocated with the form so the client component can
// import the actions directly (Next.js 15 forbids passing inline
// functions from server to client components, but importing a
// "use server" function from a client component is fine).
//
// Permissions: middleware already enforces ADMIN for /admin/*. These
// actions re-read the session and refuse mutations if the caller is not
// ADMIN, so background jobs / API clients sharing this code path stay
// safe.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  createArticle,
  createArticleSchema,
  DuplicateArticleSlugError,
  softDeleteArticle,
  updateArticle,
  autosaveDraft,
} from "@/server/articles";
import { ensureTagsByNames, type TagRow } from "@/server/tags";

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

export async function createArticleAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = createArticleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    const row = await createArticle(parsed.data, { authorId: session.user.id });
    revalidatePath("/admin/articles");
    return { ok: true, id: row.id, redirectTo: `/admin/articles/${row.id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateArticleSlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    if (err instanceof Error && err.message.includes("无法从标题生成 slug")) {
      return { ok: false, error: err.message, fieldErrors: { slug: err.message } };
    }
    throw err;
  }
}

export async function updateArticleAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createArticleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    await updateArticle(id, parsed.data);
    revalidatePath("/admin/articles");
    revalidatePath(`/admin/articles/${id}/edit`);
    return { ok: true, redirectTo: `/admin/articles/${id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateArticleSlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    throw err;
  }
}

export async function autosaveArticleAction(
  id: string,
  patch: { title?: string; content?: string; excerpt?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    await autosaveDraft(id, patch);
    return { ok: true };
  } catch (err) {
    console.error("[autosave]", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export async function softDeleteArticleAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await softDeleteArticle(id);
  revalidatePath("/admin/articles");
  return { ok: true, redirectTo: "/admin/articles" };
}

export async function ensureTagByNameAction(name: string): Promise<TagRow | null> {
  await requireAdmin();
  if (!name || name.trim().length === 0) return null;
  const [tag] = await ensureTagsByNames([name]);
  return tag ?? null;
}

export async function redirectAfterCreate(id: string): Promise<never> {
  redirect(`/admin/articles/${id}/edit`);
}

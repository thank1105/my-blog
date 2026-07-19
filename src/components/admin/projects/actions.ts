"use server";

// Phase 5 / Day 1 server actions for /admin/projects/*.
//
// Pattern mirrors src/components/admin/articles/actions.ts: client form
// imports these directly. Pages never pass inline functions across the
// server/client boundary.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  createProject,
  createProjectSchema,
  DuplicateProjectSlugError,
  softDeleteProject,
  softDeleteProjects,
  updateProject,
  reorderProjectImages,
} from "@/server/projects";

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

export async function createProjectAction(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    const row = await createProject(parsed.data, { authorId: session.user.id });
    revalidatePath("/admin/projects");
    return { ok: true, id: row.id, redirectTo: `/admin/projects/${row.id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateProjectSlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    if (err instanceof Error && err.message.includes("无法从标题生成 slug")) {
      return { ok: false, error: err.message, fieldErrors: { slug: err.message } };
    }
    throw err;
  }
}

export async function updateProjectAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    await updateProject(id, parsed.data);
    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${id}/edit`);
    return { ok: true, redirectTo: `/admin/projects/${id}/edit` };
  } catch (err) {
    if (err instanceof DuplicateProjectSlugError) {
      return { ok: false, error: err.message, fieldErrors: { slug: "slug 已被占用" } };
    }
    throw err;
  }
}

export async function softDeleteProjectAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  await softDeleteProject(id);
  revalidatePath("/admin/projects");
  return { ok: true, redirectTo: "/admin/projects" };
}

export async function softDeleteProjectsAction(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (ids.length === 0) {
    return { ok: false, error: "请至少选择一项" };
  }
  await softDeleteProjects(ids);
  revalidatePath("/admin/projects");
  return { ok: true, redirectTo: "/admin/projects" };
}

/**
 * Persist a new image ordering. Called by the MultiImageUploader after
 * the user drops a card into a new slot -- we want the order to survive
 * a refresh, even if the user clicks Save later.
 */
export async function reorderProjectImagesAction(
  projectId: string,
  imageIds: string[],
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    await reorderProjectImages(projectId, imageIds);
    revalidatePath(`/admin/projects/${projectId}/edit`);
    return { ok: true };
  } catch (err) {
    console.error("[reorderProjectImagesAction]", err);
    return { ok: false, error: err instanceof Error ? err.message : "未知错误" };
  }
}
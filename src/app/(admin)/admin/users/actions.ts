"use server";

// Phase 1 / Day 2 server actions for the /admin/users form pages.
//
// Permissions: middleware already enforces that the visitor holds an ADMIN
// session for /admin/*. These actions remain defensive -- they re-read the
// session on the server and refuse to mutate anything if the caller is not
// an ADMIN, so the day we add background jobs / API clients the same code
// path is safe.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  createUser,
  createUserSchema,
  resetPasswordSchema,
  resetUserPassword,
  updateUser,
  updateUserSchema,
} from "@/server/users";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
}

export type ActionResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

function flattenZodError(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "form";
    out[path] = issue.message;
  }
  return out;
}

export async function createUserAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const input = {
    email: formData.get("email"),
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
    role: formData.get("role"),
  };
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  try {
    await createUser(parsed.data);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("邮箱或用户名已被使用")) {
      return { ok: false, error: err.message };
    }
    throw err;
  }
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUserAction(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const input = {
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "on",
  };
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  await updateUser(id, parsed.data);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}/edit`);
  return { ok: true };
}

export async function resetPasswordAction(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const input = { newPassword: formData.get("newPassword") };
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "密码校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  await resetUserPassword(id, parsed.data);
  return { ok: true };
}

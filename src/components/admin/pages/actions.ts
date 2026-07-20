"use server";

// Phase 7 / Day 2 server actions for /admin/pages/*

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  upsertPage,
  upsertPageSchema,
  restorePageRevision,
} from "@/server/pages";

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

export async function upsertPageAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = upsertPageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "表单校验失败", fieldErrors: flattenZodError(parsed.error) };
  }
  await upsertPage(parsed.data);
  revalidatePath("/admin/pages");
  revalidatePath(parsed.data.type === "ABOUT" ? "/about" : "/now");
  return {
    ok: true,
    redirectTo: `/admin/pages/${parsed.data.type.toLowerCase()}`,
  };
}

export async function restoreRevisionAction(
  type: "ABOUT" | "NOW",
  revisionId: string,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await restorePageRevision(type, revisionId);
    revalidatePath("/admin/pages");
    revalidatePath(type === "ABOUT" ? "/about" : "/now");
    return { ok: true, redirectTo: `/admin/pages/${type.toLowerCase()}` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "恢复失败",
    };
  }
}
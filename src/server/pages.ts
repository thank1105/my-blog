// Phase 7 / Day 2 -- admin-side Page CRUD + Now history.
//
// Phase 0 added a single `Page` row identified by `type` (ABOUT | NOW).
// This file lifts the table to support:
//   - read by type
//   - upsert (single-row-per-type; we use the latest revision as the
//     source of truth)
//   - Now history: every save snapshots the previous content into
//     `PageRevision`. About revisions are kept too so the UI can
//     offer the same affordance later.

import { z } from "zod";
import { Prisma, type PageType } from "@prisma/client";

import { db } from "@/lib/db";

/* ------------------------------------------------------------------ */
/* Schemas (shared with client forms)                                  */
/* ------------------------------------------------------------------ */

export const pageTypeValues = ["ABOUT", "NOW"] as const;

export const upsertPageSchema = z.object({
  type: z.enum(pageTypeValues),
  content: z.string().trim().min(1, "内容不能为空"),
  meta: z.string().trim().max(2000).optional().or(z.literal("")),
  /** Snapshot the previous content into history before overwriting. */
  saveRevision: z.boolean().default(true),
});

export type UpsertPageInput = z.infer<typeof upsertPageSchema>;

/* ------------------------------------------------------------------ */
/* Select shape                                                        */
/* ------------------------------------------------------------------ */

const pageSelect = {
  id: true,
  type: true,
  content: true,
  meta: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PageSelect;

export type PageRow = Prisma.PageGetPayload<{ select: typeof pageSelect }>;

const revisionSelect = {
  id: true,
  type: true,
  content: true,
  meta: true,
  createdAt: true,
} satisfies Prisma.PageRevisionSelect;

export type PageRevisionRow = Prisma.PageRevisionGetPayload<{ select: typeof revisionSelect }>;

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function getPageByType(type: PageType): Promise<PageRow | null> {
  return (await db.page.findUnique({
    where: { type },
    select: pageSelect,
  })) as unknown as PageRow | null;
}

export async function listPages(): Promise<PageRow[]> {
  return (await db.page.findMany({
    orderBy: [{ type: "asc" }],
    select: pageSelect,
  })) as unknown as PageRow[];
}

export async function listPageRevisions(
  type: PageType,
  limit = 50,
): Promise<PageRevisionRow[]> {
  return (await db.pageRevision.findMany({
    where: { type },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    select: revisionSelect,
  })) as unknown as PageRevisionRow[];
}

export async function getPageRevision(id: string): Promise<PageRevisionRow | null> {
  return (await db.pageRevision.findUnique({
    where: { id },
    select: revisionSelect,
  })) as unknown as PageRevisionRow | null;
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export async function upsertPage(input: UpsertPageInput): Promise<PageRow> {
  const meta = input.meta ? input.meta : null;
  return db.$transaction(async (tx) => {
    const existing = await tx.page.findUnique({
      where: { type: input.type },
      select: { id: true, content: true, meta: true },
    });

    if (existing && input.saveRevision) {
      // Snapshot the existing row before overwriting.
      await tx.pageRevision.create({
        data: {
          type: input.type,
          content: existing.content,
          meta: existing.meta,
        },
      });
    }

    if (existing) {
      return (await tx.page.update({
        where: { type: input.type },
        data: { content: input.content, meta },
        select: pageSelect,
      })) as unknown as PageRow;
    }
    return (await tx.page.create({
      data: {
        type: input.type,
        content: input.content,
        meta,
      },
      select: pageSelect,
    })) as unknown as PageRow;
  });
}

/**
 * Restore a historical revision into the live page. We snapshot the
 * current live content into the history first so the restore is
 * reversible.
 */
export async function restorePageRevision(
  type: PageType,
  revisionId: string,
): Promise<PageRow> {
  return db.$transaction(async (tx) => {
    const revision = await tx.pageRevision.findUnique({
      where: { id: revisionId },
      select: { id: true, type: true, content: true, meta: true },
    });
    if (!revision || revision.type !== type) {
      throw new Error("历史版本不存在或类型不匹配");
    }

    const existing = await tx.page.findUnique({
      where: { type },
      select: { content: true, meta: true },
    });
    if (existing) {
      await tx.pageRevision.create({
        data: {
          type,
          content: existing.content,
          meta: existing.meta,
        },
      });
    }

    if (existing) {
      return (await tx.page.update({
        where: { type },
        data: { content: revision.content, meta: revision.meta },
        select: pageSelect,
      })) as unknown as PageRow;
    }
    return (await tx.page.create({
      data: {
        type,
        content: revision.content,
        meta: revision.meta,
      },
      select: pageSelect,
    })) as unknown as PageRow;
  });
}
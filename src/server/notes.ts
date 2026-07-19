// Phase 4 / Notes server layer.
//
// Follows the same pattern as src/server/articles.ts: validation schemas,
// read helpers, and write helpers. Notes are simpler than articles:
// no cover image, no category, no featured flag.

import { z } from "zod";
import { Prisma, type Note, type Status, type Visibility } from "@prisma/client";

import { db } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";

/* ------------------------------------------------------------------ */
/* Schemas (shared with client forms)                                  */
/* ------------------------------------------------------------------ */

export const visibilityValues = ["PUBLIC", "PRIVATE", "PASSWORD"] as const;
export const statusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const titleSchema = z.string().trim().min(1, "标题不能为空").max(120, "标题不超过 120 字");

export const createNoteSchema = z
  .object({
    title: titleSchema,
    slug: z.string().trim().max(80).optional(),
    excerpt: z.string().trim().max(280, "摘要不超过 280 字").optional(),
    content: z.string().min(1, "正文不能为空"),
    visibility: z.enum(visibilityValues),
    password: z.string().trim().optional(),
    status: z.enum(statusValues),
    tagIds: z.array(z.string()).default([]),
  })
  .superRefine((val, ctx) => {
    if (val.visibility === "PASSWORD" && (!val.password || val.password.length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "密码文章至少需要 4 位密码",
      });
    }
  });

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = CreateNoteInput;

export const listNotesQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(statusValues).optional(),
  visibility: z.enum(visibilityValues).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;

/* ------------------------------------------------------------------ */
/* Select shape                                                        */
/* ------------------------------------------------------------------ */

export const noteSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  visibility: true,
  password: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  viewCount: true,
  authorId: true,
  author: { select: { id: true, username: true, displayName: true, email: true } },
  tags: {
    select: {
      tag: { select: { id: true, name: true, slug: true, color: true } },
    },
  },
} satisfies Prisma.NoteSelect;

export type NoteRow = Prisma.NoteGetPayload<{ select: typeof noteSelect }>;

/** Flat tag list (most callers don't care about the join shape). */
export function flattenNoteTags(row: NoteRow) {
  return row.tags.map((t) => t.tag);
}

/* ------------------------------------------------------------------ */
/* Reads                                                                */
/* ------------------------------------------------------------------ */

export interface ListNotesResult {
  rows: NoteRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listNotes(
  query: ListNotesQuery = {},
): Promise<ListNotesResult> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where: Prisma.NoteWhereInput = {
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.visibility ? { visibility: query.visibility } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q } },
            { slug: { contains: query.q } },
            { excerpt: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.note.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: noteSelect,
    }) as unknown as Promise<NoteRow[]>,
    db.note.count({ where }),
  ]);

  return { rows, total, page, pageSize };
}

export async function getNote(id: string): Promise<NoteRow | null> {
  return db.note.findFirst({
    where: { id, deletedAt: null },
    select: noteSelect,
  }) as unknown as NoteRow | null;
}

export function existingNoteSlugs(): Promise<Set<string>> {
  return db.note
    .findMany({ where: { deletedAt: null }, select: { slug: true } })
    .then((rows) => new Set(rows.map((r) => r.slug)));
}

/* ------------------------------------------------------------------ */
/* Writes                                                               */
/* ------------------------------------------------------------------ */

export class DuplicateNoteSlugError extends Error {
  constructor(public readonly slug: string) {
    super(`slug "${slug}" 已被占用`);
    this.name = "DuplicateNoteSlugError";
  }
}

export async function createNote(
  input: CreateNoteInput,
  opts: { authorId: string },
): Promise<NoteRow> {
  const baseSlug = input.slug && input.slug.length > 0 ? input.slug : slugify(input.title);
  if (!baseSlug) {
    throw new Error("无法从标题生成 slug，请手动填写");
  }
  const existing = await existingNoteSlugs();
  const slug = uniqueSlug(baseSlug, existing);

  const data: Prisma.NoteCreateInput = {
    slug,
    title: input.title,
    excerpt: input.excerpt || null,
    content: input.content,
    visibility: input.visibility,
    status: input.status,
    publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    author: { connect: { id: opts.authorId } },
    ...(input.visibility === "PASSWORD" && input.password
      ? { password: input.password }
      : {}),
    tags: input.tagIds.length > 0
      ? { create: input.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) }
      : undefined,
  };

  try {
    const created = await db.note.create({ data, select: noteSelect });
    return created as unknown as NoteRow;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateNoteSlugError(slug);
    }
    throw err;
  }
}

export async function updateNote(
  id: string,
  input: UpdateNoteInput,
): Promise<NoteRow> {
  const existing = await getNote(id);
  if (!existing) throw new Error("笔记不存在");

  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    const taken = await db.note.findFirst({
      where: { slug: input.slug, deletedAt: null, NOT: { id } },
      select: { id: true },
    });
    if (taken) throw new DuplicateNoteSlugError(input.slug);
    slug = input.slug;
  } else if (!input.slug) {
    if (input.title !== existing.title) {
      const all = await existingNoteSlugs();
      all.delete(existing.slug);
      slug = uniqueSlug(slugify(input.title), all);
    }
  }

  // Reset NoteTag join rows, recreate from input.
  await db.noteTag.deleteMany({ where: { noteId: id } });

  const data: Prisma.NoteUpdateInput = {
    slug,
    title: input.title,
    excerpt: input.excerpt || null,
    content: input.content,
    visibility: input.visibility,
    status: input.status,
    publishedAt:
      input.status === "PUBLISHED"
        ? existing.publishedAt ?? new Date()
        : null,
    ...(input.visibility === "PASSWORD" && input.password
      ? { password: input.password }
      : { password: null }),
    tags: input.tagIds.length > 0
      ? { create: input.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) }
      : undefined,
  };

  try {
    return await db.note.update({ where: { id }, data, select: noteSelect }) as unknown as NoteRow;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateNoteSlugError(slug);
    }
    throw err;
  }
}

export async function setNoteStatus(
  id: string,
  status: Status,
): Promise<void> {
  const existing = await db.note.findFirst({
    where: { id, deletedAt: null },
    select: { status: true, publishedAt: true },
  });
  if (!existing) throw new Error("笔记不存在");
  const publishedAt =
    status === "PUBLISHED"
      ? existing.publishedAt ?? new Date()
      : existing.publishedAt;
  await db.note.update({
    where: { id },
    data: { status, publishedAt },
  });
}

export async function softDeleteNote(id: string): Promise<void> {
  await db.note.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function restoreNote(id: string): Promise<void> {
  await db.note.update({
    where: { id },
    data: { deletedAt: null },
  });
}

/* ------------------------------------------------------------------ */
/* Note export (download as .md file)                                  */
/* ------------------------------------------------------------------ */

/**
 * Build a simple Markdown file payload for a note. Callers stream this
 * back as a .md download.
 */
export function exportNoteAsMarkdown(note: NoteRow): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push(`title: "${note.title.replace(/"/g, '\\"')}"`);
  lines.push(`slug: ${note.slug}`);
  lines.push(`published: ${note.publishedAt?.toISOString() ?? "false"}`);
  lines.push(`visibility: ${note.visibility}`);
  if (note.excerpt) lines.push(`excerpt: "${note.excerpt.replace(/"/g, '\\"')}"`);
  lines.push("---");
  lines.push("");
  lines.push(note.content);
  lines.push("");
  return lines.join("\n");
}

/** Soft-delete many notes at once for batch deletion. */
export async function softDeleteNotes(ids: string[]): Promise<void> {
  await db.note.updateMany({
    where: { id: { in: ids }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export type { Note, Status, Visibility };

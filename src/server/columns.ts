import { Prisma } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";

const slugSchema = z
  .string()
  .trim()
  .max(80, "slug 不超过 80 字")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 仅支持小写字母、数字和连字符")
  .optional()
  .or(z.literal(""));

export const createColumnSchema = z.object({
  name: z.string().trim().min(1, "专栏名称不能为空").max(80, "名称不超过 80 字"),
  slug: slugSchema,
  description: z.string().trim().max(500, "描述不超过 500 字").optional().or(z.literal("")),
  parentId: z.string().trim().optional().or(z.literal("")),
  order: z.number().int().min(0).default(0),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = CreateColumnInput;

const columnSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  order: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  parent: { select: { id: true, name: true, slug: true, parentId: true } },
  children: {
    orderBy: [{ order: "asc" as const }, { name: "asc" as const }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      order: true,
      parentId: true,
      _count: { select: { articles: true } },
    },
  },
  _count: { select: { articles: true, children: true } },
} satisfies Prisma.ColumnSelect;

export type ColumnRow = Prisma.ColumnGetPayload<{ select: typeof columnSelect }>;

export class DuplicateColumnSlugError extends Error {
  constructor(slug: string) {
    super(`专栏 slug 已被使用：${slug}`);
    this.name = "DuplicateColumnSlugError";
  }
}

export class InvalidColumnParentError extends Error {
  constructor(message = "父专栏无效") {
    super(message);
    this.name = "InvalidColumnParentError";
  }
}

export class ColumnHasChildrenError extends Error {
  constructor() {
    super("该专栏仍有子专栏，请先移动或删除子专栏");
    this.name = "ColumnHasChildrenError";
  }
}

async function resolveSlug(input: { slug?: string; name: string }, excludeId?: string) {
  const rows = await db.column.findMany({ select: { id: true, slug: true } });
  const slugs = new Set(rows.filter((row) => row.id !== excludeId).map((row) => row.slug));
  if (input.slug) {
    if (slugs.has(input.slug)) throw new DuplicateColumnSlugError(input.slug);
    return input.slug;
  }
  return uniqueSlug(slugify(input.name), slugs);
}

export function validateParentShape(args: {
  id?: string;
  parentId?: string | null;
  parent?: { id: string; parentId: string | null } | null;
  childCount?: number;
}) {
  if (!args.parentId) return;
  if (!args.parent) throw new InvalidColumnParentError("所选父专栏不存在");
  if (args.id && args.parentId === args.id) throw new InvalidColumnParentError("专栏不能以自己为父级");
  if (args.parent.parentId) throw new InvalidColumnParentError("专栏最多支持两级");
  if ((args.childCount ?? 0) > 0) {
    throw new InvalidColumnParentError("包含子专栏的一级专栏不能移动到其他专栏下");
  }
}

async function validateParent(parentId?: string, id?: string) {
  if (!parentId) return;
  const [parent, current] = await Promise.all([
    db.column.findUnique({ where: { id: parentId }, select: { id: true, parentId: true } }),
    id
      ? db.column.findUnique({
          where: { id },
          select: { _count: { select: { children: true } } },
        })
      : null,
  ]);
  validateParentShape({
    id,
    parentId,
    parent,
    childCount: current?._count.children ?? 0,
  });
}

export async function listColumns(): Promise<ColumnRow[]> {
  return db.column.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: columnSelect });
}

export async function listRootColumns(): Promise<ColumnRow[]> {
  return db.column.findMany({
    where: { parentId: null },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: columnSelect,
  });
}

export async function getColumn(id: string): Promise<ColumnRow | null> {
  return db.column.findUnique({ where: { id }, select: columnSelect });
}

export async function createColumn(input: CreateColumnInput): Promise<ColumnRow> {
  const parentId = input.parentId || undefined;
  await validateParent(parentId);
  const slug = await resolveSlug(input);
  try {
    return await db.column.create({
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        order: input.order,
        ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
      },
      select: columnSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DuplicateColumnSlugError(slug);
    }
    throw error;
  }
}

export async function updateColumn(id: string, input: UpdateColumnInput): Promise<ColumnRow> {
  const existing = await getColumn(id);
  if (!existing) throw new Error("专栏不存在");
  const parentId = input.parentId || undefined;
  await validateParent(parentId, id);
  const slug = await resolveSlug(input, id);
  try {
    return await db.column.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        order: input.order,
        parent: parentId ? { connect: { id: parentId } } : { disconnect: true },
      },
      select: columnSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DuplicateColumnSlugError(slug);
    }
    throw error;
  }
}

export async function deleteColumn(id: string): Promise<void> {
  const row = await db.column.findUnique({
    where: { id },
    select: { _count: { select: { children: true } } },
  });
  if (!row) throw new Error("专栏不存在");
  if (row._count.children > 0) throw new ColumnHasChildrenError();
  await db.$transaction([
    db.article.updateMany({ where: { columnId: id }, data: { columnId: null } }),
    db.column.delete({ where: { id } }),
  ]);
}

export async function reorderColumns(
  parentId: string | null,
  columnIds: string[],
): Promise<{ count: number }> {
  return db.$transaction(async (tx) => {
    const rows = await tx.column.findMany({ where: { parentId }, select: { id: true } });
    const expected = new Set(rows.map((row) => row.id));
    if (expected.size !== columnIds.length || columnIds.some((id) => !expected.has(id))) {
      throw new Error("专栏排序范围不匹配");
    }
    for (let index = 0; index < columnIds.length; index += 1) {
      await tx.column.update({ where: { id: columnIds[index] }, data: { order: index } });
    }
    return { count: columnIds.length };
  });
}

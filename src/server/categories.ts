// Phase 7 / Day 1 -- admin-side Category CRUD + reorder.

import { z } from "zod";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";

const slugSchema = z
  .string()
  .trim()
  .max(80, "slug 不超过 80 字")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 仅支持小写字母、数字、连字符")
  .optional()
  .or(z.literal(""));

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "分类名称不能为空").max(80, "名称不超过 80 字"),
  slug: slugSchema,
  description: z.string().trim().max(500, "描述不超过 500 字").optional().or(z.literal("")),
  order: z.number().int().min(0).default(0),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = CreateCategoryInput;

export const listCategoriesQuerySchema = z.object({
  q: z.string().trim().optional(),
});

export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  order: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { projects: true } },
} satisfies Prisma.CategorySelect;

export type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

async function existingCategorySlugs(): Promise<Set<string>> {
  const rows = await db.category.findMany({ select: { slug: true } });
  return new Set(rows.map((r) => r.slug));
}

export class DuplicateCategorySlugError extends Error {
  constructor(slug: string) {
    super(`分类 slug 已被占用：${slug}`);
    this.name = "DuplicateCategorySlugError";
  }
}

async function resolveSlug(
  input: { slug?: string; name: string },
  excludeId?: string,
): Promise<string> {
  const all = await existingCategorySlugs();
  if (excludeId) {
    const existing = await db.category.findUnique({
      where: { id: excludeId },
      select: { slug: true },
    });
    if (existing) all.delete(existing.slug);
  }
  if (input.slug && input.slug.trim().length > 0) {
    const taken = await db.category.findFirst({
      where: { slug: input.slug, NOT: excludeId ? { id: excludeId } : undefined },
      select: { id: true },
    });
    if (taken) throw new DuplicateCategorySlugError(input.slug);
    return input.slug;
  }
  return uniqueSlug(slugify(input.name), all);
}

/** Backward-compatible read used by the article form select. */
export async function listCategories(_type?: "PROJECT"): Promise<CategoryRow[]> {
  void _type;
  return (await db.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: categorySelect,
  })) as unknown as CategoryRow[];
}

export async function getCategory(id: string): Promise<CategoryRow | null> {
  return (await db.category.findUnique({
    where: { id },
    select: categorySelect,
  })) as unknown as CategoryRow | null;
}

export async function listCategoriesAdmin(
  query: ListCategoriesQuery = {},
): Promise<CategoryRow[]> {
  const where: Prisma.CategoryWhereInput = {
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { slug: { contains: query.q } },
          ],
        }
      : {}),
  };
  return (await db.category.findMany({
    where,
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: categorySelect,
  })) as unknown as CategoryRow[];
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryRow> {
  const slug = await resolveSlug(input);
  try {
    return (await db.category.create({
      data: {
        slug,
        name: input.name,
        description: input.description || null,
        order: input.order,
      },
      select: categorySelect,
    })) as unknown as CategoryRow;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateCategorySlugError(slug);
    }
    throw err;
  }
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<CategoryRow> {
  const existing = await getCategory(id);
  if (!existing) throw new Error("分类不存在");
  const slug = await resolveSlug(input, id);
  try {
    return (await db.category.update({
      where: { id },
      data: {
        slug,
        name: input.name,
        description: input.description || null,
        order: input.order,
      },
      select: categorySelect,
    })) as unknown as CategoryRow;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new DuplicateCategorySlugError(slug);
    }
    throw err;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  await db.category.delete({ where: { id } });
}

export async function reorderCategories(categoryIds: string[]): Promise<{ count: number }> {
  return db.$transaction(async (tx) => {
    const current = await tx.category.findMany({
      select: { id: true },
    });
    const currentSet = new Set(current.map((c) => c.id));
    if (categoryIds.length !== currentSet.size) {
      throw new Error("分类数量不匹配");
    }
    for (const id of categoryIds) {
      if (!currentSet.has(id)) {
        throw new Error(`项目分类不存在：${id}`);
      }
    }
    for (let idx = 0; idx < categoryIds.length; idx++) {
      await tx.category.update({
        where: { id: categoryIds[idx] },
        data: { order: idx },
      });
    }
    return { count: categoryIds.length };
  });
}

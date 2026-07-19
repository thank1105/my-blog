// Phase 3 / Day 1 -- minimal Category helpers (read-only enough for the
// article form to populate a dropdown). Phase 7 (page management) will
// add full CRUD + reordering UI.

import { Prisma, type CategoryType } from "@prisma/client";

import { db } from "@/lib/db";

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  order: true,
  type: true,
} satisfies Prisma.CategorySelect;

export type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

export async function listCategories(type?: CategoryType): Promise<CategoryRow[]> {
  return db.category.findMany({
    where: type ? { type } : undefined,
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: categorySelect,
  });
}

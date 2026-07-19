// Phase 3 / Day 1 -- Tag reads + a tiny "ensure by names" helper so the
// article form can auto-create a tag if the user types a new one. Full
// tag CRUD UI lands in Phase 7.

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

const tagSelect = {
  id: true,
  name: true,
  slug: true,
  color: true,
} satisfies Prisma.TagSelect;

export type TagRow = Prisma.TagGetPayload<{ select: typeof tagSelect }>;

export async function listTags(): Promise<TagRow[]> {
  return db.tag.findMany({
    orderBy: [{ name: "asc" }],
    select: tagSelect,
  });
}

export async function getTagsByIds(ids: readonly string[]): Promise<TagRow[]> {
  if (ids.length === 0) return [];
  return db.tag.findMany({
    where: { id: { in: [...ids] } },
    select: tagSelect,
  });
}

/**
 * Ensure all `names` exist as Tag rows. Returns the matching TagRow list
 * (existing + freshly created). Empty / blank inputs are skipped.
 *
 * Used by the article form when a user types a new tag in the multi-select.
 */
export async function ensureTagsByNames(names: readonly string[]): Promise<TagRow[]> {
  const cleaned = Array.from(
    new Set(
      names
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
        .slice(0, 32), // hard cap per call to prevent typos ballooning rows
    ),
  );
  if (cleaned.length === 0) return [];

  const existing = await db.tag.findMany({
    where: { name: { in: cleaned } },
    select: tagSelect,
  });
  const existingNames = new Set(existing.map((t) => t.name));
  const missing = cleaned.filter((n) => !existingNames.has(n));

  if (missing.length === 0) return existing;

  const created = await Promise.all(
    missing.map(async (name) => {
      const baseSlug = slugify(name) || `tag-${Date.now().toString(36)}`;
      const taken = await db.tag.findFirst({
        where: { slug: baseSlug },
        select: { id: true },
      });
      const slug = taken ? `${baseSlug}-${Math.floor(Math.random() * 10000)}` : baseSlug;
      return db.tag.create({ data: { name, slug }, select: tagSelect });
    }),
  );

  return [...existing, ...created];
}

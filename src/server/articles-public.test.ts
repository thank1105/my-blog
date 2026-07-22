import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  columnFindUnique: vi.fn(),
  columnFindMany: vi.fn(),
  articleFindMany: vi.fn(),
  articleCount: vi.fn(),
  articleGroupBy: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    column: {
      findUnique: mocks.columnFindUnique,
      findMany: mocks.columnFindMany,
    },
    article: {
      findMany: mocks.articleFindMany,
      count: mocks.articleCount,
      groupBy: mocks.articleGroupBy,
    },
  },
}));

import { listColumnTree, listPublishedArticles } from "./articles-public";

describe("public article column queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.articleFindMany.mockResolvedValue([]);
    mocks.articleCount.mockResolvedValue(0);
  });

  it("aggregates a root column with all of its children", async () => {
    mocks.columnFindUnique.mockResolvedValue({
      id: "backend",
      parentId: null,
      children: [{ id: "spring" }, { id: "database" }],
    });

    await listPublishedArticles({ columnSlug: "backend" });

    expect(mocks.articleFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ columnId: { in: ["backend", "spring", "database"] } }),
    }));
  });

  it("filters a child column precisely", async () => {
    mocks.columnFindUnique.mockResolvedValue({ id: "spring", parentId: "backend", children: [] });

    await listPublishedArticles({ columnSlug: "spring" });

    expect(mocks.articleCount).toHaveBeenCalledWith({
      where: expect.objectContaining({ columnId: { in: ["spring"] } }),
    });
  });

  it("keeps unassigned articles in the unfiltered article stream", async () => {
    await listPublishedArticles();

    const call = mocks.articleFindMany.mock.calls[0][0];
    expect(call.where).not.toHaveProperty("columnId");
    expect(call.where).toMatchObject({ status: "PUBLISHED", deletedAt: null });
  });

  it("combines search, tag, and pagination", async () => {
    mocks.articleCount.mockResolvedValue(24);

    const result = await listPublishedArticles({ q: "索引", tagSlug: "database", page: 3, pageSize: 5 });

    expect(mocks.articleFindMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 10,
      take: 5,
      where: expect.objectContaining({
        OR: [{ title: { contains: "索引" } }, { excerpt: { contains: "索引" } }],
        tags: { some: { tag: { slug: "database" } } },
      }),
    }));
    expect(result).toMatchObject({ total: 24, page: 3, pageSize: 5 });
  });

  it("returns an empty result for a missing column", async () => {
    mocks.columnFindUnique.mockResolvedValue(null);

    const result = await listPublishedArticles({ columnSlug: "missing", page: 2 });

    expect(result).toEqual({ rows: [], total: 0, page: 2, pageSize: 12 });
    expect(mocks.articleFindMany).not.toHaveBeenCalled();
  });

  it("reports direct, child, and aggregate published counts", async () => {
    mocks.columnFindMany.mockResolvedValue([
      {
        id: "backend",
        name: "后端工程",
        slug: "backend",
        description: null,
        children: [
          { id: "spring", name: "Spring Boot", slug: "spring", description: null },
          { id: "database", name: "数据库", slug: "database", description: null },
        ],
      },
    ]);
    mocks.articleGroupBy.mockResolvedValue([
      { columnId: "backend", _count: { _all: 2 } },
      { columnId: "spring", _count: { _all: 3 } },
    ]);

    const tree = await listColumnTree();

    expect(tree[0]).toMatchObject({
      directCount: 2,
      totalCount: 5,
      children: [{ id: "spring", count: 3 }, { id: "database", count: 0 }],
    });
  });
});

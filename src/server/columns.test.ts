import { describe, expect, it } from "vitest";

import {
  ColumnHasChildrenError,
  createColumnSchema,
  InvalidColumnParentError,
  validateParentShape,
} from "./columns";
import { resolveColumnScopeIds } from "./articles-public";

describe("column input and hierarchy", () => {
  it("accepts a root, a child, and an empty parent", () => {
    expect(createColumnSchema.safeParse({ name: "后端", slug: "backend", parentId: "", order: 0 }).success).toBe(true);
    expect(createColumnSchema.safeParse({ name: "Redis", slug: "redis", parentId: "root", order: 0 }).success).toBe(true);
  });

  it("rejects invalid slugs and negative order", () => {
    expect(createColumnSchema.safeParse({ name: "后端", slug: "Bad Slug", order: 0 }).success).toBe(false);
    expect(createColumnSchema.safeParse({ name: "后端", slug: "backend", order: -1 }).success).toBe(false);
  });

  it("rejects self-parenting and a third level", () => {
    expect(() => validateParentShape({ id: "a", parentId: "a", parent: { id: "a", parentId: null } })).toThrow(InvalidColumnParentError);
    expect(() => validateParentShape({ parentId: "child", parent: { id: "child", parentId: "root" } })).toThrow("最多支持两级");
  });

  it("prevents a root with children from becoming a child", () => {
    expect(() => validateParentShape({ id: "root", parentId: "other", parent: { id: "other", parentId: null }, childCount: 2 })).toThrow("不能移动");
  });

  it("uses child-only scope for a child and aggregate scope for a root", () => {
    expect(resolveColumnScopeIds({ id: "child", parentId: "root", children: [] })).toEqual(["child"]);
    expect(resolveColumnScopeIds({ id: "root", parentId: null, children: [{ id: "a" }, { id: "b" }] })).toEqual(["root", "a", "b"]);
  });

  it("describes protected parent deletion", () => {
    expect(new ColumnHasChildrenError().message).toContain("子专栏");
  });
});

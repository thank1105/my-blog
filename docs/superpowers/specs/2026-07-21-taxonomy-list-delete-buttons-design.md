# 分类和标签列表删除按钮设计

> 日期：2026-07-21
> 状态：待审核
> 范围：`/admin/categories`、`/admin/tags`

## 1. 背景

分类和标签管理列表目前每行只有“编辑”入口。项目已经在编辑表单中提供删除能力：

- `deleteCategoryAction(id)` 会校验管理员权限、删除分类并刷新 `/admin/categories`；
- `deleteTagAction(id)` 会校验管理员权限、删除标签并刷新 `/admin/tags`；
- 删除分类时，文章和作品会失去分类关联；
- 删除标签时，相关的文章、笔记和作品标签关联会被清理。

本次需求是在两个列表的“编辑”按钮旁增加直接删除按钮，避免用户必须先进入编辑页面。

## 2. 目标与非目标

### 2.1 目标

1. 在分类列表每行的编辑按钮右侧显示删除按钮。
2. 在标签列表每行的编辑按钮右侧显示删除按钮。
3. 删除按钮使用垃圾桶图标 + “删除”文字，并使用危险色区分操作风险。
4. 点击删除前显示带有名称的确认提示，避免误操作。
5. 复用现有服务端 Action、权限校验和数据库删除逻辑。
6. 删除成功后刷新当前列表；删除期间禁用按钮并显示“删除中…”。

### 2.2 非目标

- 不新增软删除或回收站逻辑；沿用当前分类和标签的删除语义。
- 不新增批量删除功能。
- 不新增数据库 Schema、迁移或删除 API。
- 不改变编辑页现有的删除按钮。
- 不实现标签合并功能的列表快捷入口。

## 3. 交互设计

### 3.1 分类列表

每行操作区从左到右为：

```text
[编辑]  [垃圾桶 删除]
```

点击删除后提示：

```text
确定要删除分类“分类名称”吗？文章 / 作品会失去分类关联。
```

确认后调用 `deleteCategoryAction(id)`。成功后分类从当前列表消失；取消则不产生任何修改。

### 3.2 标签列表

每行操作区从左到右为：

```text
[编辑]  [垃圾桶 删除]
```

点击删除后提示：

```text
确定要删除标签“标签名称”吗？所有关联会被清理。
```

确认后调用 `deleteTagAction(id)`。成功后标签从当前列表消失；取消则不产生任何修改。

### 3.3 通用状态和错误处理

- 按钮使用 `useTransition` 管理提交状态。
- 进入提交状态后，按钮显示“删除中…”并禁用，防止重复删除。
- Action 返回成功后调用 `router.refresh()`，保留当前筛选和查询参数。
- Action 异常时保留当前行，并提示“删除失败，请稍后重试”。
- 删除按钮提供包含名称的 `aria-label` 和 `title`。

## 4. 技术方案

### 4.1 客户端按钮组件

新增两个独立客户端组件：

- `src/components/admin/categories/DeleteCategoryButton.tsx`
- `src/components/admin/tags/DeleteTagButton.tsx`

两个组件分别导入对应的服务端 Action，接收以下 Props：

```ts
interface DeleteButtonProps {
  id: string;
  name: string;
}
```

组件负责确认提示、pending 状态、Action 调用、错误提示和路由刷新。独立组件可以让分类和标签的确认文案与删除语义保持清晰，避免将服务端函数作为参数跨越 Server/Client 边界。

### 4.2 列表接入

修改：

- `src/app/(admin)/admin/categories/page.tsx`
- `src/app/(admin)/admin/tags/page.tsx`

在现有操作单元格中使用 `flex` 布局，将删除组件放在编辑链接右侧。列表页面继续保持服务端渲染和现有查询逻辑。

### 4.3 安全边界

不修改现有 Action。每次删除仍由服务端 `requireAdmin()` 再次校验管理员身份，客户端按钮只负责发起交互，不承担权限判断。

## 5. 文件变更范围

### 新增

- `src/components/admin/categories/DeleteCategoryButton.tsx`
- `src/components/admin/tags/DeleteTagButton.tsx`

### 修改

- `src/app/(admin)/admin/categories/page.tsx`
- `src/app/(admin)/admin/tags/page.tsx`

### 不修改

- `src/components/admin/categories/actions.ts`
- `src/components/admin/tags/actions.ts`
- `src/server/categories.ts`
- `src/server/tags.ts`
- Prisma Schema 和迁移文件

## 6. 验收标准

- [ ] 分类列表每行的编辑按钮右侧显示删除按钮。
- [ ] 标签列表每行的编辑按钮右侧显示删除按钮。
- [ ] 删除确认提示包含当前分类或标签名称及关联影响说明。
- [ ] 取消确认不会删除数据。
- [ ] 确认后复用现有删除 Action，列表刷新后对应行消失。
- [ ] 删除期间按钮显示“删除中…”且不可重复点击。
- [ ] 非管理员不能通过客户端按钮绕过服务端权限校验。
- [ ] 当前搜索和分类类型筛选仍然保留。
- [ ] `pnpm typecheck` 通过，`pnpm lint` 无新增错误。

## 7. 验证方式

1. 登录管理员账号访问 `/admin/categories`。
2. 在任意分类行点击删除，确认提示名称和影响说明正确。
3. 点击取消，确认分类仍在列表中。
4. 再次点击并确认，确认分类从列表消失且关联内容不再显示该分类。
5. 访问 `/admin/tags`，重复验证标签删除和关联清理。
6. 执行 `pnpm typecheck`、`pnpm lint` 和现有测试套件。
# 文章列表直接删除按钮设计

> 日期：2026-07-21  
> 状态：待用户审核  
> 范围：`/admin/articles` 文章列表

## 1. 背景

当前文章列表每行只提供“编辑”链接。项目已经具备文章软删除能力：

- `src/server/articles.ts` 的 `softDeleteArticle` 只写入 `deletedAt`；
- `src/components/admin/articles/actions.ts` 的 `softDeleteArticleAction` 会校验管理员权限并刷新 `/admin/articles`；
- 默认文章查询会排除 `deletedAt` 非空的文章。

本次需求是在每行“编辑”右侧增加一个可以直接操作的“删除”按钮。

## 2. 目标与非目标

### 2.1 目标

1. 在文章列表每行的“编辑”右侧显示“删除”按钮。
2. 使用图标 + 文字的清晰样式：垃圾桶图标和“删除”文字。
3. 删除前显示确认提示，避免误操作。
4. 确认后沿用现有软删除逻辑，不永久删除数据库记录。
5. 删除成功后刷新列表，使该文章立即从当前列表消失。
6. 删除期间显示进行中状态并禁用按钮，避免重复提交。
7. 保持管理员权限校验在服务端，不把权限判断交给客户端。

### 2.2 非目标

- 不新增永久删除功能。
- 不新增回收站页面或恢复入口。
- 不改动数据库 Schema、文章查询规则或已有软删除服务函数。
- 不在本次需求中增加批量删除功能。
- 不引入新的通知组件或 UI 依赖。

## 3. 交互设计

### 3.1 正常状态

操作区从左到右为：

```text
[编辑]  [垃圾桶 删除]
```

- “编辑”沿用现有 `text-accent` 样式。
- “删除”使用现有危险色 `text-error`，避免与编辑操作混淆。
- 两个操作使用水平间距，按钮支持换行布局，避免窄屏下溢出。
- 垃圾桶图标使用 `lucide-react` 的 `Trash2`，尺寸与现有 `FileEdit` 一致。
- 删除按钮提供 `aria-label="删除《文章标题》"`，确保图标和文字之外仍有明确的无障碍名称。

### 3.2 确认流程

1. 用户点击“删除”。
2. 浏览器显示确认提示：`确定要将《文章标题》移入回收站吗？`
3. 用户点击取消：不调用服务端 Action，文章保持不变。
4. 用户点击确认：调用 `softDeleteArticleAction(id)`。
5. 调用期间按钮变为“删除中…”并禁用。
6. 调用成功后执行 `router.refresh()`，文章从列表消失。
7. 调用失败时保留文章行，解除进行中状态，并通过浏览器提示“删除失败，请稍后重试”。

本次沿用原生 `window.confirm`，不新增弹窗组件；这样可以保持改动最小，也与现有后台批量删除交互保持一致。

## 4. 技术方案

### 4.1 客户端边界

新增 `src/components/admin/articles/DeleteArticleButton.tsx`，使用 `"use client"`。组件只负责：

- 渲染删除按钮；
- 管理 `pending` 状态；
- 调用确认提示；
- 调用已经存在的 `softDeleteArticleAction`；
- 删除成功后刷新当前路由。

组件 Props：

```ts
interface DeleteArticleButtonProps {
  id: string;
  title: string;
}
```

`/admin/articles/page.tsx` 继续保持服务端页面和数据查询，只在 `ArticleRowView` 的操作单元格中渲染该客户端组件。

### 4.2 服务端边界

不修改现有 `softDeleteArticleAction`：

- 服务端继续通过 `requireAdmin()` 校验权限；
- 继续调用 `softDeleteArticle(id)`；
- 继续 `revalidatePath("/admin/articles")`；
- 数据库记录仍然保留，只更新 `deletedAt`。

这样客户端新增按钮不会绕过现有安全边界，也不会重复实现删除逻辑。

### 4.3 错误与状态

- `useTransition` 用于管理提交期间的禁用状态。
- 成功结果以列表刷新作为反馈，不新增 Toast 依赖。
- 异常结果不刷新列表，使用原生提示告知用户，并恢复按钮可用状态。
- 删除操作使用文章 `id`，确认提示使用文章 `title`；标题仅用于展示，不参与数据库查询条件。

## 5. 文件变更范围

### 新增

- `src/components/admin/articles/DeleteArticleButton.tsx`

### 修改

- `src/app/(admin)/admin/articles/page.tsx`
  - 引入 `DeleteArticleButton`；
  - 在现有“编辑”链接右侧渲染删除按钮。

### 不修改

- `src/server/articles.ts`
- `src/components/admin/articles/actions.ts`
- Prisma Schema 和迁移文件

## 6. 验收标准

- [ ] `/admin/articles` 每篇文章的编辑链接右侧都有“图标 + 删除”按钮。
- [ ] 点击删除后会显示包含文章标题的确认提示。
- [ ] 取消确认不会修改文章。
- [ ] 确认后文章使用软删除，不再出现在文章列表中。
- [ ] 删除期间按钮显示“删除中…”且不可重复点击。
- [ ] 删除失败时文章仍在列表中，并提示用户重试。
- [ ] 非管理员无法通过该按钮绕过服务端权限校验。
- [ ] `pnpm typecheck` 通过，`pnpm lint` 无新增错误。
- [ ] 既有文章编辑和筛选功能不受影响。

## 7. 验证方式

1. 登录管理员账号访问 `/admin/articles`。
2. 对一篇测试文章点击“删除”，确认提示中的标题正确。
3. 先点击取消，确认文章仍在列表中。
4. 再次删除并确认，确认按钮出现“删除中…”后文章从列表消失。
5. 检查数据库中该文章仍存在但 `deletedAt` 非空。
6. 访问该文章的公开链接，确认它不再作为公开文章返回。
7. 执行 `pnpm typecheck` 和 `pnpm lint`。

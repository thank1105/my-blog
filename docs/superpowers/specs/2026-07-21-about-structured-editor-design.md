# 关于我结构化编辑器设计

> 日期：2026-07-21
> 状态：待审核
> 范围：后台 `/admin/pages/about` 与前台 `/about`

## 1. 背景

当前“关于我”页面的后台编辑器将 `Page.meta` 作为一段“JSON / 自由文本”输入，普通用户需要理解 JSON 才能填写头像、社交链接等扩展信息。前台 `/about` 页面目前只渲染 `content` Markdown，`meta` 没有真正参与展示。

本次将 About 的元数据改为结构化表单，让用户通过普通输入框、上传控件、标签和可排序列表维护资料，并让这些字段真正显示在前台。

## 2. 目标与非目标

### 2.1 目标

1. About 后台不再要求用户手写 JSON。
2. 提供六类可视化字段：头像、基本信息、详细介绍、社交链接、技能标签、经历时间线。
3. 社交链接和经历时间线支持添加、删除和调整顺序。
4. 技能标签支持添加和删除。
5. 头像复用现有管理员上传接口，保存为 `/uploads/...` 路径。
6. 元数据继续存储在现有 `Page.meta` 字段中，不新增数据库迁移。
7. 前台 `/about` 读取并展示这些结构化信息。
8. 对空值、旧数据和非法 JSON 做安全回退，不影响页面正常打开。
9. 保留 About 正文的 Markdown 编辑能力和历史版本保存能力。

### 2.2 非目标

- 本次不改造 Now 页面的编辑器；Now 继续使用现有内容和 meta 文本编辑方式。
- 不新增用户认证或权限模型；沿用现有管理员权限。
- 不做头像裁剪、图片编辑或云存储迁移。
- 不新增复杂的拖拽排序库；使用上移 / 下移按钮调整顺序。
- 不引入新的数据库表；不改变 `Page` / `PageRevision` 数据模型。
- 不实现前台实时预览；保存后通过“预览前台”链接查看效果。

## 3. 数据结构

`Page.meta` 继续保存 JSON 字符串，但 JSON 由表单自动生成，用户不直接编辑：

```ts
interface AboutMeta {
  avatar: string;
  displayName: string;
  tagline: string;
  socialLinks: {
    label: string;
    url: string;
  }[];
  skills: string[];
  timeline: {
    year: string;
    title: string;
    description: string;
  }[];
}
```

示例存储结果：

```json
{
  "avatar": "/uploads/2026-07/avatar.jpg",
  "displayName": "小川",
  "tagline": "独立创作者，写作、观察、做项目。",
  "socialLinks": [
    { "label": "GitHub", "url": "https://github.com/example" }
  ],
  "skills": ["写作", "摄影", "TypeScript"],
  "timeline": [
    {
      "year": "2024",
      "title": "开始独立创作",
      "description": "开始持续记录和发布作品。"
    }
  ]
}
```

### 3.1 兼容策略

- `meta` 为空：使用所有字段的空默认值。
- `meta` 是旧的合法 JSON：尽量读取同名字段，缺失字段补默认值。
- `meta` 是非法 JSON 或自由文本：后台表单使用空默认值，前台忽略 meta 并继续显示正文。
- 字段内容保存前通过共享 Zod Schema 校验；不让用户直接接触 JSON 解析错误。

## 4. 后台界面设计

### 4.1 页面布局

采用结构化单页表单，保留现有“内容” Markdown 编辑区和保存历史选项。About 页面各区块顺序为：

1. 基本信息
2. 头像
3. 社交链接
4. 技能标签
5. 详细介绍（现有 Markdown 内容）
6. 经历时间线
7. 保存按钮和历史版本

顶部继续保留“预览前台”链接，指向 `/about`。

### 4.2 基本信息

- 显示名称：普通文本输入，可留空。
- 一句话简介：普通文本输入，建议限制 160 字。

### 4.3 头像

- 复用 `/api/admin/upload` 和现有本地上传规则。
- 显示当前头像预览。
- 支持选择新图片和移除头像。
- 存储值为空或 `/uploads/...` 路径。

### 4.4 社交链接

每一项包含：

- 链接名称
- 链接地址
- 删除按钮
- 上移 / 下移按钮

提供“添加社交链接”按钮。链接地址只允许 `http://`、`https://` 或 `mailto:`，避免保存无效或危险协议。

### 4.5 技能标签

- 输入技能名称后按 Enter 添加。
- 已添加技能以 chip 展示。
- 每个 chip 有删除按钮。
- 空白技能不保存，重复技能不重复添加。

### 4.6 详细介绍

继续使用现有 Markdown 文本区，保存到 `Page.content`。此字段负责主要正文，不与结构化 meta 混用。

### 4.7 经历时间线

每一项包含：

- 年份或时间段
- 标题
- 描述
- 删除按钮
- 上移 / 下移按钮

提供“添加经历”按钮。空白条目不提交或在保存前显示字段错误。

## 5. 前台展示设计

`/about` 页面读取 `content` 和解析后的 AboutMeta：

1. 有头像或基本信息时，在页面顶部显示个人资料头部。
2. 有头像时显示圆形头像；没有头像时不渲染空图片。
3. 有显示名称或 tagline 时显示对应文本；全部为空时保留当前页面标题。
4. 有社交链接时显示链接列表；空列表时隐藏区块。
5. Markdown 正文继续作为主要内容显示。
6. 有技能时显示技能 chip；空列表时隐藏区块。
7. 有经历时按保存顺序显示时间线；空列表时隐藏区块。
8. 所有用户输入文本继续经过现有 Markdown / HTML 安全处理，链接使用安全协议检查。

前台只展示已保存的数据，不在本次需求中增加编辑态预览。

## 6. 技术方案

### 6.1 共享模型与解析

新增 `src/lib/about-meta.ts`，提供：

- `aboutMetaSchema`
- `defaultAboutMeta`
- `parseAboutMeta(value: string | null | undefined)`
- `serializeAboutMeta(value: AboutMeta)`

后台客户端表单和服务端保存 Action 共用同一套 Schema，保证数据契约一致。

### 6.2 编辑器组件

保留 `PageEditor` 作为 About / Now 外层编辑器，但当 `type === "ABOUT"` 时：

- 隐藏原始 meta textarea；
- 显示新的 `AboutMetaEditor`；
- 提交时将结构化表单数据序列化为 `meta` 字符串。

新增组件建议：

- `src/components/admin/pages/AboutMetaEditor.tsx`
- `src/components/admin/pages/AvatarUploader.tsx`（或对现有上传器做最小通用化）

`PageEditor` 继续负责 content、saveRevision、Action 调用和历史版本。

### 6.3 服务端与前台

- `src/components/admin/pages/actions.ts` 的 `upsertPageAction` 继续接收 `meta` 字符串，但新增解析后的结构化校验。
- `src/server/pages.ts` 继续保存字符串，保留 PageRevision 的 meta 快照。
- `src/server/pages-public.ts` 增加安全的 About meta 读取辅助函数，或由 `/about` 调用 `parseAboutMeta`。
- `src/app/(frontend)/about/page.tsx` 增加结构化资料区块。

## 7. 文件变更范围

### 新增

- `src/lib/about-meta.ts`
- `src/components/admin/pages/AboutMetaEditor.tsx`
- 相关测试文件

### 修改

- `src/components/admin/pages/PageEditor.tsx`
- `src/components/admin/pages/actions.ts`
- `src/server/pages-public.ts`
- `src/app/(frontend)/about/page.tsx`

### 不修改

- Prisma Schema 和迁移文件
- Now 页面的现有编辑流程
- 文章、笔记、作品数据模型

## 8. 验收标准

- [ ] About 后台不再显示要求手写 JSON 的 meta textarea。
- [ ] 可以上传、替换和移除头像。
- [ ] 可以编辑显示名称和一句话简介。
- [ ] 可以添加、删除、上移和下移社交链接。
- [ ] 可以添加和删除技能标签，且不保存空白或重复技能。
- [ ] 可以继续编辑 Markdown 详细介绍。
- [ ] 可以添加、删除、上移和下移经历时间线。
- [ ] 保存后 `/about` 能看到已填写的结构化信息。
- [ ] 空字段不会渲染空容器。
- [ ] 非法旧 meta 不会导致后台或前台 500。
- [ ] 历史版本保存和恢复仍然可用。
- [ ] `pnpm typecheck` 通过，`pnpm lint` 无新增错误，测试通过。

## 9. 验证方式

1. 登录管理员进入 `/admin/pages/about`。
2. 填写基本信息、上传头像、添加社交链接、技能和两条经历。
3. 保存并打开 `/about`，逐项确认展示结果。
4. 调整社交链接和经历顺序，保存后确认前台顺序同步。
5. 删除一项技能和一条经历，确认前台对应内容消失。
6. 清空头像和可选字段，确认前台不出现破损图片或空区块。
7. 保留一份旧格式或非法 meta，确认页面仍能正常打开。
8. 检查 About 历史版本保存与恢复。
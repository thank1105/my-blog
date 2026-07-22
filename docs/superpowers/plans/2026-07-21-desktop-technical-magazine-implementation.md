# 小川记事桌面端技术杂志风实施计划

依据：`docs/superpowers/specs/2026-07-21-desktop-technical-magazine-design.md`

## 实施原则

- 桌面 Web 优先，只验收 1440px 和 1920px。
- 不新增平板、手机布局或移动端交互。
- 保留工作区中与本轮无关的未提交文件和改动。
- 不生成默认封面；示例文章使用现有真实图片资源。
- 每完成一个业务边界就先运行对应测试，再继续下一个边界。

## 任务 1：建立封面必填的数据边界

修改文件：

- `prisma/schema.prisma`
- `src/lib/media.ts`
- `src/server/articles.ts`
- `src/server/articles.test.ts`（新增或补充）

步骤：

1. 将 `Article.coverImage` 从 `String?` 改为 `String`。
2. 保留项目和其他内容模型原有的可空封面，不扩大本轮约束范围。
3. 在 `src/lib/media.ts` 新增文章专用的必填封面 schema；不能直接改变所有模块共用的可选 schema。
4. 将文章创建、更新输入切换到必填封面 schema。
5. 创建和更新数据时直接写入非空 `coverImage`，移除 `|| null`。
6. 增加测试：空字符串、纯空格和缺失字段均被拒绝；合法本地上传路径和 HTTP(S) URL 被接受。

验证：

```powershell
pnpm prisma:validate
pnpm typecheck
.\node_modules\.bin\vitest.cmd run src/server/articles.test.ts
```

## 任务 2：补齐 seed 的真实封面并重置本地数据库

修改文件：

- `prisma/seed.ts`

使用资源：

- `public/uploads/2026-07/*`

步骤：

1. 用图片查看工具检查现有上传图片，选择四张构图适合 `16:10` 裁切的真实图片。
2. 为四篇示例文章配置稳定的本地 `/uploads/2026-07/...` 路径。
3. 在 upsert 的 `create` 和 `update` 中都写入封面，确保重复 seed 也会修正数据。
4. 重新生成 Prisma Client。
5. 按未上线项目假设强制重置本地数据库，再执行 seed。
6. 查询数据库确认不存在 `coverImage` 为空的文章。

验证：

```powershell
pnpm prisma:generate
.\node_modules\.bin\prisma.cmd db push --force-reset --skip-generate
pnpm db:seed
```

## 任务 3：后台文章表单强制封面

修改文件：

- `src/components/admin/articles/ArticleForm.tsx`
- `src/components/admin/articles/CoverImageUploader.tsx`
- `src/components/admin/articles/actions.ts`
- 对应表单或 action 测试

步骤：

1. 将文章表单 schema 的 `coverImage` 改为必填。
2. 上传区域标题显示“封面图（必填）”。
3. 将预览区域改为明确的 `16:10` 大预览，帮助作者预判桌面列表裁切效果。
4. 无封面时保留上传操作但显示醒目的字段错误。
5. 已有封面只能“替换”，不提供清空为无封面的最终状态；如果保留移除操作，则提交必须立刻被阻止。
6. 服务端 action 继续输出字段级错误，使绕过客户端的请求也不能保存。
7. 自动保存仅更新标题、正文和摘要，不改变已有封面；创建文章前仍必须先提供封面。

验证：

```powershell
pnpm typecheck
.\node_modules\.bin\vitest.cmd run src/server/articles.test.ts
```

## 任务 4：扩展桌面技术杂志设计令牌

修改文件：

- `tailwind.config.ts`
- `src/app/globals.css`

步骤：

1. 将主背景、文字和现有色值对齐设计规格。
2. 新增稳定命名的靛蓝、青绿及对应浅色 token。
3. 在 CSS 变量和 Tailwind 颜色之间保持单一来源，避免组件内散落十六进制色值。
4. 增加统一的桌面面板、彩色标签、焦点环和图片加载失败状态样式。
5. 保留 `prefers-reduced-motion` 规则。
6. 不增加移动端断点或移动端专项样式。

验证：

```powershell
pnpm typecheck
pnpm lint
```

## 任务 5：重构文章列表项的桌面图文比例

修改文件：

- `src/components/frontend/articles/ArticleListItem.tsx`
- 新增对应组件测试（若当前测试环境支持服务端组件渲染，则直接覆盖；否则测试可提取的样式/内容映射）

步骤：

1. 将结构改为左侧固定比例封面、右侧弹性内容。
2. 桌面主列表使用约 `32% : 68%`，封面显示宽度控制在 300–340px 附近。
3. 封面容器固定 `aspect-[16/10]`，使用 `object-cover`。
4. 移除无封面条件分支，使文章列表拥有稳定结构。
5. 将专栏路径和标签改为低饱和彩色标记，颜色分配使用稳定规则。
6. 标题与摘要分别限制两行；元信息固定在内容底部附近。
7. 更新 Next Image 的 `sizes`，与实际桌面宽度一致。
8. 图片 `alt` 使用文章标题。
9. 增加不超过 2% 的封面悬停缩放、标题变色与可见焦点状态。

验证重点：

- 1440px 下封面不小于列表宽度约 30%。
- 1920px 下封面不会因容器变宽而远离文字。
- 长标题、长摘要不会使卡片失衡。

## 任务 6：首页与复用文章流的桌面视觉升级

修改文件：

- `src/components/frontend/articles/ArticlesList.tsx`
- `src/components/frontend/articles/ColumnTree.tsx`
- `src/components/frontend/articles/TagCloud.tsx`
- `src/app/(frontend)/page.tsx`
- 可新增一个只负责首页导语的前台组件

步骤：

1. 新增紧凑首页导语区，展示站点主张、文章数量和主要专栏入口。
2. 导语区控制在首屏约三分之一内，确保首篇文章仍可见。
3. 将搜索、专栏树和标签合并为一个有浅底色的桌面侧栏面板。
4. 为一级、二级专栏增加清晰缩进、字重和稳定辅助色。
5. 文章结果栏增加白色内容面和更清晰的数量、筛选状态。
6. 空结果、错误和分页统一使用杂志式浅色面板。
7. 保持首页、专栏、标签、归档继续复用 `ArticlesList`，禁止复制列表实现。
8. 不调整移动端折叠逻辑；已有移动端代码只做必要的无回归保持。

验证路由：

- `/`
- `/?q=索引`
- `/columns/backend-engineering`
- `/columns/spring-boot`
- `/tags/engineering`
- `/archive`

## 任务 7：统一专栏目录、Header、Footer 与文章详情

修改文件：

- `src/app/(frontend)/columns/page.tsx`
- `src/components/frontend/Header.tsx`
- `src/components/frontend/HeaderNav.tsx`
- `src/components/frontend/Footer.tsx`
- `src/app/(frontend)/articles/[slug]/page.tsx`

步骤：

1. `/columns` 一级专栏使用稳定的三色顶部标记或浅色标题区。
2. 二级专栏保持紧凑列表，突出名称和文章数量。
3. Header 增强品牌区域、当前导航和搜索入口反馈，不新增菜单项。
4. Footer 使用暖灰分区形成页面结束，不增加装饰性营销内容。
5. 文章详情强化顶部封面、专栏路径、标签和相关文章区域。
6. Markdown 正文保持中性背景和现有阅读宽度。
7. 不修改移动端导航交互。

## 任务 8：桌面浏览器视觉验收

工具与证据：

- 使用项目内开发服务和 Codex 内置浏览器。
- 使用用户提供的两张参考截图作为比例依据。
- 保存 1440px 与 1920px 的首页、专栏页和文章详情截图。

步骤：

1. 启动本地开发服务。
2. 在 1440px 检查首页、专栏、标签、归档、文章详情和后台文章表单。
3. 在 1920px 重复检查首页与文章详情，重点检查内容最大宽度和图文距离。
4. 检查搜索、筛选、清除筛选、分页、悬停和键盘焦点。
5. 检查图片加载失败、长标题、长摘要和空结果。
6. 将参考图与实现截图并排查看，重点修正封面宽度、卡片高度、图文间距、边框和圆角。
7. 完成后关闭仅用于验收的开发服务，并恢复临时浏览器视口。

本轮不以平板或手机截图作为验收项。

## 任务 9：完整质量检查

按顺序运行：

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm build
git diff --check
```

最终检查：

- Prisma 模型、seed、后台和前台对封面必填的定义一致。
- 所有文章列表路由使用同一个新版列表组件。
- 没有引入默认封面或假图片。
- 没有扩大到平板和手机专项开发。
- 没有覆盖工作区内无关的未提交改动。

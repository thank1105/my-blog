# 实时进度（ROADMAP）

> 与 `DEVELOPMENT.md` 配合使用：DEVELOPMENT 写计划与验收标准，ROADMAP 写当日完成度与下一步动作。

## Phase 0 — 项目脚手架（v0.1.0-foundation）

**状态**：✅ 已完成（2026-07-18）

**交付清单**

- [x] Node.js 24 LTS + pnpm 10.34.5 环境就绪
- [x] Next.js 15.5.20 + React 19.1.8 + TypeScript 5.9.3 初始化
- [x] Tailwind CSS 3.4.19 + PostCSS 8.5.6 + Autoprefixer 10.5.2 安装并配置设计 Token
- [x] Prisma 6.19.3 + @prisma/client 6.19.3 装入，schemas 走 SQLite
- [x] ESLint 9.39.2 + Prettier 3.9.2（含 `next/core-web-vitals` 规则）
- [x] shadcn/ui CLI 配置文件 `components.json`（Phase 2 才真正添加组件）
- [x] 项目目录结构遵循 REQUIREMENTS § 9（含 `(frontend)` / `(admin)` 路由组占位）
- [x] `.nvmrc`、`pnpm-lock.yaml`、`.env.example`、`.gitignore`
- [x] 首页占位（Hello World / 小川记事 / PHASE 0 · FOUNDATION）
- [x] Prisma 6.19.3 在 Windows 上的 schema-engine 解析 bug 通过 `scripts/db-prepare.cjs` 绕过（详见 `docs/prisma-known-issues.md`）
- [x] `pnpm dev`、`pnpm prisma:push`、`pnpm typecheck`、`pnpm lint`、`pnpm build` 全部通过

**演示能力**

`pnpm dev` 启动后访问 `http://localhost:3000` 可看到「PHASE 0 · FOUNDATION · 小川记事 · Hello world」占位卡片。

## Phase 1 — 数据库 & 认证（v0.2.0-auth）

**当前进度**：Day 1 + Day 2 已完成（2026-07-18），Git Tag `v0.2.0-auth` 已打。

### Day 1 — 认证核心

**交付清单**

- [x] 安装 NextAuth.js 4.24.14、bcryptjs 3.0.3、react-hook-form 7.82、Zod 3.25、`@hookform/resolvers` 3.10、tsx 4.20
- [x] 顺带引入 Vitest 3.2，作为首个测试框架（Day 2 才真正写单测）
- [x] 补全 `prisma/schema.prisma`：13 张业务表（User/Article/Note/Project/ProjectImage/Album/Photo/Category/Tag/ArticleTag/NoteTag/ProjectTag/Page）+ Role/Visibility/Status/CategoryType/PageType 共 5 个枚举
- [x] `src/lib/auth.ts`：NextAuth v4 Credentials Provider 配置；JWT session；HTTP-only Cookie；bcrypt cost 12；限流在 `authorize()` 内强制
- [x] `src/lib/rate-limit.ts`：进程内滑动窗口限流器（5 次 / 15 分钟），Phase 10 切到 Postgres 后替换实现
- [x] `src/app/api/auth/[...nextauth]/route.ts`：NextAuth API 路由
- [x] `src/types/next-auth.d.ts`：扩展 `Session.user` 与 `JWT` 类型，新增 `id`/`role` 字段
- [x] 登录页 `/login`（server component 拉 session 与 `?error=`）+ `LoginForm` 客户端组件（react-hook-form + Zod 校验）+ `LoginPageError` 中文错误条
- [x] 后台占位 `/admin`：展示当前会话邮箱、名称、角色、会话 ID；提供 SignOut
- [x] `prisma/seed.ts`：幂等 upsert；默认账号 admin@example.com / friend@example.com（密码可由 `SEED_*_PASSWORD` 环境变量覆盖）
- [x] `package.json` 新增 `db:seed`（`prisma db seed` → `tsx prisma/seed.ts`）与 `prisma.seed` 配置
- [x] `.env.example` 新增 `NEXTAUTH_SECRET` / `NEXTAUTH_URL`；本地 `.env` 已生成 48 字节随机密钥
- [x] 端到端验证（手动 + Node 脚本）：`CSRF → 5 次错 → 6 次仍 401 → 正确密码登录 → /admin 渲染邮箱与角色`。

**演示能力**

- 浏览器访问 `/login` 看到中文登录卡；输 admin@example.com / ChangeMe!2026 进入 `/admin`，右上角看到 `ADMIN` 标签、`小川` 名字、会话 ID
- 5 次错密码后第 6 次（含正确密码）被锁定 15 分钟；`/login?error=RateLimited` 显示专门的中文提示
- `pnpm db:seed` 重建/补齐 admin + friend 两个账号

**Day 2 — 用户管理 + 权限中间件**

**交付清单**

- [x] `src/lib/visibility.ts`：可见性矩阵（GUEST/USER/ADMIN × PUBLIC/PRIVATE/PASSWORD）的纯函数实现，单测覆盖整张矩阵（19 个用例）
- [x] `src/middleware.ts`：以 `withAuth` 守卫 `/admin/*`；未登录 → `/login?callbackUrl=...`；非 ADMIN 已登录 → `/`
- [x] `src/server/users.ts`：listUsers / getUser / createUser / updateUser / resetUserPassword / DuplicateUserError；密码统一走 `BCRYPT_COST = 12`；Zod schemas 与表单共享
- [x] `/admin/users` 列表页 + `/admin/users/new` 新建页 + `/admin/users/[id]/edit` 编辑页（含「重置密码」独立卡片、isActive 禁用开关、role 切换）
- [x] `src/components/admin/AdminShell.tsx`：面包屑 + SignOut 占位 header，Phase 2 接 Sidebar 后替掉
- [x] `/admin` dashboard 改为三张统计卡 + 「用户管理」快捷入口，移除 Day 1 占位
- [x] `vitest.config.ts` 接入（`@` 别名与 tsconfig 同源；为后续 component 测试预留 happy-dom）
- [x] `pnpm test` 共 23 个用例通过（visibility 19 + middleware 4）
- [x] `pnpm typecheck` / `pnpm lint` / `pnpm build` 全部通过；`pnpm build` 输出 8 条路由 + `ƒ Middleware 61.6 kB`
- [x] 端到端验证（Node HTTP 脚本）：匿名 /admin → /login、USER /admin → /、ADMIN /admin → dashboard、/admin/users 列表正确、/admin/users/new 表单含邮件 + 密码 + 角色、/admin/users/[id]/edit 含「重置密码」 + 「启用账号」

**演示能力**

- ADMIN 登录后 `/admin` 看到三张统计卡（当前账号 / 账号总数 / 已禁用）+ 「用户管理」入口
- 在 `/admin/users/new` 创建新账号；跳回列表，新账号可见
- 在 `/admin/users/[id]/edit` 一站式改昵称 / 角色 / 启用状态 / 重置密码；表单内联错误、提交后弹「已保存 HH:MM:SS」状态条
- 用 USER 账号登录后访问 `/admin/*` 直接被 middleware 怼回首页

**验收对齐**（DEVELOPMENT.md Phase 1 验收标准全部勾上）

- [x] 访问 `/login` 输入 admin 账号能登录
- [x] 未登录访问 `/admin/*` 跳转到 `/login`
- [x] 登录后访问 `/admin` 能看到用户管理页
- [x] 创建新用户，新用户能登录
- [x] 密码在数据库中是 bcryptjs 哈希（明文看不到）
- [x] 5 次错误密码后被限流 15 分钟
- [x] 关闭浏览器再打开，session 保持（如果选了「记住我」）

**Git Tag**

`v0.2.0-auth`（本地 + 远程均已推送）

**下一步：Phase 2 — 设计系统 & 布局**

- 主色 + 字体 + Header / Footer
- 后台 Sidebar + 后台布局
- 全站统一布局 + 移动端响应式

- `lib/visibility.ts` + 单测，`middleware.ts` 守卫 `/admin/*` + 单测
- 后台 `/admin/users` 列表、新建、编辑、禁用、重置密码
- Phase 1 完成验收 + `v0.2.0-auth` Tag

## Phase 2 — 设计系统 & 布局（v0.3.0-design）

**当前进度**：Day 1 已完成（2026-07-18）；Day 2 待启动。

### Day 1 — 主题 & 字体 & 公共组件

**交付清单**（按 DEVELOPMENT.md Day 1 原始 6 条任务逐条勾选）

- [x] **使用 Tailwind CSS 3.4 配置主题色（主色 `#E85A2C`）**：`tailwind.config.ts` 中 `accent = #E85A2C`、`accent-soft = #FBE6DC`（与 design-decisions.md 第 2 条一致）；globals.css 同步 `--color-accent: 232 90 44` 等 RGB 三元组
- [x] **引入字体（思源黑体、思源宋体、Inter、JetBrains Mono）**：4 个字体全部以 `next/font/local` 自托管到 `.next/static/media/`，**零外部链接**。具体文件位于 `src/fonts/`：
  - `Inter-Regular.woff2` / `Inter-Medium.woff2` / `Inter-Bold.woff2`（Latin UI，~110 KB 各）
  - `JetBrainsMono-Regular.woff2` / `JetBrainsMono-Medium.woff2`（代码，~90 KB 各）
  - `SourceHanSansCN-Regular.otf` / `SourceHanSansCN-Bold.otf`（思源黑体，SubsetOTF / GB2312 3500 字，~8 MB 各）
  - `SourceHanSerifCN-Regular.otf` / `SourceHanSerifCN-Bold.otf`（思源宋体，SubsetOTF / GB2312 3500 字，~11 MB 各）
  - 全部 SIL OFL 1.1 可商用
- [x] **使用 `next/font` 子集化 + 预加载**：`src/app/layout.tsx` 中 4 个 `next/font/local` 实例（`inter` / `sourceHanSansCN` / `sourceHanSerifCN` / `jetbrainsMono`），全部 `display: "swap"`、全部输出 CSS 变量（`--font-sans` / `--font-sans-cn` / `--font-serif` / `--font-mono`）；`tailwind.config.ts` 的 `fontFamily.sans/serif/mono` 优先消费这些变量，并在其后追加 OS fallback 链
- [x] **安装 `lucide-react@0.577.0`**（按 baseline § 2.2 锁定版本）与 **`class-variance-authority@0.7.1`**（shadcn 标准运行时依赖）
- [x] **新增 4 个 shadcn 基础组件**（new-york 风味）：
  - [x] `src/components/ui/button.tsx`：cva + 6 variant（default / destructive / outline / secondary / ghost / link）+ 4 size；暂时去掉 `asChild` 以避免引入 `@radix-ui/react-slot`（Phase 3 文章卡片需要时再加）
  - [x] `src/components/ui/card.tsx`：Card / CardHeader / CardTitle / CardDescription / CardContent / CardFooter
  - [x] `src/components/ui/input.tsx`：单 input，支持 `aria-invalid` 错误样式
  - [x] `src/components/ui/badge.tsx`：cva + 6 variant（default / secondary / outline / soft / success / danger）
- [x] **`src/components/frontend/Header.tsx`**（server component，`getServerSession` 拉登录态）：logo「小川记事」+ 副标题 + 主导航（写作 / 观察 / 项目 / 关于 / 归档）+ 搜索占位按钮（Phase 5 接入）+ 登录态切换（未登录显示「登入」/ 已登录显示「后台」+ 邮箱 + 「退出」）
- [x] **`src/components/frontend/Footer.tsx`**：归档标签（写作 / 观察 / 项目 / 摄影 / 设计 / 生活 / 思考）+ 标语「生活本身就是最好的素材。」+ 署名「— 小川」+ 社交图标（微博 / 邮件 / RSS，均为 lucide-react）
- [x] **重写 `src/app/page.tsx`**：作为 Day 1 视觉演示页，串起 Header + Hero 占位 + 4 张归档卡片（最新文章 / 项目记录 / 创作笔记 / 影像记录，全部为占位数据）+ Footer
- [x] **登录页 `/login`（Phase 1）保持原状**：仍由 root layout 直出，无 Header/Footer；`(frontend)` 路由组目前只有 login 一个页面，尚未创建路由组 layout（留给 Day 2）
- [x] **`pnpm typecheck` / `pnpm lint` / `pnpm build` / `pnpm test`（23 个用例）全部通过**；`pnpm dev` 实测：`/` 渲染 8/8 关键文本、`/login` 仍为极简登录形态
- [x] **`.next/` 构建产物 + dev server CSS 扫描**：**13 个** `@font-face` 定义、**9 个** `/_next/static/media/*.{woff2,otf}` 字体 URL、**0 个** `fonts.googleapis.com` / `fonts.gstatic.com` 链接（dev server 实际访问 `http://localhost:3002/` 验证）

**字体策略决策（追加到 DEVELOPMENT.md 附录 B）**

> 2026-07-18 — Phase 2 Day 1 引入字体时**使用 `next/font/local` 自托管，零外部链接**：从 GitHub 下载 Inter / JetBrains Mono 的 `.woff2` 和 Adobe 官方 Source Han Sans / Serif CN 的 SubsetOTF（GB2312 3500 字子集），全部放入 `src/fonts/`，由 `next/font/local` 在构建期 self-host 到 `.next/static/media/`，文件名 hash 化。运行时浏览器只从同源加载字体，无任何外部网络请求。
> 替代方案：
> 1. `next/font/google` —— 用户明确拒绝（构建期会向 Google Fonts 发起请求，慢）
> 2. 纯系统字体栈 —— 被拒绝（思源黑体 / 宋体 / Inter / JetBrains Mono 在多数用户的系统中实际并未安装，回退命中失败）
> 后续路径：OTF 文件可在 Phase X 进一步用 fonttools 转 woff2，把 Source Han 单字体从 ~10MB 压到 ~3MB

**演示能力**

- 浏览器访问 `/`：Header（小川记事 + 副标题 + 5 项导航 + 搜索图标 + 登入链接）→ Hero 占位（写作 / 观察 / 项目）→ 简介 + 「查看作品」CTA → 4 张归档卡 → Footer（归档标签 + 标语 + 署名 + 社交图标）
- 字体实际效果：英文走 Inter / JetBrains Mono（self-host）；中文标题走思源宋体（self-host）；中文正文走思源黑体（self-host）；所有 OS fallback 在字体加载失败时兜底
- `/login` 仍为 Phase 1 极简登录卡，不被 Header/Footer 干扰
- ADMIN 登录后访问 `/`：Header 右侧切换为「后台 + 邮箱 + 退出」

**关键文件清单**

```
src/fonts/                                       ← 9 个自托管字体文件（SIL OFL 1.1）
  Inter-Regular.woff2 / Medium.woff2 / Bold.woff2
  JetBrainsMono-Regular.woff2 / Medium.woff2
  SourceHanSansCN-Regular.otf / Bold.otf
  SourceHanSerifCN-Regular.otf / Bold.otf
src/app/layout.tsx                              ← 4 个 next/font/local 实例 + CSS 变量输出
src/app/globals.css                             ← 设计 Token；h1/h2/h3 走 theme("fontFamily.serif")
src/app/page.tsx                                ← 重写为带 Header / Footer 的视觉演示页
tailwind.config.ts                              ← fontFamily 优先消费 next/font 变量 + OS fallback 链
src/components/ui/button.tsx                    ← shadcn new-york button（6 variants × 4 sizes）
src/components/ui/card.tsx                      ← Card / CardHeader / CardTitle / CardDescription / CardContent / CardFooter
src/components/ui/input.tsx                     ← shadcn Input，支持 aria-invalid
src/components/ui/badge.tsx                     ← shadcn Badge（6 variants）
src/components/frontend/Header.tsx              ← 前台 Header（server component + getServerSession）
src/components/frontend/Footer.tsx              ← 前台 Footer（归档标签 + 标语 + 社交）
```

**验收对齐**（DEVELOPMENT.md Phase 2 / Day 1 验收标准——与交付清单 1:1 对应）

- [x] Tailwind 主题色：`accent = #E85A2C`（与 design-decisions.md 第 2 条一致）
- [x] 引入字体（思源黑体、思源宋体、Inter、JetBrains Mono）：4 个字体全部 self-host，无外部链接
- [x] 使用 `next/font` 子集化 + 预加载（`display: "swap"`、CSS 变量输出）
- [x] 安装 lucide-react@0.577.0 + Button / Card / Input / Badge 4 个 shadcn 基础组件齐备
- [x] Header：logo + 5 项主导航 + 搜索占位 + 登录态切换
- [x] Footer：归档标签 + 标语 + 署名 + 社交
- [x] 首页可视地展示 Header / Hero / Footer 组合
- [x] `pnpm typecheck / lint / build / test` 全部通过
- [x] 运行时零外部字体 URL（dev server CSS 扫描验证：13 个 `@font-face` + 9 个 self-hosted URL + 0 外部）

- (frontend) 路由组 layout.tsx（Header + main + Footer）；把 login 从路由组里挪出去（顶层 /login）让 layout 不再需要排除路径
- (admin)/admin/layout.tsx 改为 Sidebar + TopBar 结构（替换 Day 1 的 AdminShell 占位）
- 404 / error / loading 三个约定文件
- 移动端响应式：Header 抽屉菜单、Sidebar 折叠
- Git Tag `v0.3.0-design`

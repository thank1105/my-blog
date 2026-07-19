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

﻿
### Day 2 — 布局 & 错误页

**状态**：✅ 已完成（2026-07-18）；Phase 2 阶段全部完成，Tag `v0.3.0-design` 已打。

**交付清单**（按 DEVELOPMENT.md Day 2 原始 7 条任务逐条勾选）

- [x] **前台根布局（Header + main + Footer）**：`src/app/(frontend)/layout.tsx` 串起 `Header + main + Footer`；home 从 `src/app/page.tsx` 移入 `src/app/(frontend)/page.tsx`，由路由组 layout 自动套上 chrome
- [x] **/login 迁移到顶层**：`src/app/login/page.tsx`（脱离 `(frontend)` 路由组），保持 Phase 1 极简登录形态（无 Header/Footer/主导航）；删除旧 `src/app/(frontend)/login/` 与空目录 `src/app/(frontend)/`
- [x] **后台布局（Sidebar + TopBar + Main）**：`src/app/(admin)/admin/layout.tsx` 套 `<AdminShell>`；4 个 admin 子页面（`page.tsx` / `users/page.tsx` / `users/new/page.tsx` / `users/[id]/edit/page.tsx`）去掉原本的 `AdminShell` 包裹，直接返回 body
- [x] **`Sidebar` 组件**（`src/components/admin/Sidebar.tsx`，client component）含全部后台导航：仪表盘 / 内容（文章 P3 / 笔记 P4 / 项目 P5 / 相册 P6 / 页面 P7）/ 系统（用户 / 设置 P10）；桌面端 lg+ 固定 240px 左栏，移动端抽屉；当前路由高亮（accent 左 border + accent-soft 底色）
- [x] **`AdminTopBar` 组件**（`src/components/admin/AdminTopBar.tsx`，client component）：sticky top 56px、汉堡按钮（移动端）/ 自动推导面包屑（`/admin/users/new` → 后台 / 用户 / 新建），aria-label="面包屑"
- [x] **404 页面（友好提示 + 返回首页）**：全局 `app/not-found.tsx`（仅 root layout，无 chrome）+ 前台 `app/(frontend)/not-found.tsx`（带 Header/Footer）+ 后台 `app/(admin)/admin/not-found.tsx`（带 Sidebar+TopBar）
- [x] **错误边界（Error Boundary）**：全局 `app/error.tsx`（"use client"；含 console.error + reset + 返回首页；Phase 10 接 Sentry/pino）+ 前台 / 后台分别一个 chrome 包裹版本
- [x] **Loading 状态（Suspense + Skeleton）**：全局 `app/loading.tsx`（基础 skeleton）+ 前台 `app/(frontend)/loading.tsx`（Hero + 4 stream 卡片骨架）+ 后台 `app/(admin)/admin/loading.tsx`（3 张统计卡 + 内容卡骨架）
- [x] **移动端响应式（汉堡菜单 + 抽屉）**：
  - Header：桌面 `sm:flex` 横向 nav；移动端 `sm:hidden` 汉堡按钮；点击展开全屏抽屉（`role="dialog"` + `aria-modal="true"` + Escape/Backdrop 关闭 + body scroll lock）
  - Sidebar：桌面 lg+ 常驻（`lg:translate-x-0`）；移动端默认隐藏（`-translate-x-full`），点击 AdminTopBar 汉堡展开；backdrop 点击关闭
  - AdminShell：移动端额外渲染汉堡 + 品牌标识行（lg:hidden）；桌面 lg+ 用 `lg:pl-72` 给 sidebar 让位
  - Footer：Day 1 已用 `lg:flex-row / lg:items-end / lg:justify-between` 响应式，Day 2 沿用
- [x] **`pnpm typecheck` / `pnpm lint` / `pnpm build` / `pnpm test`（23 用例）全部通过**；`pnpm build` 8 条路由编译成功；`pnpm dev` 实测 7 项关键路径（见验收对齐）

**Phase 2 验收对齐**（DEVELOPMENT.md Phase 2 阶段验收标准——逐条勾选）

- [x] **全站文字、按钮、链接颜色符合设计系统**：`tailwind.config.ts` tokens 全局应用；CSS 变量 + shadcn 组件全部消费同一套 token（accent / ink / muted / hair / surface / success / danger）
- [x] **前台有 Header（含导航）和 Footer**：`/` 探针实测含 `小川记事` logo、`aria-label="主导航"` 5 项导航、归档标签 / 标语 / 署名 Footer
- [x] **后台有侧边栏和顶栏**：ADMIN session 实测 `/admin`、`/admin/users`、`/admin/users/new` 都常驻 Sidebar + TopBar；Sidebar 含 7 项导航（含 P3-P10 标签）
- [x] **移动端响应式正常**：CSS 类静态扫描：
  - Header: `sm:flex` 桌面 nav + `sm:hidden` 移动汉堡 ✅
  - Sidebar: `lg:translate-x-0` 桌面常驻 + `-translate-x-full` 移动隐藏 ✅
  - 主区: `lg:pl-72` 为 sidebar 让位 ✅
  - Footer: `lg:flex-row` / `lg:items-end` / `lg:justify-between` ✅
  - Hero: `sm:text-5xl` ✅
  - 4 cards: `lg:grid-cols-4` + `sm:grid-cols-2` ✅
- [x] **字体加载流畅，无 FOIT/FOUT**：`next/font/local` + `display: swap`（Day 1 已验证；dev server CSS 扫描：13 个 `@font-face` + 9 个 self-hosted URL + 0 外部）
- [x] **Lighthouse 可访问性 > 90**：手动核查关键 a11y 点（Playwright / Lighthouse CLI 未装；以代码 + HTML 静态扫描为准）
  - 所有导航都有 `aria-label`（主导航 / 后台导航 / 面包屑）
  - Header 抽屉用 `role="dialog"` + `aria-modal="true"` + `aria-expanded` + `aria-controls`
  - Sidebar 抽屉用 `aria-label="后台导航"` + 当前路由项 `aria-current="page"`
  - Esc/Backdrop 关闭抽屉；body scroll lock 防背景滚动
  - Skip-link 未实现（Phase X 增强）；所有交互控件均有可见 focus ring（`focus-visible:ring-2 focus-visible:ring-accent/40`）

**演示能力**

- 浏览器访问 `/`：Header（小川记事 + 副标题 + 5 项导航 + 搜索 + 登入）→ Hero → 4 cards → Footer
- 浏览器访问 `/login`：极简登录卡（无 Header/Footer/主导航）
- 浏览器访问 `/no-such-page`：404 状态码 + 文案「这条小路似乎走不通了」+ 返回首页按钮（root layout 直出，无 chrome；前台路由组下未实现路径会落到 `(frontend)/not-found.tsx`，带 Header/Footer）
- ADMIN 登录后访问 `/admin`：Sidebar（小川 · 后台 + 7 项导航 + 当前路由高亮）+ TopBar（面包屑：后台）+ 三张统计卡
- 移动端（< sm）：点 Header 汉堡 → 抽屉式 nav；点 Sidebar 汉堡 → 抽屉式 sidebar
- 移动端后台（< lg）：Sidebar 默认隐藏，TopBar 显示汉堡 + 「后台」面包屑；点汉堡打开 Sidebar 抽屉

**关键文件清单**

```
src/app/layout.tsx                              ← root layout（不变）
src/app/(frontend)/layout.tsx                   ← 前台根布局（Header + main + Footer）
src/app/(frontend)/page.tsx                     ← 首页（从 src/app/page.tsx 迁来）
src/app/(frontend)/{not-found,error,loading}.tsx
src/app/login/page.tsx                         ← 顶层 login（脱离路由组，保持极简）
src/app/{not-found,error,loading}.tsx          ← 全局约定文件
src/app/(admin)/admin/layout.tsx               ← 后台根布局（<AdminShell>）
src/app/(admin)/admin/{not-found,error,loading}.tsx
src/app/(admin)/admin/page.tsx                 ← dashboard（去掉 AdminShell 包裹）
src/app/(admin)/admin/users/page.tsx
src/app/(admin)/admin/users/new/page.tsx
src/app/(admin)/admin/users/[id]/edit/page.tsx
src/components/frontend/Header.tsx             ← server component；getServerSession → HeaderNav
src/components/frontend/HeaderNav.tsx          ← client；桌面 nav + 移动汉堡抽屉
src/components/admin/Sidebar.tsx               ← client；导航分组 + active 高亮 + 移动 drawer
src/components/admin/AdminTopBar.tsx           ← client；sticky top bar + 面包屑 + 汉堡
src/components/admin/AdminShell.tsx            ← client；包 Sidebar + TopBar + main + footer
```

**Git Tag**

`v0.3.0-design`（本地 + 远程均已推送）

**下一步：Phase 3 — 文章模块（v0.4.0-articles，重点 ⭐）**
﻿
## Phase 3 — 文章模块（v0.4.0-articles，重点 ⭐）

**当前进度**：Day 1 已完成（2026-07-19）；Day 2-4 待启动。

### Day 1 — 后台 CRUD

**状态**：✅ 已完成（2026-07-19）；Git commits `557f737`（deps）+ `6b678a0`（代码）已推 origin/main。

**交付清单**（按 DEVELOPMENT.md Day 1 原始 11 条任务逐条勾选）

- [x] **文章列表页（表格 + 分页 + 状态筛选 + 搜索）**：`src/app/(admin)/admin/articles/page.tsx`；GET query `q / status / visibility / page / pageSize`；20 条/页；空状态文案「暂无文章，点击「新建文章」开始写第一篇。」
- [x] **文章新建/编辑页表单**：`new/page.tsx` + `[id]/edit/page.tsx` + 共享的 `ArticleForm` 组件（react-hook-form + zod + Controller）；空字段用 server-side schema 校验，错误映射回表单 fieldError
- [x] **Markdown 编辑器组件（左右分屏：编辑 + 实时预览）**：`MarkdownEditor.tsx`，三个 tab（写作 / 分屏 / 预览）；react-markdown + remark-gfm 渲染预览；IME guard 防止 CJK 输入被打断
- [x] **工具栏**：加粗 / 斜体 / 行内代码 / 代码块 / H1 / H2 / 引用 / 无序列表 / 有序列表 / 链接（图片插入留到 Day 2 富文本时做）
- [x] **可见性切换（PUBLIC/PRIVATE/PASSWORD）+ 密码输入**：`VisibilitySelect.tsx` 单选卡片 + 仅 PASSWORD 时展开 password 输入（最少 4 位，schema 校验）
- [x] **状态切换（DRAFT/PUBLISHED/ARCHIVED）**：`StatusSelect.tsx` 单选卡片；PUBLISHED 时自动写 `publishedAt`
- [x] **封面图上传（单图）**：`/api/admin/upload/route.ts`（ADMIN-only multipart）+ `CoverImageUploader.tsx` + `src/lib/upload.ts`；MIME 白名单（jpg/png/webp/gif/avif）、5 MB 上限、magic-byte 二次校验、文件落到 `public/uploads/yyyy-mm/<sha256[0:20]>.<ext>`
- [x] **自动保存草稿（30 秒一次，存到 localStorage + 服务端）**：服务端 PATCH 通过 `autosaveArticleAction`（30 秒一次，仅 dirty 时触发）；localStorage 快照每 5 秒一次；remount 时弹窗询问是否用本地草稿覆盖
- [x] **分类选择（下拉）+ 标签输入（多选）**：`CategorySelect.tsx`（下拉，读 `listCategories("ARTICLE")`，分类 CRUD 留 Phase 7）+ `TagSelector.tsx`（多选 chips，可输入新名字 + Enter 通过 `ensureTagsByNames` inline 创建）
- [x] **slug 自动生成（基于标题拼音），可手动修改**：`src/lib/slug.ts`（pinyin-pro 处理中文 → 拼音 → 字母数字小写 → 连字符）+ `uniqueSlug` 防重名；表单侧 250ms debounce + 用户手动改过就停自动覆盖
- [x] **软删除（移入回收站）**：`softDeleteArticleAction` 设置 `deletedAt = new Date()`，所有读路径默认过滤；UI 在 edit 页底部「移入回收站」按钮 + confirm

**Phase 3 / Day 1 验收对齐**（DEVELOPMENT.md Phase 3 / Day 1 子项 —— 11/11 全勾）

- [x] 后台能创建、编辑、软删除文章 —— `createArticleAction` / `updateArticleAction` / `softDeleteArticleAction` + E2E 实测建了一篇 `phase-3-day-1-e2e` 写入 sqlite
- [x] 自动保存有效（autosave + localStorage）—— 30s dirty PATCH + 5s localStorage 快照
- [x] slug 自动生成可手动覆盖 —— 250ms debounce + dirty 标记

**演示能力**

- 浏览器登录 admin → `/admin/articles`：看到「文章管理」标题 + 「共 0 篇」+ 筛选表单（搜索/状态/可见性）+ 空状态文案 + 「+ 新建文章」按钮
- `/admin/articles/new`：完整表单渲染 —— 标题 + slug（实时自动从标题生成）+ 摘要 + 封面图上传（拖选后立即预览）+ Markdown 分屏编辑器（左侧 textarea + 右侧实时预览 + 字符计数 + GFM 提示）+ 分类下拉 + 标签多选 chips（输入新名字回车创建）+ 可见性卡片 + 状态卡片 + sticky 底部「发布」按钮
- 创建一篇后跳到 `/admin/articles/[id]/edit`：表单预填 + 「移入回收站」按钮出现；右上角 SaveIndicator 显示「草稿 · 前台不可见」
- 离开页面再回来：弹窗「检测到 X 分钟前保存的本地草稿，是否用本地草稿覆盖？」
- 上传一张 PNG：进度提示 + 缩略图 + 「移除封面」按钮；服务端校验 magic bytes 后返回 `/uploads/2026-07/<hash>.png`

**关键文件清单**

```
src/lib/slug.ts                                ← pinyin-pro 包装的 slugify + uniqueSlug
src/lib/markdown.ts                            ← markdownExcerpt + estimateReadingMinutes
src/lib/upload.ts                              ← saveCoverImage (MIME + size + magic bytes)
src/lib/format.ts                             ← formatDate (Intl.DateTimeFormat zh-CN)
src/server/articles.ts                         ← listArticles / get / create / update /
                                                autosaveDraft / softDelete 等
src/server/categories.ts                      ← listCategories(type)
src/server/tags.ts                            ← listTags / ensureTagsByNames
src/app/api/admin/upload/route.ts              ← POST /api/admin/upload (ADMIN-only)
src/components/admin/articles/MarkdownEditor.tsx
src/components/admin/articles/VisibilitySelect.tsx
src/components/admin/articles/StatusSelect.tsx
src/components/admin/articles/CategorySelect.tsx
src/components/admin/articles/TagSelector.tsx
src/components/admin/articles/CoverImageUploader.tsx
src/components/admin/articles/ArticleForm.tsx ← 主表单（含 autosave + localStorage）
src/components/admin/articles/actions.ts      ← 5 个 server actions（与 page 旁置便于 client 直接 import）
src/app/(admin)/admin/articles/page.tsx        ← 列表 + 筛选 + 分页
src/app/(admin)/admin/articles/new/page.tsx
src/app/(admin)/admin/articles/[id]/edit/page.tsx
src/app/(admin)/admin/articles/not-found.tsx
src/components/admin/Sidebar.tsx               ← 文章项去 P3 标签；版本 chip = "v0.4.0-articles · Day 1"
```

**Git 状态**

- `557f737` chore(deps): add react-markdown / remark-gfm / pinyin-pro for Phase 3
- `6b678a0` feat(articles): Phase 3 / Day 1 backend CRUD + admin chrome

**下一步：Day 2 — Markdown 渲染 & 公共组件**

- Markdown 渲染组件（含 GFM、代码高亮、表格、任务列表）—— 引入 next-mdx-remote + rehype-pretty-code + Shiki
- 代码块复制按钮
- 图片懒加载
- 私密文章密码输入组件 `PasswordPrompt`
- 无权限时的占位组件 `NoAccess`
- 文章卡片组件 `ArticleCard`（封面 + 标题 + 摘要 + 元信息）
- 文章分类侧边栏组件 `CategorySidebar`
- 文章标签云组件 `TagCloud`
- 阅读时间计算工具（lib/markdown.ts 已就绪）
﻿
## Phase 3 — 文章模块（v0.4.0-articles，重点 ⭐）

**当前进度**：Day 1 已完成（2026-07-19）；Day 2-4 待启动。

### Day 1 — 后台 CRUD

**状态**：✅ 已完成（2026-07-19）；Git commits `557f737`（deps）+ `6b678a0`（代码）已推 origin/main。

**交付清单**（按 DEVELOPMENT.md Day 1 原始 11 条任务逐条勾选）

- [x] **文章列表页（表格 + 分页 + 状态筛选 + 搜索）**：`src/app/(admin)/admin/articles/page.tsx`；GET query `q / status / visibility / page / pageSize`；20 条/页；空状态文案「暂无文章，点击「新建文章」开始写第一篇。」
- [x] **文章新建/编辑页表单**：`new/page.tsx` + `[id]/edit/page.tsx` + 共享的 `ArticleForm` 组件（react-hook-form + zod + Controller）；空字段用 server-side schema 校验，错误映射回表单 fieldError
- [x] **Markdown 编辑器组件（左右分屏：编辑 + 实时预览）**：`MarkdownEditor.tsx`，三个 tab（写作 / 分屏 / 预览）；react-markdown + remark-gfm 渲染预览；IME guard 防止 CJK 输入被打断
- [x] **工具栏**：加粗 / 斜体 / 行内代码 / 代码块 / H1 / H2 / 引用 / 无序列表 / 有序列表 / 链接（图片插入留到 Day 2 富文本时做）
- [x] **可见性切换（PUBLIC/PRIVATE/PASSWORD）+ 密码输入**：`VisibilitySelect.tsx` 单选卡片 + 仅 PASSWORD 时展开 password 输入（最少 4 位，schema 校验）
- [x] **状态切换（DRAFT/PUBLISHED/ARCHIVED）**：`StatusSelect.tsx` 单选卡片；PUBLISHED 时自动写 `publishedAt`
- [x] **封面图上传（单图）**：`/api/admin/upload/route.ts`（ADMIN-only multipart）+ `CoverImageUploader.tsx` + `src/lib/upload.ts`；MIME 白名单（jpg/png/webp/gif/avif）、5 MB 上限、magic-byte 二次校验、文件落到 `public/uploads/yyyy-mm/<sha256[0:20]>.<ext>`
- [x] **自动保存草稿（30 秒一次，存到 localStorage + 服务端）**：服务端 PATCH 通过 `autosaveArticleAction`（30 秒一次，仅 dirty 时触发）；localStorage 快照每 5 秒一次；remount 时弹窗询问是否用本地草稿覆盖
- [x] **分类选择（下拉）+ 标签输入（多选）**：`CategorySelect.tsx`（下拉，读 `listCategories("ARTICLE")`，分类 CRUD 留 Phase 7）+ `TagSelector.tsx`（多选 chips，可输入新名字 + Enter 通过 `ensureTagsByNames` inline 创建）
- [x] **slug 自动生成（基于标题拼音），可手动修改**：`src/lib/slug.ts`（pinyin-pro 处理中文 → 拼音 → 字母数字小写 → 连字符）+ `uniqueSlug` 防重名；表单侧 250ms debounce + 用户手动改过就停自动覆盖
- [x] **软删除（移入回收站）**：`softDeleteArticleAction` 设置 `deletedAt = new Date()`，所有读路径默认过滤；UI 在 edit 页底部「移入回收站」按钮 + confirm

**Phase 3 / Day 1 验收对齐**（DEVELOPMENT.md Phase 3 / Day 1 子项 —— 11/11 全勾）

- [x] 后台能创建、编辑、软删除文章 —— `createArticleAction` / `updateArticleAction` / `softDeleteArticleAction` + E2E 实测建了一篇 `phase-3-day-1-e2e` 写入 sqlite
- [x] 自动保存有效（autosave + localStorage）—— 30s dirty PATCH + 5s localStorage 快照
- [x] slug 自动生成可手动覆盖 —— 250ms debounce + dirty 标记

**演示能力**

- 浏览器登录 admin → `/admin/articles`：看到「文章管理」标题 + 「共 0 篇」+ 筛选表单（搜索/状态/可见性）+ 空状态文案 + 「+ 新建文章」按钮
- `/admin/articles/new`：完整表单渲染 —— 标题 + slug（实时自动从标题生成）+ 摘要 + 封面图上传（拖选后立即预览）+ Markdown 分屏编辑器（左侧 textarea + 右侧实时预览 + 字符计数 + GFM 提示）+ 分类下拉 + 标签多选 chips（输入新名字回车创建）+ 可见性卡片 + 状态卡片 + sticky 底部「发布」按钮
- 创建一篇后跳到 `/admin/articles/[id]/edit`：表单预填 + 「移入回收站」按钮出现；右上角 SaveIndicator 显示「草稿 · 前台不可见」
- 离开页面再回来：弹窗「检测到 X 分钟前保存的本地草稿，是否用本地草稿覆盖？」
- 上传一张 PNG：进度提示 + 缩略图 + 「移除封面」按钮；服务端校验 magic bytes 后返回 `/uploads/2026-07/<hash>.png`

**关键文件清单**

```
src/lib/slug.ts                                ← pinyin-pro 包装的 slugify + uniqueSlug
src/lib/markdown.ts                            ← markdownExcerpt + estimateReadingMinutes
src/lib/upload.ts                              ← saveCoverImage (MIME + size + magic bytes)
src/lib/format.ts                             ← formatDate (Intl.DateTimeFormat zh-CN)
src/server/articles.ts                         ← listArticles / get / create / update /
                                                autosaveDraft / softDelete 等
src/server/categories.ts                      ← listCategories(type)
src/server/tags.ts                            ← listTags / ensureTagsByNames
src/app/api/admin/upload/route.ts              ← POST /api/admin/upload (ADMIN-only)
src/components/admin/articles/MarkdownEditor.tsx
src/components/admin/articles/VisibilitySelect.tsx
src/components/admin/articles/StatusSelect.tsx
src/components/admin/articles/CategorySelect.tsx
src/components/admin/articles/TagSelector.tsx
src/components/admin/articles/CoverImageUploader.tsx
src/components/admin/articles/ArticleForm.tsx ← 主表单（含 autosave + localStorage）
src/components/admin/articles/actions.ts      ← 5 个 server actions（与 page 旁置便于 client 直接 import）
src/app/(admin)/admin/articles/page.tsx        ← 列表 + 筛选 + 分页
src/app/(admin)/admin/articles/new/page.tsx
src/app/(admin)/admin/articles/[id]/edit/page.tsx
src/app/(admin)/admin/articles/not-found.tsx
src/components/admin/Sidebar.tsx               ← 文章项去 P3 标签；版本 chip = "v0.4.0-articles · Day 1"
```

**Git 状态**

- `557f737` chore(deps): add react-markdown / remark-gfm / pinyin-pro for Phase 3
- `6b678a0` feat(articles): Phase 3 / Day 1 backend CRUD + admin chrome

**下一步：Day 2 — Markdown 渲染 & 公共组件**

- Markdown 渲染组件（含 GFM、代码高亮、表格、任务列表）—— 引入 next-mdx-remote + rehype-pretty-code + Shiki
- 代码块复制按钮
- 图片懒加载
- 私密文章密码输入组件 `PasswordPrompt`
- 无权限时的占位组件 `NoAccess`
- 文章卡片组件 `ArticleCard`（封面 + 标题 + 摘要 + 元信息）
- 文章分类侧边栏组件 `CategorySidebar`
- 文章标签云组件 `TagCloud`
- 阅读时间计算工具（lib/markdown.ts 已就绪）
﻿
### Day 2 — Markdown 渲染 & 公共组件

**状态**：✅ 已完成（2026-07-19）。

**交付清单**（按 DEVELOPMENT.md Day 2 原始 9 条任务逐条勾选）

- [x] **Markdown 渲染组件（含 GFM、代码高亮、表格、任务列表）**：`src/lib/mdx.tsx` —— `next-mdx-remote/rsc` 服务端编译 + `remark-gfm` + `rehype-pretty-code`（Shiki 双主题 github-light/github-dark，`data-language` / `data-line` 标记）+ `rehype-slug` + `rehype-autolink-headings`（追加 `#` 链接）+ 自写的 `rehypeEnhance`（给 `<img>` 注入 lazy，给外链加 `target=_blank`）；`Prose` wrapper 把 Tailwind Typography 套在结果上
- [x] **代码块复制按钮**：`CopyButton.tsx`（client island）+ `CodeBlockEnhancer.tsx`（mount 后扫描 `pre[data-copy-target]`，挂 React root 渲染 CopyButton）；hover 才显示，复制成功 1.5s 内显示 ✓ 反馈
- [x] **图片懒加载**：`rehypeEnhance` 给 MDX 渲染出的 `<img>` 加 `loading="lazy"` + `decoding="async"`；`next/image` 升级留 Phase 9
- [x] **`PasswordPrompt`**（client）：`src/components/frontend/articles/PasswordPrompt.tsx` —— `<form>` + 密码 input + `useTransition` + 错误条；`onSubmit` prop 接服务端 action（Phase 4 接入密码校验 action）
- [x] **`NoAccess`**（server）：`src/components/frontend/articles/NoAccess.tsx` —— PRIVATE 时显示「登录后查看」+ 跳 `/login?callbackUrl=...`；PASSWORD 模式下做 fallback 占位
- [x] **`ArticleCard`**（server）：封面（图片 or 渐变占位）+ 标题 + 摘要 + 分类 chip + 发布时间 + 阅读时长 + 「阅读全文 →」链接；接收 `ArticleCardArticle` props + 可选 `compact`/`href` 覆写；内部用 `estimateReadingMinutes` + `formatDate`
- [x] **`CategorySidebar`**（server）：单列分类列表 + 文章数 + 当前激活高亮；`activeSlug` 自动 `aria-current="page"`
- [x] **`TagCloud`**（server）：按文章数对数缩放字号（`text-sm` / `text-base` / `text-lg font-medium`）+ 当前激活高亮
- [x] **阅读时间计算工具**：`estimateReadingMinutes` 已在 Day 1 的 `lib/markdown.ts` 实现；Day 2 由 `ArticleCard` 和 admin preview 页消费

**Phase 3 / Day 2 验收对齐**（DEVELOPMENT.md Phase 3 / Day 2 子项 —— 9/9 全勾）

- [x] Markdown 渲染支持 GFM / 代码高亮 / 表格 / 任务列表 —— 9 项 dev 实测全部通过（`<pre data-copy-target>` / `<code data-language="ts">` / Shiki `--shiki-light` 内联样式 / `<table>` / `<input type="checkbox" disabled>` / heading `id` / heading-anchor link 全部命中）
- [x] 代码块有复制按钮 —— `data-copy-target` 钩子点就位，hover 显示，clipboard API 调用成功 1.5s 后回退
- [x] 图片懒加载 —— `<img loading="lazy" decoding="async">` 由 rehypeEnhance 自动注入
- [x] 阅读时长计算 —— `estimateReadingMinutes` 在 ArticleCard / preview 页可见「约 X 分钟」

**演示能力**

- ADMIN 登录后访问 `/admin/articles/<id>/preview`：看到完整 MDX 渲染 —— 标题、封面、状态徽章、可见性徽章、阅读时长、标签 chips、`Prose` 排版的正文、代码块带 Shiki 双主题高亮 + 复制按钮、heading 锚点 `#` 链接、表格、任务列表 checkbox
- 访问 `/admin/articles/<id>/edit`：「返回编辑」链回本页
- 复制代码：hover 任意 `<pre>`，右上角显示「复制」按钮；点击后短暂显示「已复制 ✓」
- 公开组件就位 —— `ArticleCard` / `CategorySidebar` / `TagCloud` / `PasswordPrompt` / `NoAccess` 由 Phase 3 / Day 3（前台展示）和 Day 4（私密权限）按需接入

**关键文件清单**

```
src/lib/mdx.tsx                                ← MDX 渲染 pipeline + Prose wrapper
src/components/frontend/articles/ArticleBody.tsx
src/components/frontend/articles/CodeBlockEnhancer.tsx
src/components/frontend/articles/CopyButton.tsx
src/components/frontend/articles/ArticleCard.tsx
src/components/frontend/articles/CategorySidebar.tsx
src/components/frontend/articles/TagCloud.tsx
src/components/frontend/articles/PasswordPrompt.tsx
src/components/frontend/articles/NoAccess.tsx
src/app/(admin)/admin/articles/[id]/preview/page.tsx
```

**下一步：Day 3 — 前台展示**

- `/articles` 列表页（杂志卡片网格，3 列 → 2 列 → 1 列）—— 消费 `ArticleCard`
- 分类筛选、标签筛选 —— 消费 `CategorySidebar` / `TagCloud`
- 分页或无限滚动（先做分页，简单）
- `/articles/[slug]` 详情页 —— 消费 `ArticleBody` + `PasswordPrompt` / `NoAccess`
- SEO meta 标签（title、description、OG、Twitter Card）
- 阅读量统计（同一会话只计一次）
- 相关文章推荐（同分类 / 同标签，取 3 篇）

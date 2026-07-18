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

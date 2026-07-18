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

**当前进度**：Day 1 已完成（2026-07-18），目标 Tag `v0.2.0-auth` 待 Day 2 收尾后再打。

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

**已知遗留（Day 2 收尾项）**

- 进程内限流器在多实例 / 重启后会重置。Phase 10 切到 Postgres 时替换为 `LoginAttempt` 表；Day 2 不会动这个
- 后台真正的 `Sidebar` + 列表/新建/编辑/禁用 UI 是 Day 2 任务；今天仅提供最小占位页面
- 用户可见性矩阵 (`lib/visibility.ts`) + `middleware.ts` 守卫 `/admin/*` 都是 Day 2 任务
- 首次单元测试（`lib/visibility.ts` 与 `middleware.ts`）也是 Day 2 任务；Vitest 已经在 devDependency 中并能 `pnpm exec vitest --version` 通过

**下一步：Day 2 — 用户管理 + 权限中间件**

- `lib/visibility.ts` + 单测，`middleware.ts` 守卫 `/admin/*` + 单测
- 后台 `/admin/users` 列表、新建、编辑、禁用、重置密码
- Phase 1 完成验收 + `v0.2.0-auth` Tag

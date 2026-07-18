# 实时进度（ROADMAP）

> 与 `DEVELOPMENT.md` 配合使用：DEVELOPMENT 写计划与验收标准，ROADMAP 写当日完成度与下一步动作。

## Phase 0 — 项目脚手架（v0.1.0-foundation）

**状态**：? 已完成（2026-07-18）

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

## 下一步：Phase 1 — 数据库 & 认证（v0.2.0-auth）

- NextAuth.js 4.24（Credentials Provider，cost 12）
- bcryptjs 3
- react-hook-form 7 + Zod 3.25
- 第一个真实 User 模型 + admin seed
- 登录页 + 受保护的后台骨架
- 首次启用 Vitest

详见 `DEVELOPMENT.md` Phase 1 与 `docs/technology-baseline.md`。

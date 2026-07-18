# 技术栈稳定版本基线

> 基线日期：2026-07-18
> 状态：已确认，适用于 Phase 0–10
> 版本策略：优先使用仍受官方支持、经过生产验证的稳定版本线，不自动追随最新主版本

本文档是 My-Blog 技术版本的**唯一事实来源**。`README.md`、`REQUIREMENTS.md`、`DEVELOPMENT.md` 和设计文档只保留与各自用途相关的摘要；出现差异时，以本文档为准。

## 1. 选择原则

1. 核心框架必须处于官方支持周期内。
2. 默认避开刚发布的最新主版本，优先采用前一个成熟且仍受维护的版本线。
3. 版本较新但上一代已不适合作为新项目基线时，可以采用当前成熟主版本，并明确记录原因。
4. 固定主版本和稳定次版本线；安装时使用该版本线内最新安全补丁。
5. 不使用 `latest`、`next`、`beta`、`canary` 等浮动标签。
6. React 与 React DOM、Prisma CLI 与 Client 必须严格同版；Next.js 与 `eslint-config-next` 必须保持相同版本线。

“稳定”不等于“越旧越好”。Next.js 14 已退出官方支持，因此不再使用；React 19 虽是当前稳定主版本，但已长期稳定并与 Next.js 15 生态兼容，因此纳入基线。

## 2. 完整版本矩阵

表中的“参考补丁”是基线确认时可用的版本。开始实际开发时，可以更新到同一版本线内更高的安全补丁，但不得自行跨越已锁定的主版本或次版本线。

### 2.1 运行环境与核心框架

| 技术 | 锁定版本线 | 参考补丁 | 说明 |
|---|---:|---:|---|
| Node.js | **24 LTS** | 24.18.x | 使用 LTS，不使用非 LTS 的 Node 26 |
| pnpm | **10.x** | 10.34.x | 不升级到 pnpm 11 |
| Next.js | **15.5.x** | 15.5.20 | App Router；官方 Maintenance LTS |
| React | **19.1.x** | 19.1.8 | 与 React DOM 严格同版 |
| React DOM | **19.1.x** | 19.1.8 | 与 React 严格同版 |
| TypeScript | **5.9.x** | 5.9.3 | 不采用新发布的 TypeScript 7 |
| `@types/node` | **24.x** | 同 Node.js 主版本 | 开发依赖 |
| `@types/react` | **19.x** | 同 React 主版本 | 开发依赖 |
| `@types/react-dom` | **19.x** | 同 React DOM 主版本 | 开发依赖 |

### 2.2 UI 与样式

| 技术 | 锁定版本线 | 参考补丁 | 说明 |
|---|---:|---:|---|
| Tailwind CSS | **3.4.x** | 3.4.19 | 使用 `tailwind.config.ts` 配置模型 |
| shadcn/ui CLI | **3.x** | 3.8.5 | 通过 `pnpm dlx shadcn@3.8.5` 初始化 |
| PostCSS | **8.x** | 8.5.x | 开发依赖 |
| Autoprefixer | **10.x** | 10.5.x | 开发依赖 |
| lucide-react | **0.577.x** | 0.577.0 | Phase 2 按需安装 |

shadcn/ui 生成组件时引入的 `class-variance-authority`、`clsx`、`tailwind-merge` 等辅助包，由锁定的 CLI 生成并交给 `pnpm-lock.yaml` 固定，不在架构文档中逐项维护版本。

### 2.3 数据库与认证

| 技术 | 锁定版本线 | 参考补丁 | 说明 |
|---|---:|---:|---|
| Prisma CLI | **6.19.x** | 6.19.3 | 与 `@prisma/client` 严格同版 |
| `@prisma/client` | **6.19.x** | 6.19.3 | 与 Prisma CLI 严格同版 |
| SQLite | **Prisma 内置连接器** | — | Phase 0–9 本地数据库 |
| PostgreSQL | **17.x** | 当前 17.x 安全补丁 | Phase 10 生产数据库 |
| NextAuth.js | **4.24.x** | 4.24.14 | v5 仍为 beta，不采用 |
| bcryptjs | **3.x** | 3.0.3 | 密码哈希 cost 固定为 12 |

认证方案统一为：

> NextAuth.js v4 Credentials Provider + JWT Session + HTTP-only Cookie + bcryptjs（cost 12）。

JWT 是 NextAuth.js 的会话策略；浏览器通过框架管理的 HTTP-only Cookie 持有会话令牌。

### 2.4 Markdown、代码高亮与图片处理

| 技术 | 锁定版本线 | 参考补丁 | 安装阶段 |
|---|---:|---:|---|
| next-mdx-remote | **5.x** | 5.0.0 | Phase 3 |
| remark-gfm | **4.x** | 4.0.1 | Phase 3 |
| rehype-slug | **6.x** | 6.0.0 | Phase 3 |
| rehype-autolink-headings | **7.x** | 7.1.0 | Phase 3 |
| rehype-pretty-code | **0.14.x** | 0.14.4 | Phase 3 |
| Shiki | **3.x** | 3.23.0 | Phase 3，由 rehype-pretty-code 调用 |
| sharp | **0.34.x** | 0.34.5 | 首个图片处理阶段 |

### 2.5 表单、校验与工程工具

| 技术 | 锁定版本线 | 参考补丁 | 说明 |
|---|---:|---:|---|
| react-hook-form | **7.x** | 7.82.x | Phase 1 按需安装 |
| Zod | **3.25.x** | 3.25.76 | 不升级到 Zod 4 |
| ESLint | **9.x** | 9.39.x | Phase 0 开发依赖 |
| `eslint-config-next` | **15.5.x** | 15.5.20 | 与 Next.js 保持相同版本线 |
| Prettier | **3.x** | 3.9.x | Phase 0 开发依赖 |
| Vitest | **3.x** | 3.2.x | 首次编写单元测试时安装 |
| Husky | **9.x** | 9.1.7 | 可选，启用 Git Hooks 时安装 |
| lint-staged | **16.x** | 16.4.x | 可选，与 Husky 同时启用 |

## 3. 分阶段安装边界

统一完整技术栈不代表 Phase 0 一次安装所有依赖。

| 阶段 | 安装范围 |
|---|---|
| Phase 0 | Node.js、pnpm、Next.js、React、React DOM、TypeScript、类型定义、Tailwind CSS、PostCSS、Autoprefixer、Prisma、`@prisma/client`、shadcn/ui CLI、ESLint、`eslint-config-next`、Prettier |
| Phase 1 | NextAuth.js、bcryptjs、react-hook-form、Zod；首次写单元测试时安装 Vitest |
| Phase 2 | lucide-react 和具体 shadcn/ui 组件依赖 |
| Phase 3 | next-mdx-remote、remark/rehype、rehype-pretty-code、Shiki |
| Phase 5–6 | sharp 及图片处理相关依赖（若此前尚未安装） |
| 按需 | Husky、lint-staged，仅在启用提交钩子时安装 |
| Phase 10 | PostgreSQL 17 或提供兼容 PostgreSQL 17 的托管服务 |

## 4. 依赖分类

### 运行时依赖

`next`、`react`、`react-dom`、`@prisma/client`，以及后续阶段实际在应用运行时使用的认证、Markdown、表单、图片和图标依赖。

### 开发依赖

`typescript`、`@types/*`、`tailwindcss`、`postcss`、`autoprefixer`、`prisma`、`eslint`、`eslint-config-next`、`prettier`、`vitest`、`husky`、`lint-staged`。

shadcn/ui CLI 使用固定版本的 `pnpm dlx` 执行，不作为应用运行时依赖。

## 5. 锁定与升级规则

1. `package.json` 写入明确版本，不写浮动标签；实际解析结果由 `pnpm-lock.yaml` 锁定。
2. `packageManager` 字段固定 pnpm 10 的具体版本；Node.js 版本通过 `.nvmrc` 或 `.node-version` 记录。
3. CI 和部署使用 `pnpm install --frozen-lockfile`。
4. 同一版本线内的补丁升级必须通过 lint、类型检查、单元测试和生产构建。
5. 主版本或已锁定次版本线的升级必须单独记录决策，不与普通依赖更新混合。
6. 核心版本退出官方支持、出现无法修复的高危漏洞、部署平台停止支持或关键依赖不兼容时，重新评审本基线。

## 6. 明确不采用的版本

| 不采用 | 原因 |
|---|---|
| Next.js 14 | 已退出官方支持，不适合作为新项目基础 |
| Next.js 16 | 当前 Active LTS，但不是本项目选择的保守稳定线 |
| React 18 | 不是 Next.js 15 新项目的优先生态组合 |
| Tailwind CSS 4 | 会改变现有 `tailwind.config.ts` 与设计 Token 配置方式 |
| Prisma 7 | 最新主版本，当前项目无需承担迁移变化 |
| NextAuth.js 5 beta | 预发布版本，不用于生产基线 |
| TypeScript 7、ESLint 10、Vitest 4、pnpm 11 | 新主版本，暂不引入 |

## 7. 尚未纳入锁定范围的候选项

以下能力仍是后续候选，而不是当前已确认技术栈，因此不在本基线中预先锁定版本：OAuth Provider、Playwright E2E、Sentry SDK、搜索服务、Newsletter/PWA/移动端封装，以及特定云存储 SDK。

启用其中任何一项前，必须先确认必要性和兼容版本，将结果补入本基线，再安装依赖。部署平台、数据库托管、对象存储等 SaaS 服务按其兼容协议和区域能力选择，不使用 npm 主版本规则机械约束。

## 8. 复审依据

- [Next.js Support Policy](https://nextjs.org/support-policy)
- [Node.js Releases](https://nodejs.org/en/about/previous-releases)
- [Prisma 官方文档](https://www.prisma.io/docs)
- [Auth.js 官方文档](https://authjs.dev/)
- [Tailwind CSS v3 文档](https://v3.tailwindcss.com/docs)
- [npm Registry](https://www.npmjs.com/)

文档中的版本状态以基线日期为准；复审依据只用于评估是否升级，不代表自动跟随最新版本。

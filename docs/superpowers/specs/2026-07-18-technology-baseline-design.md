# 完整技术栈稳定版本统一设计

> 日期：2026-07-18
> 状态：已确认，待同步到项目技术文档
> 适用范围：My-Blog 全部开发阶段（Phase 0–10）

## 1. 背景

项目文档当前以 Next.js 14、React 18、Tailwind CSS 3 和 Prisma 5 为基础，但版本描述分散在 `README.md`、`REQUIREMENTS.md`、`DEVELOPMENT.md` 与设计决策文档中，并存在以下问题：

- Next.js 14 已不在 Next.js 官方支持范围内，不适合作为 2026 年新项目的起始版本。
- README、需求文档和开发文档对认证方案分别使用了“Cookie Session”“Auth.js”和“NextAuth.js”等不同表述。
- 核心依赖示例缺少 `react-dom`，并将 TypeScript 放在运行时依赖中。
- Node.js、pnpm、PostgreSQL 等运行环境只给出了过旧的最低版本，没有统一开发基线。
- 多份文档重复维护版本号，容易在后续阶段再次产生漂移。

本设计只统一项目文档，不创建 Next.js 脚手架、不安装依赖，也不修改任何业务代码。

## 2. 目标与非目标

### 2.1 目标

1. 为 Phase 0–10 使用的完整技术栈建立唯一、明确的稳定版本基线。
2. 默认避免刚发布的最新主版本，优先选择仍受支持且经过生产验证的版本线。
3. 统一框架、样式、数据库、认证、内容处理、表单和工程工具的兼容组合。
4. 让 Phase 0 可以直接依据文档安装依赖，无需再次决定主版本。
5. 建立版本升级规则，防止文档与实际依赖再次漂移。

### 2.2 非目标

- 不创建或修改 `package.json`、锁文件、Next.js 源代码或 Prisma Schema。
- 不执行 Phase 0 的安装、初始化、数据库或页面开发任务。
- 不改变现有产品需求、视觉方向、数据模型或阶段划分。
- 不为了追求“全旧一代”而使用已经停止维护或存在明显生态风险的版本。

## 3. 版本选择原则

版本选择按以下优先级执行：

1. **官方支持状态**：不采用已退出官方支持范围的核心框架。
2. **生态兼容性**：框架、React、类型定义、Lint 配置和 UI 工具必须能组成已验证的组合。
3. **成熟度**：默认选择最新主版本的前一个成熟版本，或当前主版本中经过长期验证的稳定版本线。
4. **安全补丁**：固定主版本和稳定次版本，但安装及维护时允许更新该版本线内的安全补丁。
5. **最小迁移成本**：没有明显维护收益时，不主动改变现有文档采用的配置模型。
6. **例外需说明**：若上一主版本已不适合作为新项目基线，则使用当前成熟稳定主版本并记录理由。

“稳定”不等同于“版本越旧越好”。例如 Next.js 14 已停止支持，因此即使改动最少也不进入基线；React 19 虽是当前稳定主版本，但已经成熟并与 Next.js 15 的生态组合更合理，因此作为例外采用。

## 4. 统一版本基线

以下补丁号是 2026-07-18 的参考基线。项目文档以“主版本/稳定次版本线”为长期约束，实际安装时使用该版本线内最新安全补丁，并由 `pnpm-lock.yaml` 锁定最终解析结果。

### 4.1 运行环境与核心框架

| 技术 | 基线版本线 | 参考补丁 | 决策理由 |
|---|---:|---:|---|
| Node.js | 24 LTS | 24.18.x | 当前成熟 LTS；不使用非 LTS 的 Node 26 |
| pnpm | 10.x | 10.34.x | 避开刚发布的 pnpm 11 |
| Next.js | 15.5.x | 15.5.20 | 官方 Maintenance LTS；Next.js 14 已停止支持 |
| React | 19.1.x | 19.1.8 | 与 Next.js 15 兼容，已充分成熟 |
| React DOM | 19.1.x | 19.1.8 | 必须与 React 严格保持相同版本 |
| TypeScript | 5.9.x | 5.9.3 | 生态成熟；暂不使用新发布的 TypeScript 7 |

### 4.2 UI 与样式

| 技术 | 基线版本线 | 参考补丁 | 决策理由 |
|---|---:|---:|---|
| Tailwind CSS | 3.4.x | 3.4.19 | 保留成熟配置模型和现有 `tailwind.config.ts` 设计 Token |
| shadcn/ui CLI | 3.x | 3.8.5 | 避开最新 CLI 主版本，并与既定样式方案保持一致 |
| PostCSS | 8.x | 8.5.x | Tailwind CSS 3 的稳定工具链 |
| Autoprefixer | 10.x | 10.5.x | Tailwind CSS 3 的稳定工具链 |
| lucide-react | 0.577.x | 0.577.0 | 采用进入 1.x 前的成熟 API 线，降低图标 API 变化风险 |

shadcn/ui 生成组件时产生的 `class-variance-authority`、`clsx`、`tailwind-merge` 等辅助依赖，由固定的 shadcn/ui CLI 版本生成并写入锁文件，不在需求文档中逐项充当架构选型。

### 4.3 数据库与认证

| 技术 | 基线版本线 | 参考补丁 | 决策理由 |
|---|---:|---:|---|
| Prisma CLI | 6.19.x | 6.19.3 | 避开 Prisma 7，保留成熟 Schema 与迁移工作流 |
| `@prisma/client` | 6.19.x | 6.19.3 | 必须与 Prisma CLI 严格保持相同版本 |
| SQLite | Prisma 内置连接器 | — | Phase 0–9 本地开发，无需单独安装数据库服务 |
| PostgreSQL | 17.x | 当前 17.x 补丁 | Phase 10 生产数据库；避开最新数据库主版本 |
| NextAuth.js | 4.24.x | 4.24.14 | v4 是稳定版本；不采用仍为 beta 的 v5 |
| bcryptjs | 3.x | 3.0.3 | 成熟纯 JavaScript 密码哈希实现 |

认证方案统一为：

> NextAuth.js v4 Credentials Provider + JWT Session + HTTP-only Cookie + bcryptjs（cost 12）。

“JWT Session”描述 NextAuth.js 的会话策略；浏览器通过由框架管理的 HTTP-only Cookie 持有会话令牌，两者不冲突。

### 4.4 Markdown、代码高亮与图片处理

| 技术 | 基线版本线 | 参考补丁 |
|---|---:|---:|
| next-mdx-remote | 5.x | 5.0.0 |
| remark-gfm | 4.x | 4.0.1 |
| rehype-slug | 6.x | 6.0.0 |
| rehype-autolink-headings | 7.x | 7.1.0 |
| rehype-pretty-code | 0.14.x | 0.14.4 |
| Shiki | 3.x | 3.23.0 |
| sharp | 0.34.x | 0.34.5 |

`rehype-pretty-code` 与 Shiki 共同负责服务端代码高亮；文档不得再将 Shiki 描述成互相独立的第二套渲染方案。

### 4.5 表单、校验与工程工具

| 技术 | 基线版本线 | 参考补丁 | 说明 |
|---|---:|---:|---|
| react-hook-form | 7.x | 7.82.x | 稳定版本，v8 仍为 beta |
| Zod | 3.25.x | 3.25.76 | 避开 Zod 4，减少生态兼容变动 |
| ESLint | 9.x | 9.39.x | 避开 ESLint 10 |
| eslint-config-next | 15.5.x | 15.5.20 | 与 Next.js 严格保持相同版本线 |
| Prettier | 3.x | 3.9.x | 当前成熟稳定主版本 |
| Vitest | 3.x | 3.2.x | 避开 Vitest 4 |
| Husky | 9.x | 9.1.7 | 成熟 Git Hooks 工具链 |
| lint-staged | 16.x | 16.4.x | 避开最新 17.x |

Husky 与 lint-staged 仍为可选工具，是否在 Phase 0 启用保持原开发计划的“可选”定义；版本基线只规定启用时使用的版本。

## 5. 唯一事实来源

新增 `docs/technology-baseline.md` 作为技术版本的唯一事实来源，包含：

1. 版本选择原则；
2. 完整版本矩阵；
3. Phase 0 与后续阶段的安装边界；
4. 版本锁定与升级规则；
5. 被拒绝的核心版本及理由；
6. 基线日期和复审触发条件。

其他文档只保留与其用途直接相关的摘要：

- `README.md`：展示核心技术摘要，并链接到基线文档。
- `REQUIREMENTS.md`：描述完整技术选型和依赖分类，以基线文档为准。
- `DEVELOPMENT.md`：说明每个阶段安装哪些已选定依赖，不自行决定另一套版本。
- `docs/design-decisions.md`：保留设计 Token 和 Tailwind CSS 3 配置模型，链接到基线文档。
- `docs/README.md`：把技术基线加入文档索引。

## 6. 分阶段安装边界

统一完整技术栈不代表 Phase 0 一次安装所有依赖。

### Phase 0 安装

- Node.js 24 LTS、pnpm 10；
- Next.js 15.5、React 19.1、React DOM 19.1；
- TypeScript 5.9 与对应类型定义；
- Tailwind CSS 3.4、PostCSS 8、Autoprefixer 10；
- Prisma 6.19 与 `@prisma/client` 6.19；
- shadcn/ui CLI 3；
- ESLint 9、eslint-config-next 15.5、Prettier 3。

### 后续阶段按需安装

- Phase 1：NextAuth.js、bcryptjs、react-hook-form、Zod。
- Phase 2：lucide-react 与具体 shadcn/ui 组件依赖。
- Phase 3：next-mdx-remote、remark/rehype、Shiki。
- Phase 5–6：sharp 及图片处理相关依赖。
- 测试或提交钩子首次启用时：Vitest、Husky、lint-staged。
- Phase 10：切换到 PostgreSQL 17 或对应版本的托管 PostgreSQL。

## 7. 版本锁定与升级策略

1. `package.json` 使用明确版本，不使用 `latest`、`next`、`beta`、`canary` 等浮动标签。
2. React 与 React DOM 必须严格同版；Prisma CLI 与 Prisma Client 必须严格同版；Next.js 与 eslint-config-next 必须保持相同版本线。
3. `pnpm-lock.yaml` 必须提交到 Git，CI 和部署使用 `pnpm install --frozen-lockfile`。
4. 安全补丁可在同一稳定版本线内升级，但升级后必须运行 lint、类型检查、测试和生产构建。
5. 主版本升级不随日常依赖更新进行，必须单独建立决策记录并验证迁移成本。
6. 出现以下情况时重新评审基线：核心版本退出官方支持、出现无法在当前版本修复的高危漏洞、部署平台停止支持，或关键依赖不再兼容。

## 8. 文档修改范围

实施时只修改或新增以下文档：

- 新增 `docs/technology-baseline.md`；
- 修改 `README.md`；
- 修改 `REQUIREMENTS.md`；
- 修改 `DEVELOPMENT.md`；
- 修改 `docs/design-decisions.md`；
- 修改 `docs/README.md`。

本规格文件保留在 `docs/superpowers/specs/`，用于记录本次决策形成过程，不替代面向项目开发者的技术基线文档。

## 9. 验收标准

1. 所有 Markdown 文档不再把 Next.js 14、React 18、Prisma 5、Node.js 18 或 pnpm 8 描述为当前项目基线。
2. 所有当前版本描述与 `docs/technology-baseline.md` 一致。
3. README、需求文档和开发文档使用同一认证方案名称与会话描述。
4. React/React DOM、Prisma CLI/Client、Next.js/eslint-config-next 的配对约束被明确记录。
5. Phase 0 清单明确实际安装范围，后续依赖保持按需安装。
6. Tailwind CSS 配置说明统一为 3.4 的 `tailwind.config.ts` 模型。
7. 环境要求统一为 Node.js 24 LTS、pnpm 10、本地 SQLite、生产 PostgreSQL 17。
8. 文档链接可解析，Markdown 表格与代码块结构正确。
9. Git 工作区中不出现项目代码、配置文件或依赖锁文件变更。

## 10. 已拒绝方案

### 保留原版本

拒绝 Next.js 14 + React 18 + Prisma 5 的原始组合，因为 Next.js 14 已退出官方支持，不应作为新项目地基。

### 全量使用最新主版本

拒绝 Next.js 16 + Tailwind CSS 4 + Prisma 7 + ESLint 10 + pnpm 11 的组合，因为它扩大脚手架和配置迁移面，也不符合本项目优先稳定而非追新的原则。

### 在每份文档中维护完整版本表

拒绝多点复制版本矩阵。版本只在 `docs/technology-baseline.md` 完整维护，其他文档保留必要摘要和链接，以降低长期漂移风险。

## 11. 版本状态核对来源

- [Next.js Support Policy](https://nextjs.org/support-policy)：确认 15.x 为 Maintenance LTS、14.x 已不受支持。
- [Node.js Releases](https://nodejs.org/en/about/previous-releases)：确认 Node.js 24 为 LTS 版本线。
- [npm Registry](https://www.npmjs.com/)：核对各依赖在 2026-07-18 可用的稳定版本和预发布标签。
- [Auth.js 官方文档](https://authjs.dev/)：核对 NextAuth.js/Auth.js 命名与认证能力。
- [Prisma 官方文档](https://www.prisma.io/docs)：核对 Prisma、SQLite 与 PostgreSQL 工作流。

版本状态可能随时间变化，因此这些链接用于触发基线复审，不意味着自动跟随其最新主版本。

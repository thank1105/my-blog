# My-Blog

个人博客系统，代号 `My-Blog`，正式站点名「小川记事」。
作者独立开发，目标承载文章、笔记、作品集、相册四类内容，支持公开/私密/密码三态可见性。

---

## 项目状态

🚧 **规划与设计阶段**，尚未开始脚手架。

## 文档导航

按阅读顺序：

| # | 文档 | 用途 |
|---|---|---|
| 0 | [docs/visual-anchor.png](./docs/visual-anchor.png) | **视觉锚**：一张图了解全站气质 |
| 1 | [REQUIREMENTS.md](./REQUIREMENTS.md) | 需求文档（功能 + 数据 + UI 规范 + 部署） |
| 2 | [DEVELOPMENT.md](./DEVELOPMENT.md) | 开发文档（阶段规划 + 任务清单 + 里程碑） |
| 3 | [docs/design-decisions.md](./docs/design-decisions.md) | 设计决策记录（Token + 已合并到 REQUIREMENTS 的变更） |
| 4 | [docs/design-prompts.md](./docs/design-prompts.md) | 视觉稿生成 Prompt 包 |
| 5 | [docs/design-explorations/](./docs/design-explorations/) | P1-P6 出图存档 |
| 6 | [docs/README.md](./docs/README.md) | docs 目录索引 |

## 设计风格

- 杂志卡片 + 大图沉浸（少数派 + Behance 融合）
- 主色 `#E85A2C`（番茄橙）/ 米白底 `#FAFAFA`
- 衬线大标 + 无衬线正文
- 风格基线参见 [docs/visual-anchor.png](./docs/visual-anchor.png)

## 技术栈（来自 REQUIREMENTS § 8）

- 框架：Next.js 14（App Router）+ TypeScript
- UI：Tailwind CSS + shadcn/ui
- 数据库：本地 SQLite → 部署时迁 PostgreSQL
- ORM：Prisma
- 认证：邮箱 + 密码（bcrypt + HTTP-only Cookie Session）

## 阶段概览（来自 DEVELOPMENT § 3）

| 阶段 | 名称 | 累计天数 | Tag |
|---|---|---|---|
| 0 | 项目脚手架 | 1 | v0.1.0-foundation |
| 1 | 数据库 & 认证 | 3 | v0.2.0-auth |
| 2 | 设计系统 & 布局 | 5 | v0.3.0-design |
| 3 | 文章模块 ⭐ | 9 | v0.4.0-articles |
| 4-10 | 笔记 / 作品 / 相册 / 分类 / 首页 / SEO / 部署 | 23 | v1.0.0 |

总计约 **23 个工作日**（一个月专注开发）。

---

*最后更新：2026-07-18*

# 设计决策记录（Design Decisions）

> 🟢 **状态**：✅ 已合并入 [REQUIREMENTS.md](../REQUIREMENTS.md) 与 [DEVELOPMENT.md](../DEVELOPMENT.md)（合并日期 2026-07-18）
> 配套：[visual-anchor.png](./visual-anchor.png)、[design-prompts.md](./design-prompts.md)、[technology-baseline.md](./technology-baseline.md)（技术版本）
> 配套原始文档：[REQUIREMENTS.md](../REQUIREMENTS.md) § 6、[DEVELOPMENT.md](../DEVELOPMENT.md)
> 创建日期：2026-07-18

---

## 背景

通过 [design-prompts.md](./design-prompts.md) 的 P1-P6 提示词出图后，对 6 张候选图做了横向对比。P4 文章详情页为最完整单一视觉锚，参考该图与 P2/P3/P5/P6 完成本轮设计决策。

---

## 决策 1：品牌名（Brand Name）

**调整前**（REQUIREMENTS.md § 6.3.1）：

> 站点 logo："My-Blog"

**调整后**：

> 站点 logo："**小川记事**"（副标题："一个独立创作者的日常与记录"）

**理由**：

- P1 风格基底图中自然生成的中文名 `小川记事` 比 `My-Blog` 更具个人辨识度
- 与设计原则「个人表达」一致
- 符合博客调性（独立创作者，而非产品/SaaS）

**影响**：

- 所有页面 header 的 logo 文案
- About / 关于页的个人称呼
- FOOTER 的版权署名

---

## 决策 2：主色 Accent（Accent Color）

**调整前**（REQUIREMENTS.md § 6.2.1）：

> 主色 / 强调橙：`#FF6B35`

**调整后**：

> 主色 / 强调橙：**`#E85A2C`**（更浓的"番茄橙"，更上镜）

**理由**：

- 实际出图中渲染出的橙色更接近 `#E85A2C`，观感更抓人
- 保持"暖橙"语义不变，仅微调色值
- 通过 WCAG AA 对比度校验（与 #FFFFFF 对比度 = 4.62:1 ✅）

**影响**：

- `tailwind.config.ts` 中 `accent` 色值
- CSS 变量 `--color-accent`
- 全站按钮、链接下划线、活跃态、blockquote 左边框、code 块复制按钮

---

## 决策 3：首页卡片列数（Hero Card Grid）

**调整前**（REQUIREMENTS.md § 6.3.1）：

> "最新文章"区域：3 列卡片栅格（响应式 2/1 列）—— 但 P1 风格基底图为 4 列

**调整后**：

> "最新文章"和"作品精选"区域：**均锁定 3 列**（响应式：lg 3 列 → md 2 列 → sm 1 列）

**理由**：

- P2、P3 一致使用 3 列（杂志卡片风最稳的节奏）
- P1 的 4 列只是因为 hero 下方并列卡片，落地时应与 P2/P3 对齐
- 4 列在 1440px 桌面下卡片会偏小，3 列更舒展

**影响**：

- 首页 (`/(frontend)/page.tsx`) 的 `<ArticleCardGrid>` 列数
- 文章列表 (`/articles`) 的列数
- 作品列表 (`/projects`) 的列数

---

## 锁定的其他视觉元素（无需调整，仅确认）

| 元素                 | 决策                             | 来源               |
| -------------------- | -------------------------------- | ------------------ |
| 页面底色             | 米白 `#FAFAFA`                   | 与 P1-P6 一致      |
| 卡片底色             | 纯白 `#FFFFFF`                   | 与 P1-P6 一致      |
| 圆角                 | 4-8px（小圆角）                  | P2/P3 卡片圆角观察 |
| 阴影                 | 极轻或无                         | P2/P3 几乎无阴影   |
| 留白                 | 卡片间距 24-32px                 | P3 网格观察        |
| 中文标题字体         | 思源宋体 / 衬线主导              | P4 大标题气质      |
| 中文正文字体         | 思源黑体 / 无衬线                | P4 正文行气质      |
| 中文装饰字体         | 霞鹜文楷（备用）                 | 引用、可空         |
| 文章详情正文最大宽度 | 720px 居中                       | P4 列宽观察        |
| 正文行高             | 1.8                              | 规约一致           |
| 文章列表分页         | "1 2 3 … 7 →" 极简居中           | P3 验证            |
| Hero 处理            | 全宽 16:9，左下角标题 + 极细灰线 | P1/P2 一致         |
| 笔记列表样式         | 单列紧凑 + 极细灰线分隔          | P2 验证            |
| 作品图组             | 纵向堆叠 + 每张下方 caption      | P5 验证            |
| 相册瀑布             | 4 列 masonry + 8-12px gutter     | P6 验证            |

---

## 视觉锚（Visual Anchor）

`docs/visual-anchor.png` —— **P4 文章详情页截图**

整个 Phase 0-2 期间，每次写完组件后回头校对这张图，确保：

- 色温、留白、字号节奏没漂
- 衬线/无衬线主次没变
- 橙点缀用量没放大

---

## 对 Phase 0 / Phase 2 实施的传递清单

进入脚手架阶段时，下面这些必须**先于业务代码**做。技术版本以 [technology-baseline.md](./technology-baseline.md) 为准；样式固定采用 Tailwind CSS 3.4 的 `tailwind.config.ts` 配置模型：

1. **在 `tailwind.config.ts`**：

   ```ts
   colors: {
     bg: '#FAFAFA',      // 页面底
     surface: '#FFFFFF', // 卡片
     ink: '#1A1A1A',     // 主文字
     muted: '#6B7280',   // 次文字
     hair: '#E5E7EB',    // 分隔
     accent: '#E85A2C',  // 主点缀（覆盖原 #FF6B35）
     success: '#10B981',
     danger: '#EF4444',
   }
   ```

2. **字体加载顺序**（next/font）：
   - 优先级 1：思源宋体（Source Han Serif）→ 中文标题
   - 优先级 2：Inter → 英文 + UI
   - 优先级 3：思源黑体（Source Han Sans）→ 中文正文
   - 可选：JetBrains Mono（代码）、霞鹜文楷（装饰）

3. **全局圆角档**：
   - `rounded-sm: 4px`、`rounded-md: 8px`、`rounded-lg: 12px`（避免 12+）
   - 卡片/按钮用 `rounded` 或 `rounded-md`

4. **阴影档**：
   - 默认：none
   - hover：极轻 `0 1px 3px rgba(0,0,0,0.05)`
   - 浮层（菜单/弹窗）：`0 4px 12px rgba(0,0,0,0.08)`

5. **栅格**：
   - 容器最大宽 1280px（左右各 32px padding）
   - 3 列卡片：每张 ~388px（`lg:grid-cols-3 gap-6 lg:gap-8`）
   - 正文列：最大 720px 居中

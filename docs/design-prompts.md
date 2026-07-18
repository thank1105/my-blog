# 个人博客 My-Blog 视觉稿生成 Prompt 包

> 配套文档：[REQUIREMENTS.md](../REQUIREMENTS.md) § 6、《DEVELOPMENT.md](../DEVELOPMENT.md) § Phase 3-6
> 用途：用 AI 图像工具出几张视觉稿，确定网站视觉基调
> 设计基调（来自设计规范）：**杂志卡片（少数派）+ 大图沉浸（Behance）融合风**

---

## 0. 怎么用这个文档

1. 先用 **P1 主提示词** 确定整体风格基线（出 2-4 张"整站气质"概念图）
2. 再用 **P2-P6 分场景提示词** 出 5 个关键页面的高保真 mock（封面级别即可，不需要细节动效）
3. 把所有出图排在一块，对比后挑出最顺眼的一张，把它的"色温、字体气质、留白节奏"作为后续开发的视觉锚点
4. 建议**同一 prompt 一次性跑 3-4 次**，横向对比选最优

---

## 1. 设计 Token 表（设计系统定义稿）

| Token            | 值                              | 用途                              |
| ---------------- | ------------------------------- | --------------------------------- |
| 主色 / Accent    | **#FF6B35 暖橙**                | 按钮、链接、活跃态、强调          |
| 文字主色         | **#1A1A1A**                     | 标题、主文                        |
| 文字次色         | **#6B7280**                     | 元信息、摘要、标签                |
| 边框/分隔        | **#E5E7EB**                     | 卡片描边、分割线                  |
| 页面底色         | **#FAFAFA 米白**                | body 背景，不用纯白               |
| 卡片底色         | **#FFFFFF**                     | 卡片表面                          |
| 成功             | #10B981                         | 成功态                            |
| 警告             | #EF4444                         | 错误、危险                        |
| 中文字体（标题） | 思源宋体 / 衬线                 | ArticleCard、Article detail title |
| 中文字体（正文） | 思源黑体 / 无衬线               | body、UI 文字                     |
| 英文字体         | Inter                           | 英文与代码外的西文                |
| 代码字体         | JetBrains Mono                  | 代码块                            |
| 圆角             | 4-8px                           | 卡片、按钮                        |
| 阴影             | 极轻 0 1px 3px rgba(0,0,0,0.05) | 不用强阴影                        |
| 留白             | 桌面卡片间距 24-32px            | 大方、克制                        |
| 正文字号/行高    | 16px / 1.8                      | 阅读舒适                          |
| 正文最大宽度     | 720px 居中                      | 文章详情正文                      |

**视觉形容词（写 prompt 用）**：

> editorial magazine, Japanese minimalism, generous whitespace, soft cream background, warm orange accent used sparingly, serif headlines paired with sans-serif body, small radius corners, subtle hairlines instead of strong borders, photography-forward, premium indie zine atmosphere, restrained color palette, not flashy

**反例（避免词）**：

> gradient backgrounds, neon colors, glassmorphism, heavy shadows, big radius, emoji-heavy, AI-looking 3D, comic illustrations, bootstrap-y look, generic SaaS template

---

## 2. P1 — 主提示词（整体风格基底）

跑这个 prompt 出 2-4 张整站气质概念图，**只确定风格方向，不画具体页面布局**。

### 2.1 英文版（Midjourney / GPT-Image）

```
A wide hero composition that captures the visual signature of a personal blog by an independent creator who writes essays, takes photos, and ships small projects. The aesthetic is editorial magazine meets Behance personal portfolio: warm cream paper background (#FAFAFA), generous whitespace, a single hero photograph occupying the upper third in 16:9, large serif headline in deep black (#1A1A1A) set in Source Han Serif feel, soft hairline (#E5E7EB) dividing lines, a few small UI cards below in white with subtle 4-8px corners. Accent color is a single warm orange (#FF6B35) used only on one small call-to-action button and a few underline-links. Body text in clean humanist sans-serif (Source Han Sans feel). The mood is calm, personal, premium but unpretentious — like a curated print zine, not a tech startup landing page. No gradients, no neon, no glassmorphism, no giant shadows. Photographic content is real-looking (film or natural light), not stock-y. Aspect ratio 16:9.
```

### 2.2 中文版（即梦 / 通义万相）

```
独立创作者个人博客的封面视觉稿，宽幅 16:9，整体气质是"杂志编辑感 + Behance 个人作品集"的融合。米白色（#FAFAFA）背景，留白克制而大方，上方三分之一是一张真实质感的生活/纪实摄影大图（16:9，胶片或自然光，不要素材感）。下面是衬线体大字标题（接近思源宋体，#1A1A1A），用极细灰线（#E5E7EB）分隔区域；几张白色小卡片，圆角 4-8px，几乎无阴影。主点缀色是一种暖橙色（#FF6B35），只用在一个 CTA 按钮和少量链接下划线。正文字体是无衬线（接近思源黑体）。整体气质是冷静、个人化、有质感，像一本独立印刷 zine，不像 SaaS 落地页。禁止渐变背景、霓虹色、毛玻璃、强阴影、3D 拟物、卡通插画、emoji。
```

---

## 3. P2 — 首页 `/`（含 Hero + 文章精选 + 作品精选 + 笔记流）

### 3.1 英文版

```
A full-page screenshot mock of a personal blog homepage, 1440px wide, desktop view. Top: minimal header with the site logo "My-Blog" in serif on the left, nav links (首页 / 文章 / 笔记 / 作品 / 相册 / 关于) horizontally centered, search icon and 登录 link on the right.

Below header: a 16:9 hero card with a full-bleed lifestyle photograph (desaturated natural-light photo of someone journaling at a window or walking through city), with title "我在大理住了三个月" in serif headline (~32px) bottom-left, hairline divider beneath.

Then "最新文章" section header in black serif, below it a magazine grid of four white cards in a 3-column layout: each card has a 16:9 photo on top, serif title under it, 2-line grey excerpt, meta row (date · category · read time) at bottom in small grey text. Subtle 4-8px corners. White cards on cream background.

Then "作品精选" section, three wider cards each ~33% wide with a tall preview photo dominating the card and a short serif caption.

Then "最新笔记" section as a compact list (single column) — each row showing date on the left, title in the middle, top-right small visibility badge (a tiny lock icon if private). No background per row, just hairline dividers.

Footer: minimal, two columns — site description on left, link groups on right. White-on-cream, no heavy chrome.

Color: cream #FAFAFA bg, white cards, #1A1A1A text, #6B7280 meta, #FF6B35 on the single "查看全部 →" link. No stock photos, use real-feeling photography. Style: editorial, desktop, screenshot mock.
```

### 3.2 中文版

```
个人博客首页整页 mock，宽屏 1440px 设计稿截图。

顶部：极简导航条，左侧 serif logo "My-Blog"，中间导航"首页 / 文章 / 笔记 / 作品 / 相册 / 关于"，右侧搜索图标 + "登录"链接。

导航下方：一块 16:9 全宽 Hero 大图卡，里面是一张去饱和自然光的生活摄影（窗边写作或城市散步），左下角放置衬线体大字标题"我在大理住了三个月"，下方一条极细灰线分隔。

"最新文章"区域：黑字衬线 section 标题"最新文章"，下方是 3 列卡片栅格（响应式 2/1 列），每张：顶部 16:9 缩略图 → 衬线体标题 → 2 行灰色摘要 → 底部小灰字 meta（日期 · 分类 · 阅读时长）。卡片白底，圆角 4-8px，几乎无阴影。

"作品精选"区域：标题"作品精选" + 3 张更宽的卡片，每张约 33% 宽，纵向预览图占主导，下方短 caption。

"最新笔记"区域：标题"最新笔记" + 紧凑列表（单列），左侧日期、中间标题、右上角小标识（私密锁或密码提示）。无单行背景，只用极细发边灰线分隔。

底部 footer：极简，左右两列（左：站点描述；右：链接组）。

配色：米白底 #FAFAFA，白色卡片，#1A1A1A 主文字，#6B7280 元信息，单点橙色 #FF6B35 只用在"查看全部 →"这类次级链接上。整体克制、写真质感、不要 SaaS 模板感。
```

---

## 4. P3 — 文章列表 `/articles`（杂志卡片网格）

### 4.1 英文版

```
A magazine-style article index page mock, desktop view 1440px wide. 3-column grid of cards on a cream (#FAFAFA) background, each card is white with 4-8px corners and almost no shadow. Card anatomy: 16:9 cover photo at top (lifestyle or travel photography, desaturated, real feel not stock), serif title in deep black (#1A1A1A) below the image, 2-3 lines of grey (#6B7280) excerpt, meta row at bottom showing "摄影 · 8 分钟阅读 · 2026-07-10" in small grey text.

Above grid: a single-line section header "全部文章 · 47 篇" in serif on the left, right-aligned category and tag filter pills (small, hairline-bordered, the active one has a thin #FF6B35 underline instead of fill).

Below grid: minimal pagination "1 2 3 … 7 →" centered, no chunky buttons.

The dominant rhythm is generous whitespace between cards (24-32px gutter). No featured hero on this page — just the grid. Style: editorial, desktop view. Photography must look real, colors muted.
```

### 4.2 中文版

```
文章列表页 mock，桌面 1440px。3 列杂志卡片网格，米白 #FAFAFA 背景，白色卡片，圆角 4-8px，几乎无阴影。

每张卡片：顶部 16:9 封面图（去饱和生活/旅行摄影，要看起来真实非素材）→ 衬线体标题（#1A1A1A 深黑）→ 2-3 行灰色摘要（#6B7280）→ 底部 meta 小灰字"摄影 · 8 分钟阅读 · 2026-07-10"。

网格上方：单行 section 标题"全部文章 · 47 篇"（衬线）左对齐，右对齐分类/标签筛选 pill（极简描边，激活态用细橙线 #FF6B35 下划线，不用填色）。

网格下方：分页 "1 2 3 … 7 →" 极简居中，不要厚按钮。

主节奏：卡片间留白 24-32px，克制大方。本页不加 Hero。桌面视图。
```

---

## 5. P4 — 文章详情 `/articles/[slug]`（沉浸式封面 + 居中正文）

### 5.1 英文版

```
A long-form article reading page mock, desktop view 1440px wide. Composition top-to-bottom:

Top: a full-bleed cover photo (16:9, occupies entire viewport width, slight 5% bottom padding into content area) — natural-light still life or landscape, desaturated, real-feel photography.

Below cover, on cream background: a centered column with maximum width 720px:
1. A serif title "关于散步这件小事" in Source Han Serif feel, ~40px, two-line break allowed
2. Subtitle in smaller grey: "记录一些没有目的地的行走 · 摄影随笔"
3. Meta row with date · category · read time in small grey text, separated by middle dots: "2026-07-12 · 摄影 · 6 分钟阅读"
4. Body: multiple paragraphs with line-height 1.8, generous spacing between paragraphs
5. One inline image mid-article (full 720px width)
6. One code block with subtle grey background and monospace font, with a tiny "copy" button at top-right corner with #FF6B35 accent text
7. One blockquote with a left orange (#FF6B35) 3px border and italic text

Article bottom: tag cloud "#散步 #胶片 #旅行" as small pill chips. Below tags: a centered row "分享到：微博 · Twitter · 复制链接" small text. Then "相关文章" — 3 mini cards horizontally.

No sidebar. No comments. Just the column. Style: editorial long-read, desktop view, very generous whitespace, ~720px reading column centered on cream background.
```

### 5.2 中文版

```
长文章阅读页 mock，桌面 1440px。

顶部：全宽封面大图（16:9，铺满屏宽，底部往正文区下沉约 5%）——自然光静物或风景，去饱和，写真质感。

封面下，米白背景，居中正文列，最大宽度 720px：
1. 衬线体大标题"关于散步这件小事"（Source Han Serif 气质，~40px，可换行两行）
2. 副标题灰色小字"记录一些没有目的地的行走 · 摄影随笔"
3. meta 行：小灰字"2026-07-12 · 摄影 · 6 分钟阅读"，中间点分隔
4. 正文：多段落，行高 1.8，段间留白大方
5. 正文中一张 inline 图（满 720px 宽）
6. 一段代码块（淡灰底，等宽字体，右上角一个细小的"复制"字按钮，强调色 #FF6B35）
7. 一段 blockquote：左侧 3px 橙色 #FF6B35 竖线 + 斜体文字

文末：标签云" #散步  #胶片  #旅行 "小 pill；下方居中一行"分享到：微博 · Twitter · 复制链接"小字；再下方"相关文章"横向 3 张小卡。

没有侧栏、没有评论区。只有这一列。气质：编辑长读，桌面视图，留白克制而大方。
```

---

## 6. P5 — 作品详情 `/projects/[slug]`（Behance 全宽沉浸）

### 6.1 英文版

```
A Behance-style project detail page mock, desktop view 1440px wide. Composition top-to-bottom:

1. Minimal header identical to homepage (logo + nav).

2. A centered header block on cream background: serif project title "西藏 · 阿里 · 一个月" in large (~40px), then below a small grey meta row "2026-05 · #摄影 #旅行 #胶片", then a 1-2 sentence description in muted grey.

3. Below: 5-7 full-bleed photographs stacked vertically, alternating aspect ratios (16:9, 4:3, 3:4 portrait centered at 70% width, 16:9, 3:2, 16:9). These images own the page. Each image has a tiny grey caption beneath (optional, like "夜行列车" in #6B7280, 13px).

4. After images: a centered ~640px text block with 2-3 paragraphs describing the project (gear, locations, story).

5. Bottom block "其他作品 →" with 3 wide cards horizontally.

Atmosphere: intimate, photo-forward, like a personal photo essay book. No marketing CTAs. No comments. Pure visual narrative. Soft cream background, no heavy chrome. Editorial.
```

### 6.2 中文版

```
Behance 风格作品详情页 mock，桌面 1440px。从上到下：

1. 顶部极简导航条（与首页一致）。

2. 居中 header 块，米白背景：衬线体大项目标题"西藏 · 阿里 · 一个月"（~40px），下方小灰字 meta"2026-05 · #摄影 #旅行 #胶片"，再下方 1-2 句灰色简介。

3. 下方：5-7 张全宽照片纵向堆叠，比例交替变化（16:9 / 4:3 / 竖 3:4 居中 70% / 16:9 / 3:2 / 16:9）。图片绝对主导页面。每张图下方配一行极小灰字 caption（如"夜行列车"，#6B7280，13px）。

4. 图片后：居中 ~640px 正文块，2-3 段项目描述（设备、地点、故事）。

5. 末尾"其他作品 →"区：横向 3 张宽卡。

气质：亲密、视觉主导，像一本个人摄影集。无 CTA、无评论区。纯视觉叙事。米白底，无重型 chrome。
```

---

## 7. P6 — 相册瀑布流 `/photos`（Pinterest 风多列）

### 7.1 英文版

```
A Pinterest-style masonry photo grid page mock, desktop view 1440px wide. Cream (#FAFAFA) page background, header same minimal style, then a thin filter row: "全部 · 2025 西藏行 · 2024 京都 · 独立照片" as horizontal pills, with "排序：最新" on the right.

The grid: 4 columns of true masonry (not uniform tile), with images of genuinely varying aspect ratios — some tall portraits, some square, some panorama — fitting together tightly with 8-12px gutters. 30-50 images visible. All photos have a real-feel (travel, life, food, street), warm-but-natural color (not too saturated), like dark-table scanned film photography mixed with phone shots.

Below the grid: minimalist "加载更多" centered button with a hairline border, not a chunky CTA. No infinite scroll indicator.

Hover state on a single card: subtle scale 1.02 with shadow appearing, but in the mock just show the resting state.

Style: editorial photo wall, premium indie photography portfolio feel, not 500px stock.
```

### 7.2 中文版

```
Pinterest 风格照片瀑布流页 mock，桌面 1440px。

米白 #FAFAFA 页面背景，顶部与首页相同的极简导航，下方是一行 filter："全部 · 2025 西藏行 · 2024 京都 · 独立照片" 横排 pill，右侧"排序：最新"。

4 列真正 masonry（非均分 tile），图片真实高宽比不一：有竖版人像、有正方形、有横长图，紧密拼合，间距 8-12px。一屏 30-50 张图。所有图片真实感（旅行、生活、食物、街头），暖而自然（别太饱和），像胶片暗房扫描 + 手机随拍的混合。

瀑布流下方：极简"加载更多"按钮居中，细发边描边而非重型 CTA，不要无限滚动指示。

Hover 单卡：scale 1.02 + 阴影浮现，但 mock 里只展示静态。

气质：编辑级照片墙、质感独立摄影集、不要 500px 那种 stock 站感。
```

---

## 8. 工具适配小贴士

| 工具                               | 备注                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Midjourney**                     | 用上面的英文版，参数 `--ar 16:9 --style raw --s 80`；主提示词可加 `--ar 3:2` 让 hero 更紧凑                              |
| **GPT-Image-1 / DALL-E**           | 英文版或中文版均可；尺寸直接选 16:9 横版                                                                                 |
| **即梦 AI（jimeng.jianying.com）** | 中文版通常效果更稳；用"宽屏 1440px 设计稿截图"作为开头                                                                   |
| **通义万相 / 文心一格**            | 中文版；可在 prompt 后追加"避免文字渲染错误"                                                                             |
| **Stable Diffusion / ComfyUI**     | 英文版 + 加 negative prompt："generic, stock, neon, gradient, glassmorphism, heavy shadow, 3d, cartoon, SaaS, bootstrap" |

---

## 9. 出图后的"挑图"决策清单

出完 4-6 张图后，对照以下 7 个问题做主图遴选：

1. 整体色温是偏暖还是偏冷？博文调性偏好？→ 决定 accent 色
2. Hero 图占版心多少？视觉是更"杂志"还是更"作品集"？→ 决定首页 Hero 占比
3. 卡片圆角偏 4px 还是 8px？→ 落 token
4. 字体气质更衬线主导还是更无衬线主导？→ 落 Typography
5. 阴影有多重？→ 越克制越好（极轻或无）
6. 留白呼吸感足吗？→ 觉得"塞"就放大间距
7. 摄影是胶片/自然光还是过度饱和？→ 影响后续图源选择

挑出的那张"主图"会成为后续所有设计决策的视觉锚，建议截图存到 `docs/visual-anchor.png`，整个开发期围着它校准。

# docs/ 文档索引

> 这是 **My-Blog** 项目的设计文档仓库。所有开发决策、视觉锚、生成素材都在这里。
> 通用项目文档请看根目录的 [README.md](../README.md) 与 [REQUIREMENTS.md](../REQUIREMENTS.md)、[DEVELOPMENT.md](../DEVELOPMENT.md)。

---

## 目录结构

```
docs/
├── README.md                   ← 你在这里
├── visual-anchor.png           ← 视觉锚（文章详情页 P4）
├── design-decisions.md         ← 设计决策与 Token 表
├── design-prompts.md           ← 视觉稿生成 Prompt 包
└── design-explorations/        ← P1-P6 视觉稿原图
    ├── p1-style/               ← 风格基底
    ├── p2-homepage/            ← 首页
    ├── p3-articles/            ← 文章列表
    ├── p4-article-detail/      ← 文章详情（视觉锚源）
    ├── p5-project/             ← 作品详情
    └── p6-photos/              ← 相册瀑布流
```

## 必读顺序

如果是第一次接手本项目，按这个顺序读：

1. **[visual-anchor.png](./visual-anchor.png)** —— 一张图看完全部气质
2. **[design-decisions.md](./design-decisions.md)** —— 3 项决策 + 锁定元素表 + Phase 0 实施清单
3. **[design-prompts.md](./design-prompts.md)** —— 有需要复盘/重新出图时再看
4. **[design-explorations/](./design-explorations/)** —— P1-P6 原图，作参考对比

## 约束规则

- ✅ 任何新决策先记入 `design-decisions.md`，再决定是否同步到 `REQUIREMENTS.md`
- ✅ 不直接修改 `REQUIREMENTS.md` 的 § 6 设计章节，除非有新的设计决策
- ✅ `visual-anchor.png` 是开发期的"标尺"，每个组件完成后用眼睛对照一次

## 重新出图

如果觉得当前视觉锚过时了，按 `design-prompts.md` § 0 的流程重新跑一遍：

```
P1 → P2 → P3 → P4 → P5 → P6
 ↓    ↓    ↓    ↓    ↓    ↓
每张出 3-4 张候选
 ↓
挑出最一致的视觉锚
 ↓
替换 visual-anchor.png
 ↓
追加决策到 design-decisions.md
```

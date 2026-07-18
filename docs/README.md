# docs/ 文档索引

> 这是 **My-Blog** 项目的技术决策、设计决策与视觉素材目录。
> 通用项目文档请看根目录的 [README.md](../README.md)、[REQUIREMENTS.md](../REQUIREMENTS.md) 与 [DEVELOPMENT.md](../DEVELOPMENT.md)。

---

## 目录结构

```text
docs/
├── README.md                   ← 你在这里
├── technology-baseline.md      ← 技术版本唯一事实来源
├── visual-anchor.png           ← 视觉锚（文章详情页 P4）
├── design-decisions.md         ← 设计决策与 Token 表
├── design-prompts.md           ← 视觉稿生成 Prompt 包
├── superpowers/specs/          ← 已批准设计规格存档
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
2. **[technology-baseline.md](./technology-baseline.md)** —— 完整技术版本、安装边界与升级规则
3. **[design-decisions.md](./design-decisions.md)** —— 3 项视觉决策 + 锁定元素表 + Phase 0/2 传递清单
4. **[design-prompts.md](./design-prompts.md)** —— 有需要复盘或重新出图时再看
5. **[design-explorations/](./design-explorations/)** —— P1-P6 原图，作参考对比

## 约束规则

- ✅ 技术版本只在 `technology-baseline.md` 完整维护；其他文档保留摘要和链接
- ✅ 技术主版本升级必须单独记录决策并完成兼容验证
- ✅ 视觉新决策先记入 `design-decisions.md`，再决定是否同步到 `REQUIREMENTS.md`
- ✅ 不直接修改 `REQUIREMENTS.md` 的 § 6 设计章节，除非有新的设计决策
- ✅ `visual-anchor.png` 是开发期的视觉标尺，每个组件完成后都要校对

## 重新出图

如果当前视觉锚过时，按 `design-prompts.md` § 0 的流程重新执行：

```text
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

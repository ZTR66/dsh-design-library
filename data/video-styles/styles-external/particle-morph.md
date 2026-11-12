---
key: particle-morph
name: Particle Morph
description: 粒子聚散造型，成千上万的点在形态间流动重组，抽象而精确
en: 粒子聚散造型
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Particle Morph · 粒子聚散造型

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：hundreds of thousands of glowing particles, gather into shape then scatter, deep blue-black background, lines connecting into a relationship network, big number counter, one English conclusion line as subtitle

**画面要点**：hundreds of thousands of glowing particles, gather into shape then scatter, deep blue-black background, lines connecting into a relationship network, big number counter, one English conclusion line as subtitle

**容易失败的点**：Too few particles or no target shape and the form cannot be read; provide a defined shape and enough particles; the gathering and scattering needs rhythm, so do not let them drift all the time.

**参考主色**：`#3e6cb8` · `#b88a3e`

## 实现提示词

```text
做一支粒子动画，几十万发光粒子在深色背景上聚成你的主题的形状和文字，再散开变成下一个形状。画面要点：数十万发光粒子、聚拢成形再散开、深蓝黑底、连线成关系网络、大数字计数器、一句英文结论字幕。注意：粒子太少或不给目标形状，就读不出造型。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

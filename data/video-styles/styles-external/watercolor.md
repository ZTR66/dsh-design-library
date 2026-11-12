---
key: watercolor
name: Watercolor
description: 水彩手绘，颜料在纸上晕开、边缘沉积、留白透气，柔和自然
en: 水彩手绘
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Watercolor · 水彩手绘

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：warm cotton paper fibers, transparent wash that deepens as it layers, dry-brush skips, paper white as highlight, handwritten notes with leader lines, stroke-by-stroke coloring, mist-wipe transition, low-saturation ochre and gray-blue

**画面要点**：warm cotton paper fibers, transparent wash that deepens as it layers, dry-brush skips, paper white as highlight, handwritten notes with leader lines, stroke-by-stroke coloring, mist-wipe transition, low-saturation ochre and gray-blue

**容易失败的点**：Vector shapes with a watercolor texture look fake at a glance; use variable-width strokes and bristle edges, leave paper white in the highlights, and do not fill whole areas with color.

**参考主色**：`#b88a3e`

## 实现提示词

```text
用 Canvas 画一页会自己上色的水彩手账，主题是你的主题，透明笔触一层层叠，干笔飞白，纸白留作高光。画面要点：暖色棉纸纤维、透明 wash 越叠越深、dry-brush 飞白、纸白当高光、手写批注加引线、逐笔上色、薄雾擦除转场、赭石灰蓝低饱和。注意：矢量图贴水彩纹理会假，要用变宽笔触加毛刷轨迹。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

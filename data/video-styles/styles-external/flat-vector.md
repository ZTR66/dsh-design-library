---
key: flat-vector
name: Flat Vector
description: 扁平矢量插画，纯色块无渐变、无描边，几何化造型，现代简洁
en: 扁平矢量
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Flat Vector · 扁平矢量

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：SVG plus GSAP, large solid color blocks, five-or-six-color high-saturation palette, overshoot elastic easing, anticipation then burst then rebound, about 10% squash and stretch, stagger of two to four frames, shape-wipe transitions

**画面要点**：SVG plus GSAP, large solid color blocks, five-or-six-color high-saturation palette, overshoot elastic easing, anticipation then burst then rebound, about 10% squash and stretch, stagger of two to four frames, shape-wipe transitions

**容易失败的点**：Adding gradients or moving several subjects at once falls apart; let only one hero move at a time; keep solid colors to five or six.

**参考主色**：`#b88a3e` · `#3eb8a8`

## 实现提示词

```text
用 SVG 加 GSAP 做你的主题的扁平矢量讲解，纯色无渐变，五六种高饱和色，元素弹性入场，一镜到底。画面要点：SVG 加 GSAP、纯色大色块、五六色高饱和色板、overshoot 弹性缓动、预备冲出回弹、约 10% 挤压拉伸、stagger 两到四帧、形状擦除转场。注意：加渐变或几个主体同时动就散了，同一时刻只动一个主角。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

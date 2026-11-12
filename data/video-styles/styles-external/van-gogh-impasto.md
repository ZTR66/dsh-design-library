---
key: van-gogh-impasto
name: Van Gogh Impasto
description: 梵高厚涂油画，旋涡状厚笔触、高饱和对比色、画面有隆起质感
en: 梵高厚涂油画
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Van Gogh Impasto · 梵高厚涂油画

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：flat-color underpainting plus flow-field strokes, walls vertical and floor along perspective, starry sky swirling around vortexes, region palettes of a dozen-plus hues, short thick impasto, dark blue outlines, 8fps stroke boil, small objects on their own layers

**画面要点**：flat-color underpainting plus flow-field strokes, walls vertical and floor along perspective, starry sky swirling around vortexes, region palettes of a dozen-plus hues, short thick impasto, dark blue outlines, 8fps stroke boil, small objects on their own layers

**容易失败的点**：Changing only colors without laying strokes is just an ordinary illustration; wall, floor and figure need separate layers with their own strokes; strokes shaking across the whole screen cause dizziness.

**参考主色**：`#3e6cb8` · `#b84e3e`

## 实现提示词

```text
用 Canvas 2D 画你的主题，先平涂底色，再顺着流场铺短粗厚涂笔触，每块区域十几种色相，笔触每秒换八次。画面要点：平涂底稿加流场笔触、墙竖地沿透视星空绕漩涡、区域色板十几种色相、短粗厚涂、深蓝描边、8fps 笔触沸腾、小物件单独成层。注意：墙、地、人物分三遍铺笔触，一套参数跑全图会糊成地毯。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

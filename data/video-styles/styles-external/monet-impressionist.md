---
key: monet-impressionist
name: Impressionist Oil (Monet)
description: 印象派油画，碎笔触、光色交融、模糊边界，莫奈式的朦胧光线
en: 印象派油画／莫奈
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Impressionist Oil (Monet) · 印象派油画／莫奈

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：impressionist with no outlines, horizontal water strokes, colored shadows with warm yellow in light and pale purple in shade, bright short-stroke light flecks trembling, 6fps local stroke boil, water lily and Japanese bridge motifs

**画面要点**：impressionist with no outlines, horizontal water strokes, colored shadows with warm yellow in light and pale purple in shade, bright short-stroke light flecks trembling, 6fps local stroke boil, water lily and Japanese bridge motifs

**容易失败的点**：Strokes shaking across the whole screen cause dizziness, so animate only the water and light flecks; strokes that are too large blur the figures; juxtapose complementary colors and do not mix them into gray.

**参考主色**：`#b86c3e` · `#3e6cb8`

## 实现提示词

```text
用 Canvas 2D 画你的主题，不勾边，水面用横向短笔触，受光侧叠暖黄、背光侧叠淡紫，光斑一闪一闪。画面要点：印象派不勾边、横向水面笔触、受光暖黄背光淡紫的色彩阴影、亮色短笔光斑颤动、6fps 局部笔触沸腾、睡莲日本桥母题。注意：全屏一起沸腾会变满屏噪点，地板和桥这类大面保持不动。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

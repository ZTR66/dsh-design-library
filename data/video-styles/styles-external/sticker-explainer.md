---
key: sticker-explainer
name: Die-cut Sticker Explainer
description: 贴纸科普，模切白边贴纸贴在画面上，粗描边、活泼配色，讲解感
en: 贴纸科普
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Die-cut Sticker Explainer · 贴纸科普

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：photo cut-out stickers with white outline, blue-gray and off-white background, two or three colors plus one accent, flat icons with precise charts, oversized canvas, long-eased pan and zoom, bar growth and number roll-ups

**画面要点**：photo cut-out stickers with white outline, blue-gray and off-white background, two or three colors plus one accent, flat icons with precise charts, oversized canvas, long-eased pan and zoom, bar growth and number roll-ups

**容易失败的点**：More than three colors falls apart; bar heights and numbers must be proportionally accurate or the seriousness is lost; stickers without a white border and drop shadow are just ordinary cut-outs.

**参考主色**：`#b88a3e`

## 实现提示词

```text
用 HTML 大画布做你的主题的科普动画，照片抠图加 10px 白边做成贴纸，蓝灰底只用两三种颜色，镜头在画布上平移缩放。画面要点：照片抠图白描边贴纸、蓝灰米白底、两三色加一个强调色、扁平图标配精确图表、超大画布、长缓动平移缩放、柱状生长与数字滚动。注意：配色一多、图表比例不准，就没有科普的严肃感。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

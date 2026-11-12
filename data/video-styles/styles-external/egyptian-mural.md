---
key: egyptian-mural
name: Ancient Egyptian Mural
description: 古埃及壁画，侧面人物、象形文字、赭石与青金石配色，平涂无透视
en: 古埃及壁画
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Ancient Egyptian Mural · 古埃及壁画

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：profile-face frontal-eye convention, column-divided horizontal registers, hieroglyph columns, flat fills of ochre, lapis, peacock green and earth yellow, black outlines, small hands at the ends of sun rays, lime plaster wall texture

**画面要点**：profile-face frontal-eye convention, column-divided horizontal registers, hieroglyph columns, flat fills of ochre, lapis, peacock green and earth yellow, black outlines, small hands at the ends of sun rays, lime plaster wall texture

**容易失败的点**：Adding perspective and shadows no longer looks like a mural; figures must use the canonical pose with frontal torso and profile head; use only mineral colors such as ochre red, earth yellow and blue-green.

**参考主色**：`#b88a3e`

## 实现提示词

```text
用 Canvas 2D 把你的主题画成古埃及墓室壁画，人物侧脸正眼，分栏横带构图配象形文字栏，赭石青金平涂加黑描边。画面要点：侧脸正眼程式、分栏横带 register、象形文字栏、赭石青金孔雀绿土黄平涂、黑色描边、太阳光线末端小手、墙面石灰质感。注意：壁画是平的，别加透视和阴影，再让河水和光线动起来免得太静。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

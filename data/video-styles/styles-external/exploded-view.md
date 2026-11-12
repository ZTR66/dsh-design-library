---
key: exploded-view
name: Product Exploded View
description: 产品爆炸拆解图，零件沿轴向分离悬浮，标注引线，工业设计感
en: 产品爆炸拆解
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Product Exploded View · 产品爆炸拆解

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：real CAD/PCB/BOM, evenly spaced layers along one axis, PBR studio key light plus cool rim light, HDRI reflections, leader lines and dimension lines, camera moving between layers, closing back together at the end

**画面要点**：real CAD/PCB/BOM, evenly spaced layers along one axis, PBR studio key light plus cool rim light, HDRI reflections, leader lines and dimension lines, camera moving between layers, closing back together at the end

**容易失败的点**：Made-up model numbers and figures give it away; parts must separate along the assembly axis; materials must distinguish metal, plastic and PCB.

**参考主色**：`#4eb83e` · `#b88a3e`

## 实现提示词

```text
用 Blender 做你的产品爆炸拆解，零件沿一根轴等距分层抬起，棚拍主光加冷色轮廓光，引线标真实参数，最后合回一体。画面要点：真实 CAD／PCB／BOM、沿一轴等距分层、PBR 棚拍主光加冷轮廓光、HDRI 反射、引线与尺寸线、镜头在层间穿行、最后合拢。注意：标注只写图纸里有的数，尺寸不许估。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

---
key: psychedelic-shader
name: Iridescent Psychedelic Shader
description: 虹彩迷幻着色器，流体扭曲、色彩流转、金属光泽，WebGL 实时渲染感
en: 虹彩迷幻Shader
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Iridescent Psychedelic Shader · 虹彩迷幻Shader

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：psychedelic hypnosis, concentric lines, kaleidoscope mirror symmetry, vortex tunnel, iridescent thin-film color flowing along edges, high-saturation clashing colors, VJ loop

**画面要点**：psychedelic hypnosis, concentric lines, kaleidoscope mirror symmetry, vortex tunnel, iridescent thin-film color flowing along edges, high-saturation clashing colors, VJ loop

**容易失败的点**：The source is only one sentence and easily falls back to a plain gradient background; specify how many-fold the symmetry is, how it rotates and which colors to use; the first 0.5 seconds of A is black, so avoid it when cutting.

**参考主色**：`#3ea8b8` · `#6c3eb8` · `#8ab83e`

## 实现提示词

```text
用 shader 做一支迷幻催眠动画，主题是你的主题，同心线和万花筒对称一直旋转，虹彩色沿边缘流动。画面要点：psychedelic 催眠、同心线、万花筒镜像对称、旋涡隧道、虹彩薄膜色沿边缘流动、高饱和撞色、VJ 循环。注意：只写迷幻两个字会退成普通渐变，要写清对称方式和运动方式。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

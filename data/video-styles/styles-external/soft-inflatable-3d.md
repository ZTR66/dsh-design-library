---
key: soft-inflatable-3d
name: Soft Inflatable 3D
description: 软体充气 3D，橡胶质感、糖果配色、挤压回弹，可爱而厚实
en: 软体充气3D
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Soft Inflatable 3D · 软体充气3D

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：SSS soft rubber, candy colors, AO plus HDRI three-point lighting, cloner arrays, soft-body collision squash, long-tail easing, shallow depth of field and motion blur, 24fps cinematic frame rate

**画面要点**：SSS soft rubber, candy colors, AO plus HDRI three-point lighting, cloner arrays, soft-body collision squash, long-tail easing, shallow depth of field and motion blur, 24fps cinematic frame rate

**容易失败的点**：A slow rebound has no weight; a material without subsurface scattering looks like hard plastic; flat lighting looks like a web illustration.

**参考主色**：`#b83e6c` · `#b86c3e`

## 实现提示词

```text
用 Blender 做你的主题的软体充气 3D，糖果色软胶带次表面散射，落地压扁再快速弹起，棚拍三点光，浅景深。画面要点：SSS 软胶、糖果色、AO 加 HDRI 三点光、克隆阵列、软体碰撞挤压、长尾缓动、浅景深与运动模糊、24fps 电影帧率。注意：回弹一慢就没重量，下落加速、触地压扁、弹起要快。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

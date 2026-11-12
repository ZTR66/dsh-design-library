---
key: isometric-world
name: Isometric 2.5D World
description: 等轴 2.5D 世界，45 度俯视的立体小场景，可分层堆叠，干净明亮
en: 等轴2.5D世界
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Isometric 2.5D World · 等轴2.5D世界

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：true isometric 30 degrees, flat three-tone shading per face, floating base with cross-section, Isotype icon counting, label leader lines, cutaway, buildings growing with overshoot, camera following a route

**画面要点**：true isometric 30 degrees, flat three-tone shading per face, floating base with cross-section, Isotype icon counting, label leader lines, cutaway, buildings growing with overshoot, camera following a route

**容易失败的点**：Slipping in perspective turns it into low-poly 3D; use a fixed 30 degree projection with no outlines; a camera that spins around breaks the isometric feel.

**参考主色**：`#6cb83e` · `#b84e3e`

## 实现提示词

```text
用 Canvas 或 Three.js 正交相机把你的主题做成等轴测微缩世界，每个面三色调平涂，用小图标和引线标数据。画面要点：true isometric 30 度、每面三色调平涂、悬浮底座带剖面、Isotype 图标计数、标签引线、剖开 cutaway、建筑生长带过冲、沿路线带镜头。注意：固定 30 度等轴，一加透视或描边就变成低多边形 3D。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

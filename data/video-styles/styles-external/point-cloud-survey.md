---
key: point-cloud-survey
name: Point-cloud Survey
description: 点云测绘，立体扫描的密集点阵，逐层剥离展示内部结构
en: 点云测绘／剥层
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Point-cloud Survey · 点云测绘／剥层

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：real airborne lidar points, near-black background, scan line or section plane advancing, points condense into a solid lit at grazing angle, layers peeled by ground, vegetation and building classes, hairline measurement readouts, one designed camera move

**画面要点**：real airborne lidar points, near-black background, scan line or section plane advancing, points condense into a solid lit at grazing angle, layers peeled by ground, vegetation and building classes, hairline measurement readouts, one designed camera move

**容易失败的点**：From afar a point cloud looks like a flat carpet, so the camera must fly low and close; points that are too sparse cannot read as terrain; peel the layers by ground, vegetation and building class.

**参考主色**：`#777777`

## 实现提示词

```text
用 Three.js 把你的地点做成激光点云，黑底悬浮真实测量点，扫描面经过后凝成实体地形，再按地面植被建筑逐层剥开。画面要点：真实机载激光点、近黑底、扫描线或剖切面推进、点凝成掠射光实体、按地面植被建筑分类剥层、发丝线测量读数、一条设计好的运镜。注意：远看点云像平地毯，镜头要贴低穿过去。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

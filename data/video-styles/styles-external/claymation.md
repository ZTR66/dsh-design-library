---
key: claymation
name: Claymation Stop-motion
description: 黏土定格动画，表面留指纹和压痕，刻意抽帧制造手工感，柔光棚拍浅景深
en: 黏土定格
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Claymation Stop-motion · 黏土定格

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：clay material with fingerprints and dents, on twos 12fps, slight shape change boil on every beat, soft studio light, shallow-depth macro, handmade jump-cut rhythm

**画面要点**：clay material with fingerprints and dents, on twos 12fps, slight shape change boil on every beat, soft studio light, shallow-depth macro, handmade jump-cut rhythm

**容易失败的点**：Motion that is too smooth looks like 3D animation; drop frames to get a stop-motion feel; a material without fingerprints and dents is just plastic; the light should look like a real tabletop shoot.

**参考主色**：`#b8a83e`

## 实现提示词

```text
用 Blender 做你的主题的黏土定格动画，表面留指纹和压痕，两帧换一个姿势按 12 帧播放，柔光棚拍浅景深。画面要点：黏土材质指纹压痕、on twos 12fps、每拍形状微变 boil、柔光棚拍、浅景深微距、手工跳切节奏。注意：动作一顺滑就像 CG，要故意抽帧，形状每一拍都微微变。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

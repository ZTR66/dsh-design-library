---
key: brick-toy
name: Brick Toy
description: 积木玩具，塑料块拼装的场景和角色，块面清晰、色彩饱和，乐高式观感
en: 积木玩具
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Brick Toy · 积木玩具

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：real tabletop, macro shallow depth of field, glossy ABS rectangular highlights, studs on top faces, contact shadows in the seams, characters stop-motion on twos, camera smooth frame by frame, neutral studio HDRI

**画面要点**：real tabletop, macro shallow depth of field, glossy ABS rectangular highlights, studs on top faces, contact shadows in the seams, characters stop-motion on twos, camera smooth frame by frame, neutral studio HDRI

**容易失败的点**：Using branded minifigures carries copyright risk; bricks need studs and plastic highlights; deep depth of field no longer looks like a real macro shot.

**参考主色**：`#4eb83e` · `#b86c3e`

## 实现提示词

```text
用 Blender 做你的主题的积木定格，真实木桌上微距拍，亮面塑料带凸点，角色两帧一拍定格，镜头保持顺滑。画面要点：真实桌面、微距浅景深、亮面 ABS 矩形高光、顶面凸点、缝隙接触阴影、角色 on twos 定格、镜头逐帧顺滑、中性棚拍 HDRI。注意：别出现品牌字样和小人轮廓，角色用积木拼出来。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

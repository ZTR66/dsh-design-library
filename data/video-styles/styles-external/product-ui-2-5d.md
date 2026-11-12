---
key: product-ui-2-5d
name: Product UI 2.5D Camera
description: 产品界面 2.5D 运镜，真实页面截图层叠倾斜，相机穿行其间，苹果发布会式
en: 产品界面2.5D运镜
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Product UI 2.5D Camera · 产品界面2.5D运镜

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：Remotion, real page screenshots, 2.5D page camera, pages tilted then layered, beat-synced cuts, number roll-ups, flash frames, key information held for one second

**画面要点**：Remotion, real page screenshots, 2.5D page camera, pages tilted then layered, beat-synced cuts, number roll-ups, flash frames, key information held for one second

**容易失败的点**：Fast pacing with the whole screen shaking together looks cheap; slow it down one notch. UI text must be real and readable, since gray blurred bars look like placeholders. A perspective angle that keeps changing causes dizziness.

**参考主色**：`#d2d2d2`

## 实现提示词

```text
用 Remotion 把你的产品真实页面截图做成宣传片，截图 3D 倾斜做 2.5D 运镜，关键信息停留一秒以上。画面要点：Remotion、真实页面截图、2.5D 页面相机、页面倾斜后分层、卡点剪辑、数字滚动、闪帧、关键信息停留一秒。注意：节奏太快、整屏一拍一抖会廉价，放慢一档。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

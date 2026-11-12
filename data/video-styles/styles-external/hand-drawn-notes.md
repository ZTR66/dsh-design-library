---
key: hand-drawn-notes
name: Hand-drawn Paper Notes
description: 纸面手绘笔记，铅笔线条、便签、箭头和圈注，随手记录的亲切感
en: 纸面手绘笔记
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Hand-drawn Paper Notes · 纸面手绘笔记

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：off-white paper, hand-drawn thin-line equipment, handwritten titles and amounts, numbered step cards, from empty to finished, tick marks, explainer pacing

**画面要点**：off-white paper, hand-drawn thin-line equipment, handwritten titles and amounts, numbered step cards, from empty to finished, tick marks, explainer pacing

**容易失败的点**：If the label and the pouring action are not on the same beat there is no explainer feel; lines that are too regular look like an icon library; too many colors kill the hand-drawn feel.

**参考主色**：`#ededed`

## 实现提示词

```text
用 HTML 在米白纸面上做你的主题的步骤动画，手绘细线画器物，每加一样东西就同步跳出名称和用量。画面要点：米白纸面、手绘细线器物、手写体标题与用量、步骤编号卡、从空到成品、刻度线、讲解节奏。注意：字和动作不同步就没有讲解感，每一步同一拍出现。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

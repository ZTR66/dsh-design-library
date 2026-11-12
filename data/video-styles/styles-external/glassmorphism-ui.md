---
key: glassmorphism-ui
name: Glassmorphism UI
description: 玻璃拟态界面，半透明磨砂卡片、背景模糊、流光色斑，科技产品感
en: 玻璃拟态UI
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Glassmorphism UI · 玻璃拟态UI

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：aurora color blobs with blur 80 to 150px, backdrop-filter frosted cards, white fill at 5 to 10%, 1px white border, two or three adjacent hues, 3 to 5% noise to prevent banding, sine breathing easing

**画面要点**：aurora color blobs with blur 80 to 150px, backdrop-filter frosted cards, white fill at 5 to 10%, 1px white border, two or three adjacent hues, 3 to 5% noise to prevent banding, sine breathing easing

**容易失败的点**：Contrasting colors look cheap, so use only adjacent hues; keep motion slow; glass without a 1px translucent white edge and background blur looks like an ordinary card.

**参考主色**：`#3e4eb8`

## 实现提示词

```text
用 HTML 做你的主题的玻璃拟态动画，底层三到五个大色斑高斯模糊慢慢漂，上面浮磨砂玻璃卡片，1px 半透明白描边。画面要点：aurora 大色斑 blur 80 到 150px、backdrop-filter 磨砂卡片、白色 5 到 10% 填充、1px 白描边、邻近色两三色、3 到 5% 噪点防色带、sine 呼吸缓动。注意：撞色会脏，动作一快就廉价，全程慢呼吸。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

---
key: scifi-hud
name: Sci-fi Scan HUD
description: 科幻扫描 HUD，取景框、数据读数、扫描线、锁定标记，战术界面感
en: 科幻扫描HUD
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Sci-fi Scan HUD · 科幻扫描HUD

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：glowing wireframe, projection base, scan plane growth, target-lock boxes, local teardown, garbled digits rolling down to settle, one cool color plus one warm accent, near-black stage, bloom

**画面要点**：glowing wireframe, projection base, scan plane growth, target-lock boxes, local teardown, garbled digits rolling down to settle, one cool color plus one warm accent, near-black stage, bloom

**容易失败的点**：Text laid directly over a wireframe is hard to read, so put it on a dark backing plate; floating parts look fake, so keep them connected; too many colors get messy.

**参考主色**：`#3ea8b8`

## 实现提示词

```text
用 Three.js 线框把你的主题扫描成发光全息体，目标框锁定部件再拆开，数字从乱码滚到真值，单色加辉光。画面要点：发光 wireframe、投影底座、扫描面生长、目标锁定框、局部拆解、乱码数字滚动落定、单冷色加一个暖色强调、近黑舞台、bloom。注意：文字别直接压在线框上，放进暗底板，部件之间要连着。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

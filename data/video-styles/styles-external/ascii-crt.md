---
key: ascii-crt
name: ASCII Character Visuals
description: ASCII 字符拼出的画面，绿色终端 CRT 扫描线和闪烁，复古计算机感
en: ASCII字符视觉
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# ASCII Character Visuals · ASCII字符视觉

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：monospace character grid, amber or green phosphor monochrome, CRT scanlines and barrel distortion, bloom glow, character density gradient, blinking cursor, push and pull by changing font size, typewriter subtitles

**画面要点**：monospace character grid, amber or green phosphor monochrome, CRT scanlines and barrel distortion, bloom glow, character density gradient, blinking cursor, push and pull by changing font size, typewriter subtitles

**容易失败的点**：Applying an ASCII filter to the whole image looks like a filter at a glance; every pixel must come from a real character in the grid; too small a character set blurs the image.

**参考主色**：`#151515`

## 实现提示词

```text
用等宽字符网格拼出你的主题，琥珀色单色 CRT 荧光屏，加扫描线和辉光，推拉镜头靠改字号来做。画面要点：monospace 字符网格、琥珀或绿色荧光单色、CRT 扫描线与桶形畸变、bloom 辉光、字符密度梯度、光标闪烁、改字号推拉、打字机字幕。注意：每一处亮点都得是网格里的真字符，整图套 ASCII 滤镜会露馅。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

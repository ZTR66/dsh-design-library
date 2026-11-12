---
key: editorial-dataviz
name: Editorial Paper Data Story
description: 纸面编辑式数据叙事，报纸杂志排版，图表和正文并置，印刷质感
en: 纸面编辑式数据叙事
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Editorial Paper Data Story · 纸面编辑式数据叙事

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：beige dot-grid paper, real data drawn point by point, red and blue pencil strokes, handwritten notes pinned to data points, RdBu diverging color scale, chart as camera, chart type chosen by the data

**画面要点**：beige dot-grid paper, real data drawn point by point, red and blue pencil strokes, handwritten notes pinned to data points, RdBu diverging color scale, chart as camera, chart type chosen by the data

**容易失败的点**：Turning it into a dashboard or slide deck loses the editorial feel; make one point at a time; use only changes in the chart itself as transitions.

**参考主色**：`#cfcfcf`

## 实现提示词

```text
用 Canvas 在米色点阵纸上画你的主题的真实数据，红蓝铅笔逐点画出，手写批注钉在数据点旁，图表本身当镜头。画面要点：米色点阵纸、真实数据逐点绘制、红蓝铅笔笔触、手写批注钉在数据点、RdBu 发散色阶、图表即镜头、按数据选图型。注意：别做成仪表盘或幻灯片，一次只讲一个观点。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

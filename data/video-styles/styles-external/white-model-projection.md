---
key: white-model-projection
name: White-model Projection
description: 实体白模投影，纯白立体模型上的光影和投影变化，极简而高级
en: 实体白模投影
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# White-model Projection · 实体白模投影

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：pure white block model, dark-room plinth, data as projected light, only faces toward the projector light up, soft light edges spilling over the base, one question per layer, lights on and off as opener and closer, real building data

**画面要点**：pure white block model, dark-room plinth, data as projected light, only faces toward the projector light up, soft light edges spilling over the base, one question per layer, lights on and off as opener and closer, real building data

**容易失败的点**：If the white model carries its own color it is no longer a projection; color may only come from the projected light; text should be projected onto the model, not float on the screen.

**参考主色**：`#3e6cb8` · `#b86c3e`

## 实现提示词

```text
用 Three.js 做你的城市白模，纯白体块放在暗房展台上，数据只以投影光一层层打上去，光边柔和、溢出底座。画面要点：纯白体块模型、暗房展台、数据即投影光、只亮朝向投影仪的面、柔和光边溢出底座、一层一个问题、开灯关灯作开场收尾、真实建筑数据。注意：颜色别画进材质，暖色环境光还会把白模染黄。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

---
key: feature-3d-character
name: Feature-film 3D Character
description: 动画电影级 3D 角色，圆润造型、次表面散射、三点布光、柔和轮廓光
en: 动画电影式3D角色
source: LearnPrompt/carl-motion
license: MIT
tier: 外部
---

# Feature-film 3D Character · 动画电影式3D角色

> 来源：[LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) · MIT

**一句话**：one-shot animated short, tech stack of your choice, cinematic backlight and sunset, shallow depth of field, character expression and performance, a small story told shot by shot, cinematic subtitle bar

**画面要点**：one-shot animated short, tech stack of your choice, cinematic backlight and sunset, shallow depth of field, character expression and performance, a small story told shot by shot, cinematic subtitle bar

**容易失败的点**：Just saying make a character falls back to a crude SVG figure; state that it should be made as complex as possible and open up Three.js or Blender; without depth of field and rim light it does not look like an animated film.

**参考主色**：`#b86c3e`

## 实现提示词

```text
用你认为最好的技术做一支动画短片，主角是你的主题，电影布光、浅景深、角色有表情有表演，做到你能做到的最复杂最精致。画面要点：one-shot 动画短片、自选技术栈、电影级逆光与夕阳、浅景深、角色表情与表演、按镜头讲小故事、电影字幕条。注意：只说做个角色会退成简陋小人，要明确要求最复杂最精致。输出 1920×1080、30fps、8 秒，写成可复现的源码并渲染成 MP4。
```

## 怎么用

1. **先读「画面要点」**——那是这个风格的识别特征，做不到就不像。
2. **再看「容易失败的点」**——原文实测出来的坑，避开它们能省一轮返工。
3. **配色自己定**：这里的主色是参考值，不是完整色板。要精确配色就用
   `design_search` 从 269 个设计系统里挑。
4. **动效参数**：`video_craft_read({ id: 'animation-principles' })` 有完整的缓动和时长表。

这个风格给的是方向，具体实现要补。它和库内那些风格是同一层级的东西，
只是少了一份现成参数表。

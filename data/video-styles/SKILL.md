---
name: video-style
description: "Use when the user wants to make a video rather than a UI — a knowledge short, a music video, a title sequence, an explainer, or anything that will be watched on a screen instead of clicked. Covers choosing among 44 code-rendered visual styles, checking what this machine can actually render, and building the film frame by frame with code. Trigger words: 做视频, 知识片, 短视频, MV, 片头, 动画, 逐帧, 渲染成片, make a video, render a film."
---

# Video style skill

This skill turns a topic into a rendered short film. The画面 is drawn by code —
no video-generation model, no editing software, no stock footage.

**Read this whole file before starting.** The failure mode here is not "bad
code"; it is producing a technically fine video in the wrong visual language, or
promising a video the machine cannot render.

---

## Step 0 — Check the machine before promising anything

Call `video_env_check` **first**, every time. It is cheap and it decides what is
possible.

Judge the deliverable, not a single "ready" flag:

| The user wants | Needs |
|---|---|
| 静音成片（无旁白，纯画面 + BGM） | `silent: yes` |
| 有旁白的知识片 | `narrated: yes` |
| 浏览器 Canvas / WebGL 渲染 | `browserRendered: yes` |
| 音乐 MV（画面踩拍点） | `beatSync: yes` |

If something required is missing:

1. **Tell the user what is missing and the exact command.** One named package,
   not "your environment is incomplete".
2. **Ask before installing.** Installation changes their machine.
3. If they decline, work within what is available — say what that limits.

**Watch for the Python split.** The report lists which interpreter holds which
package. If `edge-tts` lives in one Python and `pillow` in another, a single
script cannot narrate and render in one pass: plan two steps, or install the
missing package into one environment. Ignoring this produces an `ImportError`
mid-render, after the expensive part is done.

---

## Step 1 — Pick a style, and show your reasoning

`video_style_search` matches a topic against 44 specs. Keywords include topic
words (历史, 数学, 宇宙, 游戏, 职场), so searching the subject usually works
better than searching for a look.

**Offer the user 2–3 candidates, never one**, and say why each fits:

```
- gufeng（古风）— 夜色城门与人群剪影、朱红印章，适合历史事件与制度
- woodcut（木刻）— 黑白版画刀痕，适合变法、起义这类硬转折
```

Let them choose. A style chosen by the user is worth ten chosen for them.

**Historical art styles.** `data/video-styles/artmotion/` carries 35 more
visual languages — cave painting, Egyptian, Greek, Roman, Gothic, cubism,
Bauhaus, pop and so on — each as a numbered document. They are indexed as style
entries, so `design_search` finds them by name. Use one when the subject has a
period flavour the 44 base styles cannot reach.

**Prefer 基础档.** The 44 specs mark 38 as 基础 (renders from code alone) and 6
as 增强 (needs generated imagery). 增强 means an outside image model, an API key,
and a cost — do not reach for it unless the user asks.

---

## Step 2 — Read the spec, and obey its three lists

`video_style_read({ key })` returns the full spec: exact hex values, fonts,
motion timings, camera grammar, and three lists that matter more than the rest:

| List | Meaning |
|---|---|
| **放心改** | Change freely — swapping the board colour is fine |
| **一改就变味** | Changing it keeps the shape but loses the flavour |
| **不能改** | Changing it means this is no longer this style |

**These lists are the contract.** A chalkboard film without the chalk-grain
filter is not a chalkboard film. If the user's request conflicts with 不能改,
say so and offer a different style rather than quietly breaking the style.

---

## Step 2b — Turn the style into shots

A style says what the film looks like. It does not say what happens in the next
four seconds. `video_shot_search` covers that gap with 124 recipe cards, each
carrying a duration in frames, an energy level, the intention behind the move,
and a parameter table.

Pick cards by **what the shot does**, not by what it looks like:

| The film needs to | Search |
|---|---|
| start | `category: "opening"` — 11 cards |
| move between ideas | `category: "transition"` — 15 cards |
| introduce a product surface | `category: "ui-entrance"` — 21 cards |
| land a number | `category: "data"` — 5 cards |
| set a title | `category: "typography"` — 22 cards |
| end | `category: "outro"` — 6 cards |

Then `video_shot_read({ name })` returns the build: exact frame ranges, easing
curves, a table of which parameter changes what, and the known pitfalls for that
shot specifically.

**Compose a sequence of cards rather than inventing motion.** A 60-second film is
eight to twelve cards, not one continuous improvisation. The cards are the
vocabulary; the order is yours.

## Step 3 — Decide how it is spoken

Three cases, in order of preference:

**A. The user supplies audio.** Best. Measure it — duration, and whether the
picture must follow beats.

**B. Generate narration.** `edge-tts` is already available on most machines.
For Chinese knowledge films, `zh-CN-YunyangNeural` reads as a professional news
anchor; `zh-CN-XiaoxiaoNeural` is warmer. Generate first, then measure, then
build the picture to the audio's length — never the reverse.

```bash
edge-tts --voice zh-CN-YunyangNeural --text "..." --write-media narration.mp3
```

**C. Silent.** Fine for a title sequence or a visual essay. `numpy` can build a
simple tonal bed; anything richer needs a real track.

**On music:** this plugin ships no BGM, because the one that comes with the
upstream style library is licensed only for that project's own tool. So:

- The user names a track → use it, cut to length
- No track → synthesise a bed with numpy, or go silent
- **Never pick a track on the user's behalf and present it as their choice.**
  If you must suggest one, mark it as a suggestion.

---

## Step 4 — Build the film as a function of time

One rule makes the whole renderer reproducible:

> **Every frame is a pure function of `t`. The same `t` always draws the same
> frame. All randomness uses a fixed seed.**

This is what lets you render frame 900 without rendering 899 first, and what
makes a re-render match the last one.

Structure that works:

```
film.js  — window.render(t) draws frame t onto a canvas
render.mjs — loop t = 0 .. duration, screenshot each frame, pipe to ffmpeg
```

Render the expensive things once (a particle simulation, a layout) into a
lookup table, then have `render(t)` read from it during playback.

**Draft cheap before rendering full.** Render 6–8 still frames across the
timeline and look at them before spending minutes on 5,000 frames.

---

## Step 5 — Inspect, do not assume

You cannot watch a video. So measure it.

- **Contact sheet**: every N seconds, one frame, into a single image. Read it.
- **Numbers**: actual duration (ffprobe), loudness (ffmpeg `ebur128`), whether
  frames are static when they should move.
- **Quality gate**: `video_style_read({ key: 'quality-gate', part: 'craft' })`
  has the checklist for "what a bad frame looks like".

Fix what the inspection finds, then inspect again. A first render with no
problems is rarer than you would like.

---

## What this skill does not do

- It does not generate images from prompts. If a shot needs photographic
  realism, that is outside what code drawing can do — say so.
- It does not render for you. It gives you the spec, the environment report, and
  the method; you write the renderer.
- It does not decide the content. The facts, the argument, the point — those are
  the user's.

---

## The honest limit

The craft documents in this library encode a great deal of what an expert
decides: which sentence becomes which kind of shot, how long a beat lasts, when
a cut happens. They will get a competent video out of you.

What they cannot encode is **when not to draw**. The best of these films leave
roughly one sentence in five on screen as text alone, with no picture. Knowing
which fifth is a judgement about what the audience needs in that moment — it is
not in any table, and asking the user is usually better than guessing.

# Video library — provenance

**Documentation only.** No images, video, audio or fonts are redistributed here.
Every upstream marks its preview media as the author's own work; nothing of that
kind is copied.

## Sources

| Folder | Repository | License | Files | What was taken |
|---|---|---|---|---|
| `styles/` | [andyhuo520/vibe-knowledge](https://github.com/andyhuo520/vibe-knowledge) | **MIT** | 44 `STYLE.md` + `catalog.json` + `INDEX.md` | Style specs: palette, fonts, motion, camera grammar, constraints |
| `craft/` | [xiazhuo123456789/vibe-knowledge-video](https://github.com/xiazhuo123456789/vibe-knowledge-video) | **MIT** | 14 `.md` | Camera grammar, quality gate, render craft, narrative structure |
| `mv/` | [Win-Hao/music-mv](https://github.com/Win-Hao/music-mv) | **MIT** | 7 `.md` | Music-video workflow: styles, character, storyboard, transitions |
| `shots/` | [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | **Apache-2.0** | `library.json` (124 cards) + 125 card sources | Shot recipe cards: intent, timing, energy, parameter tables, pitfalls |
| `artmotion/` | [alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) | **MIT** | 93 `.md` | 35 historical art styles + method documents |
| `index/` | [ismoshushi/awesome-opus-video-skills](https://github.com/ismoshushi/awesome-opus-video-skills) | **MIT** | 2 `.md` | The curated index of video agent-skills |
| `toolkit/` | [liangdabiao/video-skills-toolkit](https://github.com/liangdabiao/video-skills-toolkit) | **MIT** | 97 files | Six Remotion workflow templates (talking-head, article-to-video, geometry proof, paper cutout, sketch story, subtitles) |
| `remotion/free/` | [RenderComp/free-remotion-templates](https://github.com/RenderComp/free-remotion-templates) | **MIT** | 58 files | 50 standalone Remotion template components |
| `remotion/rve/` | [reactvideoeditor/remotion-templates](https://github.com/reactvideoeditor/remotion-templates) | **none declared** | `README.md` only | Documentation only — source not copied |
| `remotion/aliabassi/` | [ali-abassi/remotion-templates](https://github.com/ali-abassi/remotion-templates) | **none declared** | `README.md`, `SKILL.md` | Documentation only — source not copied |
| `motion/` | [iart-ai/motion-design-skills](https://github.com/iart-ai/motion-design-skills) | **MIT** | 34 files, 9 skills | Timing, easing, weight, rhythm — the numbers behind motion that feels right |
| `director/baocut/` | [jimliu/baocut](https://github.com/jimliu/baocut) | **BaoCut Community 1.0** | 85 `.md` | Shot cards, transition wording, camera-move checks, QA |
| `director/chaojifeng/` | [mileson/chaojifeng-video-design](https://github.com/mileson/chaojifeng-video-design) | **MIT** | 49 files | Story spine, shot planning, sound-picture rhythm, delivery acceptance |
| `director/spark-video/` | [modelstudioai/skills](https://github.com/modelstudioai/skills) | **Apache-2.0** | 51 files | Director treatment, shot prompt structure, screenplay-to-shot mapping |
| `director/visual-skills/` | [smixs/visual-skills](https://github.com/smixs/visual-skills) | **CC-BY-4.0** | 13 `.md` | Storyboards, shot lists, camera direction, lighting, blocking, pacing |
| `manim/` | [G-U-N/vibe-manim](https://github.com/G-U-N/vibe-manim) | **MIT** | 37 files | 33 standalone Manim scenes as reference patterns |
| `varg/` | [varghq/skills](https://github.com/varghq/skills) | **MIT** | 431 files | 14 selected skills: sound design, kinetic type, data motion, transitions, titles, FFmpeg recipes, caption styling |
| `shader/` | [gokayfem/shader-skills](https://github.com/gokayfem/shader-skills) | **MIT** | 15 files | GLSL, SDF raymarching, procedural terrain and generative reference |
| `reelmimic/` | [edenfunf/reelmimic](https://github.com/edenfunf/reelmimic) | **MIT** | 444 files | 36 HyperFrames-based skills: montage, music-to-video, painted animation, pixel art, captions |

### What was NOT taken from varghq/skills

That repository carries 76 skills. Only 14 were copied — the ones about making a
film with code. Left behind: e-commerce ad pipelines, AI character generators,
and skills that route to paid third-party APIs. Copying them would add
instructions that cannot be followed on a machine rendering frames locally.

## Licensing notes

| License | Sources | Obligation |
|---|---|---|
| MIT | most of the library | Keep the copyright notice |
| Apache-2.0 | video-shotcraft, modelstudioai/skills | Keep notice; state changes |
| CC-BY-4.0 | smixs/visual-skills | **Attribution required** — Serge Shima |
| BaoCut Community 1.0 | jimliu/baocut | Noncommercial sharing only; include the full license |
| none declared | reactvideoeditor, ali-abassi | Documentation only, no source copied |

## Notes on specific sources

**vibe-knowledge-video** reports `NOASSERTION` through GitHub's API because its
`LICENSE` file lacks the machine-readable header GitHub matches on. The file
itself is the standard MIT text.

**video-shotcraft** explicitly states its shot cards were written from scratch
after studying publicly released work: no frames, screenshots, art assets or
brand elements are included, and its own `ATTRIBUTION.md` records the research
trail. What is redistributed is that original implementation documentation, under
Apache-2.0.

**The two unlicensed repositories** are present as documentation only. Their
README and SKILL files describe what exists, which is what a reader needs to
decide whether to install them; the source is not redistributed because there is
no grant permitting it. `scripts/guard-publish.mjs` lists them explicitly so the
exemption is visible rather than buried.

## Deliberately absent

| Item | Why |
|---|---|
| `styles/*/still.jpg` | The upstream NOTICE forbids re-uploading these as your own |
| Sample videos and previews | Same |
| Default BGM (`vibe-bgm.m4a`) | Licensed to that project for use with its own tool |
| Default voice reference | An AI voice made for that project |
| `docs/original-analysis/` | Transcripts of third-party videos, research-only upstream |
| `demos/`, `media/`, `previews/` in every repository | Rendered output, not description |

Because no BGM ships here, the plugin imposes none. The soundtrack is the user's
to choose, or is synthesised locally.

## How it is used

- `video_style_search` reads `catalog.json` — per-style `keywords`, `templates`,
  `fam`, `tier` — so a topic can be matched to a look without opening every spec.
- `video_style_read({ key })` returns one `STYLE.md`.
- `video_style_read({ key, part: 'craft' | 'mv' })` returns the shared method
  documents.
- `video_shot_search` reads the shot manifest; `video_shot_read({ name })` returns
  the full card for one shot.

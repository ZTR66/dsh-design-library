# Changelog

## 0.6.1

Makes the library navigable, and fixes the two reasons a model could not reach most of it.

**`video_guide` — the map.** A model that has never seen this library knows it has
search tools but not what is in them, so it guesses keywords. Add one tool that
returns the whole catalogue — five design stages in order, 44 styles grouped by
subject and by family, 124 shot cards grouped by what they do — and guessing stops
being necessary. `stage`, `topic`, `family` and `shotCategory` narrow it.

**Method documents are indexed now.** The scanner accepted only `DESIGN.md`,
`SKILL.md`, `STYLE.md` and `*-DESIGN.md`. The craft, motion and toolkit folders hold
flat files — `structure-bible.md`, `animation-principles.md`, `visual-grammar.md` —
and none of them matched, so 69 method documents were absent from the index. Styles
and shot cards still worked, which is why the symptom was "the video looks flat"
rather than "the library is empty": palette and shot skeletons were reachable, the
numbers that make motion deliberate were not.

The fix is a second name rule scoped to those folders. Scope matters — the first
attempt also admitted `varg`, `reelmimic` and `artmotion`, which took the index from
429 to 1256 entries with 828 craft documents, mostly per-frame source notes. A model
reading 1200 entries to find `animation-principles` is worse off than one reading 130
good ones, so the directory list is short: `craft|motion|toolkit|manim|mv`.

**Search scores instead of filtering.** Both search tools required *every* term to
appear in the same entry. A natural query therefore matched nothing: `高级 质感 界面
科技` returns 0 hits under AND, 4 under scoring, because each word matches a
different style. Every matching term now adds score and only entries with no match at
all are dropped.

**`video_craft_read` resolves invented ids.** A model that has not seen the library
writes an id from the folder names it finds on disk —
`video-styles/craft/structure-bible/SKILL` for a document whose real id is
`video-styles/craft/structure-bible`. The old matcher tried the exact id, a `/wanted`
suffix and a bare substring, and all three failed on one extra segment. It now
normalises the path (drop `/SKILL`, unify separators), then falls back to matching the
last segment, then the document title.

**Better failure message.** The old one listed style ids only, which taught a caller
nothing about craft documents. It now names a valid id for the right *kind* of
document and says where ids come from.

Verified against the recorded failures from a real session: `structure-bible` (68
lines), `animation-principles` (115 lines) and `高级 质感 界面 科技` (4 hits) all
succeed, and 124 shot cards still resolve.

## 0.6.0

Adds layout_check: overlap, overflow and text-collision detection.

- Measures rendered boxes in a real browser instead of parsing CSS. "Does this overlap" is a
  layout question: padding, negative margins, transforms, grid stacking and fixed positioning all
  change the box, and a static read gets those wrong
- Three kinds of finding: overflow (past the page edge, or clipped by an overflow: hidden
  ancestor), overlap (two boxes sharing space), collision (text on top of text, always an error)
- Parent/descendant pairs are excluded before reporting: containment is not a collision. Without
  that rule every card with a label inside it would be flagged
- Overlap needs both an absolute floor (8px by default, which ignores shadows and borders) and a
  share of the smaller box (5%), so slivers do not generate noise
- Accepts a file path, an http(s) URL, or an inline HTML string; wait for fonts before measuring,
  because font metrics change widths
- Verified: a page with three deliberate defects reports exactly those three, and a well-formed
  page reports nothing


## 0.5.0

Adds sound design, kinetic typography, shaders and a full music-video workflow.

- **`varg/`** — 14 of the 76 skills in [varghq/skills](https://github.com/varghq/skills), chosen because
  they apply to code-rendered film: sound design with measured LUFS, 17 beat-timed kinetic type pieces,
  maps and data motion, transition craft, title design, FFmpeg recipes, caption styling
- **`reelmimic/`** — 36 HyperFrames-based skills from
  [edenfunf/reelmimic](https://github.com/edenfunf/reelmimic): montage on a beat spine,
  music-to-video, painted animation, pixel art, embedded captions
- **`shader/`** — GLSL, SDF raymarching and procedural noise reference from
  [gokayfem/shader-skills](https://github.com/gokayfem/shader-skills)
- Index reaches 716 entries; 1619 files under `data/video-styles/`

Fixed: the publish manifest credited 890 wave-3/4 files to this package instead of
their upstream repositories. The guard passed either way because this package is
itself on the allow-list, which is exactly why the attribution had to be checked
by hand rather than trusted to a passing guard.

## 0.4.1

- New `video_craft_read` tool: read any craft document by id, with fuzzy matching
- The `video_style_read` enum could not scale past two folders; reading by id replaced it

## 0.4.0

- **`motion/`** — 9 skills from [iart-ai/motion-design-skills](https://github.com/iart-ai/motion-design-skills):
  animation principles, shot composition, beat-sync editing, colour motion, logo animation,
  motion art direction, motion backgrounds, Remotion, After Effects. These produce numbers —
  durations, cubic-bezier curves, stagger offsets, spring configs — rather than adjectives
- **`director/`** — shot cards and transition wording (baocut), story spine and sound-picture
  rhythm (chaojifeng), director treatment and shot prompt structure (modelstudioai),
  storyboard method (visual-skills)
- **`manim/`** — 33 standalone Manim scenes as reference patterns
- Index reaches 650 entries

## 0.3.0

First release with video support.

- **`video_style_search` / `video_style_read`** — 44 visual styles from
  [andyhuo520/vibe-knowledge](https://github.com/andyhuo520/vibe-knowledge), each with exact hex
  values, fonts, motion timing, camera grammar and three constraint lists
- **`video_shot_search` / `video_shot_read`** — 124 shot recipe cards from
  [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft), each with a
  duration in frames, energy level, directorial intention, parameter table and pitfalls
- **`video_env_check`** — reports per pipeline stage what the machine has and what is missing,
  with the exact install command, and grades by deliverable rather than one ready flag
- **`artmotion/`** — 35 historical art styles from
  [alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion)
- **`toolkit/`, `remotion/`** — Remotion workflow templates and 50 standalone components
- The video skill document is indexed as a skill, so the model finds "how to make a video"
  in the same catalogue it already searches for design skills
- Licensing: documentation only. Images, video, BGM and voice samples from every upstream are
  deliberately not redistributed, because their notices forbid it. `NOTICE` records why

## 0.2.1

- `video_env_check` now finds Playwright outside the plugin directory. Resolving it from the
  plugin's own `node_modules` reported the driver missing on a machine where it was installed
  and working, because nobody should install a browser driver inside a managed plugin directory
  that an update replaces. Probes run: this module, `$DSH_VIDEO_TOOLS`, the working directory and
  its ancestors, then a short list of shared tool folders

## 0.2.0

- First video capability: 44 style specs plus an environment check
- `sync.mjs` no longer deletes the whole `data/` directory. It removed the video style library,
  which arrives through a separate fetch script, and took a network round trip to restore

## 0.1.0

Initial release.

- 290 design documents (256 systems + 34 skills) from 19 repositories, deduplicated by content hash
- `design_search`, `design_read`, `design_review`
- Panel, composer control and settings page
- `design_review` measures WCAG contrast for declared `on-*` pairs and flags off-palette colours
  with line numbers, font families outside the declared set, and radii off the declared scale
- Three upstreams excluded for licensing (`master5d`, `simota`, `kubai087`); they appear as
  external links rather than content
- `scripts/guard-publish.mjs` refuses to pack if excluded content appears or any hash changed

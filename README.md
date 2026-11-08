# dsh-design-library

A design library plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): **browse specs, review UI, and make video** — three jobs sharing one searchable library.

716 indexed entries — 256 design documents, 97 visual styles, 124 shot recipe cards, 204 craft documents, and 35 design skills. Searchable, readable in full, insertable into a conversation, and callable from the review and video tools.

## What it does

### 1. Browse and insert

A sidebar entry opens the library. Filter by kind (design spec / skill / video style / shot card / craft document), search the full text, read a document, or insert one into the current conversation.

### 2. Skills the model picks itself

The useful ones register into the skill catalogue, so the model loads them when a design task calls for it. Defaults to "curated"; switch to all or off in settings.

### 3. A review that computes

`design_review` does not restate the spec. It measures:

- the WCAG contrast of every `on-<x>` pair the system declares, and any surface where no declared text colour reaches AA
- colour literals in your file that are not in the palette, **with line numbers**
- font families outside the declared set, and radii off the declared scale

Every finding names the two tokens it compared and the ratio it computed, so it can be checked rather than believed.

### 4. Measuring layout

`layout_check` renders the page in a real browser and measures boxes, rather than parsing CSS — "does this overlap" is a question about layout, not about declarations. Padding, negative margins, transforms, grid stacking and fixed positioning all change the answer, and a static read gets those wrong.

Three kinds of problem:

- **overflow** — past the right or bottom edge of the document, or clipped by an `overflow: hidden` ancestor
- **overlap** — two boxes sharing space that should not
- **collision** — text on top of text, which is always a defect

**A parent and its own descendant are containment, not overlap.** Those pairs are dropped first; what remains is what was actually misplaced.

Each finding reports both elements' paths, coordinates and sizes, plus the shared area as a percentage of the smaller box.

### 5. Making video

Added in 0.3.0. The plugin **does not render video** — ffmpeg and a headless browser do that. It handles the three things that go wrong more often:

**Choosing the visual language.** 97 styles, each with exact hex values, fonts, motion timing, camera grammar, and three lists: safe to change / changes the flavour / must not change. For example `粉笔黑板` (chalkboard):

```
palette: board #1F4A42 · white chalk #EEECE3 · yellow chalk #F5D76E · pink chalk #F28B82
must not change: removing the chalk-grain filter
changes the flavour: text appearing all at once (loses the writing-on-board feel)
```

**Knowing what happens next second.** 124 shot recipe cards, each stating its use, duration to the frame, energy level, directorial intention, a parameter table, and the pitfall specific to that shot. Not "add a premium transition" but "flights 36–64 / 96–128 / 158–190 frames, asymmetric in-out `bezier(0.62,0,0.16,1)`".

**Looking up actual numbers.** 204 craft documents: animation principles (durations, easing curves, stagger offsets, spring configs), sound design (measured LUFS, cue sheets), kinetic typography (17 beat-timed pieces), data motion, transitions, shaders.

**Environment self-check.** `video_env_check` reports what this machine can do, what is missing, and the exact command to fix it. It grades by deliverable rather than one ready flag:

```
silent: yes          frames drawn and encoded
narrated: yes        with a voice track
browserRendered: no  canvas/WebGL frames (needs playwright)
beatSync: no         cutting on beats (needs librosa)
```

It also flags a split Python environment — `edge-tts` in one interpreter and `pillow` in another means a script that narrates and renders in one pass will fail at import time.

## Install

Desktop: **Settings → Plugins**, search `@ztr66/dsh-design-library`.

Or from the command line, then restart the host:

```sh
dsh plugin --profile <your profile> add @ztr66/dsh-design-library
```

Requires DSH `>=0.2.0-rc.1` and Node 20+.

## Tools

### Design

| Tool | What it does |
| --- | --- |
| `design_search` | Find a document by text, source or kind; returns ids |
| `design_read` | Read one document — full text, structured tokens, or headings |
| `design_review` | Check a file or snippet against a design system, with computed findings |
| `layout_check` | Measure overlapping, overflowing and clipped elements in a real browser |

### Video

| Tool | What it does |
| --- | --- |
| `video_style_search` | 97 visual styles, filtered by topic keyword or family |
| `video_style_read` | Read one style spec, or a craft document |
| `video_shot_search` | 124 shot cards, by category (opening / typography / transition / data / outro…) or function |
| `video_shot_read` | Read one card in full: frame numbers, curves, parameter table, pitfalls |
| `video_craft_read` | Read any craft document by id |
| `video_env_check` | Report the render environment down to the missing package and its install line |

## Configuration

On this plugin's row in `cordis.patch.yml`:

```yaml
- id: design-library
  name: '@ztr66/dsh-design-library'
  config:
    skillMode: curated   # curated | all | off
    roots: []            # extra local directories to scan
    maxEntries: 5000
```

`roots` is where your own design documents go. The bundled content is always available.

## What video needs

The plugin supplies the references and the self-check; the render chain is yours. One `video_env_check` tells you what is missing:

| Component | Purpose | Install |
| --- | --- | --- |
| ffmpeg | encoding, frame extraction, mixing | [ffmpeg.org](https://ffmpeg.org/download.html) |
| playwright | headless browser, one screenshot per frame | `npm i -D playwright && npx playwright install chromium` |
| pillow | draw frames directly, no browser | `pip install pillow` |
| edge-tts | Chinese narration, 8 voices | `pip install edge-tts` |
| librosa | BPM and beat onsets; only for music video | `pip install librosa` |

**You can work without playwright**: pillow draws frames and ffmpeg encodes them, with fewer effects available. `video_env_check` reports which tier the current machine reaches.

**No BGM ships with this plugin.** The track from the upstream style library is licensed to that project's own tool, not ours to redistribute. Supply a track, or synthesise one locally.

## Where the bundled content comes from

Everything under `data/` is third-party content, redistributed under its own license. `PROVENANCE.md` names the repository, license and original path for each file; `NOTICE` carries the full attribution.

| License | Sources | Obligation |
| --- | --- | --- |
| MIT | most of the library | keep the copyright notice |
| Apache-2.0 | video-shotcraft, modelstudioai | keep notice, state changes |
| CC-BY-4.0 | smixs/visual-skills | **attribution required** — Serge Shima |
| BaoCut Community 1.0 | jimliu/baocut | noncommercial sharing only, include the license |
| none declared | reactvideoeditor, ali-abassi | documentation only, no source copied |

**14 of the 76 skills in `varghq/skills` were taken** — the ones that apply. The rest are e-commerce ad pipelines, AI character generators, and skills that route to paid third-party APIs; they cannot be followed on a machine rendering frames locally, so copying them would add noise.

`npm prepack` runs `scripts/guard-publish.mjs`: if any bundled file's hash has changed, or content from a non-redistributable source appears, packing fails.

## Regenerating the bundled data

```sh
npm run sync                      # rebuild data/ and PROVENANCE.md from the local checkout
node scripts/sync.mjs --dry-run   # report only, write nothing
```

The video resources are fetched by separate scripts (sparse git clones, to avoid the unauthenticated GitHub API limit):

```sh
pwsh -File scripts/fetch-video-styles.ps1    # 44 base styles + craft docs
pwsh -File scripts/fetch-video-extras.ps1    # shot cards + art styles + templates
pwsh -File scripts/fetch-video-wave3.ps1     # animation principles + shot planning + Manim
pwsh -File scripts/fetch-video-wave4.ps1     # sound + kinetic type + shaders
```

## Known limitations

- The panel renders document text as monospace plain text; it does not render Markdown
- No images, video or audio are bundled — text only
- The review covers colour, font and radius; it does **not** evaluate layout, motion or component structure
- The video tools supply references and a self-check; they do **not** render video — you write the renderer
- No BGM or voice samples ship here, by upstream license

## License

Plugin code MIT. Bundled documents keep their original licenses; see `PROVENANCE.md` and `NOTICE`.

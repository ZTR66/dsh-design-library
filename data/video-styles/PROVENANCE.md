# Video style library — provenance

**Documentation only.** No images, video, audio or fonts are redistributed here,
because the upstream NOTICE forbids it (see "Deliberately absent").

## Sources

| Folder | Repository | License | Files | What was taken |
|---|---|---|---|---|
| `styles/` | [andyhuo520/vibe-knowledge](https://github.com/andyhuo520/vibe-knowledge) | **MIT** | 44 `STYLE.md` + `catalog.json` + `INDEX.md` | Style specs: palette, fonts, motion, camera grammar, constraints |
| `craft/` | [xiazhuo123456789/vibe-knowledge-video](https://github.com/xiazhuo123456789/vibe-knowledge-video) | **MIT** | 14 `.md` | Camera grammar, quality gate, render craft, narrative structure |
| `mv/` | [Win-Hao/music-mv](https://github.com/Win-Hao/music-mv) | **MIT** | 7 `.md` | Music-video workflow: styles, character, storyboard, transitions |

On the second source: GitHub's API reports `NOASSERTION`, but the repository's
`LICENSE` file is the standard MIT text. The API only reports NOASSERTION because
the file lacks the machine-readable header GitHub matches on; the grant itself is
unambiguous.

## Deliberately absent

| Item | Why |
|---|---|
| `styles/*/still.jpg` | The upstream NOTICE states these are the author's own work and must not be re-uploaded |
| Sample videos | Same |
| Default BGM (`vibe-bgm.m4a`) | Licensed to that project for use with its own tool; not ours to redistribute |
| Default voice reference | An AI voice made for that project; not ours to redistribute |
| `docs/original-analysis/` | Transcripts of third-party videos, research-only upstream |

Because no BGM ships here, the plugin imposes none. The soundtrack is the user's
to choose, or is synthesised locally.

## Identity of this plugin's own document

`SKILL.md` in this folder is written for this plugin and is MIT like the rest of
its code.

## How it is used

- `video_style_search` reads `catalog.json` — per-style `keywords`, `templates`,
  `fam`, `tier` — so a topic can be matched to a look without opening every spec.
- `video_style_read({ key })` returns one `STYLE.md`: exact hex values, fonts,
  motion timing, camera grammar, and the three constraint lists.
- `video_style_read({ key, part: 'craft' })` returns the shared method documents.
- `video_style_read({ key, part: 'mv' })` returns the music-video workflow.

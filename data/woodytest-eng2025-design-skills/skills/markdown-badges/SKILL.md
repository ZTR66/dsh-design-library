---
name: markdown-badges
description: "Design a README badge row with shields.io and the Ileriayo/markdown-badges catalogue — correct URL escaping, one coherent style, restrained count, working links, real alt text. Use when a repo README or profile README needs a designed header instead of a wall of badges. Trigger words: 徽章, 项目徽章, README 头图, 状态徽章, badges, shields.io, readme header, profile readme."
license: MIT
metadata:
  author: Woodytest2025
  version: "1.0.0"
  category: github-profile
  keywords: badges, shields.io, readme, markdown, simple-icons, github, svg
  source: https://github.com/Ileriayo/markdown-badges
  stars: "17k"
allowed-tools: bash read write
---

# Markdown Badges — README Punctuation

A badge is a **comma, not a sentence**. Three or four of them under a title tell a reader in two seconds
that the project is maintained, what it runs on, and that somebody cared. Fifteen tell a reader nothing
except that somebody had a free afternoon.

Two things make the row possible: **shields.io**, which turns a URL into an SVG, and
[Ileriayo/markdown-badges](https://github.com/Ileriayo/markdown-badges), a catalogue of ~820 ready-made
badges in 54 categories. The catalogue is a lookup table, not a design system — it will happily hand you
two hundred badges in `for-the-badge`. Choosing the four that belong is the work.

## When to use it

| Situation | What the badges buy you | Keep it to |
| --- | --- | --- |
| Project README | licence, release, build, coverage — the four questions asked before `npm install` | 4–5, one row |
| Profile README | stack, current role, where to find you | 3 identity + 3–4 socials |
| Docs landing page | compatibility matrix, supported runtimes and versions | 6–8, in a table, not a row |
| Release notes | version and date; usually better as plain text than as a badge | 0–2 |
| Package registry page | mirrors your README — keep the identical row so the two agree | same as README |

**Do not use it for:** badges that are always green (a "passing" that has never once failed is wallpaper),
projects that are archived or quiet for years, private repositories with no public CI (the badge renders
`no status` forever), badges that repeat what the first paragraph already says, or a twelve-logo "made
with" stack under a project that has three dependencies.

## The catalogue, and what it is not

- **~820 badges, 54 categories** (`Languages`, `Frameworks, Platforms and Libraries`, `Databases`,
  `Design`, `Social`, `Testing`, `Version Control`, …). Each category is one table: name, badge, markdown.
- **Everything is `for-the-badge`.** Every badge in the catalogue carries `style=for-the-badge`; the Tips
  section says it was chosen "for appearance purposes" and that you may swap the string for any other style.
- **Icons only.** The maintainer does not add badges without a Simple Icons mark: "For making badges
  without icons, you can use shields.io". Text-only badges you compose yourself against shields.
- **The shape is `badge/<LABEL>-<HEX>.svg?style=for-the-badge&logo=<slug>&logoColor=white`** — no message
  segment, and the hex is written `%23F7DF1E` (`%23` = `#`) because a raw `#` would start a URL fragment.
- **The prose is deliberately tiny:** Usage, Tips, Contribution, Contact, License, then the tables. No
  opinion about count, order, contrast or mobile — that is why this skill exists.

## The URL, dissected

```text
base   https://img.shields.io/badge/    the host and the badge path prefix
path   label-message-color               three dash-separated segments: LABEL, MESSAGE, COLOR
query  ?style=flat-square&logo=github   rendering options; never changes the words

LABEL may be omitted — /badge/<MESSAGE>-<COLOR> renders one segment instead of two.
```

Everything in the path is escaped by hand. Get one character wrong and the badge silently renders the wrong
text.

| Character | Type as | Example |
| --- | --- | --- |
| `-` hyphen | `--` | `pre-release` → `pre--release` |
| `_` underscore | `__` | `snake_case` → `snake__case` |
| space | `_` (or `%20`) | `last commit` → `last_commit` |
| `/` slash | `%2F` | `CI/CD` → `CI%2FCD` |
| `%` percent | `%25` | `98%` → `98%25` |
| `+` plus | `%2B` | `C++` → `C%2B%2B` |
| `#` hash | never in markdown | write `F7DF1E`, not `#F7DF1E` |

| Param | Accepts | What it does |
| --- | --- | --- |
| `style` | `flat` (default), `flat-square`, `plastic`, `for-the-badge`, `social` | Picks the whole visual language. See below. |
| `logo` | Simple Icons slug — `github`, `python`, `nextdotjs` | One mark, drawn at the far left in front of the label. |
| `logoColor` | name or hex | `white` on dark brands, `black` on yellow/cyan ones. |
| `label` | text | Overrides the left half without touching the path. |
| `labelColor` | name or hex | The left half's fill; `#555` by default. |
| `color` | name or hex | Overrides the third path segment. |
| `link` | URL, repeatable | Click target for each half when the badge is not wrapped in `[]()`. |
| `cacheSeconds` | integer | Shortens the shields-side cache on hand-maintained badges. |

## Six badges worth copying

```markdown
<!-- stack — one language badge is plenty; three means you could not decide -->
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<!-- license — static, because the answer does not change -->
[![License: MIT](https://img.shields.io/badge/license-MIT-0f766e?style=flat-square)](https://github.com/acme/aperture/blob/main/LICENSE)

<!-- version — dynamic, because a hand-written version rots within a week -->
[![npm](https://img.shields.io/npm/v/your-package?style=flat-square&logo=npm&logoColor=white&label=version)](https://www.npmjs.com/package/your-package)

<!-- CI — workflow file name first, branch second -->
[![CI](https://img.shields.io/github/actions/workflow/status/OWNER/REPO/ci.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white)](https://github.com/OWNER/REPO/actions)

<!-- downloads — vanity, but the honest kind -->
[![downloads](https://img.shields.io/npm/dm/your-package?style=flat-square&logo=npm&logoColor=white&label=downloads/month)](https://www.npmjs.com/package/your-package)

<!-- social — link it, or it is decoration -->
[![X](https://img.shields.io/badge/X-000000?style=flat-square&logo=x&logoColor=white)](https://x.com/yourhandle)
```

## Pick one style, once

| Style | Height | Character | Use it for |
| --- | --- | --- | --- |
| `flat` | 20px | rounded ends, soft gradient, grey label | the classic OSS README |
| `flat-square` | 20px | square corners, no gradient | design-conscious repos; the safest default |
| `plastic` | 18px | glossy bevel, mid-2000s | nothing new; only to match a legacy README |
| `for-the-badge` | 28px | uppercase, wide, loud | profile READMEs where badges *are* the design |
| `social` | 20px | monochrome, hover states, no colour | star/download counters |

- **One style for the whole row.** A `flat` badge beside a `for-the-badge` badge looks like a mistake,
  because it is one.
- **`social` is the trap.** `/github/stars/OWNER/REPO` defaults to it: the same URL renders 88×20 social
  and 68×20 with `?style=flat`. Add the style param explicitly or the stars badge breaks the row.
- **`logoColor` is not decorative.** White disappears on `FFCA28`, black disappears on `000000`. Match the
  logo to the fill, not to your mood.
- **Colours carry meaning:** blue = information, green = passing/released, orange/yellow = beta or warning,
  red = failing, light grey = inactive. A red badge in a row of greens reads as an alarm whether you meant
  it or not.

## A designed header, end to end

The header is six beats, in this order: **mark → title → tagline → one badge row → one paragraph → proof.**

```markdown
<p align="center">
  <img src="./assets/mark.svg" width="72" height="72" alt="Aperture logo">
</p>

<h1 align="center">Aperture</h1>

<p align="center"><strong>Screenshot diffs in CI, in forty seconds.</strong></p>

<p align="center">
  <a href="https://github.com/acme/aperture/actions/workflows/ci.yml"><img alt="Build passing" src="https://img.shields.io/github/actions/workflow/status/acme/aperture/ci.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white"></a>
  <a href="https://www.npmjs.com/package/aperture"><img alt="npm version 2.4" src="https://img.shields.io/npm/v/aperture?style=flat-square&logo=npm&logoColor=white"></a>
  <a href="./LICENSE"><img alt="License MIT" src="https://img.shields.io/badge/license-MIT-0f766e?style=flat-square"></a>
  <a href="https://github.com/acme/aperture/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/acme/aperture?style=flat-square&logo=github&logoColor=white"></a>
</p>

Aperture renders the same route on two branches, diffs the screenshots pixel by pixel, and fails the job
with a side-by-side image when they disagree. No account, no upload, no baseline server.

<img src="./assets/diff-view.png" alt="Side-by-side diff of the checkout page, 14 pixels changed" width="720">
```

Why it is written this way: inside an HTML block **GitHub does not parse markdown**, so a markdown image
wrapped in a markdown link renders as literal text in some viewers. Use `<a>` + `<img>` there. Keep the
`alt` even though the badge already has a label — it survives a shields outage. The screenshot gets a real
sentence as `alt`, not "screenshot". Four badges, one style, one line, centred; the image does the selling.

## Static vs dynamic

| Badge | Hand-write it | Pull it from shields |
| --- | --- | --- |
| Licence | `license-MIT-0f766e` — one licence, never changes | `/github/license/OWNER/REPO` |
| Version | never; it rots in a week | `/npm/v/PKG`, `/pypi/v/PKG`, `/github/v/release/OWNER/REPO` |
| Build | never | `/github/actions/workflow/status/OWNER/REPO/ci.yml?branch=main&event=push` |
| Downloads | — | `/npm/dm/PKG`, `/pypi/dm/PKG` |
| Stars | — | `/github/stars/OWNER/REPO` (force `?style=flat-square`) |
| Coverage | never fake it | Codecov / Coveralls badge, copied verbatim from their dashboard |
| Anything JSON | — | `/badge/dynamic/json?url=<encoded API>&query=$.field&label=…` |

The workflow segment is the file name (`ci.yml`) or the workflow's `name:`, and GitHub's native
`https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg?branch=main&event=push` is the same data
without shields in the middle — use it when you want zero third parties in the path.

**A dynamic badge is a promise.** One that is red 30% of the time — flaky matrix job, nightly-only failure,
a branch nobody merges — trains readers to ignore the entire row, and then the 70% of the time it is green
means nothing. Either fix the pipeline, narrow the workflow to the job you actually gate on, or delete the
badge. Wrong endpoints fail quietly too: a misspelled repo renders a calm grey `repo not found`, and a
missing workflow renders `no status` — both ship looking perfectly official.

## Colour discipline

| Name | Hex rendered | Alias | Use for |
| --- | --- | --- | --- |
| `brightgreen` | `#4b0` | `success` | passing, shipped |
| `green` | `#67ac09` | — | stable, supported |
| `yellowgreen` | `#95991a` | — | release candidate |
| `yellow` | `#d8b800` | — | beta, partial support |
| `orange` | `#ea7233` | `important` | warning, deprecation |
| `red` | `#dd4343` | `critical` | failing, unsupported |
| `blue` | `#007ec6` | `informational` | neutral facts: version, licence, platform |
| `lightgrey` | `#939393` | `inactive` | archived, experimental |

Prefer the **name** over the hex: shields has re-tuned these for contrast and will keep doing so. When you
need a brand hex, write it without `#` (`3178C6`) and check it on both themes — a `000000` badge vanishes
on GitHub dark, a `FFCA28` badge vanishes on light. If a single colour must survive both, use a mid-tone and
a contrasting `logoColor`; if it truly cannot, ship two `<img>` tags, one with `#gh-dark-mode-only` and one
with `#gh-light-mode-only` on the URL.

To look like **one family** rather than eight logos: pick the accent from your logo, use it for the two
badges that carry no brand (`license`, `version`), and let the language/framework badges keep their own
brand colours. Two custom colours plus four brand colours is a row; six custom colours is a paint chart.

## Accessibility and markdown traps

- **`alt` describes the fact, not the picture:** `alt="Build passing"`, never `alt="badge"`. It is what a
  screen reader announces and what a reader sees when shields is down.
- **Every badge that names a destination gets a link.** An unwrapped `<img>` is a dead end on mobile, where
  there is no hover to reveal anything.
- **Four to five per row, maximum.** At 360px a `for-the-badge` row of five is ~500px wide and wraps into
  two ragged lines; the 28px height also overwhelms a compact README that uses 16px body text.
- **Fix the param order:** `?style=…&logo=…&logoColor=…&label=…`. Order does not change the render, but a
  fixed order keeps diffs readable and makes duplicated params (`style=flat&style=flat-square`) obvious.
- **Caching hides your fix.** shields caches upstream results and GitHub proxies the image through Camo, so
  a corrected badge can take minutes to an hour to appear; `cacheSeconds` only shortens the first hop.
  Do not "fix" a badge by adding a random query param — you have broken the cache, not the colour.
- **A broken image is a design decision you skipped.** If shields 5xx's, the `<img>` collapses to its alt
  text; two badges and a sentence degrade gracefully, twelve badges become a wall of grey words.

## Reference files

- `references/badge-templates.md` — 54 copy-paste badges in 8 categories, every URL checked against
  shields.io, each in both `flat-square` and `for-the-badge`, plus a profile README starter block.

## Checklist before shipping

- [ ] Four to five badges, one row, one style, all 20px or all 28px
- [ ] Every `-` written as `--`, every `_` as `__`, no raw `#` in any colour
- [ ] Version and build are dynamic; licence is static; nothing duplicates the first paragraph
- [ ] Every badge has factual `alt` text and a working link target
- [ ] Colours are semantic and legible on both GitHub themes
- [ ] `?style=` is explicit on `/github/stars/…` (it defaults to `social`)
- [ ] Row checked at 360px width and with images blocked

---
name: readme-stats
description: "Add GitHub Readme Stats cards (stats, top-langs, pin, wakatime, gist) to a profile README — themed, transparent, width-matched and cached so they load fast instead of showing a broken 503. Use when a GitHub profile needs proof of work without badge soup. Trigger words: GitHub 主页, 个人简介, 数据卡片, 统计卡片, profile README, github stats card, top languages, readme badge."
license: MIT
metadata:
  author: Woodytest2025
  version: "1.0.0"
  category: github-profile
  keywords: github-readme-stats, profile-readme, svg-cards, top-languages, github-stats, badges
  source: https://github.com/anuraghazra/github-readme-stats
  stars: "80k"
allowed-tools: bash read write
---

# GitHub Readme Stats — Cards That Don't Embarrass You

GitHub Readme Stats renders a user's GitHub activity as an **SVG image** you embed in a README: `/api` (stats),
`/api/top-langs`, `/api/pin`, `/api/gist`, `/api/wakatime` — all driven by query parameters, no build step.

This is **the cheapest big upgrade to a profile README**: two well-chosen cards tell a visitor what you build,
where you spend your time, and how active you are — in under a second of reading. The trap is that the default
output is ugly: green-on-black `#151515`, mismatched widths, a rank ring nobody understands, a language list
topped by "Jupyter Notebook". The card is not the design. **The curation is:**

> Two cards. One accent colour. Transparent background. Equal geometry. Nothing else.

## When to use it

| Situation | Why these cards fit |
| --- | --- |
| Personal profile README (`username/username`) | Instant, factual "what I work on" block above the fold |
| Job-hunting / freelance profile | Languages + activity are legible proof, cheaper than a portfolio |
| Open-source maintainer profile | Pin card spotlights the one repo you want starred |
| Student / early-career profile | Commit history and language mix are the only signal available |
| Docs or project README "about the author" strip | One compact `top-langs` card, no stats card |
| Wakatime users | `/api/wakatime` shows hours by language — stronger than commit counts |

**Do not use it when:**

- The README belongs to a **private team or company org** — cards expose personal accounts, and org profiles
  look wrong with a personal stats card.
- The repo is a **library README** (npm/PyPI front page). Visitors came for install instructions; a stats card
  is self-indulgent noise. One `pin` card is the maximum.
- A **broken image would look worse than no image**. The public Vercel instance is rate-limited and does return
  503s; if the README is a landing page for a product, self-host first (see below) or skip the cards.
- The account is **nearly empty** (a handful of commits). An honest short README beats a card showing `0`.
- You need per-repo metrics, contributor graphs or CI status — that is `lowlighter/metrics` or badges, not this.

## Quick start

Minimum viable pair, pasted into `README.md` (replace `YOUR_HANDLE`):

```md
<div align="center">

<img height="165" src="https://github-readme-stats.vercel.app/api?username=YOUR_HANDLE&show_icons=true&theme=transparent&hide_border=true&rank_icon=github" alt="GitHub stats" />
<img height="165" src="https://github-readme-stats.vercel.app/api/top-langs/?username=YOUR_HANDLE&layout=compact&langs_count=8&theme=transparent&hide_border=true" alt="Top languages" />

</div>
```

Why each piece:

- `theme=transparent` — one parameter that removes the "screenshot from 2019" look and lets the card inherit
  whatever background GitHub is using. This alone fixes most of the ugliness.
- `hide_border=true` — the default border is a hairline rectangle that fights GitHub's own card edges.
- `height="165"` — sets **one** axis so the two cards share a baseline. Never set `height` and `card_width` on
  the same `<img>`; the browser stretches the SVG.
- `layout=compact` — a horizontal language bar instead of a tall list. The single most important `top-langs`
  parameter for narrow screens.
- `alt` on every image — screen readers and the broken-image fallback both use it.

Inside raw HTML attributes, prefer `&amp;` over `&`. GitHub tolerates a bare `&`, but `&amp;` is the only
form that survives every Markdown renderer (including mirrors and static-site generators).

**Side-by-side vs stacked.** Two `<img>` tags inside one `<div align="center">` sit side by side while the
viewport allows, then wrap on mobile — usually the desired behaviour. For a hard two-column grid that never
wraps, put the same two tags in `<table><tr><td valign="top">…</td><td valign="top">…</td></tr></table>`; just
remember a table will not wrap, so it overflows on narrow screens. Default to the `div`.

## Parameters that matter

Two groups: the ones that change how it **looks**, and the ones that change whether it tells the **truth**.

### Design parameters

| Parameter | Values | What it does | Recommended |
| --- | --- | --- | --- |
| `theme` | theme name, e.g. `dark`, `tokyonight`, `radical`, `github_dark`, `transparent` | Applies a full preset palette | Pick one, use it on every card |
| `bg_color` | hex, no `#`, e.g. `0d1117`; `00000000` = transparent | Card background | `00000000` or omit with `theme=transparent` |
| `title_color` | hex | Title text | Your one accent |
| `text_color` | hex | Labels and values | Muted: `57606a` light / `c9d1d9` dark |
| `icon_color` | hex | The stat icons (`show_icons=true`) | Same accent as `title_color` |
| `border_color` | hex | 1px card border | Same as `bg_color`, or `hide_border=true` |
| `border_radius` | number, e.g. `8` | Corner radius | `8`–`12`; `0` for brutalist, GitHub is `6` |
| `hide_border` | `true` | Removes the border entirely | `true` on transparent cards |
| `card_width` | number, e.g. `400` | Fixed width in px | `400`–`420`, **identical on both cards** |
| `rank_icon` | `default`, `github`, `percent` | Rank ring style | `github` (an octocat, no cryptic letter grade) |
| `show_icons` | `true` | Small icons next to each metric | `true` — it is what makes the card read as designed |
| `locale` | language code from `src/translations.js` (`en`, `de`, `es`, `fr`, `ja`, `pt-br`, `ru`, …) | Translates labels | Match the README's language |
| `custom_title` | string | Replaces "GitHub Stats" / "Most Used Languages" | Rename once you have a voice: "Shipped this year" |
| `disable_animations` | `true` | Kills the CSS fade-in | `true` for screenshots, PDFs, print |

### Correctness parameters

| Parameter | Values | Why it matters |
| --- | --- | --- |
| `count_private` | `true` | Includes private contributions in totals. Needs a token **that can see them** — on the public instance, usually nothing changes. Self-host to make it real. |
| `include_all_commits` | `true` | Counts every year, not just the current one. Makes old accounts look their age. |
| `hide` | comma list: `commits,prs,issues,contribs,stars,prs_merged` | Remove metrics you are weak on. Removing one row also tightens the card. |
| `hide_title` | `true` | Drops the heading — useful when your own `<h3>` already names the section |
| `number_format` | `short` (1.2k), `none` (1,234), `long` (1.2 thousand) | Pick one and use it on both cards |
| `show` | `reviews,prs_merged,prs_merged_percentage,discussions_started,discussions_answered` | Adds extra rows for maintainers and reviewers |
| `commits_year` | 4-digit year | Restricts the commit count to one year — great for "what I did in 2025" |
| `exclude_repo` | comma list (top-langs) | Drops coursework/forks that would otherwise dominate the language mix |
| `size_weight` / `count_weight` | floats, default `1` / `0` | How language percentages are ranked — see the Jupyter pitfall below |
| `langs_count` | number, default `5` | How many languages appear; `8` is a good compact strip |

There is **no `dates` parameter** — for a time window use `commits_year`; for a repo filter use `exclude_repo`.

## The designed-profile recipe

1. **Pick one theme as the base.** `tokyonight`, `github_dark`, `radical`, `gruvbox`, `nord`, `dracula` are the
   presets that survive contact with GitHub's UI. Browse the gallery in `themes/README.md`.
2. **Override exactly one accent.** Take the theme's title colour and set `title_color` + `icon_color` to your
   personal accent (a project colour, a brand hue). Two accents is a mess; three is a casino.
3. **Go transparent.** `theme=transparent&hide_border=true`, or `bg_color=00000000`. The card then matches
   GitHub light *and* dark without a second asset.
4. **Equalise the width, not the height.** Same `card_width` on both cards, same `border_radius`, same
   `number_format` — equal widths align the tops and let the heights fall where they may.
5. **Lay them out side by side** in a centred `<div>` (see Quick start), stats first — activity is the hook,
   languages are the detail.
6. **Add one separator** between the cards and the rest of the README: a centred `<img>` divider, `---`, or a
   single `###` heading. One separator, not three.
7. **Keep exactly two cards.** A third (pin, wakatime, streak) is allowed only if it is the point of the
   profile. Four cards is a dashboard, and nobody reads a dashboard in a README.

The full result is one block you can ship:

```md
<div align="center">

<img src="https://github-readme-stats.vercel.app/api?username=YOUR_HANDLE&show_icons=true&hide_border=true&rank_icon=github&number_format=short&theme=transparent&title_color=2f81f7&icon_color=2f81f7&text_color=57606a&card_width=420" alt="GitHub stats" />
<img src="https://github-readme-stats.vercel.app/api/top-langs/?username=YOUR_HANDLE&layout=compact&langs_count=8&hide_border=true&theme=transparent&title_color=2f81f7&text_color=57606a&card_width=420" alt="Top languages" />

<sub>Updated on every page load — no cron, no action.</sub>

</div>
```

## Dark and light parity

GitHub renders README images in both colour schemes, often in the same session. Two reliable approaches:

**`<picture>` with a media query** (the modern, reliable one):

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-stats.vercel.app/api?username=YOUR_HANDLE&show_icons=true&hide_border=true&theme=github_dark&card_width=420" />
  <img src="https://github-readme-stats.vercel.app/api?username=YOUR_HANDLE&show_icons=true&hide_border=true&theme=default&card_width=420" alt="GitHub stats" />
</picture>
```

The `<img>` is the light-mode fallback; the `<source>` wins when the OS is dark — this is the approach to use.

**Transparent + one palette** — `theme=transparent` with `title_color`/`text_color` chosen for contrast against
*both* backgrounds. Cheapest, one asset, always matches; the compromise is that mid-grey text can look washed
out in one of the two modes.

**Legacy anchors** (`#gh-dark-mode-only`, `#gh-light-mode-only` appended to the image URL) still appear in old
tutorials. GitHub has been retiring this syntax; treat it as unsupported and use `<picture>` instead.

## Other endpoints

| Card | Endpoint | Extra parameters | Use it for |
| --- | --- | --- | --- |
| Stats | `/api?username=…` | `show_icons`, `rank_icon`, `hide`, `show`, `include_all_commits` | The activity headline |
| Top languages | `/api/top-langs/?username=…` | `layout=compact\|donut\|donut-vertical\|pie`, `langs_count`, `exclude_repo`, `size_weight`, `count_weight` | The "what I write" card |
| Pin | `/api/pin/?username=…&repo=…` | `show_owner`, `description_lines_count` | Spotlight one repo in a grid |
| Gist | `/api/gist?id=…` | theme + colour params | Show a snippet's stars/forks/files |
| Wakatime | `/api/wakatime/?username=…` | `layout=compact`, `langs_count`, `hide`, `custom_title` | Hours coded per language |

```md
<img src="https://github-readme-stats.vercel.app/api/pin/?username=YOUR_HANDLE&repo=YOUR_REPO&theme=transparent&hide_border=true&description_lines_count=2" alt="Pinned repo" />

<img src="https://github-readme-stats.vercel.app/api/wakatime?username=YOUR_HANDLE&layout=compact&langs_count=8&theme=transparent&hide_border=true" alt="Wakatime" />
```

Pin cards are the best option for a **library README** — one card, no personal stats. Wakatime needs a public
Wakatime profile; it is meaningless without one, and `layout=compact` keeps it readable.

## Self-hosting (and why you probably should)

The public `github-readme-stats.vercel.app` instance is a **best-effort service**: it shares a small pool of
GitHub API tokens across every visitor on the internet, so cards get queued, served stale, or fail with a 503 /
"maximum retry limit reached" during peak hours. Self-hosting is a 10-minute fork-and-deploy and removes the
lottery:

1. **Fork** `anuraghazra/github-readme-stats` on GitHub.
2. **Import** the fork into Vercel (New Project → your fork → deploy). No build config needed.
3. **Create a classic PAT** with `repo` (and `read:user`) scope — `repo` is what makes `count_private=true`
   actually count private commits.
4. **Set env vars** in Vercel → Settings → Environment Variables:
   - `PAT_1` = your token (add `PAT_2`, `PAT_3`… to rotate and multiply your hourly quota)
   - `CACHE_SECONDS` = edge cache TTL; raising it trades freshness for fewer API calls (a profile card does not
     need to be fresher than a few hours)
   - `WHITELIST` = comma-separated usernames allowed to use your deployment, if you do not want to be a public
     proxy
5. **Point your README** at `https://<your-project>.vercel.app/api?username=…`.

Why it fixes things: your own token quota (5,000 req/h authenticated instead of 60 unauthenticated), your own
cache, and private-contribution counts that are actually visible to the token. It also stops your README from
breaking because someone else's went viral.

If you want richer output — contribution calendars, music, posts, dozens of plugins, committed snapshots — look
at [`lowlighter/metrics`](https://github.com/lowlighter/metrics). It runs as a GitHub Action, commits generated
SVGs into the repo, and never depends on a third-party server; the cost is a heavier workflow and more
configuration. Choose one system, not both.

## Pitfalls

| Symptom | Cause | Fix |
| --- | --- | --- |
| Card looks unchanged after editing | GitHub proxies images through its camo cache | Bump the URL: add `&v=2`, then `&v=3` on the next edit |
| Raw "Something went wrong" / red text in the README | Upstream rate limit or 503, rendered as an SVG error card | Retry, self-host, or remove the card; never ship a card you have not seen load |
| Two cards of different heights, ragged layout | One card has a title/extra rows | Fix one axis on both cards — equal `card_width` (recommended) or equal `height` — never both on one `<img>` |
| Card overflows on mobile | Default width plus a long language list | `layout=compact`, `card_width=400`, `langs_count=8` |
| Language card says "Jupyter Notebook 78%" | `size_weight` counts notebook bytes, which include markup and outputs | `&size_weight=0.5&count_weight=0.5` or `exclude_repo=<notebook repos>` |
| Private work invisible despite `count_private=true` | The serving token cannot see those repos | Self-host with your own `PAT_1` |
| `count_private=true` reveals a big private workload | The card counts commits nobody can inspect | Leave it off on a public job-hunting profile, or expect the "what is all this?" question |
| Numbers look fake or contradictory | `include_all_commits` on one card, default on the other | Set `include_all_commits` and `number_format` identically on the pair |
| Text disappears in dark mode | A light theme with hardcoded `bg_color`, or grey-on-grey | `theme=transparent`, or `<picture>` with two themes |
| Card is huge relative to text | Default width on a narrow README column | `card_width=400`; GitHub's content column is ~830px, so two 400s + gap fits |
| Accent colour is invisible | `icon_color` set but `show_icons=false` | Turn on `show_icons` before choosing icon colours |

## Visual rules

- **Two cards, one accent, one radius.** Treat the pair as a single component, not two images.
- **Transparent beats themed.** A transparent card never mismatches GitHub's background; a hardcoded `bg_color` will.
- **Muted text, loud title.** `text_color` should sit near GitHub's own secondary text; reserve saturation for
  `title_color` and `icon_color`.
- **No rank letter by default.** `rank_icon=github` (or hiding the rank) avoids the "B+" conversation.
- **Numbers must be true; alt text on every card.** Hide metrics rather than inflate them; every `<img>` gets `alt`.

## Reference files

- `references/params.md` — full parameter list per endpoint, theme names, six copy-paste hex presets, URL
  encoding and caching notes.

## Checklist before shipping

- [ ] Exactly two cards (or one pin card on a project README)
- [ ] `theme=transparent` + `hide_border=true` — no default green-on-black
- [ ] One accent colour across `title_color` and `icon_color`
- [ ] Same `card_width` / `border_radius` / `number_format` on both cards
- [ ] `layout=compact` and `langs_count≤8` on `top-langs`
- [ ] `include_all_commits` and `count_private` set deliberately, not by accident
- [ ] Every `<img>` has `alt`; dark mode checked with `<picture>` or transparent bg
- [ ] URLs loaded successfully in a private window (no error card)
- [ ] Self-hosted instance noted in a comment if the public one 503s

---
name: simple-icons
description: Embed consistent, single-colour brand marks with Simple Icons — 3,400+ free SVG logos (npm `simple-icons` 16.x) for tech-stack rows, social links, integration grids, README badges, sponsor blocks and docs. Use when a footer, pricing table or "built with" strip needs real company logos that agree on size, colour and optical weight. Trigger words — 品牌图标, 技术栈图标, 社交图标, 徽章, logo 墙, brand icons, logos, tech stack, social icons, badges, shields, simple icons.
license: CC0-1.0
metadata:
  author: Woodytest2025
  version: "1.0.0"
  category: design-icons
  keywords: simple-icons, brand-icons, svg, logos, badges, shields, iconography
  source: https://github.com/simple-icons/simple-icons
  stars: "26k"
allowed-tools: bash read write
---

# Simple Icons — One Brand Language

**Simple Icons** is a library of 3,400+ single-colour brand marks. Every logo is normalised to one `<path>` on a
24 × 24 grid, so GitHub's cat, Vercel's triangle and Stripe's wordmark arrive in the same box and can be
*typeset* instead of assembled. It solves supply — current, consistently drawn marks — but not composition, which is
the rest of this file.

A tech-stack row is a design decision, not a shopping list. When every mark sits in the same box, the same ink and
the same gap, the row reads as one texture. When one logo is 40px, one is full colour, one is a PNG with a white
background and one still carries its tagline, the page looks glued together from press kits. **Mixed icon sets and
mismatched optical weights are the tell of an amateur page.**

## When to use it

| Situation | Why Simple Icons fits |
| --- | --- |
| Tech-stack / "built with" grids | One shared grid, so a six-up row looks typeset |
| Social links in headers and footers | One colour system instead of eight platform palettes |
| Integration and partner logos | Vendors' own assets have wildly different weights; these don't |
| README badges | Shields.io resolves the same slugs, so docs and site agree |
| Sponsor and customer sections | Monochrome until hover keeps focus on the names |

**Do not use it for:** interface glyphs (brands only — no arrows, chevrons, search or state icons; use Lucide or
Phosphor for UI chrome and never mix them into a logo row); brands missing from the set (never approximate with a
lookalike or a generated mark — use a wordmark instead); trademark-sensitive use (not as your own product icon, not
implying endorsement, not a "trusted by" row without permission); or decoration. **These are logos, not artwork.**

## Install and the icon object

`npm install simple-icons` — 16.x; pin the major, because icon data changes between minors.

```js
import { siGithub, siVercel } from "simple-icons";

siGithub.title;       // "GitHub"
siGithub.slug;        // "github"
siGithub.hex;         // "181717" — six hex digits, no leading "#"
siGithub.path;        // one 24×24 SVG path
siGithub.source;      // URL of the brand's source page
siGithub.guidelines;  // optional: URL of the brand's usage guidelines
siGithub.svg;         // ready-made "<svg role=\"img\" …><title>…</title><path …/></svg>"
```

- `hex` is the brand colour — prefix it: `` `#${siGithub.hex}` ``. `path` is drawn on a 24 × 24 `viewBox`; no
  strokes, gradients or second colours.
- `svg` is a convenience string for copy-paste and SSR. It carries **no `fill`**, so it renders black until styled.
- `guidelines` exists only for brands that publish rules; read it before recolouring. **No giant JSON default export
  any more** — older `simpleIcons.icons` tutorials are dead, and 16.x is named exports all the way down.

## Three ways to ship a mark

### 1. Inline SVG from npm — the default choice

```tsx
import { siGithub, siVercel, type SimpleIcon } from "simple-icons";

function BrandIcon({ icon, size = 20 }: { icon: SimpleIcon; size?: number }) {
  return (
    <svg role="img" viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
}
// <a href="https://github.com/acme" aria-label="GitHub"><BrandIcon icon={siGithub} /></a>
// <a href="https://vercel.com" aria-label="Vercel"><BrandIcon icon={siVercel} /></a>
```

- `fill="currentColor"` is what makes the row themable: icons inherit the parent text colour and flip with dark
  mode for free.
- `<title>` is the accessible name; don't also set `aria-label` on the same `<svg>`. When decorative, drop `<title>`
  and add `aria-hidden="true"`, and put `aria-label` on the `<a>` for icon-only links.
- `type SimpleIcon` ships with the package, so one `<BrandIcon>` accepts any mark. Import named icons only —
  `import * as icons` or an `icons[slug]` lookup defeats tree-shaking and drags the whole set into the bundle.

Vue mirrors it: `import { siVercel } from "simple-icons"` in `<script setup>`, then
`<svg viewBox="0 0 24 24" fill="currentColor"><title>{{ siVercel.title }}</title><path :d="siVercel.path" /></svg>`.

### 2. CDN `<img>` — zero build step

```html
<img src="https://cdn.simpleicons.org/react/61DAFB" alt="React" width="24" height="24"
     loading="lazy" decoding="async" />
```

- URL shape is `https://cdn.simpleicons.org/<slug>`, plus an optional `/<colour>` (hex without `#`; common named
  colours also work). `.svg` is an optional suffix.
- There is **no size parameter**. The response is a 24 × 24 `viewBox` SVG, so the `<img>` `width` and `height`
  decide the rendered size.
- `<img>` is a separate document: page CSS, `currentColor` and dark-mode tokens cannot reach it, and the fill is
  baked into the URL. Two themes mean two URLs.
- Without a colour segment you get the CDN's default fill. Always pass the colour you designed with, so the palette
  is not decided at the edge.

### 3. Local sprite — zero runtime dependency

Generate a `<symbol>` sheet from the paths you actually use, once at build time:

```js
// scripts/build-brand-sprite.mjs
import { siGithub, siVercel, siStripe } from "simple-icons";
import { writeFileSync } from "node:fs";

const symbols = [siGithub, siVercel, siStripe]
  .map((i) => `<symbol id="i-${i.slug}" viewBox="0 0 24 24"><path d="${i.path}"/></symbol>`)
  .join("");
writeFileSync("src/brand-sprite.svg", `<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`);
```

Inline that file once in the layout (or import it as a raw string), then reference it by id:

```html
<svg class="brand-icon" aria-hidden="true"><use href="#i-github" /></svg>
```

`fill`/`currentColor` inherit into `<use>`; width and height belong on the outer `<svg>`. Sprite 20–40 marks, not
3,400 — a sprite of everything is a payload nobody asked for.

## Finding the slug

1. **simpleicons.org** — search by brand name; the result shows the slug and the hex.
2. **`slugs.md`** in the repository root — the full title → slug index, greppable offline; a condensed version
   with hexes and rename traps lives in [references/slugs.md](references/slugs.md).
3. **Naming rule** — the JS export is `si` plus the slug with its first letter capitalised: `github` → `siGithub`,
   `nextdotjs` → `siNextdotjs`, `x` → `siX`.

Wrong slugs are the **#1 failure**. An `<img>` fails silently (alt text only), a bad import is a build error only if
you are lucky, and `node -e "import('simple-icons').then(m => console.log(Object.keys(m).filter(k => k.includes('next'))))"`
is a faster answer than guessing. The traps:

| Looks right | Actually ships as |
| --- | --- |
| `next` / `nextjs` | `nextdotjs` |
| `node` | `nodedotjs` |
| `vue` | `vuedotjs` |
| `twitter` | `x` (the old mark was removed, not aliased) |
| `aws` / `amazonaws` | `amazonwebservices` |
| `rails` | `rubyonrails` |
| `java` | `openjdk` — a different mark; check before substituting |

## Design rules for a logo row

| Context | Icon box | Gap |
| --- | --- | --- |
| Marketing / integrations grid | 28–32 px | 16–24 px |
| Product UI footer, "built with" row | 20–24 px | 8–12 px |
| Dense comparison table cell | 16 px + text label | 6–8 px |

- **One box, then optical correction.** Same `width`/`height` for all, then nudge visually heavy marks (GitHub's
  solid cat, X, Apple) down 1–2 px and airy marks up 1–2 px. The eye reads optical size, not geometry.
- **One ink.** Either the brand hex for every mark, or a single monochrome (`currentColor` at 60–70% opacity).
  Never mix: one coloured logo among grey ones reads as a bug; hover may reveal the brand hex in 150 ms.
- **One gap, on the spacing scale.** 8 or 12 px in UI, 16 or 24 px in marketing — not `justify-between` with ragged
  gaps row to row. Centre vertically with flex; SVG boxes do not share a baseline.
- **Six to eight maximum.** Past eight the row stops being scannable; switch to a labelled grid or an "and 40 more" link.
- **Name every logo.** `<title>`, `aria-label` on the link, or visible text; decorative repeats get
  `aria-hidden="true"`. Label unfamiliar marks — 12 px text under a 24 px icon beats guessing.

## Brand colour

`hex` is the brand's own value — exactly what recognition wants, and exactly what breaks contrast.

- **Check 3:1** against the adjacent background (the WCAG threshold for non-text graphics). JavaScript yellow
  (`#F7DF1E`) and Hugging Face yellow both fail on white; darken toward near-black rather than desaturating at
  random with `color-mix(in oklab, #F7DF1E 65%, #111)`.
- **Monochrome-first for dark mode.** Black marks (Vercel, X, Next.js, Apple, TikTok) vanish on a near-black surface;
  render `currentColor`, or put each mark on a light chip.
- **Do not freestyle the hue.** Many guidelines permit only the official colour, black or white; read
  `icon.guidelines` when present. Keep brand tokens in CSS (`--brand-github: #181717`) and override them for dark mode.

## README badges

Shields.io reads the same slugs, so docs and product stay in one language:

```md
[![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev)
```

- `logo=` takes the Simple Icons slug — the same `nextdotjs` and `nodedotjs` traps apply. `logoColor=` sets the glyph
  only; the badge background is the segment after the label (`61DAFB`).
- `style=flat-square` is the docs default: compact, square, reads as metadata. `style=for-the-badge` is loud —
  all-caps, oversized, high contrast; one at the top of a README is a statement, ten is a carnival, and it never
  belongs in product UI.
- Shields renders on its own server and does not adapt to dark mode. Pick a `logoColor` that survives both GitHub
  themes. Keep labels short: `-` escapes as `--`, `_` as `__`.

## Performance

- **Tree-shake or pay.** A typical mark is under 1 KB of path data and nine in ten stay under 3 KB (React ≈ 2.9 KB,
  GitHub ≈ 0.8 KB, Vercel ≈ 0.1 KB). The full set is megabytes; shipping it for a slug lookup is a real regression.
- **Inline what is above the fold**, lazy-load the rest; a CDN `<img>` per logo is a request per logo, eight inline
  `<svg>` nodes are zero. Add `loading="lazy"`/`decoding="async"` below the fold with intrinsic `width`/`height`.
- **Pin the version.** Paths redraw, hexes update and slugs disappear between minors; a lockfile plus a deliberate
  upgrade beats a silent redesign. Edge caches keep removed slugs alive long after a fresh page 404s.

## Licensing: CC0 artwork, trademarked brands

The repository is released under **CC0 1.0** — the SVG paths are a public-domain dedication. That is not the whole
story, and the README and `DISCLAIMER.md` say so:

- **Trademarks are not licensed by CC0.** Marks stay their owners'; neither CC0 nor inclusion grants usage rights.
- **Check the brand's guidelines** before recolouring, animating, cropping or combining a mark. `icon.guidelines`
  links them when they exist; `icon.source` points at the brand's asset page.
- **Do not imply endorsement.** "Works with" is descriptive; "trusted by" needs permission. Keep attribution present
  but light — a legal-page line ("Brand icons via Simple Icons, CC0; trademarks belong to their owners") is honest.

## Pitfalls

- **Wrong or stale slug** — the most common failure; an `<img>` shows alt text only, a renamed `siNext` → `siNextdotjs`
  import survives a string-only codemod, and retired marks (`twitter`) stop existing rather than aliasing.
- **Thin marks at 12 px** — linear geometry clogs into a smudge; 20 px minimum or a filled variant.
- **`<img>` cannot inherit `currentColor`** — theming means swapping URLs; black marks vanish in dark mode.
- **Mixed sources** — a Simple Icons mark next to a press-kit PNG next to a Font Awesome brand icon is three visual
  languages in one row.
- **Over-recolouring** — a logo tinted to match your accent often violates guidelines and looks counterfeit.
- **Stale CDN URL** — a removed slug can keep serving from edge cache; self-host anything long-lived.

## Checklist before shipping

- [ ] Every slug verified against simpleicons.org or `slugs.md`, never guessed
- [ ] One box size per row, heavy marks optically corrected by ±2 px
- [ ] One ink (brand hex, or monochrome at 60–70%) with ≥ 3:1 contrast in light and dark
- [ ] Gap on the spacing scale, six to eight logos maximum
- [ ] Every logo has an accessible name; decorative repeats are `aria-hidden`
- [ ] Named imports only, no `import *`; below-fold `<img>` icons are lazy
- [ ] Brand guidelines checked, no endorsement implied

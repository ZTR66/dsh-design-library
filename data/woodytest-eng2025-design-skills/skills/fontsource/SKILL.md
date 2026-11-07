---
name: fontsource
description: Self-host 2000+ open-source type families as npm packages with Fontsource — variable vs static packages, subsets, italics, font-display, fallback stacks and pairings that match a product's tone. Use when choosing type for a product or wiring fonts into a build without the Google Fonts CDN. Trigger words — 字体, 自托管字体, 字体搭配, webfont, variable font, font pairing, fontsource, self-hosted fonts, FOUT, CLS.
license: MIT
metadata:
  author: Woodytest2025
  version: "1.0.0"
  category: design-typography
  keywords: fontsource, webfonts, variable-fonts, subsets, font-display, type-pairing, self-hosted
  source: https://github.com/fontsource/fontsource
  stars: "6.1k"
allowed-tools: bash read write
---

# Fontsource — Self-hosted Type

Type is 80% of the perceived quality of a page. Before a reader parses a word, weight, width and rhythm have already
decided whether the product reads expensive, technical, friendly or cheap. Colour is decoration on top of that.

The Google Fonts CDN serves the same fonts at the cost of a third-party request chain (DNS + TLS + CSS + font on
`fonts.gstatic.com`), a privacy question, and no control over caching or `font-display`. **Fontsource** ships those
fonts as npm packages — `@fontsource/inter`, `@fontsource-variable/inter` — versioned and bundled with your app.
Every face it emits already declares `unicode-range` and `font-display: swap`, so the browser downloads only the
character sets the page uses. It does not pick the pairing or fix fallback metrics — that is this skill.

## When to use it

| Approach | Use it when | What it costs |
| --- | --- | --- |
| **Fontsource (npm)** | You control the build (Vite, webpack, Next, Astro, SvelteKit) and want immutable, cache-busted, first-party files | Weight in `node_modules`; you own preload and fallback metrics |
| **Google Fonts CDN** | A prototype, a microsite, or a CMS whose build you cannot touch | Third-party chain, consent question, blocked on some corporate networks |
| **Hand-rolled `@font-face`** | Licensed brand fonts, a custom subset, an exact pinned file | You write subsetting, `unicode-range`, formats and `font-display` |
| **System font stack** | Dashboards, admin tools, docs, email — UI that should disappear | No brand voice; looks like every native app |

**A system stack is the better answer more often than designers admit.** Data-dense UI, internal tools and content
read once do not earn a 50 KB download. `-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
renders instantly, never shifts, and on Apple platforms is San Francisco. Reach for a webfont when **brand voice is
part of the job**: marketing, editorial, onboarding, empty states, anything with a headline.

## Choosing the package

Same family, two shapes. The rule: **variable unless you ship only one or two weights.**

| | `@fontsource-variable/{family}` | `@fontsource/{family}` |
| --- | --- | --- |
| Covers | A continuous range, e.g. `100 900` | One weight, one style |
| Import | `import "@fontsource-variable/inter"` | `import "@fontsource/inter/400.css"` |
| Italic | `wght-italic.css` | `400-italic.css` |
| Extra axes | `opsz.css`, `standard.css`, `full.css` | none |
| Family name | `"Inter Variable"` | `"Inter"` |

Variable packages exist for most popular families, not all. Verified on npm for Fontsource v5.3.x: `inter`,
`inter-tight`, `geist`, `geist-mono`, `instrument-sans`, `manrope`, `figtree`, `outfit`, `public-sans`,
`space-grotesk`, `newsreader`, `source-serif-4`, `literata`, `fraunces`, `playfair-display`, `cormorant-garamond`,
`bodoni-moda`, `jetbrains-mono`, `roboto-mono`, `source-code-pro`, `fira-code`, `sora` (see references).

Static-only: `@fontsource/instrument-serif` (400 + italic), `@fontsource/ibm-plex-mono` (100–700 + italic),
`@fontsource/poppins`, `@fontsource/space-mono`, `@fontsource/fragment-mono` — none has a variable package.

## Install and import

```bash
npm install @fontsource-variable/inter @fontsource-variable/newsreader @fontsource-variable/jetbrains-mono
```

Import once, in the entry file (`main.ts`, `layout.tsx`, `+layout.svelte`), never inside a component. On Vite,
webpack, Astro or SvelteKit the import is enough: fonts become hashed, immutable assets.

```js
import "@fontsource/inter";                      // static: = 400.css, every subset
import "@fontsource/inter/latin-400.css";        // static: latin subset only, weight 400
import "@fontsource/inter/latin-400-italic.css";  // static: latin subset, 400 italic
import "@fontsource/inter/500.css";              // static: any other weight, one face per import

import "@fontsource-variable/inter";             // variable: wght, every subset
import "@fontsource-variable/inter/wght.css";    // variable: explicit wght
import "@fontsource-variable/inter/wght-italic.css";
import "@fontsource-variable/inter/opsz.css";    // optical size (Inter, Newsreader, Fraunces…)
import "@fontsource-variable/inter/standard.css";// wght + every other standard axis
```

- **One axis import per family.** Every axis CSS already contains `wght`, so `opsz.css` + `wght.css` emits duplicate
  `@font-face` blocks. Several standard axes? `standard.css`. Custom axes (Fraunces' `SOFT` / `WONK`)? `full.css`.
- **Subsets are a static-package feature.** `@fontsource-variable/inter/latin.css` is a 404; variable packages have no
  per-subset entry point and rely on `unicode-range`. `latin-400.css` / `latin-ext-300.css` are static-only.
- **Fontsource emits no CSS custom properties.** There is no `--fontsource-inter`; the CSS hard-codes
  `font-family: 'Inter Variable'`. Tokens are yours to write.

On Next.js `next/font/local` beats a raw CSS import because it adds metric-adjusted fallbacks and automatic preload:

```ts
// app/layout.tsx
import localFont from "next/font/local";
const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900", display: "swap", variable: "--font-sans",
});
```

Preload the one file the first screen needs. Bundlers rename assets, so import the URL instead of typing a path:

```js
import interUrl from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
// <link rel="preload" as="font" type="font/woff2" href={interUrl} crossorigin="anonymous" />
```

One preload per family, latin subset, normal style — preloading a file the first paint never uses is a self-inflicted
50 KB delay. TypeScript rejecting the side-effect import? Add `declare module "@fontsource/*" {}` to `globals.d.ts`.

## A CSS setup that holds up

```css
:root {
  /* Variable packages carry the " Variable" suffix; the static name is the safety net. */
  --font-sans: "Inter Variable", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-serif: "Newsreader Variable", Newsreader, ui-serif, Georgia, Cambria, "Times New Roman", serif;
  --font-mono: "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
}

html {
  font-family: var(--font-sans);
  font-optical-sizing: auto;   /* opsz tracks font-size; don't also set font-variation-settings:"opsz" */
  font-synthesis: none;        /* no faux bold, no faux oblique — ship real faces instead */
}

body {
  font-size: 1rem;                    /* 16px floor */
  line-height: 1.6;
  font-weight: 400;                   /* 300 looks elegant in Figma, weak on a real screen */
  font-variant-numeric: tabular-nums; /* numbers stop jittering in tables, timers, prices */
}

/* Display sizes need negative tracking and tighter leading — the biggest amateur tell. */
.display {
  font-size: clamp(3rem, 6vw, 3.75rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-weight: 600;
  font-feature-settings: "ss01" 1, "cv11" 1; /* Inter: alternate figures + single-storey a; verify per family */
}
```

Type scale, expressed once as tokens and reused everywhere:

| Token | Size | Line-height | Tracking | Role |
| --- | --- | --- | --- | --- |
| `xs` | 12px | 16px | `+0.01em` | captions, labels, badges |
| `sm` | 14px | 20px | `+0.005em` | secondary UI, help text |
| `base` | 16px | 26px | `0` | body copy |
| `lg` | 18px | 28px | `-0.005em` | lead paragraph, card body |
| `xl` | 20px | 30px | `-0.01em` | card titles, h4 |
| `2xl` | 24px | 32px | `-0.015em` | h3 |
| `3xl` | 30px | 38px | `-0.02em` | h2 |
| `4xl` | 38px | 46px | `-0.022em` | h1 |
| `5xl` | 48px | 54px | `-0.025em` | display |
| `6xl` | 60px | 64px | `-0.03em` | hero |

## Choosing type for a product

Pick the tone before the font. One display family, one text family, one mono — never more than three in total.

| Tone | Display | Text | Mono | What it signals |
| --- | --- | --- | --- | --- |
| **Editorial / opinion** | `newsreader` | `inter` | `jetbrains-mono` | Authored, edited, calm authority |
| **Institutional / docs / reports** | `source-serif-4` | `public-sans` | `ibm-plex-mono` | Trustworthy, plain-spoken, not trendy |
| **Friendly / consumer / geometric** | `manrope` | `figtree` | `jetbrains-mono` | Approachable, rounded, modern |
| **Technical / dev tool / SaaS** | `instrument-sans` | `inter` | `geist-mono` | Precise, product-not-landing-page |
| **Luxury / fashion / hotel** | `playfair-display` | `lora` | `ibm-plex-mono` | High-contrast heritage, expensive |
| **Swiss / design-led startup** | `space-grotesk` | `inter` | `jetbrains-mono` | Confident, typographic, of-the-moment |

Swaps: `fraunces` + `figtree` for warmth, `geist` for a monochrome technical look, `literata` + `public-sans` for
long-form non-fiction. Exact packages, weights, sizes and CSS live in `references/type-pairings.md`.

## Performance

Measured `latin` subset sizes, as shipped (woff2 is already compressed — gzip buys almost nothing):

| File | Size |
| --- | --- |
| `inter-latin-wght-normal.woff2` | ~47 KB — every weight, 100–900 |
| `fraunces-latin-opsz-normal.woff2` | ~65 KB |
| `newsreader-latin-opsz-normal.woff2` | ~128 KB (wide `opsz` range) |
| `inter-latin-400-normal.woff2` (static) | ~23 KB — one weight |

- **Two variable families cost 40–90 KB** and replace four to six static faces. Six static weights of one family is
  6 × ~23 KB = ~140 KB for the same visual range. That is the real reason not to load six weights.
- **Subset or pay for glyphs nobody renders.** Cyrillic, Greek and Vietnamese sit in the same CSS but are fetched
  only when a character in that range appears. `latin-*.css` trims the build; `unicode-range` trims the network.
- **`swap` vs `optional`.** `swap` (Fontsource's default) paints fallback text immediately — right for body copy.
  `optional` lets a slow first load skip the font and use it from cache later — right for a display face. Never `block`.
- **CLS is metric mismatch, not Fontsource.** Give the swap a metric-adjusted fallback so nothing reflows:

```css
@font-face {
  font-family: "Inter Fallback";
  src: local("Arial");
  size-adjust: 107%; ascent-override: 90%; descent-override: 22.4%; line-gap-override: 0%;
}
:root { --font-sans: "Inter Variable", "Inter Fallback", Arial, sans-serif; }
```

**Preload 1–2 files, maximum** — hero/body latin weight, nothing else — and trim the axis range in the build
(`fonttools varLib.instancer`) if you only use 400–700, never at runtime.

## Accessibility and i18n

- **Body 16px minimum**, line-height 1.5–1.7, measure 45–75ch. Tight leading on long lines is the most common
  readability failure in beautiful designs.
- **Weight is not contrast.** Thin strokes fail contrast at 14px even in near-black; keep 400+ below 18px, reserve
  200–300 for large display text, and re-check 4.5:1 body / 3:1 large after the real face is applied.
- **No faux styles.** Browsers slant the roman when italic is missing and it looks broken. Manrope, Space Grotesk,
  Outfit and Bricolage Grotesque ship no italic in Fontsource — use weight or colour for emphasis instead of `<em>`.
- **CJK is a different problem.** `@fontsource/noto-sans-sc` / `-jp` / `-kr` are megabytes per weight split into
  ~100 unicode-range slices. Load them only for that script, else pair `swap` with a system CJK fallback.
- **Arabic, Devanagari, Thai** need script-appropriate families (`noto-naskh-arabic`, `noto-sans-devanagari`,
  `noto-sans-thai`); a latin sans silently falls back to an unrelated system face.
- **Set `lang` and `dir`.** `<html lang="ja">` selects the right CJK glyph variants (SC vs JP) and drives hyphenation.

## Pitfalls

1. **`import "@fontsource/inter"` is not "just the font".** It is weight 400 across ~7 subsets: 7 `@font-face` rules
   and 14 emitted files. Use `latin-400.css`; the browser only downloads the ranges it needs, the *build* carries all.
2. **Mixing static and variable gives you two families.** `Inter` and `Inter Variable` are different names, and
   styling a weight you never installed (`font-weight: 500` on a 400-only package) synthesises bold.
3. **Missing italic → faux oblique.** `400.css` never includes italic; add `400-italic.css` / `wght-italic.css`, or
   set `font-synthesis: none` and accept upright emphasis.
4. **Tailwind drift.** Map the literal name (`"Inter Variable"`, quotes included) in `theme.fontFamily`, or define
   `--font-sans` in `@theme` and use `font-sans`. Two sources of truth silently render the fallback.
5. **FOUT in dark mode** flashes light-on-light text. Set the background on `html` before first paint and pair the
   fallback with `size-adjust`, or use `font-display: optional` for the brand face.
6. **Licensing.** Most families are SIL OFL-1.1: embedding is fine, but keep the license file, don't sell the fonts
   alone, and don't use a Reserved Font Name on a modified version. Some are Apache-2.0 or UFL — check `LICENSE`.

## Reference files

- `references/type-pairings.md` — six complete pairings: packages, weights, sizes, per-pairing CSS, signals, swaps.
- `references/font-loading.md` — per-framework loading, preload snippets, metric overrides, and how to verify output.

## Checklist before shipping

- [ ] One display family, one text family, one mono — three maximum
- [ ] Variable package unless only one or two weights are used; every weight/italic referenced is imported
- [ ] Family names match the package (`"… Variable"` for `@fontsource-variable/*`)
- [ ] Latin-only subset import when there is no multilingual need
- [ ] Fallback stack ends in a generic family, with a `size-adjust` face for the display font
- [ ] Exactly 1–2 preloads: latin subset, above the fold only
- [ ] `font-optical-sizing: auto`, negative tracking at display sizes, `font-synthesis: none`
- [ ] Body ≥16px, line-height 1.5–1.7, measure 45–75ch, contrast re-checked with the real face
- [ ] `lang`/`dir` set, no faux italics or synthetic bold, licenses shipped

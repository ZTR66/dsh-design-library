---
name: radix-colors
description: "Build a professional palette with Radix Colors' 12-step, perceptually tuned scales — pick a grey and an accent in minutes, use steps 9/11/12 correctly, and wire light, dark, alpha and P3 themes. Use when choosing brand colours, theming a design system, fixing muddy or inaccessible UI colour, or setting up colour tokens. Trigger words: 配色, 调色板, 主题色, 颜色系统, 暗色模式, 对比度, palette, color scale, design tokens, dark mode, WCAG."
license: MIT
metadata:
  author: Woodytest2025
  version: "1.0.0"
  category: design-color
  keywords: radix-colors, color-system, palette, design-tokens, dark-mode, wcag, tailwind, css-variables
  source: https://github.com/radix-ui/colors
  stars: "1.7k"
allowed-tools: bash read write
---

# Radix Colors — A 12-Step Colour System

Radix Colors is a set of 30+ colour scales, each with **12 numbered steps**. Every step has a fixed job: 1 is the page, 9 is the primary button, 12 is the heading. The number, not the hex, is the API — which is why a palette can be assembled in minutes instead of an afternoon. The failure it prevents: an agent picks one attractive hex, then invents hover, border, muted text and disabled states by eye, and the result reads muddy because the states were never designed together.

## Why 12 steps beat arbitrary hex

- **Every step has a job.** "Which grey for this border?" becomes "borders are 6 or 7", and the answer is the same in every component. No more `#e5e7eb` vs `#e4e6ea` vs `#e6e8ec` in three files.
- **Contrast is designed per step.** Steps 11 and 12 are tuned against 1 and 2, so copy and headings stay legible without rechecking ratios every time you touch a surface. Chroma rises smoothly to step 9 (the most saturated), then settles for 10–12, which is why hover, active and selected states are one step away instead of a hex lightened by 8%.
- **Light, dark, alpha and P3 share names.** The `-dark` files retune values without renaming anything, so a component written against steps needs no second colour implementation.

## The 12 steps

| Step | Job |
| --- | --- |
| 1 | App background — the page itself, behind everything |
| 2 | Subtle background — cards, panels, sidebars, one notch off the page |
| 3 | UI element background — inputs, secondary buttons, checkboxes, wells |
| 4 | Hovered UI element background — `:hover` for anything on step 3 |
| 5 | Active / selected UI element background — `:active`, selected row or tab |
| 6 | Subtle border / separator — card outlines, dividers, table rules |
| 7 | UI element border + focus ring — control borders, resting rings |
| 8 | Hovered UI element border / stronger border — emphasis outlines |
| 9 | Solid background — primary button, badge, chart series; highest chroma |
| 10 | Hovered solid background — `:hover` for anything on step 9 |
| 11 | Low-contrast text — body copy, labels, secondary text |
| 12 | High-contrast text — headings, key numbers, the first thing read |

**9 for solid, 11 for text, 12 for headings, 7/8 for borders, 3/4/5 for surfaces.**

Read the scale in three bands: **1–8 surfaces and borders, 9–10 fills, 11–12 text.** Skipping bands is what produces unreadable UI — step 3 as text is mush, step 9 as a border is a stripe, step 12 as a background is a wall.

## Install and import

Run `npm install @radix-ui/colors@3.0.0`. The package is CSS files, one per scale per variant. Variables are `--{scale}-{1..12}` and `--{scale}-a{1..12}`; the scale name is the file name (`slate.css` → `--slate-1`).

| File | Contains | Scope inside the file |
| --- | --- | --- |
| `slate.css` | Light values | `:root, .light, .light-theme` |
| `slate-dark.css` | Dark values, same names | `.dark, .dark-theme` |
| `slate-alpha.css` | Light alpha `--slate-a1`…`--slate-a12` | `:root, .light, .light-theme` |
| `slate-dark-alpha.css` | Dark alpha, same names | `.dark, .dark-theme` |

**`@import` must come before every other rule**, or the palettes are dropped:

```css
/* src/styles/theme.css */
@import "@radix-ui/colors/slate.css";
@import "@radix-ui/colors/slate-dark.css";
@import "@radix-ui/colors/iris.css";
@import "@radix-ui/colors/iris-dark.css";
```

Bare specifiers need a bundler (Vite, Next.js, webpack, Parcel); in raw HTML, copy the files or use a CDN URL. **Import only what you use**: a normal product is one grey, one accent and two to four semantic scales — eight to twelve files with dark. All 30+ scales, plus alpha, is a large stylesheet nobody reads; the only real exception is a theme picker.

**P3 needs no second import.** In v3 every scale file already ends with its own
`@supports (color: color(display-p3 1 1 1)) { @media (color-gamut: p3) { … } }` block that redeclares the same
variables in Display-P3 — there is no `slate-p3.css` to add. Keep that block when you copy or override a scale:
removing it silently downgrades every colour on a wide-gamut screen.

## Wire dark mode

The dark files override the same variables inside `.dark`, so one class on `<html>` re-themes everything. Set it **before first paint** or the page flashes light:

```html
<html lang="en">
  <head>
    <script>
      // inline and blocking: runs before the body is painted
      const stored = localStorage.getItem("theme");
      const dark = stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.add(dark ? "dark" : "light");
    </script>
  </head>
```

`color-scheme: light` on `:root` and `color-scheme: dark` on `.dark` make scrollbars, form controls and the canvas match the theme for free. In React/Next add `suppressHydrationWarning` to `<html>` if the class is also rendered on the server. Light first, dark second: both selectors have equal specificity, so source order is what makes dark win. Import each scale's `-dark` file next to its light file — no component changes.

## Map steps to tokens, then to Tailwind

Components should say `--surface`, not `--slate-3`. Alias only the steps you actually consume:

```css
:root {
  --page: var(--slate-1);      --panel: var(--slate-2);
  --surface: var(--slate-3);   --surface-hover: var(--slate-4);
  --line: var(--slate-6);      --line-strong: var(--slate-7);
  --ink: var(--slate-12);      --ink-muted: var(--slate-11);
  --overlay: var(--slate-a3);

  /* accent slot — re-brand the whole app by changing these six lines */
  --accent-surface: var(--iris-3);  --accent-border: var(--iris-6);
  --accent-ring: var(--iris-8);     --accent-solid: var(--iris-9);
  --accent-solid-hover: var(--iris-10);  --accent-text: var(--iris-11);
  --accent-contrast: #ffffff; /* the label colour on --accent-solid */
}
```

- **Put `.dark` on `<html>`, the same element as `:root`.** `--page: var(--slate-1)` is substituted on the element where it is declared; if `.dark` sits on a nested wrapper, descendants inherit the already-resolved light value and the panel stays light. Scoping dark to a subtree means redeclaring the aliases inside `.dark`.
- **Never override one step alone** (`--iris-9: #5b5bd6`): the ramp is tuned as a system, and a custom 9 breaks its relationship to 8 and 10. Change the whole scale or add an alias.

Tailwind v4 reads the same variables:

```css
@import "tailwindcss";
/* …plus the four Radix imports above */

@theme inline {
  --color-page: var(--slate-1);        --color-panel: var(--slate-2);
  --color-panel-hover: var(--slate-4); --color-line: var(--slate-6);
  --color-ink: var(--slate-12);        --color-ink-muted: var(--slate-11);
  --color-accent: var(--iris-9);       --color-accent-hover: var(--iris-10);
}
```

`@theme inline` is required when the value is another `var()`. Without `inline`, Tailwind resolves the token once at `:root` and emits the light value everywhere, so dark mode silently stops working. This yields `bg-page`, `bg-panel`, `border-line`, `text-ink`, `text-ink-muted`, `bg-accent`, `hover:bg-accent-hover`; add `@custom-variant dark (&:where(.dark, .dark *));` if you also use `dark:` utilities.

## Choosing a grey

The grey is the temperature of the whole UI; the accent is its voice.

| Grey | Undertone | Pairs with | Feels like |
| --- | --- | --- | --- |
| `gray` | none, pure | any accent | docs, dashboards, admin, utilities |
| `mauve` | violet | iris, violet, purple, plum, pink | modern SaaS, AI tools, creator products |
| `slate` | blue | blue, indigo, cyan, sky | fintech, infrastructure, security |
| `sage` | green | green, jade, teal, mint | health, wellness, sustainability |
| `olive` | yellow-green | lime, grass, yellow | editorial, food, outdoor |
| `sand` | warm orange | tomato, orange, amber, gold, brown | commerce, publishing, hospitality |

Match undertones or go pure: warm grey next to a cool accent reads muddy. When in doubt, `gray` is the safe neutral and `slate` is the safe "designed" neutral; use one grey for the whole product, because slate chrome next to sand cards looks like two apps stapled together. Automatic rule: choose the grey whose undertone is closest to the accent's hue family — no brand colour yet? Start from `slate` + `blue`, or `gray` + one accent.

## Choosing an accent

Find the scale closest to the brand hue — never tint a scale by hand. Each family has several characters:

| Character | Scales | Use for |
| --- | --- | --- |
| Bright, energetic | tomato, orange, amber, yellow, lime, mint, sky | consumer, food, kids, marketing |
| Deep, confident | red, ruby, crimson, plum, purple, violet, iris, indigo, blue | product UI, fintech, dev tools |
| Natural, muted | green, grass, teal, jade, brown, bronze, gold | health, sustainability, luxury, editorial |

Enterprise takes `blue`/`indigo`, dev tools `iris`/`violet`, health `teal`/`jade`, consumer `pink`/`plum`, luxury `gold`/`bronze`, editorial `tomato`/`gold`. Two scales per hue is normal: `red` is warm, `ruby` is cool, `crimson` is deep pink. Bright scales (yellow, amber, lime, mint, sky) are **light at step 9**, so they take dark labels — their step 11 is still a legible dark version of the hue and works as text.

## Composing a full theme

One neutral, one accent, a small set of semantics. Four chromatic scales total is already a lot.

| Role | Scale | Steps used |
| --- | --- | --- |
| Neutral | `slate` | 1, 2, 3, 6, 7, 11, 12 |
| Accent | `iris` | 3, 6, 8, 9, 10, 11 |
| Destructive | `red` | 3, 9, 11 |
| Success | `jade` | 3, 9, 11 |
| Warning | `amber` | 3, 9 (dark text), 11 |

**Step 9 of a bright scale is not safe for white text.** Against white, step 9 lands between roughly 3:1 and 5:1 depending on the scale — fine for large text and UI components, often short of 4.5:1 for 14px copy, and clearly short on pastel scales. Either keep `--accent-solid: var(--accent-9)` and compute the label colour, flipping to dark ink when the ratio fails (that is what `--accent-contrast` is for), or put the label on step 12 of the same scale and skip white entirely.

## Dark mode is not a 1:1 mapping

- **The relationships shift.** The gap between 1 and 2 is smaller, step 3 is a raised surface rather than a slightly lighter page, and 9/10 are retuned so their relationship to white text can invert. Re-check contrast in dark mode instead of assuming the light answer holds.
- **Shadows stop working.** Elevation becomes borders plus surface steps: `--line` for structure, `--slate-a3` for hover, `1px` borders on everything that used to have a shadow.
- **Test both modes, every view:** lists, forms, tables, empty states, focus rings, disabled controls. Disabled is conventionally step 3 background with step 8 text.
- Never fake dark mode with `filter: invert(1)` or by subtracting lightness from each hex — it desaturates the accent and destroys the alpha scales.

## Design recipes

**Card** — page at 1, card at 2, one subtle border:

```css
.card { background: var(--slate-2); border: 1px solid var(--slate-6); border-radius: 10px; padding: 20px; color: var(--slate-11); }
.card h3 { color: var(--slate-12); }
```

**Primary button + hover** — 9 and 10, with an alpha ring for definition in both modes:

```css
.btn { background: var(--iris-9); color: var(--accent-contrast); border: 0; border-radius: 6px; padding: 8px 14px;
       box-shadow: inset 0 0 0 1px var(--iris-a8); transition: background-color 120ms ease; }
.btn:hover { background: var(--iris-10); }
.btn:active { box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.18); }
.btn:focus-visible { outline: 2px solid var(--iris-8); outline-offset: 2px; }
```

**Form field + focus ring** — resting border 7, hover 8, ring 8:

```css
.field { background: var(--slate-2); border: 1px solid var(--slate-7); border-radius: 6px; color: var(--slate-12); padding: 8px 10px; }
.field:hover { border-color: var(--slate-8); }
.field:focus-visible { outline: 2px solid var(--iris-8); outline-offset: 1px; }
```

**Badge (soft)** — tinted surface, readable text, matching hairline:

```css
.badge { background: var(--jade-3); border: 1px solid var(--jade-6); color: var(--jade-11); border-radius: 999px; padding: 2px 8px; font-size: 12px; }
```

**Data-viz categorical palette** — six step-9 values, two scales apart in hue:

```css
:root {
  --chart-1: var(--iris-9);   --chart-2: var(--jade-9);   --chart-3: var(--amber-9);
  --chart-4: var(--tomato-9); --chart-5: var(--cyan-9);   --chart-6: var(--purple-9);
  --chart-grid: var(--gray-6); --chart-axis: var(--gray-11);
}
```

Order series by hue distance, never reuse a scale twice, and use `-a` variants for overlapping area fills so gridlines show through. Never encode meaning in red vs green alone.

## Contrast rules

- **Never use step 9 as text** on 1 or 2 — it is a fill tone, roughly 2–3:1 — and never put white text on step 9 of a bright scale (`yellow`, `amber`, `lime`, `mint`, `sky`, `gold`). Use dark ink or move the label to step 12.
- **Body copy 11, headings 12.** If 11 feels too strong for a caption, change size or weight, not the step; going lighter silently drops below AA.
- **Borders:** 6 for dividers, 7 for interactive controls (3:1 non-text), 8 for hover and focus.
- **Alpha for overlays and glass** (`--slate-a2`…`--slate-a6`). Alpha steps are tuned per mode, so `--slate-a3` is not `--slate-3` at 40% — use the alpha scale rather than applying opacity to a solid. `--slate-a11` is for text over photos, but check the worst-case backdrop.
- **Check the pair, not the scale.** Compute the ratio for your actual step combination (a WCAG function is in `references/palette.md`); step 9 on white is the usual failure.

## Pitfalls

- **Import hygiene.** Importing every scale bloats the CSS; `@import` after any other rule silently drops the palettes; single-step overrides and `@theme` without `inline` freeze half the system at a light-mode value.
- **Variable collisions.** `--gray-1` is a very generic name; two libraries or micro-frontends on one page will fight. Scope the import under a class or alias into `--ds-*` names.
- **`!important` overrides.** Fighting a component library at property level loses to its next release. Override the semantic alias layer, once, and route every component through the accent slot instead of hardcoding `--iris-9`.
- **Dark-mode flicker.** Applying `.dark` after hydration flashes light for a frame; use the inline blocking script. SSR cannot read `localStorage`, so decide on the client before paint.
- **Alpha + backdrop blur.** `backdrop-filter: blur(12px)` over `--slate-a2` looks washed out and does nothing without a backdrop; add an `@supports (backdrop-filter: blur(1px))` branch and an opaque `--slate-2` fallback.

## Reference files

- `references/palette.md` — every scale grouped by character, six ready-made palettes with exact steps, and the contrast checker.

## Checklist before shipping

- [ ] Only the scales actually used are imported, light before dark
- [ ] `.dark` on `<html>`, applied before first paint, no flash on reload
- [ ] Semantic aliases exist; components never read raw scale variables
- [ ] Text 11/12, borders 6/7/8, surfaces 2/3/4/5, solids 9/10 — no band skipping
- [ ] Step 9 label contrast checked (≥ 4.5:1 body, ≥ 3:1 large/UI)
- [ ] Every view reviewed in both modes, including focus and disabled states
- [ ] P3 `@supports` block intact, sRGB fallback untouched
- [ ] Chart colours separated by hue, not only lightness, and not red/green alone

---
name: roughjs-sketch
description: "Create hand-drawn, sketch-style graphics with Rough.js on Canvas or SVG — wobbly borders, hachure fills, annotations, diagram arrows and illustrated empty states. Use when a UI feels too stiff and needs a human, whiteboard or notebook feel. Trigger words: 手绘, 草图, 手绘风格, 涂鸦, sketch style, hand-drawn, doodle, whiteboard, rough, 天然设计感."
license: MIT
metadata:
  author: Woodytest2025
  version: "1.0.0"
  category: design-visual
  keywords: roughjs, hand-drawn, sketch, svg, canvas, hachure, illustration
  source: https://github.com/rough-stuff/rough
  stars: "21k"
allowed-tools: bash read write
---

# Rough.js — Hand-drawn Graphics

Rough.js draws **rough, hand-drawn looking** shapes: rectangles, circles, lines, arcs, curves, polygons and
arbitrary SVG paths, filled with sketchy hachure or dots instead of flat colour. It renders to `<canvas>`
(bitmap) or `<svg>` (vector, stylable with CSS, crisp on retina).

The point is not "make it look broken". The point is **warmth and imperfection**: a hero illustration, a
whiteboard diagram, a hand-annotated screenshot, a wobbly underline under a heading, an empty state that
does not look like a corporate placeholder.

## When to use it

| Situation | Why Rough.js fits |
| --- | --- |
| Landing page hero / feature illustration | Replaces generic 3D blobs with a distinctive sketch language |
| Diagrams, flows, architecture sketches | Feels like a whiteboard, softer than Mermaid's rigid boxes |
| Annotation over screenshots or product shots | Arrows + circled callouts read as human emphasis |
| Empty states, error pages, onboarding steps | Removes the "sterile template" feel |
| Underlines, highlights, frames around sections | Cheap personality; one or two per page is enough |
| Kids / education / creative / indie products | Native fit with the brand voice |

**Do not use it for:** data-dense dashboards, financial or medical UI where precision signals trust,
tiny UI chrome (icons, checkboxes, 12px labels get muddy), or anywhere the wobble fights with legibility.
Rule of thumb: **sketch is a layer of personality, not the whole component system.**

## Install

```bash
npm install roughjs          # 4.6.x
```

```html
<!-- no build step -->
<script type="module">
  import rough from "https://unpkg.com/roughjs@4.6.6/bundled/rough.esm.js";
</script>
```

TypeScript types ship with the package. ESM/CJS/UMD builds are all included; `bundled/rough.js` is the UMD
build for plain `<script>` tags.

## Two entry points

```js
import rough from "roughjs";        // canvas renderer + generator
// or: import { canvas, svg, generator } from "roughjs/bin/rough";
```

### Canvas — bitmap, fast, not stylable

```js
const rc = rough.canvas(document.querySelector("#c"));
rc.rectangle(20, 20, 220, 120, {
  roughness: 1.4,
  bowing: 1,
  stroke: "#1f2937",
  strokeWidth: 2,
  fill: "#fde68a",
  fillStyle: "hachure",
  hachureAngle: -41,
  hachureGap: 7,
});
rc.circle(160, 90, 70, { stroke: "#0f766e", fill: "#99f6e4", fillStyle: "cross-hatch" });
```

### SVG — vector, CSS-stylable, responsive

```js
const svgEl = document.querySelector("svg");
const rc = rough.svg(svgEl);
svgEl.appendChild(rc.rectangle(10, 10, 200, 100, { fill: "#fca5a5", fillStyle: "zigzag" }));
```

`rough.svg()` returns real `<path>` nodes, so `currentColor`, CSS variables, hover transitions,
`stroke-dasharray` animations and `filter: drop-shadow()` all work.

### Generator — no DOM (SSR, Node, tests)

```js
import { generator } from "roughjs/bin/generator";

const gen = generator();
const drawable = gen.rectangle(10, 10, 120, 60, { seed: 7 });
const paths   = gen.toPaths(drawable);   // [{ d, stroke, strokeWidth, fill, ... }]
const svgStr  = gen.toSVG(drawable);     // "<g>…</g>" string for SSR
```

This is the path for React Server Components, static site generation, or pre-rendering illustrations
into SVG files at build time.

## Core API

All shape methods share `(…geometry, options)` and return the drawn/created element.

```js
rc.line(x1, y1, x2, y2, o)
rc.rectangle(x, y, width, height, o)
rc.ellipse(x, y, width, height, o)
rc.circle(x, y, diameter, o)
rc.linearPath(points, o)          // [[x,y], …] straight segments, closed if you repeat the first point
rc.polygon(points, o)
rc.arc(x, y, width, height, start, stop, closed, o)   // radians
rc.curve(points, o)               // smooth curve through the points
rc.path(d, o)                     // any SVG path string — the escape hatch for icons & letters
```

### Options that actually matter

| Option | Default | Notes |
| --- | --- | --- |
| `roughness` | `1` | Wobble amount. `0` = clean, `1` = natural, `2+` = very sketchy. Keep UI shapes at `0.8–1.6`. |
| `bowing` | `1` | How much straight lines bow. Lower it for technical diagrams. |
| `stroke` | `#000` | Any CSS colour; `currentColor` works in SVG mode. |
| `strokeWidth` | `1` | Pair with `roughness` — thin strokes need less roughness. |
| `fill` | none | Fill colour. |
| `fillStyle` | `hachure` | `hachure`, `solid`, `zigzag`, `cross-hatch`, `dots`, `dashed`, `zigzag-line`. |
| `hachureGap` | `-1` | Gap between hachure lines; `-1` derives it from `strokeWidth` (×4). |
| `hachureAngle` | `-41` | Degrees. Use two shapes with different angles to differentiate regions. |
| `fillWeight` | `strokeWidth/2` | Thickness of the hachure lines. |
| `seed` | random | **Set this** for deterministic output — otherwise every re-render jitters. |
| `curveStepCount` | `9` | Higher = smoother curves, more path data. |
| `disableMultiStroke` | `false` | Set `true` for single-pass (cleaner, less "pencil overlap"). |
| `preserveVertices` | `false` | Keep polygon vertices exactly where you put them. |

`seed` is the single most important option for production: with a random seed the shape changes on every
React re-render and looks like it is vibrating.

## Framework integration

### React / Next.js

```tsx
"use client";
import { useEffect, useRef } from "react";
import rough from "roughjs";

export function SketchCard({ width = 320, height = 180 }: { width?: number; height?: number }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    svg.replaceChildren();                       // idempotent re-render (StrictMode!)
    const rc = rough.svg(svg);
    svg.appendChild(
      rc.rectangle(6, 6, width - 12, height - 12, {
        seed: 42, roughness: 1.2, stroke: "currentColor",
        strokeWidth: 1.6, fill: "var(--sketch-fill, #fef3c7)", fillStyle: "hachure",
      })
    );
  }, [width, height]);

  return <svg ref={ref} viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" />;
}
```

`replaceChildren()` before drawing is mandatory — React StrictMode mounts twice and `rough.svg` appends
without clearing, so you get double-stroked "dirty" shapes otherwise.

### Canvas with device pixel ratio

```js
const canvas = document.querySelector("canvas");
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
canvas.style.width = rect.width + "px";
canvas.style.height = rect.height + "px";
const ctx = canvas.getContext("2d");
ctx.scale(dpr, dpr);
const rc = rough.canvas(canvas);
```

Skipping the DPR scale is the #1 cause of "my sketch looks blurry".

## Design recipes

**Underline a heading** — draw a single low-roughness line under the text, not a box.

```js
rc.line(8, 46, 240, 44, { roughness: 1.8, strokeWidth: 3, stroke: "#f97316", seed: 3 });
```

**Circled callout** — ellipse with `roughness: 1.5`, `fill: none`, drawn *over* the screenshot with
`pointer-events: none`.

**Section frame** — one sketch rectangle around a whole block, `strokeWidth: 1`, `stroke: #94a3b8`,
`roughness: 1`, and `fillStyle: "hachure"` only on the accent block, never on every card.

**Arrow between elements** — `rc.linearPath` for the shaft plus two short `rc.line` calls for the head,
all with the same `seed` base so they keep their relationship across renders.

**Chart accent** — keep the real chart (Recharts/visx) clean, and use Rough.js only for an annotation
label or a highlight ring around one data point. Never hand-draw the axes.

## Visual rules

- **One sketch element per screen region.** Three wobbly boxes is charming; thirty is noise.
- **Muted strokes, warm fills.** `#1f2937` / `#475569` strokes with `#fde68a`, `#fecaca`, `#bfdbfe`,
  `#bbf7d0` fills reads "editorial sketch"; saturated neon reads "broken".
- **Roughness scales with size.** Big hero shapes: `1.2–1.8`. Small chips and badges: `0.6–0.9`.
- **Align to the grid anyway.** Keep the geometry box on a 4/8px grid and let the *pen* wobble — layout
  stays tidy while the linework feels free.
- **Dark mode:** switch `stroke` to a light token (`#e2e8f0`) and lower `fill` alpha. Hachure lines at
  full-opacity light fills look blinding on dark backgrounds.
- **Accessibility:** decorative sketches get `aria-hidden="true"`; anything meaningful gets a text
  alternative. Respect `prefers-reduced-motion` if you animate stroke draw-in.
- **Determinism:** a fixed `seed` per shape instance, and re-draw on resize with a debounce (150ms).

## Performance

- Canvas: clear and redraw a whole scene per frame; don't accumulate thousands of shapes.
- SVG: each shape is several `<path>` nodes. Above ~200 shapes, prefer canvas.
- Pre-compute illustration paths at build time with the generator and ship static SVG — zero runtime cost.
- Avoid `rc.path()` with huge icon sets inside a render loop; cache the resulting nodes.

## Reference files

- `references/options.md` — the full option list, fill styles and their visual character.
- `references/patterns.md` — copy-paste recipes: annotation layer, hero illustration, sketched card,
  arrows, progress/underline, and a React hook wrapper.

## Checklist before shipping

- [ ] Every shape has a fixed `seed`
- [ ] Roughness within `0.6–1.8`, strokes muted, not pure black
- [ ] Canvas uses DPR scaling; SVG uses `viewBox`
- [ ] Decorative graphics are `aria-hidden`, contrast checked in dark mode
- [ ] Sketch accents limited to a few per view, layout still on grid
- [ ] Re-render path clears previous nodes (`replaceChildren`)

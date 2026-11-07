/**
 * WCAG contrast arithmetic for the design review tool.
 *
 * The review tool exists to say things a model cannot reliably eyeball: an
 * actual ratio between two actual colors. Everything here is pure and
 * synchronous so it can run inside a tool handler without touching the DOM.
 */

/** Parse `#rgb`, `#rrggbb`, `rgb(r,g,b)` or `rgba(...)` into [r,g,b] 0-255. */
export function parseColor(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,8})$/.exec(text);
  if (hex) {
    const digits = hex[1];
    if (digits.length === 3 || digits.length === 4) {
      return [0, 1, 2].map((index) => Number.parseInt(digits[index] + digits[index], 16));
    }
    if (digits.length === 6 || digits.length === 8) {
      return [0, 2, 4].map((index) => Number.parseInt(digits.slice(index, index + 2), 16));
    }
    return null;
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(text);
  if (rgb) {
    return [rgb[1], rgb[2], rgb[3]].map((part) => Math.max(0, Math.min(255, Math.round(Number(part)))));
  }
  return null;
}

function channelLuminance(channel) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance per WCAG 2.x. */
export function luminance(rgb) {
  const [r, g, b] = rgb;
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/**
 * Contrast ratio between two colors, or null when either cannot be parsed.
 *
 * @param {string} foreground color value as written in a design system.
 * @param {string} background color value as written in a design system.
 * @returns {number|null} ratio in [1, 21].
 */
export function contrastRatio(foreground, background) {
  const a = parseColor(foreground);
  const b = parseColor(background);
  if (a === null || b === null) return null;
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Round to two decimals for display without changing the comparison value. */
export function formatRatio(ratio) {
  return Math.round(ratio * 100) / 100;
}

/**
 * Whether a ratio clears the WCAG AA threshold for its text size.
 *
 * @param {number} ratio computed contrast ratio.
 * @param {boolean} largeText true for >=18.66px bold or >=24px regular.
 */
export function passesAA(ratio, largeText) {
  return ratio >= (largeText ? 3 : 4.5);
}

const AA_BODY = 4.5;

/**
 * Token names that mark an intentional low-contrast tier: placeholder, disabled,
 * de-emphasised captions. WCAG exempts inactive controls, and every author of
 * these palettes chose such a tier deliberately, so judging it buries the
 * findings that matter. `secondary` is deliberately not here: secondary text is
 * ordinary body text and is expected to clear AA.
 */
const MUTED = /tertiary|subtle|muted|disabled|placeholder|quiet|faint|inactive|ghost|hint|faded/i;

/** Names that read as a text color. */
const FOREGROUND = /ink|text|label|foreground|content/i;

/** Names that read as a surface a text color can sit on. */
const SURFACE = /canvas|surface|background|bg\b|base|backdrop/i;

/**
 * Contrast facts for one palette, limited to what token names can actually prove.
 *
 * A design system's token map does not record which foreground is used on which
 * surface. Trying to infer the pairing from names produces confident nonsense:
 * `ink` on `canvas-night` measures 1.18:1 only because those two tokens belong
 * to different theme sets in the same map. Rather than guess, this audits two
 * things that are true regardless of pairing:
 *
 *   1. **Named pairs.** `on-<x>` states its surface outright, so every
 *      `on-primary` / `on-surface` / `on-background` pair is authoritative and
 *      is judged directly.
 *   2. **Surface coverage.** For each surface, does *any* declared non-surface
 *      color clear AA on it? If none does, the palette offers no legible text on
 *      that surface — a defect that holds however the designer paired things.
 *
 * Both results are computed, not guessed, and each names the tokens it used.
 *
 * Alpha colors (`rgba(255,255,255,0.7)`) are compared at their stated channel
 * values, which reads as slightly *more* contrast than the composited result.
 * That errs toward silence rather than a false alarm.
 *
 * @param {Record<string, string>} colors token name to color value.
 * @returns {{ pairs: object[], uncovered: object[], checked: number }}
 */
export function auditPalette(colors) {
  const parsed = Object.entries(colors ?? {})
    .map(([name, value]) => ({ name: String(name), value: String(value), rgb: parseColor(String(value)) }))
    .filter((item) => item.rgb !== null);

  const isMuted = (name) => MUTED.test(name);
  const isSurface = (name) => SURFACE.test(name);

  // A text color is anything that is not a surface, not a muted tier, and not a
  // border. `on-*` names are text by definition and must be included: they are
  // how most of these systems actually name the color that sits on a surface.
  const textColors = parsed.filter((item) => !isSurface(item.name)
    && !isMuted(item.name)
    && !/border|hairline|ring|shadow|stroke|outline/i.test(item.name));

  const surfaces = parsed.filter((item) => isSurface(item.name));

  // ---- 1. authoritative named pairs ---------------------------------------
  const pairs = [];
  for (const entry of parsed) {
    const match = /^on[-_](.+)$/i.exec(entry.name);
    if (match === null) continue;
    const surfaceName = match[1].toLowerCase();
    const surface = parsed.find((candidate) => candidate.name.toLowerCase() === surfaceName);
    if (surface === undefined) continue;
    const ratio = contrastRatio(entry.value, surface.value);
    if (ratio === null) continue;
    if (ratio >= AA_BODY) continue;
    pairs.push({
      foreground: entry.name,
      background: surface.name,
      ratio: formatRatio(ratio),
      required: AA_BODY,
    });
  }
  pairs.sort((a, b) => a.ratio - b.ratio);

  // ---- 2. surfaces with no legible text at all ----------------------------
  const uncovered = [];
  let checked = 0;
  for (const surface of surfaces) {
    if (textColors.length === 0) break;
    checked += 1;
    let best = null;
    for (const candidate of textColors) {
      if (candidate.name === surface.name) continue;
      const ratio = contrastRatio(candidate.value, surface.value);
      if (ratio === null) continue;
      if (best === null || ratio > best.ratio) best = { foreground: candidate.name, ratio };
    }
    if (best === null) continue;
    if (best.ratio >= AA_BODY) continue;
    uncovered.push({
      background: surface.name,
      bestForeground: best.foreground,
      ratio: formatRatio(best.ratio),
      required: AA_BODY,
    });
  }
  uncovered.sort((a, b) => a.ratio - b.ratio);

  return { pairs, uncovered, checked };
}

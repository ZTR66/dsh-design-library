/**
 * The review operation, shared by the agent tool and the panel.
 *
 * The value here is that every finding is *computed*, not restated. A model can
 * paraphrase a design system forever; what it cannot do reliably is measure the
 * contrast between two hex colors, notice that a file hard-codes `#7c3aed`
 * where the palette says `#5e6ad2`, or compare a corner radius against the
 * declared scale. Those are the findings this module produces.
 *
 * The target file scan is deliberately literal: it looks for color literals,
 * font-family declarations and radius values and compares them with what the
 * design system declares. It does not parse CSS, does not evaluate anything,
 * and does not claim that a deviation is a bug — it reports the delta and lets
 * the reader decide.
 */

import { readFile } from 'node:fs/promises';

import { auditPalette, contrastRatio, formatRatio, parseColor } from './contrast.js';

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const FONT_FAMILY = /font-family\s*:\s*([^;\n}]+)/gi;
const RADIUS = /border-radius\s*:\s*([^;\n}]+)/gi;
const MAX_TARGET_BYTES = 512 * 1024;

/** Normalize `#ABC` and `#AABBCC` to a comparable lowercase `#aabbcc`. */
function normalizeHex(value) {
  const rgb = parseColor(value);
  if (rgb === null) return String(value).toLowerCase();
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/** Every color literal in a text, with the 1-based line it first appeared on. */
export function colorLiterals(text) {
  const seen = new Map();
  const lines = text.split('\n');
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    for (const match of lines[lineIndex].matchAll(HEX)) {
      const normalized = normalizeHex(match[0]);
      if (!seen.has(normalized)) {
        seen.set(normalized, { value: match[0], normalized, line: lineIndex + 1 });
      }
    }
  }
  return [...seen.values()];
}

function collectMatches(text, pattern, limit = 24) {
  const seen = new Set();
  const found = [];
  for (const match of text.matchAll(pattern)) {
    const value = match[1].replace(/\s+/g, ' ').trim();
    const key = value.toLowerCase();
    if (value === '' || seen.has(key)) continue;
    seen.add(key);
    found.push(value);
    if (found.length >= limit) break;
  }
  return found;
}

/** The declared palette as a flat list of { token, value }. */
function declaredColors(document) {
  const colors = document.colors ?? {};
  return Object.entries(colors).map(([token, value]) => ({ token, value: String(value) }));
}

/** Colors the documents mentions only in prose, if it declared none. */
function proseColors(document) {
  return document.extracted?.colors ?? [];
}

/**
 * Everything computable about one block of code, given one design system.
 *
 * Shared by the `target` file path and by pasted `snippets` so both report the
 * same kinds of finding. Returns raw matches; the caller decides how to word
 * them, because a file has line numbers and a snippet has an index.
 *
 * @param {string} text code to inspect.
 * @param {{declared: Set<string>, prose: Set<string>, families: string[], radii: string[]}} palette
 * @returns {{total: number, colors: object[], families: string[], radii: string[]}}
 */
function inspectCode(text, expectations) {
  const literals = colorLiterals(text);
  const offColors = literals.filter((item) => !expectations.declared.has(item.normalized) && !expectations.prose.has(item.normalized));

  // A system that declares no family or no radius scale cannot have a deviation
  // from it, so those checks stay silent rather than flagging everything.
  const families = collectMatches(text, FONT_FAMILY)
    // The capture includes the author's own quotes; strip them so the message
    // does not read `font-family ""Comic Sans MS""`.
    .map((family) => family.replace(/^["']|["']$/g, '').trim())
    .filter((family) => family !== '');
  const offFamilies = expectations.families.length > 0
    ? families.filter((family) => !expectations.families.some((declared) => family.toLowerCase().includes(String(declared).toLowerCase())))
    : [];

  const radii = collectMatches(text, RADIUS);
  const offRadii = expectations.radii.length > 0
    ? radii.filter((radius) => !expectations.radii.some((declared) => radius.includes(String(declared))))
    : [];

  return { total: literals.length, colors: offColors, families: offFamilies, radii: offRadii };
}

/**
 * Build a review.
 *
 * @param {object} index the current index.
 * @param {object} request `{ designId, target?, snippets?, maxFindings? }`.
 * @returns {Promise<object>} a structured, JSON-safe review.
 */
export async function buildReview(index, request) {
  const designId = typeof request?.designId === 'string' ? request.designId : '';
  const entry = index.entries.find((candidate) => candidate.id === designId);
  if (entry === undefined) {
    return { ok: false, error: `unknown design id: ${designId || '(empty)'}`, available: index.entries.filter((item) => item.kind === 'design').slice(0, 10).map((item) => item.id) };
  }
  if (entry.kind !== 'design') {
    return { ok: false, error: `${designId} is a skill, not a design system; pick a DESIGN.md` };
  }

  const document = entry.document;
  const findings = [];
  const notes = [];

  // --- 1. Palette contrast, computed ---------------------------------------
  const palette = document.colors;
  if (palette !== undefined && Object.keys(palette).length > 0) {
    const audit = auditPalette(palette);

    for (const failure of audit.pairs.slice(0, 20)) {
      findings.push({
        kind: 'contrast',
        severity: 'error',
        message: `${failure.foreground} on ${failure.background} is ${failure.ratio}:1, below the ${failure.required}:1 AA floor. These two tokens name each other, so this is a pairing the system itself proposes.`,
        foreground: failure.foreground,
        background: failure.background,
        ratio: failure.ratio,
        required: failure.required,
      });
    }

    for (const gap of audit.uncovered.slice(0, 20)) {
      findings.push({
        kind: 'contrast',
        severity: 'warn',
        message: `No declared text color is legible on ${gap.background}: the best of them is ${gap.bestForeground} at ${gap.ratio}:1, below the ${gap.required}:1 AA floor.`,
        background: gap.background,
        bestForeground: gap.bestForeground,
        ratio: gap.ratio,
        required: gap.required,
      });
    }

    if (audit.pairs.length === 0 && audit.uncovered.length === 0) {
      notes.push(`Checked ${audit.checked} surfaces and every named on-* pair over ${Object.keys(palette).length} declared colors: no AA failure found.`);
    }
    else {
      notes.push(`Checked ${audit.checked} surfaces over ${Object.keys(palette).length} declared colors. Muted tiers (tertiary, subtle, disabled) and alpha compositing are not judged.`);
    }
  }
  else {
    const literals = proseColors(document);
    notes.push(literals.length > 0
      ? `This document declares no structured palette; ${literals.length} color literals appear in its prose and were not contrast-checked.`
      : 'This document declares no structured palette and mentions no color literals.');
  }

  // --- 2. Typography and radius scale, as declared -------------------------
  const declaredFamilies = (document.typography ?? [])
    .map((row) => row.fontFamily ?? row.value)
    .filter((value) => typeof value === 'string' && value !== '');
  const uniqueFamilies = [...new Set(declaredFamilies)];
  const declaredRadii = Object.values(document.rounded ?? {}).map((value) => String(value));

  // --- 3. Inspect code: a file on disk, or snippets the caller pasted -------
  //
  // Both go through `inspectCode`, so they report the same kinds of finding.
  // The first version checked only colours for snippets while checking colours,
  // families and radii for files — pasting code found less than pointing at a
  // file containing the same code, which made the panel's review look weaker
  // than the tool's.
  const expectations = {
    declared: new Set(declaredColors(document).map((item) => normalizeHex(item.value))),
    prose: new Set(proseColors(document).map((item) => normalizeHex(item))),
    families: uniqueFamilies,
    radii: declaredRadii,
  };

  const targetText = await resolveTarget(request?.target);
  if (targetText !== null) {
    const { path, text } = targetText;
    const found = inspectCode(text, expectations);

    for (const item of found.colors.slice(0, 30)) {
      findings.push({
        kind: 'off-palette',
        severity: 'warn',
        message: `${item.value} at line ${item.line} is not one of the design system's colors`,
        color: item.value,
        line: item.line,
      });
    }
    for (const family of found.families.slice(0, 10)) {
      findings.push({
        kind: 'font',
        severity: 'warn',
        message: `font-family "${family}" is not among the design system's families (${uniqueFamilies.join(', ')})`,
        family,
      });
    }
    for (const radius of found.radii.slice(0, 10)) {
      findings.push({
        kind: 'radius',
        severity: 'info',
        message: `border-radius "${radius}" is not in the declared scale (${declaredRadii.join(', ')})`,
        radius,
      });
    }

    if (expectations.declared.size > 0 || expectations.prose.size > 0) {
      const onPalette = found.total - found.colors.length;
      notes.push(`${onPalette} of ${found.total} distinct color literals in ${path} match the design system; ${found.colors.length} do not.`);
    }
  }
  else if (typeof request?.target === 'string' && request.target !== '') {
    notes.push(`Target ${request.target} could not be read; only the design system itself was reviewed.`);
  }

  // --- 4. Pasted snippets ---------------------------------------------------
  if (Array.isArray(request?.snippets) && request.snippets.length > 0) {
    for (const [index_, snippet] of request.snippets.slice(0, 5).entries()) {
      const text = typeof snippet === 'string' ? snippet : '';
      if (text === '') continue;
      const found = inspectCode(text, expectations);

      for (const item of found.colors) {
        findings.push({
          kind: 'off-palette',
          severity: 'warn',
          message: `${item.value} in snippet ${index_ + 1} is not one of the design system's colors`,
          color: item.value,
          snippet: index_ + 1,
        });
      }
      for (const family of found.families) {
        findings.push({
          kind: 'font',
          severity: 'warn',
          message: `font-family "${family}" in snippet ${index_ + 1} is not among the design system's families (${uniqueFamilies.join(', ')})`,
          family,
          snippet: index_ + 1,
        });
      }
      for (const radius of found.radii) {
        findings.push({
          kind: 'radius',
          severity: 'info',
          message: `border-radius "${radius}" in snippet ${index_ + 1} is not in the declared scale (${declaredRadii.join(', ')})`,
          radius,
          snippet: index_ + 1,
        });
      }
    }
  }

  const order = { error: 0, warn: 1, info: 2 };
  findings.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));

  return {
    ok: true,
    design: {
      id: entry.id,
      name: entry.name,
      repo: entry.folder,
      origin: entry.origin,
      paletteSize: Object.keys(document.colors ?? {}).length,
      typographyRoles: (document.typography ?? []).length,
      radiusSteps: declaredRadii.length,
    },
    summary: {
      errors: findings.filter((item) => item.severity === 'error').length,
      warnings: findings.filter((item) => item.severity === 'warn').length,
      notes: findings.filter((item) => item.severity === 'info').length,
    },
    findings,
    notes,
    // The declared tokens travel with the review so the caller can quote them
    // without a second round trip.
    tokens: {
      colors: document.colors,
      typography: document.typography,
      spacing: document.spacing,
      rounded: document.rounded,
      extracted: document.extracted,
    },
  };
}

async function resolveTarget(target) {
  if (typeof target !== 'string' || target.trim() === '') return null;
  try {
    const text = await readFile(target, 'utf8');
    const bounded = text.length > MAX_TARGET_BYTES ? text.slice(0, MAX_TARGET_BYTES) : text;
    return { path: target, text: bounded };
  }
  catch {
    return null;
  }
}

export { contrastRatio, formatRatio };

/**
 * Turn a design document into the shapes the panel and the review tool need.
 *
 * Two document flavours exist in the corpus and both must work:
 *
 *   - frontmatter documents (208 of the bundled 290) carry `colors`,
 *     `typography`, `spacing`, `rounded` as structured YAML, so the tokens come
 *     out exactly;
 *   - prose documents carry everything as headings and tables, so the reader
 *     falls back to scanning the body for `#rrggbb` literals, font-family
 *     declarations and radius values.
 *
 * The fallback never invents a token name. It reports what it saw under
 * `extracted`, so the panel can say "these colors appear in the text" rather
 * than claiming they are the system palette.
 */

import { splitFrontmatter } from './yaml.js';

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b/g;
const FONT_FAMILY = /font-family\s*:\s*([^;\n}]+)/gi;
const RADIUS = /border-radius\s*:\s*([^;\n}]+)/gi;

/** Section headings in a Markdown body, in document order. */
export function sectionsOf(body) {
  const found = [];
  for (const line of body.split('\n')) {
    const match = /^(#{1,4})\s+(.*\S)\s*$/.exec(line);
    if (match) {
      found.push({ level: match[1].length, title: match[2].trim() });
    }
    if (found.length >= 200) break;
  }
  return found;
}

/** First non-empty paragraph after the first heading, trimmed to one line. */
function leadParagraph(body) {
  const lines = body.split('\n');
  let started = false;
  const collected = [];
  for (const line of lines) {
    const text = line.trim();
    if (!started) {
      if (/^#{1,6}\s/.test(text)) started = true;
      continue;
    }
    if (text === '') {
      if (collected.length > 0) break;
      continue;
    }
    if (/^#{1,6}\s/.test(text) || text.startsWith('```') || text.startsWith('|')) {
      if (collected.length > 0) break;
      continue;
    }
    collected.push(text);
    if (collected.join(' ').length > 400) break;
  }
  return collected.join(' ').replace(/\s+/g, ' ').trim();
}

/** First `#` heading text, or an empty string. */
function firstHeading(body) {
  for (const line of body.split('\n')) {
    const match = /^#\s+(.*\S)\s*$/.exec(line.trim());
    if (match) return match[1].trim();
  }
  return '';
}

function firstString(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

/**
 * Normalize a frontmatter `colors` mapping to { name: colorValue }.
 * Values may themselves be nested mappings in some documents; those are
 * flattened one level with `parent-child` names.
 */
function normalizeColors(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const colors = {};
  for (const [name, value] of Object.entries(raw)) {
    if (typeof value === 'string' || typeof value === 'number') {
      colors[name] = String(value);
      continue;
    }
    if (value !== null && typeof value === 'object') {
      for (const [innerName, innerValue] of Object.entries(value)) {
        if (typeof innerName !== 'string') continue;
        if (typeof innerValue === 'string' || typeof innerValue === 'number') {
          colors[`${name}-${innerName}`] = String(innerValue);
        }
      }
    }
  }
  return Object.keys(colors).length > 0 ? colors : undefined;
}

/** Normalize a frontmatter `typography` mapping to a stable ordered array. */
function normalizeTypography(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const rows = [];
  for (const [role, value] of Object.entries(raw)) {
    if (value !== null && typeof value === 'object') {
      const row = { role };
      for (const [field, fieldValue] of Object.entries(value)) {
        if (typeof fieldValue === 'string' || typeof fieldValue === 'number') {
          row[field] = String(fieldValue);
        }
      }
      if (Object.keys(row).length > 1) rows.push(row);
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      rows.push({ role, value: String(value) });
    }
  }
  return rows.length > 0 ? rows : undefined;
}

/** Flatten a `spacing` / `rounded` mapping to { name: value }. */
function normalizeScale(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const scale = {};
  for (const [name, value] of Object.entries(raw)) {
    if (typeof value === 'string' || typeof value === 'number') scale[name] = String(value);
  }
  return Object.keys(scale).length > 0 ? scale : undefined;
}

/** Unique color literals found in prose, in first-appearance order. */
export function colorsInText(body, limit = 40) {
  const seen = new Set();
  const found = [];
  for (const match of body.matchAll(COLOR_LITERAL)) {
    const value = match[0].toLowerCase();
    if (seen.has(value)) continue;
    seen.add(value);
    found.push(value);
    if (found.length >= limit) break;
  }
  return found;
}

function uniqueValues(body, pattern, limit = 12) {
  const seen = new Set();
  const found = [];
  for (const match of body.matchAll(pattern)) {
    const value = match[1].replace(/\s+/g, ' ').trim();
    if (value === '' || seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    found.push(value);
    if (found.length >= limit) break;
  }
  return found;
}

/**
 * Read one design document into an index entry plus the tokens it declares.
 *
 * @param {string} text full document text.
 * @param {string} fallbackName name to use when the document names itself nothing.
 * @returns {object} parsed document.
 */
export function parseDesignDocument(text, fallbackName) {
  const { frontmatter, body, hasFrontmatter } = splitFrontmatter(text);

  const colors = normalizeColors(frontmatter.colors);
  const typography = normalizeTypography(frontmatter.typography);
  const spacing = normalizeScale(frontmatter.spacing);
  const rounded = normalizeScale(frontmatter.rounded);

  const name = firstString(frontmatter.name)
    ?? firstHeading(body)
    ?? fallbackName;

  const description = firstString(frontmatter.description)
    ?? leadParagraph(body)
    ?? '';

  // Prose documents: report literals under a clearly separate field so nobody
  // mistakes them for the declared palette.
  const extracted = {};
  if (colors === undefined) {
    const literals = colorsInText(body);
    if (literals.length > 0) extracted.colors = literals;
  }
  if (typography === undefined) {
    const families = uniqueValues(body, FONT_FAMILY);
    if (families.length > 0) extracted.fontFamilies = families;
  }
  if (rounded === undefined) {
    const radii = uniqueValues(body, RADIUS);
    if (radii.length > 0) extracted.radii = radii;
  }

  return {
    name,
    description: description.length > 1200 ? `${description.slice(0, 1200)}…` : description,
    hasFrontmatter,
    colors,
    typography,
    spacing,
    rounded,
    sections: sectionsOf(body),
    extracted: Object.keys(extracted).length > 0 ? extracted : undefined,
  };
}

/** Read a SKILL.md into an index entry shape. */
export function parseSkillDocument(text, fallbackName) {
  const { frontmatter, body, hasFrontmatter } = splitFrontmatter(text);
  const name = firstString(frontmatter.name) ?? firstHeading(body) ?? fallbackName;
  const description = firstString(frontmatter.description) ?? leadParagraph(body) ?? '';
  return {
    name,
    description: description.length > 1200 ? `${description.slice(0, 1200)}…` : description,
    hasFrontmatter,
  };
}

/**
 * The parts of a parsed document that the runtime index needs.
 *
 * `sections` is dropped because nothing outside the panel's headings readout
 * uses it, and keeping it would roughly double the shipped index for a feature
 * that reads the document on demand anyway.
 *
 * `name` is re-derived here from the document itself — its frontmatter, its
 * first heading, then the filename — because the prebuilt index is what the
 * panel and the skill catalogue read at runtime. Falling back to the path
 * (`.../SKILL`) would put a path where a name belongs.
 *
 * @param {string} text document text.
 * @param {string} relPath repo-relative path, used for the last-resort name.
 */
export function peekSeedDocument(text, relPath) {
  const base = relPath.slice(relPath.lastIndexOf('/') + 1);
  const stem = base.replace(/\.md$/i, '');
  const isSkill = /^SKILL\.md$/i.test(base);
  const parsed = isSkill ? parseSkillDocument(text, stem) : parseDesignDocument(text, stem);
  return {
    // A bare `SKILL.md` names its directory when the document names nothing.
    name: parsed.name,
    description: parsed.description,
    hasFrontmatter: parsed.hasFrontmatter,
    colors: parsed.colors,
    typography: parsed.typography,
    spacing: parsed.spacing,
    rounded: parsed.rounded,
    sectionCount: parsed.sections?.length ?? 0,
    extracted: parsed.extracted,
  };
}

/**
 * Discover design documents on disk and build the index the panel and tools
 * both read.
 *
 * The index is a derived cache, never a source of truth: it can be thrown away
 * and rebuilt from the files at any time. Everything expensive (reading files,
 * parsing frontmatter, hashing) happens once per file and is keyed by
 * `(path, mtimeMs, size)`, so a rescan after one file changed re-reads one file.
 */

import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

import { parseDesignDocument, parseSkillDocument, parseVideoStyle } from './spec.js';

const DOC_NAME = /^(?:DESIGN\.md|SKILL\.md|STYLE\.md|.+-DESIGN\.md)$/i;

/**
 * Method documents that carry their own name instead of a fixed one.
 *
 * The craft, motion and toolkit folders hold flat files like `structure-bible.md`
 * and `animation-principles.md`. They are not `SKILL.md`, so the rule above
 * skipped them — and with them went the two layers a video needs most: how a film
 * is structured, and how its motion is timed.
 *
 * A model could still reach the style specs and the shot cards, which is why the
 * visible symptom was "the video looks flat" rather than "the library is empty":
 * palette and shot skeletons were available, the numbers that make motion feel
 * right were not.
 *
 * The directory list is deliberately short. An earlier version also admitted
 * `varg`, `reelmimic`, `artmotion`, `remotion` and `shader`, which took the index
 * from 429 to 1256 entries — 828 of them craft documents, most of them实验性
 * 逐帧源码 notes. Volume is not the goal: a model reading a 1200-entry list to
 * find `animation-principles` is worse off than one reading 130 good entries.
 */
const METHOD_DIRS = /(?:^|[\\/])(?:craft|motion|toolkit|manim|mv)[\\/]/i;
const METHOD_NAME = /\.md$/i;

/** Whether a file should be indexed as a method document. */
function isMethodDocument(name, full) {
  if (!METHOD_NAME.test(name)) return false;
  // `SKILL.md` inside those folders is already covered by DOC_NAME and parses as
  // a skill; do not double-index it.
  if (DOC_NAME.test(name)) return false;
  return METHOD_DIRS.test(full);
}
const SKIP_DIRS = new Set(['.git', 'node_modules', '.github']);
const CACHE_TTL_MS = 30_000;

/**
 * @typedef {object} DesignEntry
 * @property {string} id stable addressable key `<folder>/<relative-path-without-extension>`
 * @property {'design'|'skill'} kind
 * @property {string} name
 * @property {string} description
 * @property {string} folder repository folder the document was found under
 * @property {string} origin 'seed' | 'local' | 'remote'
 * @property {string} path absolute path on disk
 * @property {string} relPath path relative to its root
 * @property {number} bytes
 * @property {string} hash
 * @property {number} mtimeMs
 */

function hashOf(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function walk(dir, root, out) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  }
  catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM') return out;
    throw error;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(full, root, out);
      continue;
    }
    if (entry.isFile() && (DOC_NAME.test(entry.name) || isMethodDocument(entry.name, full))) {
      out.push({ full, root });
    }
  }
  return out;
}

/** `data/voltagent-awesome-design-md/design-md/airbnb/DESIGN.md` -> `voltagent-awesome-design-md` */
function folderOf(root, full) {
  const rel = relative(root, full);
  const first = rel.split(sep)[0];
  return first === undefined || first === rel ? '' : first;
}

/**
 * One parsed document, memoized by file identity.
 *
 * The whole file is read once and the metadata comes from the read itself.
 * A preceding `stat()` was here originally and cost as much as the read: on a
 * Windows profile each call round-trips through the antivirus filter, and 290
 * sequential calls took 4.7 s before a single byte was parsed.
 *
 * @returns {Promise<{ entry: object, key: string } | null>}
 */
async function readDocument(full, root) {
  let text;
  try {
    text = await readFile(full, 'utf8');
  }
  catch {
    return null;
  }
  const info = { size: Buffer.byteLength(text, 'utf8') };

  const base = full.slice(full.lastIndexOf(sep) + 1);
  const stem = base.replace(/\.md$/i, '');
  // `STYLE.md` sits one level below a style key (`styles/chalk/STYLE.md`), so the
  // name comes from the directory rather than the file.
  const isStyle = /^STYLE\.md$/i.test(base);
  const isSkill = /^SKILL\.md$/i.test(base);
  const dirName = full.slice(0, full.lastIndexOf(sep)).split(sep).pop();

  let parsed;
  let kind;
  // A flat method document carries no front-matter contract and is not a design
  // spec, so it parses through the generic design reader and takes its own kind.
  // 'craft' is what video_craft_read already looks for.
  //
  // This return must carry the same fields the common path builds below —
  // especially `hash`. `buildIndex` de-duplicates on `entry.hash`, so a record
  // without one has `undefined` as its key: the first such document is kept and
  // every later one is filed as a duplicate of it, silently collapsing the whole
  // method library into a single entry.
  if (!DOC_NAME.test(base) && isMethodDocument(base, full)) {
    parsed = parseDesignDocument(text, stem);
    return {
      key: `${full}|${info.size}`,
      entry: {
        kind: 'craft',
        name: parsed.name || stem,
        description: parsed.description,
        path: full,
        relPath: relative(root, full).split(sep).join('/'),
        folder: folderOf(root, full),
        bytes: info.size,
        hash: hashOf(text),
        mtimeMs: 0,
        document: parsed,
      },
    };
  }
  if (isStyle) {
    parsed = parseVideoStyle(text, dirName ?? stem);
    kind = 'video';
  }
  else if (isSkill) {
    parsed = parseSkillDocument(text, stem);
    kind = 'skill';
  }
  else {
    parsed = parseDesignDocument(text, stem);
    kind = 'design';
  }

  return {
    key: `${full}|${info.size}`,
    entry: {
      kind,
      name: parsed.name || stem,
      description: parsed.description,
      path: full,
      relPath: relative(root, full).split(sep).join('/'),
      bytes: info.size,
      hash: hashOf(text),
      mtimeMs: 0,
      document: parsed,
    },
  };
}

/**
 * Run `task` over `items` with bounded concurrency, preserving result order.
 *
 * Sequential reads were the index build's whole cost: 290 files took 12 s one at
 * a time and 0.2 s at 32 in flight. Reading in parallel is safe here because
 * each task touches one file and writes only its own slot.
 *
 * @template T, R
 * @param {readonly T[]} items
 * @param {number} limit maximum tasks in flight
 * @param {(item: T, index: number) => Promise<R>} task
 * @returns {Promise<R[]>} results in input order
 */
export async function mapLimit(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (true) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await task(items[index], index);
    }
  };
  const workers = Array.from({ length: Math.min(Math.max(1, limit), items.length || 1) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * Load the prebuilt seed index.
 *
 * The bundled documents are immutable: they are packed with the plugin and
 * never edited in place. Walking their directory and reading 290 files at every
 * host start is therefore pure waste, and on a machine with a slow filesystem
 * filter it was measured at 4-32 s — long enough that the host would consider
 * the plugin hung. `scripts/sync.mjs` parses them once at build time and ships
 * `data/seed-index.json`, so startup is one file read.
 *
 * If the file is missing or malformed the caller falls back to a live scan, so
 * a hand-edited checkout still works.
 *
 * @param {string} seedRoot the packaged data directory.
 * @param {(path: string) => Promise<string>} readText reads one file as text.
 * @returns {Promise<object|null>} index-shaped object, or null when unusable.
 */
export async function loadSeedIndex(seedRoot, readText) {
  let raw;
  try {
    raw = await readText(join(seedRoot, 'seed-index.json'));
  }
  catch {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  }
  catch {
    return null;
  }
  if (parsed?.schema !== 'dsh-design-library/seed-index/v1' || !Array.isArray(parsed.entries)) return null;

  const entries = parsed.entries.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    name: entry.name ?? entry.id,
    description: entry.description ?? '',
    folder: entry.folder ?? entry.relPath.split('/')[0],
    origin: 'seed',
    path: join(seedRoot, entry.relPath),
    relPath: entry.relPath,
    bytes: entry.bytes ?? 0,
    hash: entry.sha256 ?? '',
    mtimeMs: 0,
    duplicates: [],
    document: {
      // Spread the stored document first: each kind carries different fields
      // (designs have palette/type/spacing, video styles have motion/framing and
      // the constraint lists), and an allow-list here silently dropped whichever
      // kind it was not written for.
      ...(entry.document ?? {}),
      name: entry.document?.name ?? entry.id,
      description: entry.document?.description ?? '',
      hasFrontmatter: entry.document?.hasFrontmatter === true,
      colors: entry.document?.colors,
      typography: entry.document?.typography,
      spacing: entry.document?.spacing,
      rounded: entry.document?.rounded,
      sectionCount: entry.document?.sectionCount ?? 0,
      extracted: entry.document?.extracted,
      sections: [],
    },
  }));

  return {
    revision: parsed.revision ?? '',
    builtAt: Date.parse(parsed.generatedAt ?? '') || Date.now(),
    roots: [seedRoot],
    total: entries.length,
    stats: {
      designs: entries.filter((entry) => entry.kind === 'design').length,
      skills: entries.filter((entry) => entry.kind === 'skill').length,
      duplicates: 0,
      failed: 0,
    },
    warnings: [],
    failed: [],
    entries,
  };
}

/**
 * Build an index over one or more roots.
 *
 * @param {string[]} roots directories to scan, in priority order. A document
 *   whose content duplicates one already seated by an earlier root is dropped,
 *   so the bundled seed pack always wins over a user copy of the same text.
 * @param {object} [options]
 * @param {string} [options.seedRoot] the packaged `data` directory, marked `seed`.
 * @param {number} [options.maxEntries] hard cap on indexed documents.
 * @param {number} [options.concurrency] files read in parallel; defaults to 32.
 * @returns {Promise<object>} the index.
 */
export async function buildIndex(roots, options = {}) {
  const seedRoot = options.seedRoot;
  const maxEntries = options.maxEntries ?? 5000;
  const concurrency = options.concurrency ?? 32;
  const warnings = [];
  const byHash = new Map();
  const entries = [];
  const failed = [];

  for (const root of roots) {
    let files;
    let info;
    try {
      info = await stat(root);
    }
    catch (error) {
      warnings.push(`cannot read ${root}: ${error.code ?? error.message}`);
      continue;
    }
    if (!info.isDirectory()) {
      warnings.push(`not a directory: ${root}`);
      continue;
    }
    try {
      files = await walk(root, root, []);
    }
    catch (error) {
      warnings.push(`cannot read ${root}: ${error.code ?? error.message}`);
      continue;
    }
    if (files.length > maxEntries - entries.length) {
      files = files.slice(0, Math.max(0, maxEntries - entries.length));
      warnings.push(`stopped at ${maxEntries} documents; raise maxEntries to index more`);
    }

    const records = await mapLimit(files, concurrency, async ({ full }) => {
      try {
        return await readDocument(full, root);
      }
      catch (error) {
        failed.push({ path: full, reason: error.message });
        return null;
      }
    });

    for (const record of records) {
      if (record === null) {
        continue;
      }
      const existing = byHash.get(record.entry.hash);
      if (existing !== undefined) {
        existing.duplicates.push(record.entry.path);
        continue;
      }

      const folder = folderOf(root, record.entry.path);
      const origin = seedRoot !== undefined && root === seedRoot
        ? 'seed'
        : (options.remoteRoots ?? []).includes(root) ? 'remote' : 'local';

      // The id is the root-relative path without its extension: already unique,
      // already readable, and stable across rescans as long as the file stays put.
      const entry = {
        id: record.entry.relPath.replace(/\.md$/i, ''),
        kind: record.entry.kind,
        name: record.entry.name,
        description: record.entry.description,
        folder,
        origin,
        path: record.entry.path,
        relPath: record.entry.relPath,
        bytes: record.entry.bytes,
        hash: record.entry.hash,
        mtimeMs: record.entry.mtimeMs,
        duplicates: [],
        document: record.entry.document,
      };
      byHash.set(entry.hash, entry);
      entries.push(entry);
    }
  }

  entries.sort((a, b) => (a.kind === b.kind ? a.id.localeCompare(b.id) : a.kind === 'design' ? -1 : 1));

  const designs = entries.filter((entry) => entry.kind === 'design');
  const skills = entries.filter((entry) => entry.kind === 'skill');

  return {
    revision: hashOf(entries.map((entry) => entry.hash).join(':')).slice(0, 16),
    builtAt: Date.now(),
    roots,
    total: entries.length,
    stats: {
      designs: designs.length,
      skills: skills.length,
      duplicates: entries.reduce((sum, entry) => sum + entry.duplicates.length, 0),
      failed: failed.length,
    },
    warnings,
    failed,
    entries,
  };
}

/**
 * TTL wrapper so a busy panel does not rescan on every keystroke.
 *
 * @param {() => Promise<object>} build called at most once per TTL.
 * @param {number} [ttlMs]
 */
export function cachedIndex(build, ttlMs = CACHE_TTL_MS) {
  let current;
  let builtAt = 0;
  let inflight;
  return async function get(force = false) {
    if (!force && current !== undefined && Date.now() - builtAt < ttlMs) return current;
    if (inflight !== undefined) return inflight;
    inflight = (async () => {
      try {
        const index = await build();
        current = index;
        builtAt = Date.now();
        return index;
      }
      finally {
        inflight = undefined;
      }
    })();
    return inflight;
  };
}

/** Public projection of one entry: everything the panel needs, no file bytes. */
export function publicEntry(entry) {
  return {
    id: entry.id,
    kind: entry.kind,
    name: entry.name,
    description: entry.description,
    folder: entry.folder,
    origin: entry.origin,
    bytes: entry.bytes,
    colors: entry.document.colors,
    typography: entry.document.typography,
    spacing: entry.document.spacing,
    rounded: entry.document.rounded,
    extracted: entry.document.extracted,
    sectionCount: entry.document.sections?.length ?? 0,
  };
}

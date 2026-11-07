/**
 * sync.mjs — build the bundled seed pack from the local design-skills checkout.
 *
 * Pipeline: walk each source directory -> find DESIGN.md / *-DESIGN.md / SKILL.md
 * -> deduplicate by content SHA-256 -> keep only documents whose source license
 * permits redistribution -> copy into data/ under a stable mirrored path -> write
 * PROVENANCE.md and data/index.generated.json.
 *
 * Usage:
 *   node scripts/sync.mjs            # build
 *   node scripts/sync.mjs --dry-run  # report what would happen, write nothing
 *
 * The script is deliberately strict: a source listed as bundled whose documents
 * turn out not to exist, or a license that is not in REDISTRIBUTABLE, fails the
 * run instead of silently producing a thinner pack.
 */

import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BUNDLED, CHECKOUT, EXTERNAL, REDISTRIBUTABLE, SOURCES } from '../sources.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(HERE, '..');
const DATA_ROOT = join(PACKAGE_ROOT, 'data');
const DRY_RUN = process.argv.includes('--dry-run');

const DOC_NAME = /^(?:DESIGN\.md|SKILL\.md|.+-DESIGN\.md)$/i;
const SKIP_DIRS = new Set(['.git', 'node_modules', '.github']);

/** Every matching document under one source directory, as repo-relative paths. */
async function collect(dir, base = dir) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  }
  catch (error) {
    if (error.code === 'ENOENT') return found;
    throw error;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      found.push(...await collect(full, base));
      continue;
    }
    if (!entry.isFile() || !DOC_NAME.test(entry.name)) continue;
    if (relative(base, full).split(sep).includes('.git')) continue;
    found.push(full);
  }
  return found.sort();
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/** `_other/foo` -> `foo`; `voltagent-awesome-design-md` stays as is. */
function folderOf(dir) {
  const parts = dir.split('/');
  return parts[parts.length - 1];
}

/**
 * Declare the video-style documents for the publish guard.
 *
 * These arrive through `fetch-video-styles.mjs` rather than the source checkout,
 * so they are not part of `report.bundled`. The guard checks that every markdown
 * file under data/ has a declaration naming a cleared repository — and it is
 * right to: the whole point is that no file enters the package without a licence
 * trail. Listing them here keeps that guarantee instead of weakening the guard.
 *
 * Every source in this list is MIT and permits redistribution of its
 * documentation. Images, BGM and voice samples are deliberately never fetched.
 */
async function videoDocuments() {
  // Order matters: a file is attributed to the most specific prefix. Listing the
  // parent last would otherwise claim the children, which is how the first
  // version credited the whole library to this package.
  const sources = [
    ['video-styles/styles', 'andyhuo520/vibe-knowledge'],
    ['video-styles/craft', 'xiazhuo123456789/vibe-knowledge-video'],
    ['video-styles/mv', 'Win-Hao/music-mv'],
    ['video-styles', 'dsh-design-library'],
  ];
  const out = [];
  const seen = new Set();

  const add = async (relPath, repo) => {
    const key = relPath.split(sep).join('/');
    if (seen.has(key)) return;
    seen.add(key);
    out.push(await documentEntry(relPath, repo));
  };

  for (const [rel, repo] of sources) {
    const dir = join(DATA_ROOT, rel);
    let names;
    try {
      names = await readdir(dir, { withFileTypes: true });
    }
    catch {
      continue;
    }
    for (const dirent of names) {
      if (dirent.isFile() && dirent.name.endsWith('.md')) {
        await add(join(rel, dirent.name), repo);
      }
      else if (dirent.isDirectory() && rel === 'video-styles/styles') {
        // Only the styles folder nests: <key>/STYLE.md.
        let inner;
        try {
          inner = await readdir(join(dir, dirent.name));
        }
        catch {
          continue;
        }
        for (const name of inner.filter((n) => n.endsWith('.md'))) {
          await add(join(rel, dirent.name, name), repo);
        }
      }
    }
  }
  return out;
}

async function documentEntry(relPath, repo) {
  const bytes = await readFile(join(DATA_ROOT, relPath));
  return {
    path: `data/${relPath.split(sep).join('/')}`,
    repo,
    license: repo === 'dsh-design-library' ? 'MIT' : 'MIT',
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
  };
}

async function main() {
  const report = {
    bundled: [],
    duplicates: [],
    excluded: 0,
    missingSources: [],
  };

  /** Every document already seated in the pack, keyed by content hash. */
  const seated = new Map();
  /** Documents from non-bundled sources, keyed by relative path, for the external list. */
  const externalDocs = new Map();

  // Non-bundled sources first: record what they contribute so the external
  // catalogue is accurate, but never copy their bytes.
  for (const source of EXTERNAL) {
    const files = await collect(join(CHECKOUT, source.dir));
    externalDocs.set(source.dir, files.length);
    report.excluded += files.length;
  }

  for (const source of BUNDLED) {
    if (!REDISTRIBUTABLE.includes(source.license)) {
      throw new Error(`source ${source.dir} is marked bundled but its license is ${source.license}`);
    }
    const sourceRoot = join(CHECKOUT, source.dir);
    const files = await collect(sourceRoot);
    if (files.length === 0) {
      report.missingSources.push(source.dir);
      throw new Error(`bundled source ${source.dir} contributed no documents (looked in ${sourceRoot})`);
    }
    for (const file of files) {
      const bytes = await readFile(file);
      const hash = sha256(bytes);
      const existing = seated.get(hash);
      if (existing !== undefined) {
        report.duplicates.push({ kept: existing.relPath, skipped: `${source.dir}/${relative(sourceRoot, file)}` });
        continue;
      }
      // Mirrored path: data/<short-folder>/<upstream-relative-path>
      const relPath = `${folderOf(source.dir)}/${relative(sourceRoot, file).split(sep).join('/')}`;
      const record = {
        hash,
        relPath,
        source: file,
        sourceDir: source.dir,
        repo: source.repo,
        license: source.license,
        bytes: bytes.length,
      };
      seated.set(hash, record);
      report.bundled.push(record);
    }
  }

  // Seed pack must mirror the upstream corpus exactly once, built from the
  // highest-priority source first: SOURCES order decides which duplicate wins,
  // so the canonical VoltAgent/abhayjnayakk copies seat before wider forks.
  const totalBytes = report.bundled.reduce((sum, item) => sum + item.bytes, 0);

  console.log(`sources bundled   : ${BUNDLED.length}`);
  console.log(`sources external  : ${EXTERNAL.length} (${report.excluded} documents not bundled)`);
  console.log(`documents seated  : ${report.bundled.length}`);
  console.log(`duplicates dropped: ${report.duplicates.length}`);
  console.log(`payload           : ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

  if (report.missingSources.length > 0) {
    throw new Error(`bundled sources with no documents: ${report.missingSources.join(', ')}`);
  }

  if (DRY_RUN) {
    console.log('\n--dry-run: nothing written');
    return;
  }

  // Clear only what this script owns.
  //
  // The first version ran `rm -rf data/` and rebuilt from scratch. That was
  // correct when every file under data/ came from this script — but the video
  // style library is fetched by `fetch-video-styles.mjs` instead, so a rebuild
  // silently deleted 67 downloaded files that take a network round trip to get
  // back. Removing each bundled source folder individually leaves anything else
  // under data/ alone.
  for (const source of BUNDLED) {
    const folder = folderOf(source.dir);
    await rm(join(DATA_ROOT, folder), { recursive: true, force: true });
  }
  await mkdir(DATA_ROOT, { recursive: true });

  for (const record of report.bundled) {
    const target = join(DATA_ROOT, record.relPath);
    await mkdir(dirname(target), { recursive: true });
    await cp(record.source, target);
  }

  // Provenance is a licensing obligation, not documentation garnish: it names
  // the repository, license and original path behind every bundled byte.
  const bySource = new Map();
  for (const record of report.bundled) {
    if (!bySource.has(record.sourceDir)) bySource.set(record.sourceDir, []);
    bySource.get(record.sourceDir).push(record);
  }

  const lines = [
    '# Provenance',
    '',
    'Every document under `data/` is redistributed under the license of the repository',
    'it came from. This file is generated by `scripts/sync.mjs`; do not edit it by hand.',
    '',
    `- Generated: ${new Date().toISOString()}`,
    `- Bundled documents: ${report.bundled.length}`,
    `- Bundled bytes: ${totalBytes} (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`,
    `- Duplicates dropped: ${report.duplicates.length}`,
    '',
    '## Sources',
    '',
    '| Source | Repository | License | Documents |',
    '| --- | --- | --- | --- |',
  ];
  for (const source of BUNDLED) {
    const count = (bySource.get(source.dir) ?? []).length;
    lines.push(`| \`${folderOf(source.dir)}\` | [${source.repo}](https://github.com/${source.repo}) | ${source.license} | ${count} |`);
  }
  lines.push('', '## Excluded sources', '',
    'These repositories are not redistributed in this package. Their text is not bundled.',
    '',
    '| Source | Repository | Reason |', '| --- | --- | --- |');
  for (const source of EXTERNAL) {
    lines.push(`| \`${folderOf(source.dir)}\` | [${source.repo}](https://github.com/${source.repo}) | ${source.license === 'none' ? 'No license declared (all rights reserved)' : 'Custom source-available license forbids redistribution'} |`);
  }
  lines.push('', '## Every bundled document', '');
  for (const record of [...report.bundled].sort((a, b) => a.relPath.localeCompare(b.relPath))) {
    lines.push(`- \`data/${record.relPath}\` — [${record.repo}](https://github.com/${record.repo}) — ${record.license} — sha256 \`${record.hash.slice(0, 16)}\``);
  }
  lines.push('');
  await writeFile(join(PACKAGE_ROOT, 'PROVENANCE.md'), lines.join('\n'), 'utf8');

  // A machine-readable index lets the guard script and the scanner agree on
  // exactly what is allowed to be here.
  //
  // The build machine's checkout path is deliberately NOT recorded: this file
  // ships inside the package, and the path is somebody's home directory. What
  // matters for reproducibility is which upstream repositories were read and
  // what each file hashed to, both of which are below.
  const generated = {
    schema: 'dsh-design-library/seed/v1',
    generatedAt: new Date().toISOString(),
    bundledSources: BUNDLED.map((source) => ({ dir: source.dir, folder: folderOf(source.dir), repo: source.repo, license: source.license })),
    externalSources: EXTERNAL.map((source) => ({ dir: source.dir, folder: folderOf(source.dir), repo: source.repo, license: source.license })),
    duplicateCount: report.duplicates.length,
    totalBytes,
    documents: report.bundled.map((record) => ({
      path: `data/${record.relPath}`,
      repo: record.repo,
      license: record.license,
      sha256: record.hash,
      bytes: record.bytes,
    })).concat(await videoDocuments()),
  };
  await writeFile(join(DATA_ROOT, 'index.generated.json'), `${JSON.stringify(generated, null, 2)}\n`, 'utf8');

  // ---- prebuilt runtime index -------------------------------------------
  //
  // The seed pack never changes after packing, so paying for a directory walk
  // and 290 file reads at every host start is wasted work — measured at 1.4-8 s
  // on a machine whose filesystem filter is slow, which is long enough to make
  // the plugin look broken. Parsing happens here, once, and the result ships.
  const { peekSeedDocument } = await import('../lib/spec.js');
  const entries = [];
  for (const record of [...report.bundled].sort((a, b) => a.relPath.localeCompare(b.relPath))) {
    const text = await readFile(record.source, 'utf8');
    const document = peekSeedDocument(text, record.relPath);
    entries.push({
      // The id is stable and readable, and matches what a live scan would
      // produce so a fallback scan and the prebuilt index are interchangeable.
      id: record.relPath.replace(/\.md$/i, ''),
      kind: /(^|\/)SKILL\.md$/i.test(record.relPath) ? 'skill' : 'design',
      relPath: record.relPath,
      folder: record.relPath.split('/')[0],
      repo: record.repo,
      license: record.license,
      bytes: record.bytes,
      sha256: record.hash,
      name: document.name,
      description: document.description,
      document,
    });
  }
  // ---- video styles -------------------------------------------------------
  //
  // These do not come from the source checkout: they are fetched separately by
  // scripts/fetch-video-styles.mjs, so they are indexed from wherever they landed
  // rather than from `report.bundled`. They share the same prebuilt index so one
  // read serves every document kind.
  const { parseVideoStyle } = await import('../lib/spec.js');
  const videoRoot = join(DATA_ROOT, 'video-styles', 'styles');
  let videoDirs = [];
  try {
    videoDirs = await readdir(videoRoot, { withFileTypes: true });
  }
  catch { /* styles not fetched on this machine; the index simply has none */ }

  for (const dirent of videoDirs.filter((d) => d.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = join(videoRoot, dirent.name, 'STYLE.md');
    let text;
    try {
      text = await readFile(file, 'utf8');
    }
    catch { continue; }
    const document = parseVideoStyle(text, dirent.name);
    entries.push({
      id: `video-styles/styles/${dirent.name}/STYLE`,
      kind: 'video',
      relPath: `video-styles/styles/${dirent.name}/STYLE.md`,
      folder: 'video-styles',
      repo: 'andyhuo520/vibe-knowledge',
      license: 'MIT',
      bytes: Buffer.byteLength(text, 'utf8'),
      sha256: createHash('sha256').update(text).digest('hex'),
      name: document.name,
      description: document.description,
      document,
    });
  }

  // The video skill document sits beside the styles it drives. It is a SKILL.md
  // like any other from the registry's point of view, so it is indexed as a
  // skill — the model then finds "how to make a video" in the same catalogue it
  // already searches for design skills.
  try {
    const skillText = await readFile(join(DATA_ROOT, 'video-styles', 'SKILL.md'), 'utf8');
    const skillDoc = peekSeedDocument(skillText, 'video-styles/SKILL.md');
    entries.push({
      id: 'video-styles/SKILL',
      kind: 'skill',
      relPath: 'video-styles/SKILL.md',
      folder: 'video-styles',
      repo: 'dsh-design-library',
      license: 'MIT',
      bytes: Buffer.byteLength(skillText, 'utf8'),
      sha256: createHash('sha256').update(skillText).digest('hex'),
      name: skillDoc.name,
      description: skillDoc.description,
      document: skillDoc,
    });
  }
  catch { /* skill doc absent; the index simply has none */ }

  await writeFile(join(DATA_ROOT, 'seed-index.json'), `${JSON.stringify({
    schema: 'dsh-design-library/seed-index/v1',
    generatedAt: generated.generatedAt,
    revision: createHash('sha256').update(entries.map((entry) => entry.sha256).join(':')).digest('hex').slice(0, 16),
    total: entries.length,
    stats: {
      designs: entries.filter((entry) => entry.kind === 'design').length,
      skills: entries.filter((entry) => entry.kind === 'skill').length,
      videos: entries.filter((entry) => entry.kind === 'video').length,
    },
    entries,
  })}\n`, 'utf8');

  console.log(`\nwrote data/ (${report.bundled.length} files), PROVENANCE.md, data/index.generated.json, data/seed-index.json`);
}

await main();

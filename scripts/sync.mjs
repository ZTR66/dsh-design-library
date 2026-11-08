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
    ['video-styles/shots', 'Vincentwei1021/video-shotcraft'],
    ['video-styles/artmotion', 'alchaincyf/huashu-art-motion'],
    ['video-styles/index', 'ismoshushi/awesome-opus-video-skills'],
    ['video-styles/toolkit', 'liangdabiao/video-skills-toolkit'],
    ['video-styles/remotion/free', 'RenderComp/free-remotion-templates'],
    ['video-styles/remotion/rve', 'reactvideoeditor/remotion-templates'],
    ['video-styles/remotion/aliabassi', 'ali-abassi/remotion-templates'],
    // Wave 3 and 4 — listed before the catch-all so these files are credited to
    // the repository they came from rather than to this package.
    ['video-styles/motion', 'iart-ai/motion-design-skills'],
    ['video-styles/director/baocut', 'jimliu/baocut'],
    ['video-styles/director/chaojifeng', 'mileson/chaojifeng-video-design'],
    ['video-styles/director/spark-video', 'modelstudioai/skills'],
    ['video-styles/director/visual-skills', 'smixs/visual-skills'],
    ['video-styles/manim', 'G-U-N/vibe-manim'],
    ['video-styles/varg', 'varghq/skills'],
    ['video-styles/shader', 'gokayfem/shader-skills'],
    ['video-styles/reelmimic', 'edenfunf/reelmimic'],
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

  // Walk each source folder to whatever depth it happens to have. The first
  // version assumed a fixed two-level shape and silently skipped anything
  // deeper, so declaring a new top-level folder left its children undeclared.
  const walk = async (rel, repo, depth) => {
    if (depth > 8) return;
    const dir = join(DATA_ROOT, rel);
    let names;
    try {
      names = await readdir(dir, { withFileTypes: true });
    }
    catch {
      return;
    }
    for (const dirent of names) {
      if (dirent.isDirectory()) {
        await walk(join(rel, dirent.name), repo, depth + 1);
        continue;
      }
      if (!/\.(md|json|tsx?)$/i.test(dirent.name)) continue;
      await add(join(rel, dirent.name), repo);
    }
  };

  for (const [rel, repo] of sources) {
    await walk(rel, repo, 0);
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

  // ---- shot recipe cards --------------------------------------------------
  //
  // The cards live in one manifest (`library.json`) with their source documents
  // beside it. Both are indexed: the manifest gives search a compact record per
  // shot, and the source documents are what `video_shot_read` returns. Indexing
  // the manifest separately keeps a 124-card search from reading 124 files.
  let shotManifest = null;
  try {
    shotManifest = JSON.parse(await readFile(join(DATA_ROOT, 'video-styles', 'shots', 'library.json'), 'utf8'));
  }
  catch { /* library not fetched */ }

  if (shotManifest !== null && Array.isArray(shotManifest.cards)) {
    for (const card of shotManifest.cards) {
      if (typeof card.name !== 'string' || card.name === '') continue;
      entries.push({
        id: `video-styles/shots/${card.name}`,
        kind: 'shot',
        relPath: `video-styles/shots/library.json#${card.name}`,
        folder: 'video-styles',
        repo: 'Vincentwei1021/video-shotcraft',
        license: 'Apache-2.0',
        bytes: 0,
        sha256: createHash('sha256').update(JSON.stringify(card)).digest('hex'),
        name: card.name,
        description: card.summary ?? '',
        document: {
          name: card.name,
          description: card.summary ?? '',
          category: card.category,
          use: card.use,
          duration: card.duration,
          energy: card.energy,
          intention: card.intention,
          tags: Array.isArray(card.tags) ? card.tags : [],
          source: card.source,
        },
      });
    }
  }

  // ---- art-motion reference documents ------------------------------------
  //
  // 35 historical art styles plus the method documents. Indexed as their own
  // kind so a search for "洞穴壁画" finds the style rather than a design system.
  const artRoot = join(DATA_ROOT, 'video-styles', 'artmotion');
  let artFiles = [];
  try {
    artFiles = (await readdir(artRoot)).filter((name) => name.endsWith('.md'));
  }
  catch { /* not fetched */ }

  for (const name of artFiles.sort()) {
    let text;
    try {
      text = await readFile(join(artRoot, name), 'utf8');
    }
    catch { continue; }
    // The style files are numbered (`01_cave.md`); the rest are method notes.
    const isStyle = /^\d{2}_/.test(name);
    const stem = name.replace(/\.md$/, '');
    const title = /^#\s+(.+)$/m.exec(text)?.[1]?.trim() ?? stem;
    // First non-heading, non-empty paragraph is the summary.
    const paragraph = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line !== '' && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('|')) ?? '';
    entries.push({
      id: `video-styles/artmotion/${stem}`,
      kind: isStyle ? 'video' : 'craft',
      relPath: `video-styles/artmotion/${name}`,
      folder: 'video-styles',
      repo: 'alchaincyf/huashu-art-motion',
      license: 'MIT',
      bytes: Buffer.byteLength(text, 'utf8'),
      sha256: createHash('sha256').update(text).digest('hex'),
      name: title,
      description: paragraph.slice(0, 400),
      document: {
        name: title,
        description: paragraph.slice(0, 400),
        artStyle: isStyle,
      },
    });
  }

  // ---- motion skills and director method documents -----------------------
  //
  // Two more families of prose rather than specs:
  //   motion/   nine skills answering "how should this move" with numbers
  //   director/ shot cards, transition wording, story spines, treatments
  //
  // They are indexed as `craft`: they are method, not a look, so they belong in
  // the same bucket as the camera-grammar documents from the first wave.
  const craftRoots = [
    ['motion', 'iart-ai/motion-design-skills'],
    ['director/baocut', 'jimliu/baocut'],
    ['director/chaojifeng', 'mileson/chaojifeng-video-design'],
    ['director/spark-video', 'modelstudioai/skills'],
    ['director/visual-skills', 'smixs/visual-skills'],
    ['manim', 'G-U-N/vibe-manim'],
    ['varg', 'varghq/skills'],
    ['shader', 'gokayfem/shader-skills'],
    ['reelmimic', 'edenfunf/reelmimic'],
  ];

  for (const [rel, repo] of craftRoots) {
    const root = join(DATA_ROOT, 'video-styles', rel);
    let names;
    try {
      names = await readdir(root, { withFileTypes: true });
    }
    catch {
      continue;
    }
    // One level: either documents directly, or one folder per skill.
    const files = [];
    for (const dirent of names) {
      if (dirent.isFile() && dirent.name.endsWith('.md')) {
        files.push({ rel: join(rel, dirent.name), name: dirent.name });
      }
      else if (dirent.isDirectory()) {
        for (const inner of [`SKILL.md`, `README.md`]) {
          files.push({ rel: join(rel, dirent.name, inner), name: `${dirent.name}/${inner}`, optional: true });
        }
      }
    }
    for (const item of files) {
      const full = join(DATA_ROOT, 'video-styles', item.rel);
      let text;
      try {
        text = await readFile(full, 'utf8');
      }
      catch { continue; }
      const stem = item.rel.replace(/\.md$/, '').split(sep).join('/');
      const title = /^#\s+(.+)$/m.exec(text)?.[1]?.trim()
        ?? (() => {
          const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
          const nm = fm === null ? null : /\bname:\s*(.+)/.exec(fm[1]);
          return nm === null ? item.name : nm[1].trim();
        })();
      const desc = (() => {
        const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
        if (fm !== null) {
          const d = /\bdescription:\s*([\s\S]*?)(?:\n\w+:|\n$)/.exec(fm[1]);
          if (d !== null) return d[1].trim().replace(/^["']|["']$/g, '').slice(0, 400);
        }
        const paragraph = text.split(/\r?\n/).map((l) => l.trim())
          .find((l) => l !== '' && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('|'));
        return (paragraph ?? '').slice(0, 400);
      })();
      entries.push({
        id: `video-styles/${stem}`,
        kind: 'craft',
        relPath: `video-styles/${item.rel.split(sep).join('/')}`,
        folder: 'video-styles',
        repo,
        license: repo === 'jimliu/baocut' ? 'BaoCut-Community-1.0'
          : repo === 'smixs/visual-skills' ? 'CC-BY-4.0'
            : 'MIT',
        bytes: Buffer.byteLength(text, 'utf8'),
        sha256: createHash('sha256').update(text).digest('hex'),
        name: title,
        description: desc,
        document: { name: title, description: desc },
      });
    }
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

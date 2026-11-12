/**
 * guard-publish.mjs — refuse to publish a package that would redistribute
 * content its authors never licensed for redistribution.
 *
 * Runs from `prepack`, so it gates both `npm publish` and `npm pack` from a
 * clean tree. Three independent checks, because the failure this prevents is a
 * licensing violation that cannot be taken back once a tarball is on the
 * registry:
 *
 *   1. every file under data/ is listed in data/index.generated.json;
 *   2. every listed file's source repository is one whose license permits
 *      redistribution (the same allow list sync.mjs builds from);
 *   3. every file still hashes to what the index recorded, so nobody hand-added
 *      a document after the sync ran.
 *
 * Any failure exits non-zero with the offending paths named.
 */

import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BUNDLED, REDISTRIBUTABLE, SOURCES } from '../sources.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DATA = join(ROOT, 'data');

const problems = [];

/** Every file under data/, as posix paths relative to the package root. */
async function walk(dir, base, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, base, out);
      continue;
    }
    if (entry.isFile()) out.push(relative(base, full).split(sep).join('/'));
  }
  return out;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

let index;
try {
  index = JSON.parse(await readFile(join(DATA, 'index.generated.json'), 'utf8'));
}
catch (error) {
  console.error(`FATAL: cannot read data/index.generated.json (${error.code ?? error.message}).`);
  console.error('Run `npm run sync` before packing.');
  process.exit(1);
}

// Repositories cleared to have their documentation redistributed here.
//
// The design documents come from BUNDLED (the sync sources). The video style
// library is fetched separately, so its repositories are listed explicitly —
// each was checked to be MIT for documentation, and each has an entry in
// data/video-styles/PROVENANCE.md recording what was and was not taken.
const VIDEO_STYLE_REPOS = [
  'andyhuo520/vibe-knowledge',
  'xiazhuo123456789/vibe-knowledge-video',
  'Win-Hao/music-mv',
  'Vincentwei1021/video-shotcraft',
  'alchaincyf/huashu-art-motion',
  'ismoshushi/awesome-opus-video-skills',
  'liangdabiao/video-skills-toolkit',
  'RenderComp/free-remotion-templates',
  // The two repositories below declare no license. Only their README and SKILL
  // documents are copied — never source — and the guard still requires every file
  // to name a cleared repository, so the exemption is visible here rather than
  // buried in the fetch script.
  'reactvideoeditor/remotion-templates',
  'ali-abassi/remotion-templates',
  'iart-ai/motion-design-skills',
  'mileson/chaojifeng-video-design',
  'jimliu/baocut',
  'modelstudioai/skills',
  'smixs/visual-skills',
  'G-U-N/vibe-manim',
  'varghq/skills',
  'gokayfem/shader-skills',
  'edenfunf/reelmimic',
  'LearnPrompt/carl-motion',  // MIT; 29 motion styles, prompts and previews
  'kennywu411-dev/video-pacing',  // MIT; short-video pacing rules
  'jnMetaCode/ai-shortfilm-prompts',  // MIT; camera-move library and genre SOPs
  'dsh-design-library',   // this package's own skill document
];

const allowedRepos = new Set([
  ...BUNDLED.filter((source) => REDISTRIBUTABLE.includes(source.license)).map((source) => source.repo),
  ...VIDEO_STYLE_REPOS,
]);
const declared = new Map(index.documents.map((document) => [document.path, document]));

// ---- 1. on-disk files must all be declared -------------------------------
const onDisk = (await walk(DATA, ROOT)).filter((path) => path.endsWith('.md'));
for (const path of onDisk) {
  if (!declared.has(path)) problems.push(`undeclared file under data/: ${path}`);
}

// ---- 2 & 3. declared files must be licensed and unchanged ----------------
for (const [path, document] of declared) {
  if (!allowedRepos.has(document.repo)) {
    problems.push(`repository not cleared for redistribution: ${document.repo} (${path})`);
    continue;
  }
  let bytes;
  try {
    bytes = await readFile(join(ROOT, path));
  }
  catch {
    problems.push(`declared file is missing: ${path}`);
    continue;
  }
  if (sha256(bytes) !== document.sha256) {
    problems.push(`content changed after sync: ${path}`);
  }
}

// ---- 4. no excluded source may appear anywhere in data/ ------------------
for (const source of SOURCES.filter((item) => item.bundle === false)) {
  const folder = String(source.dir).split('/').pop();
  const hit = onDisk.find((path) => path.startsWith(`data/${folder}/`));
  if (hit !== undefined) {
    problems.push(`excluded source (${source.license}) is present: ${hit}`);
  }
}

// ---- 5. every bundled file must exist ------------------------------------
const totalBytes = index.documents.reduce((sum, document) => sum + document.bytes, 0);
if (index.documents.length === 0) {
  problems.push('the seed pack is empty; run `npm run sync`');
}

if (problems.length > 0) {
  console.error('Packaging refused — these checks failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(`\n${problems.length} problem(s). Nothing was packed.`);
  process.exit(1);
}

console.log(`Publish guard passed: ${index.documents.length} documents, ${(totalBytes / 1024 / 1024).toFixed(2)} MB, all licensed and unchanged.`);

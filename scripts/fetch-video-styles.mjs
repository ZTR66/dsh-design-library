/**
 * fetch-video-styles.mjs — pull the MIT-licensed style documents into data/.
 *
 * Sources (all MIT for documentation; see PROVENANCE.md):
 *   - andyhuo520/vibe-knowledge       — 44 style specs + catalog.json
 *   - xiazhuo123456789/vibe-knowledge-video — camera grammar, quality gate, render craft
 *   - Win-Hao/music-mv               — music-video workflow docs
 *
 * What is deliberately NOT copied:
 *   - still.jpg files (NOTICE.md forbids redistributing them as your own)
 *   - sample videos, BGM, voice references
 *
 * Run: node scripts/fetch-video-styles.mjs
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DEST = join(ROOT, 'data', 'video-styles');

const GITHUB = 'https://api.github.com';
const UA = { 'User-Agent': 'dsh-design-library-build', Accept: 'application/vnd.github+json' };

async function api(path) {
  const response = await fetch(`${GITHUB}${path}`, { headers: UA });
  if (!response.ok) throw new Error(`${path} → HTTP ${response.status}`);
  return response.json();
}

/** Raw text of one file through the contents API (handles base64 + encoding). */
async function fetchText(repo, path) {
  const data = await api(`/repos/${repo}/contents/${path}`);
  if (Array.isArray(data)) throw new Error(`${path} is a directory`);
  if (data.encoding === 'base64') {
    return Buffer.from(data.content.replace(/\s/g, ''), 'base64').toString('utf8');
  }
  return data.content ?? '';
}

async function writeIn(rel, content) {
  const target = join(DEST, rel);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

/** Copy one directory of markdown from a repo into a local folder. */
async function copyDocs(repo, remoteDir, localDir, { skip = [] } = {}) {
  const entries = await api(`/repos/${repo}/contents/${remoteDir}`);
  const written = [];
  for (const entry of entries) {
    if (entry.type !== 'file') continue;
    if (!entry.name.endsWith('.md') && !entry.name.endsWith('.json')) continue;
    if (skip.some((s) => entry.name.includes(s))) continue;
    const text = await fetchText(repo, `${remoteDir}/${entry.name}`);
    await writeIn(join(localDir, entry.name), text);
    written.push(entry.name);
  }
  return written;
}

async function main() {
  const report = { styles: 0, craft: [], mv: [], skipped: [] };

  // ---- 1. the 44 styles + catalog -----------------------------------------
  console.log('fetching style catalog…');
  const stylesRepo = 'andyhuo520/vibe-knowledge';
  const stylesDir = 'skills/vibe-knowledge/styles';

  const catalog = await fetchText(stylesRepo, `${stylesDir}/catalog.json`);
  await writeIn('catalog.json', catalog);
  const parsed = JSON.parse(catalog);

  for (const style of parsed.styles) {
    const key = style.key;
    try {
      const spec = await fetchText(stylesRepo, `${stylesDir}/${key}/STYLE.md`);
      await writeIn(join('styles', key, 'STYLE.md'), spec);
      report.styles += 1;
      process.stdout.write('.');
    }
    catch (error) {
      report.skipped.push(`${key}: ${error.message}`);
    }
  }
  console.log(`\n  ${report.styles} style specs`);

  // INDEX.md is the human-readable roster; keep it beside the catalog.
  try {
    await writeIn('INDEX.md', await fetchText(stylesRepo, `${stylesDir}/INDEX.md`));
  }
  catch { /* optional */ }

  // ---- 2. craft documents --------------------------------------------------
  console.log('fetching craft documents…');
  try {
    report.craft = await copyDocs(
      'xiazhuo123456789/vibe-knowledge-video',
      'references',
      'craft',
      // narrative templates and style guides duplicate what the catalog covers
      { skip: ['original-analysis'] },
    );
    console.log(`  ${report.craft.length} craft docs`);
  }
  catch (error) {
    console.log(`  craft failed: ${error.message}`);
  }

  // ---- 3. music-video workflow --------------------------------------------
  console.log('fetching mv workflow…');
  try {
    report.mv = await copyDocs('Win-Hao/music-mv', 'references', 'mv');
    console.log(`  ${report.mv.length} mv docs`);
  }
  catch (error) {
    console.log(`  mv failed: ${error.message}`);
  }

  console.log('\n=== summary ===');
  console.log(`styles : ${report.styles}`);
  console.log(`craft  : ${report.craft.length}`);
  console.log(`mv     : ${report.mv.length}`);
  if (report.skipped.length > 0) {
    console.log(`skipped: ${report.skipped.length}`);
    for (const s of report.skipped) console.log(`  - ${s}`);
  }
}

await main();

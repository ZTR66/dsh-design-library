import { buildIndex } from './lib/scan.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root = join(process.cwd(), 'data');
const idx = await buildIndex([root], { seedRoot: root });
const videos = idx.entries.filter(e=>e.kind==='video');
console.log('styles:', videos.length);
const fam = {};
for (const v of videos) { const f=(v.family||v.meta?.family||'?'); fam[f]=(fam[f]??0)+1; }
console.log('sample entry:', JSON.stringify(videos[0], null, 1).slice(0,600));

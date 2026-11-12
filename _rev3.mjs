import { buildIndex } from './lib/scan.js';
import { buildReview } from './lib/review.js';
import { join } from 'node:path';
const root = join(process.cwd(), 'data');
const idx = await buildIndex([root], { seedRoot: root });
const designs = idx.entries.filter(e=>e.kind==='design');
const out = [];
for (const d of designs) {
  const r = await buildReview(idx, { designId: d.id });
  const n = (r.findings ?? []).length;
  if (n > 0) out.push({ id: d.id, n, kinds: [...new Set((r.findings??[]).map(f=>f.kind))].join(',') });
}
out.sort((a,b)=>b.n-a.n);
console.log('designs with findings:', out.length, '/', designs.length);
console.log(out.slice(0,15).map(o=>`${o.n}\t${o.kinds}\t${o.id}`).join('\n'));

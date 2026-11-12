import { buildIndex } from './lib/scan.js';
import { join } from 'node:path';
const root = join(process.cwd(), 'data');
const idx = await buildIndex([root], { seedRoot: root });
const designs = idx.entries.filter(e=>e.kind==='design');
console.log('designs:', designs.length);
// find ones with a structured palette and lots of on-* pairs
const scored = designs.map(d => {
  const c = d.document?.colors ?? {};
  const onPairs = Object.keys(c).filter(k=>k.startsWith('on-'));
  return { id: d.id, name: d.name, colors: Object.keys(c).length, onPairs: onPairs.length };
}).sort((a,b)=>b.colors-a.colors);
console.log(scored.slice(0,12).map(s=>`${s.colors}\t${s.onPairs}\t${s.id}`).join('\n'));

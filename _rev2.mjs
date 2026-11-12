import { buildIndex } from './lib/scan.js';
import { buildReview } from './lib/review.js';
import { join } from 'node:path';
const root = join(process.cwd(), 'data');
const idx = await buildIndex([root], { seedRoot: root });
for (const id of ['voltagent-awesome-design-md/design-md/notion/DESIGN','voltagent-awesome-design-md/design-md/raycast/DESIGN','voltagent-awesome-design-md/design-md/vercel/DESIGN','voltagent-awesome-design-md/design-md/mongodb/DESIGN']) {
  const r = await buildReview(idx, { designId: id });
  console.log('###', id);
  console.log(JSON.stringify(r.findings?.slice(0,4) ?? r, null, 1).slice(0, 1200));
  console.log('notes:', JSON.stringify(r.notes));
  console.log('');
}

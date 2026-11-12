import { buildIndex } from './lib/scan.js';
import { buildReview } from './lib/review.js';
import { join } from 'node:path';
const root = join(process.cwd(), 'data');
const idx = await buildIndex([root], { seedRoot: root });
for (const id of ['xdx888999-xdx-lab-design-skill/references/styles/05-fintech-clean-DESIGN','voltagent-awesome-design-md/design-md/airbnb/DESIGN','voltagent-awesome-design-md/design-md/claude/DESIGN','voltagent-awesome-design-md/design-md/cursor/DESIGN']) {
  const r = await buildReview(idx, { designId: id });
  console.log('###', id);
  for (const f of r.findings ?? []) console.log(' -', f.kind, '|', f.foreground ?? f.bestForeground, 'on', f.background, '=', f.ratio, 'need', f.required);
  console.log('');
}

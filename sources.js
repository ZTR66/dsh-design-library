/**
 * sources.json — every upstream this seed pack was built from.
 *
 * The build (scripts/sync.mjs) reads this file, clones or reads each source,
 * deduplicates by content hash, and then keeps ONLY the documents whose source
 * license is in `redistributable`. `excluded` names sources that are real and
 * useful but whose license does not permit bundling their text into a package;
 * they are surfaced to the user as external links instead of content.
 *
 * Keep this file in sync with PROVENANCE.md: the guard script cross-checks the
 * two before any publish.
 */

import { fileURLToPath } from 'node:url';

export const REDISTRIBUTABLE = ['MIT', 'Apache-2.0'];

/**
 * Local checkout the seed pack is built from.
 *
 * Read from the environment rather than hard-coded: the path is one developer's
 * machine, and shipping it in a published package leaks a home directory that
 * means nothing to anyone else. `sync.mjs` only runs from a checkout, so the
 * fallback keeps a fresh clone working after the sources have been fetched.
 */
export const CHECKOUT = process.env.DSH_DESIGN_SKILLS_DIR
  ?? fileURLToPath(new URL('./.sources/', import.meta.url));

/**
 * Every source repository.
 *
 *   dir      local directory name under CHECKOUT
 *   repo     GitHub owner/name
 *   license  detected LICENSE kind; `custom` and `none` are never bundled
 *   bundle   whether its documents go into data/
 */
export const SOURCES = [
  // ---- four requested sources -------------------------------------------------
  {
    dir: 'voltagent-awesome-design-md',
    repo: 'VoltAgent/awesome-design-md',
    license: 'MIT',
    bundle: true,
    note: 'The canonical brand DESIGN.md collection; newest and most complete copy of the shared corpus.',
  },
  {
    dir: 'xdx888999-xdx-lab-design-skill',
    repo: 'xdx888999/xdx-lab-design-skill',
    license: 'MIT',
    bundle: true,
    note: 'Chinese design-style system: 50 styles, 21 master methodologies, 120+ style knowledge base.',
  },
  {
    dir: 'rahulholkar16-awesome-design-md',
    repo: 'rahulholkar16/awesome-design-md',
    license: 'MIT',
    bundle: true,
    note: 'Upstream HEAD is a stub; the documents bundled here were recovered from git history (commit ef729b2).',
  },
  {
    dir: 'abhayjnayakk-awesome-design-md',
    repo: 'abhayjnayakk/awesome-design-md',
    license: 'MIT',
    bundle: true,
    note: 'Adds a workflow layer: guides, prompts, examples, style taxonomy alongside the upstream corpus.',
  },

  // ---- additional sources ------------------------------------------------------
  {
    dir: '_other/changemaner-design-taste-frontend',
    repo: 'changemaner/design-taste-frontend',
    license: 'MIT',
    bundle: true,
    note: 'Anti-slop frontend taste skill with 30 brand DESIGN.md files plus tokens and theme CSS.',
  },
  {
    dir: '_other/cozythecoder-frontend-design-md',
    repo: 'Cozythecoder/frontend-design-md',
    license: 'MIT',
    bundle: true,
    note: '60 site-derived DESIGN.md systems and 6 skills including motion, dataviz and SVG.',
  },
  {
    dir: '_other/davidgarciagordo-design-review',
    repo: 'davidgarciagordo/design-review',
    license: 'MIT',
    bundle: true,
    note: 'Design-vitality review orchestrator producing an alive/templated/flat verdict.',
  },
  {
    dir: '_other/donkeyking01-tasteful-ui-skill',
    repo: 'DonkeyKing01/tasteful-ui-skill',
    license: 'MIT',
    bundle: true,
    note: 'Taste-first product UI design with reference routing and variation comparison.',
  },
  {
    dir: '_other/jaywilburn-refactoring-ui-skill',
    repo: 'jaywilburn/refactoring-ui-skill',
    license: 'MIT',
    bundle: true,
    note: 'Refactoring UI principles applied: color, hierarchy, typography, spacing, responsive.',
  },
  {
    dir: '_other/lottiefiles-motion-design-skill',
    repo: 'LottieFiles/motion-design-skill',
    license: 'MIT',
    bundle: true,
    note: 'Motion design principles: timing, easing, choreography, Disney rules adapted to UI.',
  },
  {
    dir: '_other/paldom-icon-designer-skills',
    repo: 'Paldom/icon-designer-skills',
    license: 'MIT',
    bundle: true,
    note: 'Icon pipeline: brief, draw, critique, export, with eval checks.',
  },
  {
    dir: '_other/skydashnet-material-design-3-ui-skill',
    repo: 'skydashnet/material-design-3-ui-skill',
    license: 'MIT',
    bundle: true,
    note: 'Material Design 3 / Material You specification and review references.',
  },
  {
    dir: '_other/solinkz-micro-interactions-skill',
    repo: 'solinkz/micro-interactions-skill',
    license: 'MIT',
    bundle: true,
    note: 'Micro-interaction architecture: Saffer framework, gesture feedback, spring physics.',
  },
  {
    dir: '_other/superdesigndev-superdesign-skill',
    repo: 'superdesigndev/superdesign-skill',
    license: 'MIT',
    bundle: true,
    note: 'Canvas design skill for pages, slide decks and graphics.',
  },
  {
    dir: '_other/woodytest-eng2025-design-skills',
    repo: 'Woodytest-eng2025/design-skills',
    license: 'MIT',
    bundle: true,
    note: 'Eight skills for typography, color, icons, hand-drawn style and component systems.',
  },
  {
    dir: '_other/yuvrajangadsingh-brand-skills',
    repo: 'yuvrajangadsingh/brand-skills',
    license: 'Apache-2.0',
    bundle: true,
    note: 'Five brand design systems (Anthropic, Vercel, Tailwind, shadcn, Mintlify) with DESIGN.md references.',
  },

  // ---- evaluated but NOT distributable -----------------------------------------
  {
    dir: '_other/master5d-claude-design-skills',
    repo: 'master5d/claude-design-skills',
    license: 'none',
    bundle: false,
    note: 'Six design skills including motion philosophy and baseline UI. No LICENSE file: all rights reserved, so its text cannot be bundled.',
  },
  {
    dir: '_other/simota-design-skills',
    repo: 'simota/design-skills',
    license: 'none',
    bundle: false,
    note: 'Seven focused skills: tokens, critique, motion, a11y, ux, direction, review. No LICENSE file, so its text cannot be bundled.',
  },
  {
    dir: '_other/kubai087-kubai-icons',
    repo: 'kubai087/kubai-icons',
    license: 'custom',
    bundle: false,
    note: 'Source-available custom license; clause 3(b) forbids redistributing SKILL.md or PROMPT.md text as a skill, prompt or template.',
  },
];

/** Sources shown to the user as external links only. */
export const EXTERNAL = SOURCES.filter((source) => !source.bundle);

/** Sources whose documents ship inside this package. */
export const BUNDLED = SOURCES.filter((source) => source.bundle);

export function licenseOf(dir) {
  const source = SOURCES.find((item) => item.dir === dir);
  return source ? source.license : 'none';
}

export function repoOf(dir) {
  const source = SOURCES.find((item) => item.dir === dir);
  return source ? source.repo : 'unknown/unknown';
}

/** True when a document from `dir` may be redistributed inside this package. */
export function mayBundle(dir) {
  const source = SOURCES.find((item) => item.dir === dir);
  return source !== undefined && source.bundle === true && REDISTRIBUTABLE.includes(source.license);
}

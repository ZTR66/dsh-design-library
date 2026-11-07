/**
 * Host half of dsh-design-library.
 *
 * Three capabilities share one index:
 *
 *   - design skills registered into the skill catalogue, so the model can pick
 *     one by itself without being told;
 *   - design_search / design_read / design_review tools, so the model can look a
 *     system up and check its own output against it;
 *   - a panel plus read-only routes for the browser half.
 *
 * Failure policy, learned the hard way from plugins that bricked a profile: the
 * host's startup is all-or-nothing, so a plugin that throws — or awaits forever —
 * in `apply` takes the whole application down with it, including the UI that
 * would have let the user disable it. Every optional capability here is probed
 * with `ctx.get()`, every registration is wrapped, and the whole body runs under
 * a timeout. The worst outcome this plugin is allowed to produce is "the design
 * library is unavailable", never "the app will not start".
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildIndex, cachedIndex, loadSeedIndex, publicEntry } from './lib/scan.js';
import { buildReview } from './lib/review.js';
import { registerRoutes, searchEntries } from './lib/routes.js';
import { readSettings, writeSettings } from './lib/settings.js';
import { EXTERNAL } from './sources.js';

export const name = 'dsh-design-library';

/** Only the web server is declared: without it there is no panel and no point. */
export const inject = ['webServer'];

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED_ROOT = join(HERE, 'data');
const MAX_DOC_BYTES = 200 * 1024;
const APPLY_TIMEOUT_MS = 15_000;

/**
 * Curated skills, advertised to the model by default.
 *
 * A curated set rather than all 34 because the skill catalogue is scarce prompt
 * space billed on every request. These are distinct capabilities — aesthetic
 * direction, motion, micro-interaction, review, icons, brand systems — rather
 * than variations on one theme. Users switch to `all` or `off` in settings.
 */
const CURATED = [
  'design-taste-frontend',
  'frontend-design-md',
  'tasteful-ui',
  'refactoring-ui',
  'design-review',
  'motion-design',
  'micro-interactions',
  'icon-designer',
  'superdesign',
  'anthropic-brand',
];

function toKebab(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function shortSource(folder) {
  const parts = String(folder ?? '').split(/[-_]/);
  return toKebab(parts[0] ?? 'design') || 'design';
}

/** Best-effort logger: a context without a logger is not an error. */
function log(ctx, level, message) {
  try {
    ctx?.logger?.[level]?.(`[design-library] ${message}`);
  }
  catch { /* logging must never be the thing that throws */ }
}

/**
 * Bound a promise so a hung registration cannot hang the host's startup.
 *
 * The host boots all-or-nothing and awaits every plugin's `apply`; a promise
 * that never settles here would leave the application on its splash screen with
 * no way to disable the plugin. Timing out turns that into a logged warning.
 */
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    timer.unref?.();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {object} config loader row config
 */
export async function apply(ctx, config) {
  try {
    return await withTimeout(registerAll(ctx, config ?? {}), APPLY_TIMEOUT_MS, 'registerAll');
  }
  catch (error) {
    log(ctx, 'error', `failed to load: ${error?.stack ?? error}`);
    // DSH_DESIGN_DEBUG=1 surfaces the failure instead of degrading quietly,
    // which is what you want while developing the plugin.
    if (process.env.DSH_DESIGN_DEBUG) throw error;
    return () => {};
  }
}

async function registerAll(ctx, config) {
  const disposers = [];

  const extraRoots = Array.isArray(config.roots) ? config.roots.map(String) : [];
  const scanRoots = [SEED_ROOT, ...extraRoots];

  // The seed pack is immutable and pre-parsed at build time, so the common case
  // (no extra roots) needs no directory walk at all: one file read and the index
  // is ready. Extra roots still go through a live scan, and its result is merged
  // with the prebuilt entries.
  const getIndex = cachedIndex(async (force) => {
    const seedIndex = extraRoots.length === 0 && !force ? await loadSeedIndex(SEED_ROOT, readFile) : null;
    if (seedIndex !== null) return seedIndex;
    return buildIndex(scanRoots, {
      seedRoot: SEED_ROOT,
      remoteRoots: extraRoots,
      maxEntries: Number(config.maxEntries ?? 5000),
    });
  });

  // Warm the cache so the panel's first open does not wait on 290 file reads.
  getIndex().catch((error) => log(ctx, 'warn', `initial scan failed: ${String(error?.message ?? error)}`));

  // ---- routes -------------------------------------------------------------
  try {
    for (const dispose of registerRoutes(ctx, {
      getIndex,
      publicEntry,
      buildReview,
      // Settings: the panel reads and writes the plugin's own config row through
      // `configEditor`, which is the documented path for persisting a change.
      readSettings: () => readSettings(config),
      canWrite: () => ctx?.fiber?.entry !== undefined && ctx.get('configEditor') !== undefined,
      describeModes: (total) => {
        const curatedCount = CURATED.length;
        return {
          curated: `${curatedCount} / ${total}`,
          all: `${total} / ${total}`,
          off: `0 / ${total}`,
        };
      },
      writeSettings: (patch) => writeSettings(ctx, patch),
      external: EXTERNAL.map((source) => ({
        folder: String(source.dir).replace(/^_other\//, ''),
        repo: source.repo,
        license: source.license,
        note: source.note,
        url: `https://github.com/${source.repo}`,
      })),
    })) {
      disposers.push(dispose);
    }
  }
  catch (error) {
    log(ctx, 'warn', `routes unavailable: ${String(error?.message ?? error)}`);
  }

  // ---- tools --------------------------------------------------------------
  const tools = ctx.get('tools');
  if (tools !== undefined && typeof tools.register === 'function') {
    try {
      for (const spec of toolSpecs({ getIndex })) {
        disposers.push(tools.register(compileTool(spec)));
      }
      log(ctx, 'info', 'registered design_search, design_read, design_review');
    }
    catch (error) {
      log(ctx, 'warn', `tools unavailable: ${String(error?.message ?? error)}`);
    }
  }

  // ---- skill catalogue ----------------------------------------------------
  const skillsService = ctx.get('skills');
  const mode = config.skillMode ?? 'curated';
  if (skillsService !== undefined && typeof skillsService.register === 'function' && mode !== 'off') {
    try {
      const index = await getIndex();
      const wanted = new Set((config.enabledSkills ?? CURATED).map(toKebab));
      const disabled = new Set((config.disabledSkills ?? []).map(toKebab));
      const used = new Set();
      let registered = 0;
      for (const entry of index.entries) {
        if (entry.kind !== 'skill') continue;
        // The catalogue name comes from the skill's own name, not its path:
        // a bare `SKILL.md` would otherwise register as `...-skill`, which
        // tells the model nothing about what it loads.
        const display = toKebab(entry.name);
        const fromPath = toKebab(entry.id.split('/').filter((part) => part.toLowerCase() !== 'skill').pop() ?? '');
        const base = display !== '' && display !== 'skill' ? display : (fromPath || 'design-skill');
        if (mode === 'curated' && !wanted.has(base) && !wanted.has(display) && !wanted.has(fromPath)) continue;
        if (disabled.has(base) || disabled.has(display) || disabled.has(fromPath)) continue;

        // Deterministic de-duplication: the catalogue is first-wins on a
        // duplicate name, so a collision would silently hide a skill.
        let skillName = `design-${shortSource(entry.folder)}-${base}`;
        let suffix = 2;
        while (used.has(skillName)) {
          skillName = `design-${shortSource(entry.folder)}-${base}-${suffix}`;
          suffix += 1;
        }
        used.add(skillName);

        disposers.push(skillsService.register({
          name: skillName.slice(0, 64),
          description: (entry.description || entry.name).slice(0, 1000),
          whenToUse: `Use when the task needs interface design guidance in the spirit of ${entry.name}.`,
          source: 'custom',
          path: entry.path,
          content: '',
          invocation: { modelInvocable: true, userInvocable: false },
        }));
        registered += 1;
      }
      log(ctx, 'info', `registered ${registered} design skills (mode: ${mode})`);
    }
    catch (error) {
      log(ctx, 'warn', `skill registration failed: ${String(error?.message ?? error)}`);
    }
  }

  return () => {
    for (const dispose of disposers.reverse()) {
      try {
        dispose?.();
      }
      catch { /* an already-unwound registration is not an error here */ }
    }
    disposers.length = 0;
  };
}

// ---------------------------------------------------------------------------
// Tool specs (no `defineTool`: it compiles these into registrable definitions)
// ---------------------------------------------------------------------------

function text(value) {
  return { schema: { type: 'string' }, render: () => [{ type: 'text', text: value }] };
}

/**
 * Compile one tool spec into a registrable definition.
 *
 * `ctx.tools.register` takes a plain `ToolDefinition`: a schema, an output
 * declaration and an `execute`. The host's `defineTool` helper adds type-level
 * sugar and runtime validation, but importing it means resolving a host package
 * from inside a plugin, which fails whenever the loader's module paths differ
 * from the plugin's — the error mode is "tools silently unavailable". The
 * definitions below are already in the shape the registry wants, so they are
 * registered directly and a missing package can never disable them.
 *
 * Output schemas are `string` because every tool renders text: the value the
 * model reads *is* the text, so there is nothing to lose by declaring it
 * directly.
 */
function compileTool(spec) {
  return {
    name: spec.name,
    description: spec.description,
    parameters: spec.parameters,
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: String(value ?? '') }],
    },
    async execute(args) {
      try {
        return await spec.execute(args ?? {});
      }
      catch (error) {
        // A tool that throws ends the step with a stack trace in the log. A
        // tool that returns its failure as text lets the model read it and try
        // something else, which is almost always what the user wants.
        return `${spec.name} failed: ${String(error?.message ?? error)}`;
      }
    },
    timeoutMs: 30_000,
    isConcurrencySafe() {
      return true;
    },
  };
}

function toolSpecs({ getIndex }) {
  return [
    {
      name: 'design_search',
      description: [
        'Search the local design library: 256 design systems (DESIGN.md) and the design skills bundled with this plugin.',
        'Each result carries an `id` to pass to design_read or design_review.',
        '',
        'Use it before building any interface, so colors, type scales and spacing are chosen deliberately instead',
        'of invented. Filter with `repo` when the user names a source, or `kind` to search design systems or skills',
        'only. `query` matches name, description and source; every term must match.',
      ].join('\n'),
      parameters: {
        query: { type: 'string', description: 'Free-text terms; every term must match. Omit to list everything.' },
        repo: { type: 'string', description: 'Restrict to one source folder, e.g. "voltagent-awesome-design-md".' },
        kind: { type: 'string', enum: ['design', 'skill'], description: 'Search design systems or skills only.' },
        limit: { type: 'number', description: 'Maximum results, 1-50. Defaults to 20.' },
      },
      output: { schema: { type: 'string' }, render: (args, value) => [{ type: 'text', text: value }] },
      async execute(args) {
        const index = await getIndex(false);
        let pool = index.entries;
        if (typeof args?.repo === 'string' && args.repo !== '') {
          pool = pool.filter((entry) => entry.folder === args.repo);
        }
        if (args?.kind === 'design' || args?.kind === 'skill') {
          pool = pool.filter((entry) => entry.kind === args.kind);
        }
        const limit = Math.max(1, Math.min(50, Number(args?.limit ?? 20)));
        const matches = searchEntries(pool, args?.query ?? '', limit);

        const lines = [
          `${index.total} entries indexed (${index.stats.designs} design systems, ${index.stats.skills} skills).`,
          `${matches.length} match(es):`,
          '',
        ];
        for (const entry of matches) {
          const projected = publicEntry(entry);
          const palette = projected.colors ? Object.keys(projected.colors).length : (projected.extracted?.colors?.length ?? 0);
          lines.push(`- id: ${projected.id}`);
          lines.push(`  name: ${projected.name}`);
          lines.push(`  kind: ${projected.kind}, source: ${projected.folder}, colors: ${palette}, type roles: ${projected.typography?.length ?? 0}`);
          if (projected.description !== '') lines.push(`  about: ${projected.description.slice(0, 300)}`);
        }
        if (matches.length === 0) {
          lines.push('Nothing matched. Try a broader query, or omit `query` to list entries and filter further.');
        }
        return lines.join('\n');
      },
    },
    {
      name: 'design_read',
      description: [
        'Read one design system or design skill from the local library by its `id` (from design_search).',
        '',
        '`part: "tokens"` returns only the structured palette, type scale, spacing and radius — the fastest way to',
        'get exact values to build with. `part: "sections"` lists headings so you can find the part that matters.',
        'The default `full` returns the document body, truncated past 200 KB.',
      ].join('\n'),
      parameters: {
        id: { type: 'string', required: true, description: 'Entry id from design_search.' },
        part: { type: 'string', enum: ['full', 'tokens', 'sections'], description: 'Which part to return. Defaults to full.' },
      },
      output: { schema: { type: 'string' }, render: (args, value) => [{ type: 'text', text: value }] },
      async execute(args) {
        const index = await getIndex(false);
        const entry = index.entries.find((candidate) => candidate.id === args?.id);
        if (entry === undefined) {
          return `Unknown design id: ${args?.id ?? '(empty)'}. Call design_search first to get a valid id.`;
        }
        const document = entry.document;

        if (args?.part === 'tokens') {
          const parts = [`# ${entry.name}`, `source: ${entry.folder}`, ''];
          const colors = document.colors;
          if (colors !== undefined) {
            parts.push('## Colors');
            for (const [token, value] of Object.entries(colors)) parts.push(`- ${token}: ${value}`);
            parts.push('');
          }
          else if (document.extracted?.colors !== undefined) {
            parts.push('## Colors mentioned in the text (not a declared palette)');
            parts.push(document.extracted.colors.join(', '));
            parts.push('');
          }
          const typography = document.typography;
          if (typography !== undefined && typography.length > 0) {
            parts.push('## Typography');
            for (const row of typography) {
              const fields = Object.entries(row).filter(([key]) => key !== 'role').map(([key, value]) => `${key}=${value}`).join(' ');
              parts.push(`- ${row.role}: ${fields}`);
            }
            parts.push('');
          }
          if (document.spacing !== undefined) {
            parts.push('## Spacing');
            for (const [name, value] of Object.entries(document.spacing)) parts.push(`- ${name}: ${value}`);
            parts.push('');
          }
          if (document.rounded !== undefined) {
            parts.push('## Radius');
            for (const [name, value] of Object.entries(document.rounded)) parts.push(`- ${name}: ${value}`);
            parts.push('');
          }
          if (parts.length <= 3) parts.push('This document declares no structured tokens; request `part: "full"` to read the prose.');
          return parts.join('\n');
        }

        if (args?.part === 'sections') {
          const sections = document.sections ?? [];
          if (sections.length === 0) return `# ${entry.name}\n\nThis document has no section headings.`;
          return [`# ${entry.name}`, ''].concat(sections.map((section) => `${'#'.repeat(section.level)} ${section.title}`)).join('\n');
        }

        let content;
        try {
          content = await readFile(entry.path, 'utf8');
        }
        catch (error) {
          return `Cannot read ${entry.id}: ${String(error?.message ?? error)}`;
        }
        let truncated = false;
        if (Buffer.byteLength(content, 'utf8') > MAX_DOC_BYTES) {
          content = content.slice(0, MAX_DOC_BYTES);
          truncated = true;
        }
        const header = [`<!-- id: ${entry.id} · source: ${entry.folder} · kind: ${entry.kind} -->`, ''];
        if (truncated) header.push('<!-- truncated at 200 KB -->', '');
        return header.concat(content).join('\n');
      },
    },
    {
      name: 'design_review',
      description: [
        'Check work against one design system and return computed findings, not opinions.',
        '',
        'It measures WCAG contrast between the system\'s own color tokens, and when you pass `target` (a workspace',
        'file) or `snippets` it reports color literals that are not in the palette, font families outside the',
        'declared set, and radii off the declared scale — each with the line number where it appears.',
        '',
        'Run this after writing UI and before saying it is finished. Fix what it reports; do not argue with it.',
      ].join('\n'),
      parameters: {
        designId: { type: 'string', required: true, description: 'Entry id of the design system to review against.' },
        target: { type: 'string', description: 'Workspace file to check, e.g. "src/app.css" or "index.html".' },
        snippets: { type: 'array', items: { type: 'string' }, description: 'Code fragments to check when there is no file to point at.' },
      },
      output: { schema: { type: 'string' }, render: (args, value) => [{ type: 'text', text: value }] },
      async execute(args) {
        const index = await getIndex(false);
        const review = await buildReview(index, {
          designId: args?.designId,
          target: args?.target,
          snippets: args?.snippets,
        });
        if (review.ok === false) {
          return `${review.error}\n\nTry one of:\n${(review.available ?? []).map((id) => `- ${id}`).join('\n')}`;
        }
        const lines = [
          `# Review against ${review.design.name}`,
          `${review.design.id} · source: ${review.design.repo} · palette: ${review.design.paletteSize} colors · type roles: ${review.design.typographyRoles}`,
          '',
          `errors: ${review.summary.errors}, warnings: ${review.summary.warnings}, notes: ${review.summary.notes}`,
          '',
        ];
        if (review.findings.length === 0) {
          lines.push('No computed problems found.');
        }
        else {
          lines.push('## Findings');
          for (const finding of review.findings) {
            lines.push(`- [${finding.severity}] ${finding.message}`);
          }
        }
        if (review.notes.length > 0) {
          lines.push('', '## Notes');
          for (const note of review.notes) lines.push(`- ${note}`);
        }
        return lines.join('\n');
      },
    },
  ];
}

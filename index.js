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

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildIndex, cachedIndex, loadSeedIndex, publicEntry } from './lib/scan.js';
import { buildReview } from './lib/review.js';
import { checkLayout, formatLayoutReport } from './lib/layout.js';
import { registerRoutes, searchEntries } from './lib/routes.js';
import { checkVideoEnvironment } from './lib/videoenv.js';
import { videoGuideSpec } from './lib/guide-tool.js';
import { readSettings, writeSettings } from './lib/settings.js';
import { EXTERNAL } from './sources.js';

export const name = 'dsh-design-library';

/** Only the web server is declared: without it there is no panel and no point. */
export const inject = ['webServer'];

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED_ROOT = join(HERE, 'data');

/**
 * The video style catalogue, parsed once and kept.
 *
 * `catalog.json` ships with the package and never changes at runtime, so reading
 * it on every search would be pure waste. A failed read returns null rather than
 * throwing: a missing style library should not stop the design tools working.
 */
let shotCatalogPromise;
function loadShotCatalog() {
  if (shotCatalogPromise === undefined) {
    shotCatalogPromise = readFile(join(SEED_ROOT, 'video-styles', 'shots', 'library.json'), 'utf8')
      .then((text) => JSON.parse(text))
      .catch(() => null);
  }
  return shotCatalogPromise;
}

let videoCatalogPromise;
function loadVideoCatalog() {
  if (videoCatalogPromise === undefined) {
    videoCatalogPromise = readFile(join(SEED_ROOT, 'video-styles', 'catalog.json'), 'utf8')
      .then((text) => JSON.parse(text))
      .catch(() => null);
  }
  return videoCatalogPromise;
}
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
    videoGuideSpec({ loadVideoCatalog, loadShotCatalog }),
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

    // ---- video styles -----------------------------------------------------
    {
      name: 'video_style_search',
      description: [
        'Search 44 video style specifications: concrete looks for code-rendered films — 古风, 粉笔黑板,',
        '星空光点, 像素, 木刻, 霓虹赛博 and so on. Each entry carries exact hex values, fonts, motion timings',
        'and the list of things you must not change.',
        '',
        'Use it when the user wants a video rather than a UI. `query` matches name, the one-line summary and',
        'the style keywords (which include topic words like 历史, 数学, 宇宙, 游戏). Filter by `family` to stay',
        'in one visual family, or `tier` to avoid styles that need generated imagery.',
      ].join('\n'),
      parameters: {
        query: { type: 'string', description: 'Free-text terms; every term must match. Omit to list all.' },
        family: { type: 'string', description: 'One of: 东方, 暗场概念, 明亮流行, 印刷与纸, 图解与设计, 剪辑与纪实, 电影感, 游戏.' },
        tier: { type: 'string', enum: ['基础', '增强'], description: '基础 renders from code alone; 增强 needs generated imagery.' },
        limit: { type: 'number', description: 'Maximum results, 1-44. Defaults to 12.' },
      },
      output: { schema: { type: 'string' }, render: (args, value) => [{ type: 'text', text: value }] },
      async execute(args) {
        const catalog = await loadVideoCatalog();
        if (catalog === null) {
          return 'The video style library is missing from this installation. Reinstall the plugin.';
        }
        // Scoring, not filtering. The previous version required every term to appear
        // (`terms.every`), so a natural multi-word query like "高级 质感 界面 科技"
        // returned nothing even though each word matched a different style. Scoring
        // ranks partial matches instead of discarding them.
        const terms = String(args?.query ?? '').toLowerCase().split(/[\s,，、]+/).filter(Boolean);
        const limit = Math.max(1, Math.min(44, Number(args?.limit ?? 12)));

        const scored = [];
        for (const style of catalog.styles) {
          if (args?.family !== undefined && args.family !== '' && style.fam !== args.family) continue;
          if (args?.tier !== undefined && args.tier !== '' && style.tier !== args.tier) continue;
          const haystack = [style.name, style.en, style.one, style.fit, style.fam, style.cat, (style.keywords ?? []).join(' ')]
            .join('\n').toLowerCase();
          let score = 0;
          let hits = 0;
          for (const term of terms) {
            if (!haystack.includes(term)) continue;
            hits += 1;
            if (String(style.name ?? '').toLowerCase().includes(term)) score += 30;
            if ((style.keywords ?? []).some((k) => String(k).toLowerCase() === term)) score += 20;
            else if ((style.keywords ?? []).some((k) => String(k).toLowerCase().includes(term))) score += 8;
            if (String(style.fit ?? '').toLowerCase().includes(term)) score += 10;
            score += 1;
          }
          // A style must match at least one term — OR across terms, not AND.
          if (terms.length > 0 && hits === 0) continue;
          scored.push({ style, score });
        }
        scored.sort((a, b) => b.score - a.score);

        if (scored.length === 0) {
          return `No style matched ${JSON.stringify(args?.query ?? '')}. Families: ${catalog.families.join('、')}.`;
        }

        const lines = [`${catalog.styles.length} styles in the library; ${scored.length} match.`, ''];
        for (const { style } of scored.slice(0, limit)) {
          lines.push(`- key: ${style.key}`);
          lines.push(`  name: ${style.name} (${style.en}) · ${style.fam} · ${style.tier}档`);
          lines.push(`  look: ${style.one}`);
          lines.push(`  fits: ${style.fit}`);
          lines.push(`  templates: ${(style.templates ?? []).join('/')}`);
        }
        lines.push('', 'Read one with video_style_read({ key }).');
        return lines.join('\n');
      },
    },
    {
      name: 'video_style_read',
      description: [
        'Read one video style specification, or one of the shared craft documents.',
        '',
        '`part: "spec"` (default) returns the style itself: palette with exact hex values, typography,',
        'motion timing, camera grammar, and the three constraint lists (what you may change, what changes',
        'the flavour, what you must not touch).',
        '`part: "craft"` returns a shared method document such as visual-grammar (sentence → shot),',
        'quality-gate (how to inspect a cut), or structure-bible (narrative shape).',
        '`part: "mv"` returns the music-video workflow documents.',
      ].join('\n'),
      parameters: {
        key: { type: 'string', required: true, description: 'Style key from video_style_search, or a craft/mv document id.' },
        part: { type: 'string', enum: ['spec', 'craft', 'mv'], description: 'Which library to read from. Defaults to spec.' },
      },
      output: { schema: { type: 'string' }, render: (args, value) => [{ type: 'text', text: value }] },
      async execute(args) {
        const key = String(args?.key ?? '').trim();
        if (key === '') return 'key is required.';
        const part = args?.part ?? 'spec';

        if (part === 'spec') {
          const index = await getIndex(false);
            // 库内风格的 id 以 /STYLE 结尾（video-styles/styles/aurora/STYLE）；
            // 外部风格是单文件，id 就是文件名（video-styles/styles-external/claymation）。
            // 只认 /STYLE 会让 guide 里列出的 22 个外部风格一个都读不到。
            const entry = index.entries.find((e) => e.kind === 'video' && (
              e.id.endsWith(`/${key}/STYLE`)
              || e.id === key
              || e.id.endsWith(`/styles-external/${key}`)
            ));
          if (entry === undefined) {
            const catalog = await loadVideoCatalog();
            const keys = catalog?.styles?.map((s) => s.key) ?? [];
              const external = index.entries
                .filter((e) => e.kind === 'video' && e.id.includes('/styles-external/'))
                .map((e) => e.id.split('/').pop());
            return `Unknown style "${key}". Try: ${[...keys.slice(0, 20), ...external.slice(0, 10)].join(', ')}…`;
          }
          let content;
          try {
            content = await readFile(entry.path, 'utf8');
          }
          catch (error) {
            return `Cannot read ${entry.id}: ${String(error?.message ?? error)}`;
          }
          const d = entry.document;
          const head = [
              // 外部风格没有 family，tier 是「外部」；头部也要能读出信息，
              // 否则就是一行空的 <!-- name ·  ·  -->。
              `<!-- ${entry.name}${d.family ? ` · ${d.family}` : ""}${d.tier ? ` · ${d.tier}` : ""}${entry.id.includes("/styles-external/") ? " · 来源 carl-motion (MIT)" : ""} -->`,
            d.colors ? `<!-- palette: ${d.colors.join(' ')} -->` : '',
            '',
          ].filter(Boolean);
          return head.concat(content).join('\n');
        }

        const dir = part === 'craft' ? 'craft' : 'mv';
        const dirPath = join(HERE, 'data', 'video-styles', dir);
        let files;
        try {
          files = await readdir(dirPath);
        }
        catch {
          return `The ${dir} documents are missing from this installation.`;
        }
        const file = key.endsWith('.md') ? key : `${key}.md`;
        if (!files.includes(file)) {
          return `Unknown ${dir} document "${key}". Available: ${files.join(', ')}`;
        }
        return await readFile(join(dirPath, file), 'utf8');
      },
    },
    {
      name: 'video_shot_search',
      description: [
        'Search 124 shot recipe cards — the concrete moves a film is built from, as opposed to the overall',
        'look a style gives you. Each card states when to use it, how long it runs, its energy level, the',
        'intention behind it, and a parameter table with the values that actually matter.',
        '',
        'Categories: opening (11), typography (22), ui-entrance (21), camera (10), data (5),',
        'interaction (11), transition (15), rhythm (8), effects (15), outro (6).',
        '',
        'Use this when a style alone is not enough — when you know the film should feel a certain way but',
        'not what happens in a given second. Search by what the shot does, not by what it looks like.',
      ].join('\n'),
      parameters: {
        query: { type: 'string', description: 'Free-text terms; every term must match name, summary, intent or tags.' },
        category: { type: 'string', description: 'opening | typography | ui-entrance | camera | data | interaction | transition | rhythm | effects | outro' },
        limit: { type: 'number', description: 'Maximum results, 1-124. Defaults to 10.' },
      },
      output: { schema: { type: 'string' }, render: (args, value) => [{ type: 'text', text: value }] },
      async execute(args) {
        const index = await getIndex(false);
        const terms = String(args?.query ?? '').toLowerCase().split(/[\s,，、]+/).filter(Boolean);
        const limit = Math.max(1, Math.min(124, Number(args?.limit ?? 10)));

        const cards = index.entries.filter((entry) => entry.kind === 'shot');
        if (cards.length === 0) {
          return 'No shot cards are installed. Reinstall the plugin to restore them.';
        }

        // Scoring, not filtering — same reason as video_style_search: a query
        // like "grid 网格 干涉 摩尔纹 扫描 线" never has every word in one card,
        // so AND returned nothing. Each matching term now adds score.
        const scored = [];
        for (const card of cards) {
          const d = card.document ?? {};
          if (args?.category !== undefined && args.category !== '' && d.category !== args.category) continue;
          const haystack = [card.name, d.description, d.use, d.intention, d.category, (d.tags ?? []).join(' ')]
            .join('\n').toLowerCase();
          let score = 0;
          let hits = 0;
          for (const term of terms) {
            if (!haystack.includes(term)) continue;
            hits += 1;
            if (String(card.name).toLowerCase().includes(term)) score += 30;
            if ((d.tags ?? []).some((t) => String(t).toLowerCase() === term)) score += 20;
            if (String(d.use ?? '').toLowerCase().includes(term)) score += 12;
            score += 1;
          }
          if (terms.length > 0 && hits === 0) continue;
          scored.push({ card, score });
        }
        scored.sort((a, b) => b.score - a.score);

        if (scored.length === 0) {
          const categories = [...new Set(cards.map((c) => c.document?.category).filter(Boolean))];
          return `No shot matched ${JSON.stringify(args?.query ?? '')}. Categories: ${categories.join(', ')}.`;
        }

        const lines = [`${cards.length} shot cards installed; ${scored.length} match.`, ''];
        for (const { card } of scored.slice(0, limit)) {
          const d = card.document ?? {};
          lines.push(`- name: ${card.name}`);
          lines.push(`  category: ${d.category ?? '—'} · ${d.duration ?? ''} · energy ${d.energy ?? '—'}`);
          lines.push(`  what: ${d.description ?? ''}`);
          lines.push(`  use when: ${d.use ?? ''}`);
        }
        lines.push('', 'Read one with video_shot_read({ name }).');
        return lines.join('\n');
      },
    },
    {
      name: 'video_shot_read',
      description: [
        'Read one shot recipe card in full: the intention, the motion core with exact timings and easing,',
        'a parameter table with the adjustment each value makes, and the known pitfalls for that shot.',
        '',
        'This is the document that turns "make it feel premium" into frame numbers.',
      ].join('\n'),
      parameters: {
        name: { type: 'string', required: true, description: 'Card name from video_shot_search, e.g. basic-3d-scene.' },
      },
      output: { schema: { type: 'string' }, render: (args, value) => [{ type: 'text', text: value }] },
      async execute(args) {
        const name = String(args?.name ?? '').trim();
        if (name === '') return 'name is required.';
        const root = join(SEED_ROOT, 'video-styles', 'shots', 'cards');

        // The card sources are filed under references/shots/<category>/<name>.md,
        // so walk to the matching file rather than assuming one flat folder.
        const wanted = `${name}.md`;
        const findIn = async (dir, depth) => {
          if (depth > 4) return null;
          let items;
          try {
            items = await readdir(dir, { withFileTypes: true });
          }
          catch {
            return null;
          }
          for (const item of items) {
            if (item.isFile() && item.name === wanted) return join(dir, item.name);
          }
          for (const item of items) {
            if (!item.isDirectory()) continue;
            const found = await findIn(join(dir, item.name), depth + 1);
            if (found !== null) return found;
          }
          return null;
        };

        const file = await findIn(root, 0);
        if (file === null) {
          const catalog = await loadShotCatalog();
          const names = catalog?.cards?.map((c) => c.name) ?? [];
          return `Unknown shot "${name}". Try: ${names.slice(0, 15).join(', ')}…`;
        }
        return await readFile(file, 'utf8');
      },
    },
    {
      name: 'video_craft_read',
      description: [
        'Read any video method document by id: animation principles, shot planning, story spines, transition',
        'wording, camera-move checks, Manim reference scenes, and the craft documents shipped with the styles.',
        '',
        'Use `design_search` to find the id, then this to read it whole. The documents it returns are the ones',
        'that answer "how should this move" with numbers — durations, cubic-bezier curves, stagger offsets,',
        'spring configs — rather than with adjectives.',
      ].join('\n'),
      parameters: {
        id: { type: 'string', required: true, description: 'Entry id from design_search, e.g. video-styles/motion/animation-principles/SKILL.' },
      },
      output: { schema: { type: 'string' }, render: (args, value) => [{ type: 'text', text: value }] },
      async execute(args) {
        const wanted = String(args?.id ?? '').trim();
        if (wanted === '') return 'id is required.';
        const index = await getIndex(false);

        // Resolve an id written several plausible ways.
        //
        // A model that has not seen this library invents an id shape from the
        // folder names on disk — `video-styles/craft/structure-bible/SKILL` for a
        // document whose real id is `video-styles/something/structure-bible`. The
        // old matching only tried the exact id, a `/wanted` suffix and a bare
        // substring, so a path with one extra segment failed all three and the
        // reader gave up rather than reformulating.
        //
        // The additions are ordered from strict to loose: an exact id still wins,
        // and a name match only applies when the caller clearly aimed at a
        // section that exists.
        const craftLike = index.entries.filter(
          (entry) => entry.kind === 'craft' || entry.kind === 'video',
        );
        const normalise = (value) => String(value ?? '')
          .toLowerCase()
          .replace(/\\/g, '/')
          .replace(/\/skill\.md$/i, '')
          .replace(/\/skill$/i, '')
          .replace(/\/design\.md$/i, '')
          .replace(/\/+$/, '');
        const wantedNorm = normalise(wanted);
        const wantedSegments = wantedNorm.split('/').filter(Boolean);

        const match = index.entries.find((entry) => entry.id === wanted)
          ?? index.entries.find((entry) => normalise(entry.id) === wantedNorm)
          ?? index.entries.find((entry) => normalise(entry.id).endsWith('/' + wantedNorm))
          ?? index.entries.find((entry) => normalise(entry.id).includes(wantedNorm))
          // A guessed path usually has the right last segment: match on the
          // document's own folder name regardless of where it sits.
          ?? craftLike.find((entry) => {
            const last = wantedSegments[wantedSegments.length - 1];
            return last !== undefined && last !== '' && normalise(entry.id).endsWith('/' + last);
          })
          // The id was guessed but the title is right — let the name decide.
          ?? craftLike.find((entry) => {
            const nameSeg = String(entry.name ?? '').toLowerCase().replace(/\s+/g, '-');
            return nameSeg !== '' && wantedNorm.includes(nameSeg);
          });

        if (match === undefined) {
          // Say what a valid id looks like for THIS kind of document. Listing
          // only style ids taught a caller nothing about craft documents.
          const craftSample = craftLike
            .filter((entry) => entry.kind === 'craft')
            .slice(0, 6)
            .map((entry) => entry.id);
          const videoSample = craftLike
            .filter((entry) => entry.kind === 'video')
            .slice(0, 4)
            .map((entry) => entry.id);
          const hints = [];
          if (craftSample.length > 0) hints.push(`craft documents: ${craftSample.join(', ')}`);
          if (videoSample.length > 0) hints.push(`style documents: ${videoSample.join(', ')}`);
          return [
            `No document matched "${wanted}".`,
            '',
            'Ids come from design_search, not from folder paths on disk:',
            ...hints.map((line) => '- ' + line),
            '',
            'Call design_search({ kind: \'skill\' }) to list what is available.',
          ].join('\n');
        }
        if (/^video-styles\/shots\//.test(match.id)) {
          return `That is a shot card; read it with video_shot_read({ name: "${match.name}" }).`;
        }
        try {
          return await readFile(match.path, 'utf8');
        }
        catch (error) {
          return `Cannot read ${match.id}: ${String(error?.message ?? error)}`;
        }
      },
    },
    {
      name: 'video_env_check',
      description: [
        'Check whether this machine can render a video, and say exactly what is missing.',
        '',
        'NOT THE FIRST STEP. This only reports what the machine can do; it says nothing about what to make.',
        'If you have not yet chosen a style, a structure and the shots, call `video_guide` first — it carries',
        'the production protocol, and the environment matters only once you know what you are building.',
        'Checking the environment first makes the machine decide the content, which is backwards.',
        '',
        'Call it once the plan exists, to find out which parts of that plan this machine can actually execute.',
        'It reports, per pipeline stage: ffmpeg, a Chromium browser, the Playwright binding, image libraries,',
        'a voice engine, and beat-analysis tools. Missing items come with the exact install command.',
        '',
        'It also reports which Python interpreter holds which package — a script that narrates and renders',
        'in one pass fails when those live in different interpreters.',
      ].join('\n'),
      parameters: {},
      output: { schema: { type: 'string' }, render: (args, value) => [{ type: 'text', text: value }] },
      async execute() {
        const report = await checkVideoEnvironment();
        const lines = [
          `# Video environment — ${report.platform}`,
          '',
          // The description says this is not the first step; the output has to say
          // it too, because the model reads the result far more attentively than
          // the spec it agreed to before calling.
          '> **This is a capability report, not a plan. Two things come before it:**',
          '>',
          '> 1. **Ask the user** whether they want to approve the style, structure and shots, or want it all',
          '>    decided for them. Default to asking. "The user sounds impatient" is not a reason to skip it —',
          '>    they want the result sooner, not the question skipped, and a wrong style costs a full re-do.',
          '> 2. **Call `video_guide`** — it carries the production protocol and the library map.',
          '>',
          '> The environment check is meaningful once you know what you are building.',
          '',
        ];
        for (const [group, items] of Object.entries(report.groups)) {
          lines.push(`## ${group}`);
          for (const item of items) {
            const mark = item.ok ? 'ready' : (item.required ? 'MISSING' : 'optional');
            const bits = [`- ${item.name}: ${mark}`];
            if (item.version) bits.push(`(${item.version})`);
            if (item.python) bits.push(`in ${item.python}`);
            lines.push(bits.join(' '));
            if (!item.ok && item.install) lines.push(`  install: ${item.install}`);
            if (item.neededFor) lines.push(`  needed for: ${item.neededFor}`);
            if (item.note) lines.push(`  note: ${item.note}`);
          }
          lines.push('');
        }
        lines.push('## Can produce');
        for (const [kind, ok] of Object.entries(report.readyFor)) {
          lines.push(`- ${kind}: ${ok ? 'yes' : 'no'}`);
        }
        if (report.pythonConflict?.detected) {
          lines.push('', '## Python split', report.pythonConflict.detail, `advice: ${report.pythonConflict.advice}`);
        }
        if (report.nextStep) lines.push('', `## Next step`, report.nextStep);
        return lines.join('\n');
      },
    },
    {
      name: 'layout_check',
      description: [
        'Find overlapping boxes, elements outside the canvas, and text sitting on text.',
        '',
        'It measures rendered boxes in a real browser rather than parsing CSS, because "does this overlap"',
        'is a question about layout, not about declared styles: padding, negative margins, transforms,',
        'grid overlap and fixed positioning all change the answer, and a static read gets those wrong.',
        '',
        'Pass either a `target` (a file path or URL) or `html` (a snippet). Parent/child pairs are not',
        'reported as overlap — that is containment, not a collision — so what comes back is the pairs that',
        'are actually sharing space by accident.',
      ].join('\n'),
      parameters: {
        target: { type: 'string', description: 'File path or http(s) URL to load. Mutually exclusive with html.' },
        html: { type: 'string', description: 'HTML string to render instead of loading a target.' },
        viewport: {
          type: 'object',
          description: 'Viewport size. Defaults to 1280x900.',
          properties: { width: { type: 'number' }, height: { type: 'number' } },
        },
        padding: { type: 'number', description: 'Tolerance in px before an edge counts as overflow. Defaults to 2.' },
        minShare: { type: 'number', description: 'A pair counts as overlapping only when the shared area covers this fraction of the smaller box. Defaults to 0.05.' },
        minOverlapPx: { type: 'number', description: 'Minimum overlap width and height in px. Defaults to 8, which ignores shadows and borders.' },
        ignore: { type: 'array', items: { type: 'string' }, description: 'CSS selectors to skip, e.g. [".decorative"]' },
      },
      output: { schema: { type: 'string' }, render: (args, value) => [{ type: 'text', text: value }] },
      async execute(args) {
        const result = await checkLayout({
          target: args?.target,
          html: args?.html,
          viewport: args?.viewport,
          padding: args?.padding,
          minShare: args?.minShare,
          minOverlapPx: args?.minOverlapPx,
          ignore: args?.ignore,
        });
        return formatLayoutReport(result);
      },
    },
  ];
}

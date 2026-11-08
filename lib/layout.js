/**
 * Geometry checks: overlapping boxes and elements outside the canvas.
 *
 * Why this runs in a browser rather than by reading CSS: "does this overlap" is
 * a question about rendered boxes, not about declared styles. Two elements can
 * share a rect because of padding, negative margin, transform, grid overlap or a
 * fixed position — and a static parse gets all of those wrong. The browser
 * already knows the answer (`getBoundingClientRect`), so the check asks it.
 *
 * Three checks, in the order a person would notice them:
 *
 *   overflow    something extends past the page or its own container
 *   overlap     two boxes that should not share pixels do
 *   collision   text sitting on top of text, which is always a bug
 *
 * The hard part is *which* overlaps are bugs. A label positioned on a card is an
 * overlap and is intended. Selection is by containment: an overlap between a
 * parent and its own descendant is layout, not a collision, so those pairs are
 * dropped before reporting.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { checkVideoEnvironment } from './videoenv.js';

/** Load Playwright from wherever checkVideoEnvironment says it lives. */
async function loadPlaywright() {
  // 1. resolvable from here
  try {
    const module = await import('playwright');
    return { chromium: module.chromium, path: 'resolved' };
  }
  catch { /* try the discovered path */ }

  // 2. ask the environment check where it is
  const report = await checkVideoEnvironment();
  const entry = report.groups.render.find((item) => item.name === 'playwright');
  if (entry === undefined || entry.ok !== true || typeof entry.path !== 'string') return null;

  // `path` is the package directory; require the entry file beside it.
  try {
    const pkgPath = join(entry.path, 'package.json');
    if (existsSync(pkgPath)) {
      const require = createRequire(pkgPath);
      const module = require(entry.path);
      return { chromium: module.chromium, path: entry.path };
    }
  }
  catch { /* fall through */ }

  // 3. load it as a file URL, which works when the package is outside the module graph
  try {
    const manifest = join(entry.path, 'package.json');
    const dir = dirname(manifest);
    const module = await import(`file:///${join(dir, 'index.js').replace(/\\/g, '/')}`);
    return { chromium: module.chromium ?? module.default?.chromium, path: entry.path };
  }
  catch {
    return null;
  }
}

/**
 * The script that runs inside the page.
 *
 * Written as a string because it is evaluated in the browser, not here. It
 * returns plain JSON so nothing has to be serialised by hand.
 *
 * @param {object} options `{ padding, minOverlapPx, minAreaPx, ignore }`.
 */
function inPageCheck(options) {
  return `(function () {
  const opt = ${JSON.stringify(options)};

  const viewport = { w: document.documentElement.clientWidth, h: document.documentElement.clientHeight };
  const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);

  // Collect candidates: rendered boxes with visible area, excluding the site
  // chrome and anything the caller asked to skip.
  const ignoredTags = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'HEAD', 'TITLE', 'BR', 'HR']);
  const nodes = [];
  const all = document.body ? document.body.querySelectorAll('*') : [];
  for (const el of all) {
    if (ignoredTags.has(el.tagName)) continue;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
    if (el.getAttribute('aria-hidden') === 'true') continue;
    const skip = opt.ignore.find((sel) => { try { return el.matches(sel); } catch { return false; } });
    if (skip) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    // An element that scrolls off the document is not on the canvas at all.
    const absolute = { x: rect.left + window.scrollX, y: rect.top + window.scrollY, w: rect.width, h: rect.height };
    nodes.push({
      el,
      rect,
      absolute,
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      cls: typeof el.className === 'string' ? el.className : '',
      text: (el.textContent || '').trim().slice(0, 60),
      textLength: (el.textContent || '').trim().length,
      isTextOnly: (el.children.length === 0 && (el.textContent || '').trim().length > 0),
      scrolls: /(auto|scroll)/.test(style.overflowX + style.overflowY),
    });
  }

  const pathOf = (node) => {
    const parts = [];
    let el = node.el;
    let depth = 0;
    while (el && el !== document.body && depth < 4) {
      let label = el.tagName.toLowerCase();
      if (el.id) label += '#' + el.id;
      else if (typeof el.className === 'string' && el.className.trim() !== '') {
        label += '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.');
      }
      parts.unshift(label);
      el = el.parentElement;
      depth += 1;
    }
    return parts.join(' > ');
  };

  const describe = (node) => ({
    path: pathOf(node),
    tag: node.tag,
    text: node.text,
    box: {
      x: Math.round(node.absolute.x),
      y: Math.round(node.absolute.y),
      w: Math.round(node.absolute.w),
      h: Math.round(node.absolute.h),
    },
  });

  const findings = [];

  // ---- 1. overflow -------------------------------------------------------
  // Two kinds: past the page edge, and past a clipping container.
  for (const node of nodes) {
    const r = node.absolute;
    const pastRight = r.x + r.w - (viewport.w);
    const pastBottom = r.y + r.h - docHeight;
    if (pastRight > opt.padding) {
      findings.push({
        kind: 'overflow',
        severity: pastRight > 8 ? 'error' : 'warn',
        message: 'extends ' + Math.round(pastRight) + 'px past the right edge',
        ...describe(node),
      });
    }
    if (pastBottom > opt.padding) {
      findings.push({
        kind: 'overflow',
        severity: pastBottom > 8 ? 'error' : 'warn',
        message: 'extends ' + Math.round(pastBottom) + 'px past the bottom of the document',
        ...describe(node),
      });
    }

    // Clipped by an ancestor that hides it rather than letting it show.
    const parent = node.el.parentElement;
    if (parent) {
      const ps = getComputedStyle(parent);
      if (/(hidden|clip)/.test(ps.overflowX + ps.overflowY)) {
        const pr = parent.getBoundingClientRect();
        const outRight = (r.x + r.w) - (pr.right + window.scrollX);
        const outLeft = (pr.left + window.scrollX) - r.x;
        const outBottom = (r.y + r.h) - (pr.bottom + window.scrollY);
        const outTop = (pr.top + window.scrollY) - r.y;
        const worst = Math.max(outRight, outLeft, outBottom, outTop);
        if (worst > opt.padding) {
          findings.push({
            kind: 'clipped',
            severity: worst > 8 ? 'warn' : 'info',
            message: 'cut off by a ' + Math.round(worst) + 'px clipped parent (overflow hidden)',
            ...describe(node),
          });
        }
      }
    }
  }

  // ---- 2. overlap -----------------------------------------------------
  // Only boxes that are not ancestor/descendant of each other, and only when
  // both carry visible area worth reporting.
  const visible = nodes.filter((n) => {
    const area = n.absolute.w * n.absolute.h;
    return area >= opt.minAreaPx;
  });

  for (let i = 0; i < visible.length; i += 1) {
    for (let j = i + 1; j < visible.length; j += 1) {
      const a = visible[i];
      const b = visible[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;

      const left = Math.max(a.absolute.x, b.absolute.x);
      const right = Math.min(a.absolute.x + a.absolute.w, b.absolute.x + b.absolute.w);
      const top = Math.max(a.absolute.y, b.absolute.y);
      const bottom = Math.min(a.absolute.y + a.absolute.h, b.absolute.y + b.absolute.h);
      if (right <= left || bottom <= top) continue;

      const overlapPx = (right - left) * (bottom - top);
      const smaller = Math.min(a.absolute.w * a.absolute.h, b.absolute.w * b.absolute.h);
      // A sliver of overlap is usually a shadow or a border; require both an
      // absolute floor and a share of the smaller box.
      if (overlapPx < opt.minOverlapPx * opt.minOverlapPx) continue;
      if (overlapPx / smaller < opt.minShare) continue;

      // Text over text is always a defect; report it at error level.
      const bothText = a.isTextOnly && b.isTextOnly && a.textLength > 1 && b.textLength > 1;
      findings.push({
        kind: bothText ? 'collision' : 'overlap',
        severity: bothText ? 'error' : 'warn',
        message: (bothText ? 'text overlaps text: ' : 'boxes overlap: ')
          + Math.round(overlapPx) + 'px² (' + Math.round(overlapPx / smaller * 100) + '% of the smaller box)',
        a: describe(a),
        b: describe(b),
      });
    }
  }

  // ---- 3. off-canvas ---------------------------------------------------
  // Elements positioned entirely outside the document or the viewport width.
  for (const node of nodes) {
    const r = node.absolute;
    const entirelyLeft = r.x + r.w < 0;
    const entirelyAbove = r.y + r.h < 0;
    if (entirelyLeft || entirelyAbove) {
      findings.push({
        kind: 'offcanvas',
        severity: 'error',
        message: 'positioned entirely outside the document',
        ...describe(node),
      });
    }
  }

  // Sort errors first, then by box area so the biggest problem reads first.
  const rank = { error: 0, warn: 1, info: 2 };
  findings.sort((p, q) => {
    const bySeverity = rank[p.severity] - rank[q.severity];
    if (bySeverity !== 0) return bySeverity;
    const pa = p.box ? p.box.w * p.box.h : 0;
    const qa = q.box ? q.box.w * q.box.h : 0;
    return qa - pa;
  });

  return {
    ok: true,
    viewport,
    docHeight,
    counted: nodes.length,
    findings: findings.slice(0, 200),
    truncated: findings.length > 200,
    total: findings.length,
  };
})()`;
}

/**
 * Run the checks against a file or a pasted snippet.
 *
 * @param {object} request `{ target?, html?, viewport?, padding?, minShare?, ignore? }`.
 * @returns {Promise<object>} findings, or `{ ok: false, error }` when the browser is unavailable.
 */
export async function checkLayout(request = {}) {
  const playwright = await loadPlaywright();
  if (playwright === null || playwright.chromium === undefined) {
    return {
      ok: false,
      error: 'Playwright is not installed, and these checks need a browser to measure rendered boxes.',
      install: 'npm i -D playwright && npx playwright install chromium',
      hint: 'Run video_env_check to see what else is missing.',
    };
  }

  const viewport = {
    width: Math.max(240, Math.min(3840, Number(request?.viewport?.width ?? 1280))),
    height: Math.max(240, Math.min(2160, Number(request?.viewport?.height ?? 900))),
  };
  const options = {
    padding: Math.max(0, Number(request?.padding ?? 2)),
    minOverlapPx: Math.max(1, Number(request?.minOverlapPx ?? 8)),
    minAreaPx: Math.max(1, Number(request?.minAreaPx ?? 400)),
    minShare: Math.max(0, Math.min(1, Number(request?.minShare ?? 0.05))),
    ignore: Array.isArray(request?.ignore) ? request.ignore.slice(0, 20) : [],
  };

  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });

    if (typeof request?.target === 'string' && request.target !== '') {
      const url = /^https?:\/\//i.test(request.target)
        ? request.target
        : `file:///${request.target.replace(/\\/g, '/')}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    }
    else if (typeof request?.html === 'string' && request.html !== '') {
      await page.setContent(request.html, { waitUntil: 'networkidle', timeout: 20000 });
    }
    else {
      return { ok: false, error: 'Provide a target path/URL, or html content.' };
    }

    // Fonts change measured widths, so wait for them before measuring.
    try {
      await page.evaluate(() => document.fonts && document.fonts.ready);
    }
    catch { /* no font API; measure anyway */ }

    const result = await page.evaluate(inPageCheck(options));
    return { ...result, viewport: { width: viewport.width, height: viewport.height }, options };
  }
  catch (error) {
    return { ok: false, error: String(error?.message ?? error) };
  }
  finally {
    await browser.close().catch(() => {});
  }
}

/** Render one review result as readable text. */
export function formatLayoutReport(result) {
  if (result?.ok !== true) {
    const lines = [`# Layout check — could not run`, '', result?.error ?? 'unknown error'];
    if (result?.install) lines.push('', `install: ${result.install}`);
    if (result?.hint) lines.push(`hint: ${result.hint}`);
    return lines.join('\n');
  }

  const lines = [
    `# Layout check — ${result.counted} boxes measured`,
    '',
    `viewport: ${result.viewport.width}×${result.viewport.height} · document height: ${result.docHeight}px`,
    '',
  ];

  const counts = { error: 0, warn: 0, info: 0 };
  for (const finding of result.findings) counts[finding.severity] += 1;

  if (result.total === 0) {
    lines.push('No overlap, overflow or off-canvas elements found.');
    return lines.join('\n');
  }

  lines.push(`errors: ${counts.error}, warnings: ${counts.warn}, notes: ${counts.info}`, '');

  const groups = { error: [], warn: [], info: [] };
  for (const finding of result.findings) groups[finding.severity].push(finding);

  for (const severity of ['error', 'warn', 'info']) {
    if (groups[severity].length === 0) continue;
    lines.push(`## ${severity}`);
    for (const finding of groups[severity]) {
      if (finding.kind === 'overlap' || finding.kind === 'collision') {
        lines.push(`- ${finding.message}`);
        lines.push(`  a: ${finding.a.path}  @ ${finding.a.box.x},${finding.a.box.y} ${finding.a.box.w}×${finding.a.box.h}`);
        if (finding.a.text !== '') lines.push(`     "${finding.a.text}"`);
        lines.push(`  b: ${finding.b.path}  @ ${finding.b.box.x},${finding.b.box.y} ${finding.b.box.w}×${finding.b.box.h}`);
        if (finding.b.text !== '') lines.push(`     "${finding.b.text}"`);
      }
      else {
        lines.push(`- [${finding.kind}] ${finding.message}`);
        lines.push(`  ${finding.path}  @ ${finding.box.x},${finding.box.y} ${finding.box.w}×${finding.box.h}`);
        if (finding.text !== '') lines.push(`  "${finding.text}"`);
      }
    }
    lines.push('');
  }

  if (result.truncated) {
    lines.push(`Showing the first ${result.findings.length} of ${result.total} findings.`);
  }
  return lines.join('\n');
}

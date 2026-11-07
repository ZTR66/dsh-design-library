/**
 * HTTP routes served to the browser half.
 *
 * Read-only by construction. Every handler asks the connection service whether
 * the request may be answered (`requestRejection`), then serves from the index
 * or from a path the index already knows about — so a request can never name a
 * file outside the scanned roots, and there is no path arithmetic over
 * user-supplied strings.
 *
 * The route also carries the review operation, because the panel's "review
 * this file" action and the agent's `design_review` tool must produce the same
 * answer from the same code rather than two slightly different opinions.
 */

import { readFile } from 'node:fs/promises';

const MAX_DOC_BYTES = 200 * 1024;

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'content-type': type,
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(text),
  });
  res.end(text);
}

/** Ask the connection service whether this request may be answered at all. */
function rejection(ctx, req, res) {
  const connection = ctx.get('connection');
  if (connection === undefined || typeof connection.requestRejection !== 'function') return false;
  const code = connection.requestRejection(req);
  if (code === undefined || code === null || code === false) return false;
  res.statusCode = typeof code === 'number' ? code : 403;
  res.end();
  return true;
}

/**
 * Search entries by free text over name, description, folder and id.
 * Deliberately simple and predictable: every whitespace-separated term must
 * appear somewhere, case-insensitively. Ranking prefers name hits.
 */
export function searchEntries(entries, query, limit = 20) {
  const terms = String(query ?? '').toLowerCase().split(/\s+/).filter((term) => term !== '');
  const scored = [];
  for (const entry of entries) {
    const name = entry.name.toLowerCase();
    const haystack = `${name}\n${entry.description}\n${entry.folder}\n${entry.id}`.toLowerCase();
    if (!terms.every((term) => haystack.includes(term))) continue;
    let score = 0;
    for (const term of terms) {
      if (name === term) score += 100;
      else if (name.startsWith(term)) score += 40;
      else if (name.includes(term)) score += 20;
      else score += 1;
    }
    scored.push({ entry, score });
  }
  return scored
    .sort((a, b) => (b.score - a.score) || a.entry.name.length - b.entry.name.length)
    .slice(0, limit)
    .map((item) => item.entry);
}

/**
 * Register both routes.
 *
 * @param {object} ctx Cordis plugin context with `webServer` and `connection`.
 * @param {object} deps `{ getIndex, publicEntry, buildReview, external }`.
 * @returns {(() => void)[]} disposers, one per route.
 */
export function registerRoutes(ctx, deps) {
  const webServer = ctx.get('webServer');
  if (webServer === undefined || typeof webServer.register !== 'function') return [];

  const disposers = [];

  disposers.push(webServer.register({
    kind: 'exact',
    path: '/design-skills/index',
    handler: async (req, res) => {
      if (rejection(ctx, req, res)) return;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendJson(res, 405, { ok: false, error: 'method not allowed' });
        return;
      }
      try {
        const url = new URL(req.url ?? '/design-skills/index', 'http://localhost');
        const force = url.searchParams.get('refresh') === '1';
        const index = await deps.getIndex(force);
        sendJson(res, 200, {
          ok: true,
          revision: index.revision,
          builtAt: index.builtAt,
          total: index.total,
          stats: index.stats,
          warnings: index.warnings,
          failed: index.failed.slice(0, 20),
          external: deps.external,
          entries: index.entries.map(deps.publicEntry),
        });
      }
      catch (error) {
        sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    },
  }));

  disposers.push(webServer.register({
    kind: 'exact',
    path: '/design-skills/doc',
    handler: async (req, res) => {
      if (rejection(ctx, req, res)) return;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sendJson(res, 405, { ok: false, error: 'method not allowed' });
        return;
      }
      try {
        const url = new URL(req.url ?? '/design-skills/doc', 'http://localhost');
        const id = url.searchParams.get('id') ?? '';
        const index = await deps.getIndex(false);
        // Lookup, never path resolution: only an id the index already produced
        // can reach a file, which is what keeps this from becoming an
        // arbitrary-file-read endpoint.
        const entry = index.entries.find((candidate) => candidate.id === id);
        if (entry === undefined) {
          sendJson(res, 404, { ok: false, error: `unknown design id: ${id}` });
          return;
        }
        let text = await readFile(entry.path, 'utf8');
        let truncated = false;
        if (Buffer.byteLength(text, 'utf8') > MAX_DOC_BYTES) {
          text = text.slice(0, MAX_DOC_BYTES);
          truncated = true;
        }
        sendJson(res, 200, {
          ok: true,
          id: entry.id,
          name: entry.name,
          kind: entry.kind,
          origin: entry.origin,
          truncated,
          bytes: entry.bytes,
          content: text,
        });
      }
      catch (error) {
        sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    },
  }));

  disposers.push(webServer.register({
    kind: 'exact',
    path: '/design-skills/review',
    handler: async (req, res) => {
      if (rejection(ctx, req, res)) return;
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'method not allowed' });
        return;
      }
      try {
        const chunks = [];
        let bytes = 0;
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 256 * 1024) {
            sendJson(res, 413, { ok: false, error: 'request body too large' });
            return;
          }
          chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        const index = await deps.getIndex(false);
        const result = await deps.buildReview(index, body);
        sendJson(res, result.ok ? 200 : 400, result);
      }
      catch (error) {
        sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    },
  }));

  disposers.push(webServer.register({
    kind: 'exact',
    path: '/design-skills/settings',
    handler: async (req, res) => {
      if (rejection(ctx, req, res)) return;
      try {
        if (req.method === 'GET') {
          const current = deps.readSettings();
          const index = await deps.getIndex(false);
          const skillCount = index.entries.filter((entry) => entry.kind === 'skill').length;
          sendJson(res, 200, {
            ok: true,
            settings: current,
            writable: deps.canWrite(),
            skillCount,
            // Saying what each mode selects beats making the user guess.
            modes: deps.describeModes(skillCount),
          });
          return;
        }
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false, error: 'method not allowed' });
          return;
        }
        const chunks = [];
        let bytes = 0;
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 64 * 1024) {
            sendJson(res, 413, { ok: false, error: 'request body too large' });
            return;
          }
          chunks.push(chunk);
        }
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        const result = await deps.writeSettings(body);
        sendJson(res, result.ok ? 200 : 400, result);
      }
      catch (error) {
        sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
      }
    },
  }));

  return disposers;
}

export { sendJson, sendText };

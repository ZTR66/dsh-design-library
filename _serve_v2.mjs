/**
 * 独立起 design-library 的真实路由服务。
 * 复用插件自己的 lib/routes.js + lib/scan.js，数据是真的（真索引、真 review、真文件）。
 * 只绕开 DSH 的 connection 鉴权：把 ctx.get('connection') 返回 undefined 即可。
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildIndex, cachedIndex, loadSeedIndex, publicEntry } from './lib/scan.js';
import { buildReview } from './lib/review.js';
import { registerRoutes } from './lib/routes.js';
import { readSettings, writeSettings } from './lib/settings.js';
import { EXTERNAL } from './sources.js';

const HERE = 'D:/projects/dsh-创造/dsh-design-library';
const SEED_ROOT = join(HERE, 'data');
const PORT = 45123;

/* 一个最小的 cordis-like ctx：webServer 我们自己实现 */
const routes = [];

const webServer = {
  register(spec) {
    routes.push(spec);
    return () => {};
  },
};

const ctx = {
  // 关键：不提供 connection，routes.js 的 rejection() 直接放行
  get(key) {
    if (key === 'webServer') return webServer;
    return undefined;
  },
};

const state = { index: null, revision: 0, builtAt: 0, warnings: [], failed: [], stats: {}, total: 0 };

async function getIndex(force = false) {
  if (state.index !== null && !force) return state.index;
  const t0 = Date.now();
  const index = await buildIndex([SEED_ROOT], { seedRoot: SEED_ROOT });
  const by = {};
  for (const e of index.entries) by[e.kind] = (by[e.kind] ?? 0) + 1;
  state.index = {
    ...index,
    revision: (state.revision += 1),
    builtAt: Date.now(),
    warnings: [],
    failed: [],
    stats: by,
    total: index.total,
  };
  state.builtAt = Date.now();
  console.log(`[index] total=${index.total} kinds=${JSON.stringify(by)} in ${Date.now() - t0}ms`);
  return state.index;
}

registerRoutes(ctx, {
  getIndex,
  publicEntry,
  buildReview: (index, req) => buildReview(index, req),
  external: EXTERNAL,
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
  // CORS：让本地渲染页能取
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  const r = routes.find((it) => it.kind === 'exact' && it.path === url.pathname);
  if (r === undefined) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: `no route ${url.pathname}` }));
    return;
  }
  try {
    await r.handler(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message ?? e) }));
  }
});

server.listen(PORT, '127.0.0.1', async () => {
  console.log(`design-library service on http://127.0.0.1:${PORT}`);
  console.log('routes:', routes.map((r) => r.path).join(' '));
  await getIndex(true);
});

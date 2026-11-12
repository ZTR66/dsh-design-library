/**
 * Remotion probe.
 *
 * Remotion is an optional route: the library's default is Canvas 2D driven by
 * Playwright, and Remotion is what you switch to when the film needs real
 * footage cut on a timeline, text that measures itself, or a parameterised
 * template that produces one episode per data row.
 *
 * It is not a "missing dependency" when absent — installing it is a 771 MB
 * decision (measured: 247 packages, of which 303 MB is a private
 * chrome-headless-shell it downloads itself). Reporting it as MISSING next to
 * ffmpeg would push a model to install it for films that do not need it, so it
 * reports as optional and says what it buys.
 *
 * Two things are checked, because they fail independently:
 *
 *   package   — is `remotion` resolvable from a project?
 *   renderer  — can it actually render? The CLI is `@remotion/cli`; having the
 *               library without the CLI is enough to write a composition and
 *               not enough to produce an MP4.
 */
import { execFile } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

/** Read a package's version from a node_modules tree, or undefined. */
function versionAt(dir) {
  try {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    return pkg.version;
  }
  catch {
    return undefined;
  }
}

/**
 * Look for Remotion in the places it plausibly is.
 *
 * A global install is not the normal shape — Remotion is a per-project
 * dependency, so the honest search is the working directory and its parents
 * (a monorepo's root hoists `node_modules`), plus any explicit path the caller
 * supplies.
 */
export function findRemotion(rootDir = process.cwd(), explicit) {
  const candidates = [];
  if (typeof explicit === 'string' && explicit !== '') candidates.push(explicit);

  let dir = rootDir;
  for (let depth = 0; depth < 6; depth++) {
    candidates.push(join(dir, 'node_modules'));
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }

  for (const modules of candidates) {
    const lib = join(modules, 'remotion');
    if (!existsSync(lib)) continue;
    const cli = join(modules, '@remotion', 'cli');
    // The private browser lands here after the first render; before that the
    // render will download it, which is worth saying out loud because it is slow.
    const browser = join(modules, '.remotion');
    return {
      ok: true,
      path: lib,
      modules,
      version: versionAt(lib),
      cli: existsSync(cli) ? versionAt(cli) : undefined,
      browserDownloaded: existsSync(browser),
    };
  }
  return { ok: false };
}

/** Ask the CLI what version it is, which also proves it is runnable. */
async function cliVersion(modules) {
  try {
    const { stdout } = await run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['remotion', '--version'], {
      cwd: join(modules, '..'),
      timeout: 20_000,
      windowsHide: true,
    });
    const m = /(\d+\.\d+\.\d+)/.exec(stdout);
    return m?.[1];
  }
  catch {
    return undefined;
  }
}

/** Build the two report entries for Remotion. */
export async function probeRemotion(rootDir = process.cwd(), explicit) {
  const found = findRemotion(rootDir, explicit);
  if (!found.ok) {
    return {
      // Default route now, so absence is actionable: name the install command
      // rather than shrugging. Not `required: true` though — the Canvas route
      // remains valid, and a hard MISSING would block films that do not need it.
      package: {
        name: 'remotion',
        ok: false,
        required: false,
        note: '默认渲染路线，未装。装它才能出片；纯代码图形可退回 Canvas',
        install: 'npm i remotion @remotion/cli',
      },
      cli: {
        name: '@remotion/cli',
        ok: false,
        required: false,
        note: '未安装则无法出 MP4',
        install: 'npm i remotion @remotion/cli',
      },
    };
  }

  const cliOk = found.cli !== undefined;
  const reported = cliOk ? await cliVersion(found.modules) : undefined;

  return {
    package: {
      name: 'remotion',
      ok: true,
      required: false,
      version: found.version,
      path: found.path,
      note: '默认渲染路线',
    },
    cli: {
      name: '@remotion/cli',
      ok: cliOk,
      required: false,
      version: reported ?? found.cli,
      note: cliOk
        ? (found.browserDownloaded
          ? '私有浏览器已就绪'
          : '首次渲染会自动下载 chrome-headless-shell（约 300 MB）')
        : '装了 remotion 但没装 CLI，能写组件不能出片',
    },
  };
}

/**
 * Whether a directory looks like a Remotion project.
 *
 * Used by the guide to decide whether to name the Remotion route first or the
 * Canvas one. A project with a `remotion.config.*` or a composition entry is
 * already committed to the route; suggesting Canvas there would be noise.
 */
export function looksLikeRemotionProject(dir = process.cwd()) {
  const markers = ['remotion.config.ts', 'remotion.config.js', 'remotion.config.mjs'];
  if (markers.some((m) => existsSync(join(dir, m)))) return true;
  try {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    return Object.keys(deps).some((d) => d === 'remotion' || d.startsWith('@remotion/'));
  }
  catch {
    return false;
  }
}

/**
 * Environment detection for the video pipeline.
 *
 * The plugin does not render video and does not bundle a renderer. What it can do
 * is tell the agent, precisely, what this machine already has and what is
 * missing — so the agent installs one named package instead of asking the user
 * whether "the environment is ready".
 *
 * Detection is read-only: it runs `<cmd> --version`, imports a module, or checks
 * for a path. It never installs anything.
 *
 * The one thing that makes this worth building rather than a static checklist is
 * the Python split. On a machine with both a DSH runtime and a system Python, the
 * packages end up divided between them: the DSH interpreter has Pillow and numpy
 * but no edge-tts, while the system interpreter has edge-tts and neither of the
 * others. A script that mixes them fails at import time with a confusing error,
 * so the report says so explicitly.
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

/** First line of a command's version output, or null when it cannot run. */
async function version(cmd, args = ['--version']) {
  try {
    const { stdout, stderr } = await run(cmd, args, { timeout: 8000, windowsHide: true });
    const line = `${stdout || stderr}`.split('\n').map((s) => s.trim()).filter(Boolean)[0];
    return line ?? 'present';
  }
  catch {
    return null;
  }
}

/** Whether a path exists (file or directory). */
function pathOk(target) {
  try {
    return existsSync(target);
  }
  catch {
    return false;
  }
}

/**
 * Find a Chromium-family browser or a Playwright browser cache.
 *
 * Playwright ships its own Chromium; if that cache exists, the heavy part of the
 * install is already done and only the JS binding is missing. Reporting them
 * separately is what turns "install playwright" into "the browser is already
 * here, you only need the npm package".
 */
function findBrowser() {
  const candidates = [];

  if (process.platform === 'win32') {
    candidates.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    );
  }
  else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    );
  }
  else {
    candidates.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge');
  }

  for (const candidate of candidates) {
    if (pathOk(candidate)) return { ok: true, path: candidate };
  }

  // Playwright's own cache, per platform.
  const caches = process.platform === 'win32'
    ? [join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'ms-playwright')]
    : process.platform === 'darwin'
      ? [join(homedir(), 'Library', 'Caches', 'ms-playwright')]
      : [join(homedir(), '.cache', 'ms-playwright')];

  for (const cache of caches) {
    if (!pathOk(cache)) continue;
    try {
      const { readdirSync } = require('node:fs');
      const found = readdirSync(cache).filter((name) => /^chromium/.test(name));
      if (found.length > 0) return { ok: true, path: join(cache, found[0]), cached: true };
    }
    catch { /* unreadable cache is simply not found */ }
  }

  return { ok: false };
}

/** Ask one Python interpreter which of the video-relevant modules it can import. */
async function probePython(python) {
  if (python === undefined || python === null) return null;
  // Version numbers are pulled per module: the interpreter's own version is not a
  // package version, and reporting `3.12.14` as the Pillow version is worse than
  // reporting nothing.
  const script = [
    'import importlib, json, sys',
    'out = {"version": sys.version.split()[0], "modules": {}, "versions": {}}',
    'for m in ["PIL", "numpy", "librosa", "edge_tts", "playwright"]:',
    '    try:',
    '        mod = importlib.import_module(m)',
    '        out["modules"][m] = True',
    '        out["versions"][m] = str(getattr(mod, "__version__", "") or "")',
    '    except Exception:',
    '        out["modules"][m] = False',
    'print(json.dumps(out))',
  ].join('\n');
  try {
    const { stdout } = await run(python, ['-c', script], { timeout: 12000, windowsHide: true });
    return JSON.parse(String(stdout).trim());
  }
  catch {
    return null;
  }
}

/** Locate the interpreters worth probing. */
function candidates() {
  const list = [];
  const dshPython = process.env.DSH_PYTHON;
  if (dshPython) list.push({ label: 'DSH 运行时', path: dshPython });
  // The runtime ships its own interpreter; try the conventional location too.
  const runtimePython = join(homedir(), '.dsh', 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'python', 'python.exe');
  if (pathOk(runtimePython) && runtimePython !== dshPython) list.push({ label: 'DSH 运行时', path: runtimePython });
  list.push({ label: '系统 python', path: process.platform === 'win32' ? 'python' : 'python3' });
  return list;
}

/**
 * Build the report.
 *
 * @returns {Promise<object>} a JSON-safe description of what this machine can do.
 */
export async function checkVideoEnvironment() {
  const chromium = findBrowser();

  // ---- render chain ------------------------------------------------------
  const ffmpegVersion = await version('ffmpeg', ['-version']);
  const ffprobeVersion = await version('ffprobe', ['-version']);

  // Playwright's binding is resolved through Node, not a shell command.
  let playwrightNode = false;
  try {
    // resolve only; importing it would launch nothing but costs more
    await import('node:module').then(({ createRequire }) => {
      const require = createRequire(import.meta.url);
      require.resolve('playwright');
      playwrightNode = true;
    });
  }
  catch { playwrightNode = false; }

  // ---- python interpreters ------------------------------------------------
  const probed = [];
  for (const candidate of candidates()) {
    const result = await probePython(candidate.path);
    if (result !== null) probed.push({ ...candidate, ...result });
  }

  /** True when at least one interpreter can import `name`. */
  const has = (name) => probed.some((p) => p.modules?.[name] === true);
  /** Which interpreters can import `name`. */
  const who = (name) => probed.filter((p) => p.modules?.[name] === true).map((p) => p.label);
  /** Version of `name` from the first interpreter that has it. */
  const ver = (name) => probed.find((p) => p.modules?.[name] === true)?.versions?.[name] || undefined;

  const pillow = probed.find((p) => p.modules?.PIL);
  const numpy = probed.find((p) => p.modules?.numpy);

  // ---- voice --------------------------------------------------------------
  const edgeVersion = await version('edge-tts', ['--version']);
  const edgeModules = has('edge_tts');
  const sapi = process.platform === 'win32';

  // ---- music --------------------------------------------------------------
  const librosa = has('librosa');
  const librosaVersion = ver('librosa');

  // A split matters when one step's dependencies cannot run in the interpreter
  // that has the other step's. Two interpreters that each carry a full set are
  // fine; what breaks is an interpreter that has `edge_tts` but no image library,
  // because a single script cannot then narrate and render in one pass.
  const partialInterpreters = probed.filter((p) => {
    const hasVoice = p.modules?.edge_tts === true;
    const hasImage = p.modules?.PIL === true || p.modules?.numpy === true;
    // Useful only if it has voice without image, or image without voice — and the
    // other half exists somewhere else.
    return (hasVoice && !hasImage) || (hasImage && !hasVoice);
  });
  const conflict = probed.length > 1 && partialInterpreters.length > 0
    && !probed.some((p) => p.modules?.edge_tts === true && p.modules?.PIL === true);

  const groups = {
    render: [
      {
        name: 'ffmpeg',
        ok: ffmpegVersion !== null,
        version: ffmpegVersion ?? undefined,
        required: true,
        install: 'https://ffmpeg.org/download.html',
      },
      {
        name: 'ffprobe',
        ok: ffprobeVersion !== null,
        required: true,
        note: 'ships with ffmpeg',
      },
      {
        name: 'chromium',
        ok: chromium.ok,
        path: chromium.path,
        cached: chromium.cached === true,
        required: true,
        note: chromium.cached ? '已由 Playwright 缓存，无需重新下载' : undefined,
      },
      {
        name: 'playwright',
        ok: playwrightNode,
        required: true,
        install: 'npm i -D playwright && npx playwright install chromium',
        note: playwrightNode ? undefined : '浏览器已在，只缺这个 Node 包',
      },
      {
        name: 'pillow',
        ok: Boolean(pillow),
        version: ver('PIL'),
        python: who('PIL').join(', ') || undefined,
        required: true,
        install: 'pip install pillow',
      },
    ],
    voice: [
      {
        name: 'edge-tts',
        ok: edgeVersion !== null || edgeModules,
        version: edgeVersion ?? undefined,
        python: who('edge_tts').join(', ') || undefined,
        required: true,
        network: true,
        install: 'pip install edge-tts',
        note: '离线时降级到 SAPI',
      },
      {
        name: 'sapi',
        ok: sapi,
        required: false,
        voices: sapi ? '系统中文语音' : undefined,
        note: '离线可用，音质仅适合占位',
      },
    ],
    music: [
      {
        name: 'numpy',
        ok: Boolean(numpy),
        version: ver('numpy'),
        python: who('numpy').join(', ') || undefined,
        required: true,
        install: 'pip install numpy',
      },
      {
        name: 'librosa',
        ok: librosa,
        version: librosaVersion,
        required: false,
        optional: true,
        install: 'pip install librosa',
        neededFor: '按拍点剪辑（音乐 MV）；纯旁白片不需要',
      },
      {
        name: 'userFile',
        ok: true,
        required: false,
        note: '用户自带的音乐随时可用，无需额外依赖',
      },
    ],
  };

  const missing = [];
  for (const group of Object.values(groups)) {
    for (const item of group) {
      if (item.required && !item.ok) missing.push(item.name);
    }
  }

  // What the machine can actually produce, judged per deliverable rather than by
  // one global "ready" flag: a silent film needs far less than a beat-synced MV.
  const readyFor = {
    // Frames drawn with Pillow and encoded by ffmpeg.
    silent: Boolean(pillow) && ffmpegVersion !== null,
    // A narrated film also needs a voice engine.
    narrated: Boolean(pillow) && ffmpegVersion !== null && (edgeVersion !== null || sapi),
    // Browser-rendered canvas frames.
    browserRendered: chromium.ok && playwrightNode && ffmpegVersion !== null,
    // Cutting on beats needs precise onsets.
    beatSync: librosa && ffmpegVersion !== null,
  };

  return {
    checkedAt: new Date().toISOString(),
    platform: process.platform,
    groups,
    missing,
    pythonInterpreters: probed.map((p) => ({
      label: p.label,
      path: p.path,
      version: p.version,
      modules: p.modules,
    })),
    pythonConflict: conflict
      ? {
        detected: true,
        detail: probed
          .map((p) => `${p.label}：${Object.entries(p.modules).filter(([, v]) => v).map(([k]) => k).join('/') || '无'}`)
          .join('；'),
        advice: '旁白与渲染分两个步骤跑，各自用能导入所需模块的解释器；或把缺的包装进同一个环境',
      }
      : { detected: false },
    readyFor,
    nextStep: missing.length === 0
      ? null
      : `缺少 ${missing.join('、')}。先问用户是否可以安装，再执行对应 install 命令。`,
  };
}

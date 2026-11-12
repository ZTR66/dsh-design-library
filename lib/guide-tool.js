/**
 * The `video_guide` tool definition.
 *
 * Kept in its own module rather than inline in `index.js` because the body is
 * mostly prose — the design stages and the map format — and prose buried
 * inside a 2000-line file is the kind of thing that rots. Here it can be read
 * and edited on its own.
 *
 * Why this tool exists at all:
 *
 * A model that has never seen this library knows it has search tools, but not
 * what is inside them. Its natural move is to guess keywords, and because the
 * library is organised by class rather than by phrase, a guessed multi-word query
 * returns nothing. One recorded session failed four of nine calls this way.
 *
 * A catalogue that can be *seen* removes the guessing: one call returns the whole
 * map, so the model picks a class instead of inventing a keyword.
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNavigationTree } from './navigate.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Build the tool spec. `deps` supplies the two data loaders. */
export function videoGuideSpec(deps) {
  const { loadVideoCatalog, loadShotCatalog } = deps;

  /**
   * Read the production protocol, once per process.
   *
   * The protocol is embedded in the guide's output rather than pointed at,
   * because a pointer is a suggestion and suggestions get skipped: a recorded
   * session read the guide, then read the protocol nineteen calls later, by
   * which point every rule about ordering had already been broken. Embedding it
   * makes the rules arrive with the map.
   */
  let protocolPromise;
  function loadProtocol() {
    if (protocolPromise === undefined) {
      protocolPromise = readFile(
        join(HERE, '..', 'data', 'video-styles', 'craft', 'production-protocol.md'),
        'utf8',
      ).catch(() => null);
    }
    return protocolPromise;
  }

  /**
   * 外部导入的风格（styles-external/*.md）。
   *
   * 和库内 44 个的差别在交付物形态：库内风格给的是完整参数表（色板、字体、
   * 动效时序），外部风格给的是画面要点 + 容易失败的点 + 参考提示词。
   *
   * 两者都能用。分开列是为了让读者知道该期待什么，不是让人跳过这一组——
   * 写「别当设计规范用」曾经让这 22 个风格形同不存在，因为模型读到就绕开了。
   */
  let externalPromise;
  function loadExternalStyles() {
    if (externalPromise === undefined) {
      externalPromise = (async () => {
        const dir = join(HERE, '..', 'data', 'video-styles', 'styles-external');
        try {
          const files = await readdir(dir);
          const out = [];
          for (const file of files.filter((f) => f.endsWith('.md'))) {
            const text = await readFile(join(dir, file), 'utf8');
            const key = /^key:\s*(.+)$/m.exec(text)?.[1]?.trim() ?? file.replace(/\.md$/, '');
            const name = /^name:\s*(.+)$/m.exec(text)?.[1]?.trim() ?? key;
            const en = /^en:\s*(.+)$/m.exec(text)?.[1]?.trim() ?? '';
            out.push({ key, name, en });
          }
          return out.sort((a, b) => a.key.localeCompare(b.key));
        }
        catch { return []; }
      })();
    }
    return externalPromise;
  }

  /**
   * The method-document catalog, read from the shipped index.
   *
   * The guide used to name eight documents inline. That list was written when
   * eight was the whole library; by the time it had grown to seventy-six, the
   * names in the guide were a description of the past. Anything added since —
   * the camera-move library, the pacing rules, the genre SOPs — had no entry
   * point at all, which for a document is the same as not existing.
   *
   * Reading the index means a new file appears here without anybody remembering
   * to edit this function.
   */
  let methodCatalogPromise;
  function loadMethodCatalog() {
    if (methodCatalogPromise !== undefined) return methodCatalogPromise;
    methodCatalogPromise = (async () => {
      const groups = [
        { title: '叙事与结构', match: ['structure-bible', 'narrative-templates', 'beat-scaffold', 'visual-grammar', 'storyboard', 'alternate-worlds', 'mv/storyboard'], items: [] },
        { title: '运镜与构图', match: ['camera-move-library', 'genre-camera-sop', 'shot-composition', 'camera-and-grids', 'genres', 'maps-and-data-motion', 'kinetic-type-art', 'title-design', 'video-moodboard'], items: [] },
        { title: '节奏与剪辑', match: ['video-pacing', 'beat-sync-editing', 'editing-techniques', 'transitions', 'mv/transitions', 'transition-craft', 'edit-footage-with-code', 'short-form-ffmpeg-cookbook', 'motion-formats'], items: [] },
        { title: '动效与渲染', match: ['animation-principles', 'motion-art-direction', 'motion-background', 'logo-animation', 'easing-curves', 'easing-graph-editor', 'twelve-principles', 'render-craft', 'remotion-track', 'remotion-video', 'mv/render', 'render'], items: [] },
        { title: '风格与视觉', match: ['style-guide', 'visualization-design', 'color-motion', 'palettes-and-interpolation', 'atmosphere-prefabs', 'lighttable', 'mv/styles', 'learn-style', 'caption-styles', 'footage-effects', 'paper-shaders', 'shader-art-coding', 'threejs-animatic'], items: [] },
        { title: '文案与提示词', match: ['copywriting-rules', 'prompt-brief', 'negative-prompts', 'image-prompts', 'video-script'], items: [] },
        { title: '流程与质检', match: ['production-protocol', 'project-planner', 'quality-gate', 'rework-scripts', 'mv/review'], items: [] },
        { title: '成片风格技能', match: ['reelmimic/', 'artmotion/'], items: [] },
        { title: '制片流程', match: ['director/', 'spark-video'], items: [] },
        { title: '成套模板', match: ['toolkit/', 'manim/skills', 'manim/README', 'mv/character', 'remotion/', 'after-effects', 'artmotion', 'video-style', 'video-sound'], items: [] },
        { title: '其它', match: [], items: [] },
      ];
      const seen = new Set();
      try {
        const index = JSON.parse(await readFile(join(HERE, '..', 'data', 'seed-index.json'), 'utf8'));
        for (const entry of index.entries ?? []) {
          // skill 也是方法文档：video-styles 下的 animation-principles、
          // shot-composition 这类主文档就是 SKILL.md，只收 craft 会把它们漏掉。
          if (entry.kind !== 'craft' && entry.kind !== 'skill') continue;
          if (!String(entry.relPath ?? '').startsWith('video-styles/')) continue;
          // shots/ 是 124 张镜头卡的容器，镜头卡在上面的「四」已经单独列过
          if (String(entry.relPath).startsWith('video-styles/shots/')) continue;
          // 模板内部文件和 references/ 是展开细节，不该出现在总表里
          if (/\/(templates|assets|references)\//.test(entry.relPath)) continue;
          const id = String(entry.id ?? '')
            .replace(/^video-styles\//, '')
            .replace(/\/SKILL$/, '');
          if (id === '' || seen.has(id)) continue;
          seen.add(id);

          const name = String(entry.name ?? id).split(/[·—]/)[0].trim().slice(0, 24);
          let placed = false;
          for (const group of groups) {
            // id 形如 craft/structure-bible；分类键写的是末段名。
            // 用末段匹配，否则 craft/ 前缀会把所有条目挡在分类之外。
            const leaf = id.split('/').pop() ?? id;
            const hit = group.match.some((key) => key.includes('/')
              ? id === key || id.startsWith(key)
              : leaf === key || leaf.startsWith(key + '-'));
            if (hit) {
              group.items.push({ id: 'video-styles/' + id, name });
              placed = true;
              break;
            }
          }
          if (!placed) groups[groups.length - 1].items.push({ id: 'video-styles/' + id, name });
        }
      }
      catch { /* an unreadable index leaves the section empty, which the caller skips */ }
      return groups;
    })();
    return methodCatalogPromise;
  }

  return {
    name: 'video_guide',
    description: [
      'Show the whole video library as a map, before searching anything.',
      '',
      'Call this FIRST when making a video. Search tools only answer a question you already know how to',
      'ask; this one shows what exists, so you can pick a class instead of guessing keywords. A guessed',
      'multi-word query usually returns nothing, because the library is organised by class.',
      '',
      'It returns the design stages in order — subject → style → structure → shots → motion — plus the',
      '66 styles grouped by subject area and by visual family, the 124 shot cards grouped by what they do,',
      'and a catalog of every method document. Pick a direction from the map, then call the matching read tool.',
      '',
      'Pass `stage`, `topic`, `family` or `shotCategory` to list just that group. No arguments returns it all.',
      '',
      'BEFORE choosing anything, read the production protocol:',
      '`video_craft_read({ id: "video-styles/craft/production-protocol" })`. It states the working order',
      '(ask the user how much they want to be involved, then style → structure → shots → motion, and render',
      'segment by segment), what counts as done, and the rules that keep a film from looking flat.',
      'Skipping it is the single most common reason a generated video comes out generic.',
    ].join('\n'),
    parameters: {
      stage: {
        type: 'string',
        description: 'topic | style | structure | shot | motion — show only that stage.',
      },
      topic: {
        type: 'string',
        description: '只列某题材下的风格：历史 / 科技 / 人文 / 商业 / 纪实 / 教育 / 游戏 / 情绪',
      },
      family: {
        type: 'string',
        description: '只列某视觉家族：东方 / 暗场概念 / 图解与设计 / 剪辑与纪实 / 明亮流行 / 印刷与纸 / 游戏 / 电影感',
      },
      shotCategory: {
        type: 'string',
        description: '只列某镜头类别：camera / typography / ui-entrance / effects / transition / interaction / opening / rhythm / data / outro',
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },

    async execute(args) {
      const catalog = await loadVideoCatalog();
      const shotLib = await loadShotCatalog();
      if (catalog === null) {
        return 'The video style library is missing from this installation. Reinstall the plugin.';
      }

      // 外部风格单独读：它们不是 catalog.json 里的，格式也不同
      const external = await loadExternalStyles();

      const tree = buildNavigationTree({
        styles: catalog.styles,
        shotCards: shotLib?.cards ?? [],
      });

      const stage = String(args?.stage ?? '').trim();
      const topic = String(args?.topic ?? '').trim();
      const family = String(args?.family ?? '').trim();
      const shotCategory = String(args?.shotCategory ?? '').trim();
      const narrowed = stage !== '' || topic !== '' || family !== '' || shotCategory !== '';
      const full = !narrowed;

        // 参数写错时，之前会返回一个只有标题的空页面：看起来像「库里什么都没」
        // 而不是「你问错了」。校验一遍，把可选项摆出来。
        const VALID_STAGES = ['topic', 'style', 'structure', 'shot', 'motion', 'method'];
        if (stage !== '' && !VALID_STAGES.includes(stage)) {
          return `Unknown stage "${stage}". Valid: ${VALID_STAGES.join(', ')}. \n\nCall with no arguments for the whole map.`;
        }
        // 多个筛选参数互斥：它们各自对应不同的小节，同时给会把所有小节都过滤掉。
        const filterCount = [stage !== '', topic !== '', family !== '', shotCategory !== ''].filter(Boolean).length;
        if (filterCount > 1) {
          return 'Give one filter at a time: stage, topic, family or shotCategory. \n'
            + 'Combining them filters every section out and returns an empty page.\n\n'
            + 'Call with no arguments for the whole map.';
        }

      const counts = tree.counts;
      const lines = [];
      lines.push(
        `# 视频库导航 — ${counts.styles + external.length} 风格 · ${counts.shotCards} 镜头卡 · `
        + `${counts.families} 视觉家族 · ${counts.shotCategories} 镜头类别`,
      );
      lines.push('');
      lines.push('按顺序走完五步。跳步是"干巴巴"的主要来源。');
      lines.push('');

      // The rules arrive with the map, not as a pointer to somewhere else. A
      // model that has to fetch them separately reads them when it is already
      // stuck, which is too late for every rule about order.
      if (full) {
        const protocol = await loadProtocol();
        if (protocol !== null) {
          lines.push('---');
          lines.push('');
          lines.push('# 开工前必读 · 制作规程（已内嵌，不用再调工具）');
          lines.push('');
          lines.push('下面这份规程是硬约束，不是建议。它规定了顺序、验收标准和交付要求。');
          lines.push('读完再决定做什么。跳过它是视频做得「干巴巴」的最常见原因。');
          lines.push('');
          // The protocol is a standalone document with its own H1; demote the
          // headings one level so it nests under the guide's section instead of
          // competing with it.
          lines.push(protocol.replace(/^(#{1,4}) /gm, (m, hashes) => '#'.repeat(Math.min(6, hashes.length + 1)) + ' '));
          lines.push('');
          lines.push('---');
          lines.push('');
          lines.push('下面是库的完整地图。');
          lines.push('');
        }
      }

      // 第一步：题材
      if ((full || stage === 'topic' || topic !== '') && family === '' && shotCategory === '') {
        lines.push('## 一 · 讲什么 —— 题材 → 风格');
        lines.push('题材先定，它会排除掉一半风格。按内容选，不要按喜好选。');
        lines.push('');
        for (const item of tree.topics) {
          if (topic !== '' && item.topic !== topic) continue;
          lines.push(`**${item.topic}**（${item.count}）`);
          lines.push(item.styles.map((s) => `\`${s.key}\` ${s.name}`).join(' · '));
          lines.push('');
        }
        if (topic !== '' && !tree.topics.some((item) => item.topic === topic)) {
          lines.push(`没有「${topic}」这个题材组。`);
          lines.push(`可选：${tree.topics.map((item) => item.topic).join(' · ')}`);
          lines.push('题材组只是快捷入口，没命中的话直接看下面「二」的风格列表。');
          lines.push('');
        }
      }

      // 第二步：风格
      if ((full || stage === 'style' || family !== '') && topic === '' && shotCategory === '') {
        lines.push('## 二 · 什么风格 —— 视觉家族 → 风格');
        lines.push('选定后用 `video_style_read({ key })` 读色板、字体、动效规则。');
        lines.push('');
        for (const item of tree.families) {
          if (family !== '' && item.family !== family) continue;
          lines.push(`**${item.family}**（${item.count}）`);
          for (const style of item.styles) {
            const look = style.one ? ` — ${String(style.one).slice(0, 34)}` : '';
            lines.push(`- \`${style.key}\` ${style.name}${look}`);
          }
          lines.push('');
        }

        // 外部风格：和上面的 44 个不是一个层级
        if (family === '' && external.length > 0) {
          lines.push(`**外部风格（${external.length}）**`);
          lines.push('给的是画面要点和容易失败的点，配色和动效数值要你自己定。');
          lines.push('按要点实现即可，不比库内风格差——只是少了一份现成的参数表。');
          lines.push('');
          for (const e of external) {
            lines.push(`- \`${e.key}\` ${e.name}${e.en ? ' · ' + e.en : ''}`);
          }
          lines.push('');
        }
        if (family !== '' && !tree.families.some((item) => item.family === family)) {
          lines.push(`没有「${family}」这个视觉家族。`);
          lines.push(`可选：${tree.families.map((item) => item.family).join(' · ')}`);
          lines.push('外部风格没有家族分类，要看全部就直接调不带参数的 video_guide。');
          lines.push('');
        }
      }

      // 第三步：结构
      if (full || stage === 'structure') {
        lines.push('## 三 · 怎么排 —— 叙事结构');
        lines.push('结构先于镜头。先有段落骨架，再往骨架里填卡；反过来做会得到拼接而非片子。');
        lines.push('');
        lines.push(
          '读这些：`structure-bible`（叙事形状）· `narrative-templates`（段落模板）· '
          + '`beat-scaffold`（节拍骨架）· `visual-grammar`（句子 → 镜头）',
        );
        lines.push('');
      }

      // 第四步：镜头
      if ((full || stage === 'shot' || shotCategory !== '') && topic === '' && family === '') {
        lines.push('## 四 · 怎么拍 —— 镜头动作');
        lines.push('按功能选卡，每段 1–2 张。堆得越多越乱。');
        lines.push('');
        for (const item of tree.shotCategories) {
          if (shotCategory !== '' && item.category !== shotCategory) continue;
          lines.push(`**${item.category}**（${item.count}）`);
          for (const card of item.cards) {
            const use = card.use ? String(card.use).split('；')[0].slice(0, 34) : '';
            lines.push(`- \`${card.name}\`${use ? ` — ${use}` : ''}`);
          }
          lines.push('');
        }
        if (shotCategory !== '' && !tree.shotCategories.some((item) => item.category === shotCategory)) {
          lines.push(`没有「${shotCategory}」这个镜头类别。`);
          lines.push(`可选：${tree.shotCategories.map((item) => item.category).join(' · ')}`);
          lines.push('要按用途找卡，用 video_shot_search({ query })，它按语义搜。');
          lines.push('');
        }
      }

      // 第五步：动效
      if (full || stage === 'motion') {
        lines.push('## 五 · 怎么动 —— 让它不干巴巴');
        lines.push('镜头卡给的是动作骨架；动效方法给让动作有质感的具体数值：缓动曲线、时长、错峰、过冲。');
        lines.push('');
        lines.push(
          '读这些：`animation-principles`（缓动与时长，含 cubic-bezier 数值）· '
          + '`motion-art-direction`（哪些元素该动）· `shot-composition`（构图机位）· '
          + '`beat-sync-editing`（卡拍剪辑）',
        );
        lines.push('');
      }

      // 第六步：全部方法文档
      //
      // 这份清单是动态的：从索引读，不是硬编码。之前只列固定 8 篇，
      // 后来新收的运镜库、节奏规程、类型片 SOP 全都没有入口——收了等于没收。
      if (full || stage === 'method') {
        lines.push('## 六 · 方法文档全表');
        lines.push('按用途分组。读哪篇用 `video_craft_read({ id })`，id 就是下面反引号里的。');
        lines.push('');
        const groups = await loadMethodCatalog();
        for (const group of groups) {
          if (group.items.length === 0) continue;
          lines.push(`**${group.title}（${group.items.length}）**`);
          lines.push(group.items.map((item) => `\`${item.id}\` ${item.name}`).join(' · '));
          lines.push('');
        }
      }

      if (full) {
        lines.push('---');
        lines.push('');
        lines.push('**开工前先读规程**：`video_craft_read({ id: "video-styles/craft/production-protocol" })`');
        lines.push('它规定了调用顺序、验收标准和交付要求，跳过它是视频做得「干巴巴」的最常见原因。');
        lines.push('');
        lines.push('**下一步**：从「一」挑一个题材，然后按顺序往下走。');
        lines.push(
          '读风格 `video_style_read({ key })` · 读镜头 `video_shot_read({ name })` · '
          + '读方法 `video_craft_read({ id })`',
        );
      }

      return lines.join('\n');
    },
  };
}

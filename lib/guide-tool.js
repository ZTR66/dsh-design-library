/**
 * The `video_guide` tool definition.
 *
 * Kept in its own module rather than inline in `index.js` because the body is
 * mostly prose — the five design stages and the map format — and prose buried
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

import { buildNavigationTree } from './navigate.js';

/** Build the tool spec. `deps` supplies the two data loaders. */
export function videoGuideSpec(deps) {
  const { loadVideoCatalog, loadShotCatalog } = deps;

  return {
    name: 'video_guide',
    description: [
      'Show the whole video library as a map, before searching anything.',
      '',
      'Call this FIRST when making a video. Search tools only answer a question you already know how to',
      'ask; this one shows what exists, so you can pick a class instead of guessing keywords. A guessed',
      'multi-word query usually returns nothing, because the library is organised by class.',
      '',
      'It returns the five design stages in order — subject → style → structure → shots → motion — plus',
      'the 44 styles grouped by subject area and by visual family, and the 124 shot cards grouped by what',
      'they do. Pick a direction from the map, then call the matching read tool.',
      '',
      'Pass `stage`, `topic`, `family` or `shotCategory` to list just that group. No arguments returns it all.',
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

      const counts = tree.counts;
      const lines = [];
      lines.push(
        `# 视频库导航 — ${counts.styles} 风格 · ${counts.shotCards} 镜头卡 · `
        + `${counts.families} 视觉家族 · ${counts.shotCategories} 镜头类别`,
      );
      lines.push('');
      lines.push('按顺序走完五步。跳步是"干巴巴"的主要来源。');
      lines.push('');

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

      if (full) {
        lines.push('---');
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

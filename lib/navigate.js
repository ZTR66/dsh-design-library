/**
 * Navigation tree for the video library.
 *
 * The problem this solves is visibility, not search.
 *
 * A model that has never seen this library knows it has tools called
 * `video_style_search` and `video_shot_search`, but not what is in them. Its
 * natural move is to guess keywords — and because `query` requires every term to
 * match, a guessed multi-word query usually returns nothing. In one recorded
 * session that produced four failures out of nine calls: two searches returned
 * zero because of multi-word AND, and two document reads failed because the model
 * invented an id shape.
 *
 * A catalogue that can be *seen* removes the guessing. One call returns the whole
 * map — how many entries exist, what the classes are, what lives in each — so the
 * model can pick a class instead of inventing a keyword.
 *
 * The tree is derived from the shipped data rather than hand-written, so it
 * cannot drift out of sync with what is actually installed.
 */

/**
 * The five stages a video is designed through, in order.
 *
 * This mirrors how the work actually happens — decide the subject, pick the
 * visual language, plan the structure, choose the shots, settle the motion — and
 * a model that walks the stages in order produces a coherent film rather than a
 * pile of effects.
 */
export const STAGES = [
  {
    id: 'topic',
    zh: '讲什么',
    en: 'Subject',
    question: '这支片子在讲什么内容？观众看完要记住哪一件事？',
    leads: '先定题材，题材会约束后面所有选择：历史事件不该用霓虹赛博，数学推导不该用综艺花字。',
    next: 'style',
  },
  {
    id: 'style',
    zh: '什么风格',
    en: 'Visual language',
    question: '用哪种视觉语言讲？',
    leads: '风格决定色板、字体、动效质感。44 个风格各有 fit（适合题材），按题材筛，不要凭喜好挑。',
    next: 'structure',
  },
  {
    id: 'structure',
    zh: '怎么排',
    en: 'Structure',
    question: '段落怎么切？开场留多久？几拍之后到高潮？',
    leads: '结构先于镜头。先有骨架，再往骨架里填卡；反过来做会得到一段拼接而非一支片子。',
    next: 'shot',
  },
  {
    id: 'shot',
    zh: '怎么拍',
    en: 'Shots',
    question: '每个段落用哪几个镜头动作？',
    leads: '按功能选卡：机器怎么动、元素怎么出现、字怎么进场、怎么强调。每段 1–2 张卡，不要堆。',
    next: 'motion',
  },
  {
    id: 'motion',
    zh: '怎么动',
    en: 'Motion',
    question: '缓动、时长、错峰、过冲的具体数值是多少？',
    leads: '这是让片子不"干巴巴"的一层。卡片给的是动作骨架，动效方法给的是让它有质感的具体参数。',
    next: null,
  },
];

/**
 * Subject areas, with the words that place a style in them.
 *
 * Two rules learned by running this over the real catalogue:
 *
 * 1. **`fit` decides, nothing else.** The first version also scanned the
 *    description and tone, which put 古风 under 纪实 because its description
 *    mentions 人群剪影 — a word that says nothing about what the film is about.
 *    `fit` is the field that states the intended subject; the others describe
 *    execution.
 * 2. **Match the whole word, not a character.** Bare substrings sent 古风 into
 *    纪实 through 事件 and 青花 into 人文 through 化. Every term below is at least
 *    two characters and specific enough to mean what it says.
 */
const TOPIC_WORDS = {
  历史: ['历史', '古代', '朝代', '变法', '起义', '史料', '丝路', '明清', '百年前', '电影史', '老历史', '革命', '文献', '考古'],
  科技: ['科技', 'AI', '互联网', '未来', '赛博', '数学', '物理', '公式', '推导', '统计', '发明', '电脑史', '产品', '机制', '原理', '结构', '系统'],
  人文: ['诗词', '文学', '文化', '哲学', '汉字', '人文', '深度解读', '艺术', '小众', '器物', '博物学', '东亚', '观点', '金句', '概念'],
  商业: ['职场', '心理', '消费', '潮流', '设计史', '经济', '社会', '流程', '演化', '阶段', '策略', '博弈', '力量对比', '数量', '人口', '对比'],
  纪实: ['热点', '快讯', '数据新闻', '调查', '考证', '复盘', '辟谣', '悬案', '爆料', '反转', '事件复盘', '史料考证'],
  教育: ['科普', '冷知识', '考试题型', '方法论', '学习方法', '生活技巧', '闯关', '一步步讲清', '讲解', '推导', '公式', '年轻受众'],
  游戏: ['游戏化', '闯关', 'RPG', '卡牌', '博弈', '像素', '经营'],
  情绪: ['儿童', '萌宠', '轻松', '女性向', '怀旧', '网络梗', '萌'],
};

/**
 * Group the 44 styles into the subject areas they serve.
 *
 * A style can land in more than one area — 粉笔黑板 serves both 科技 (物理公式)
 * and 教育 (一步步讲清) — and that is correct: forcing one home per style would
 * hide it from the other query that should find it.
 */
export function groupStylesByTopic(styles) {
  const groups = new Map();
  for (const [topic, words] of Object.entries(TOPIC_WORDS)) groups.set(topic, []);

  for (const style of styles) {
    // Only `fit` decides: it is the field that states the intended subject.
    // Description, tone and name describe how the style looks, and matching on
    // them put 古风 under 纪实 via a word about silhouettes.
    const haystack = String(style.fit ?? '');
    let placed = false;
    for (const [topic, words] of Object.entries(TOPIC_WORDS)) {
      if (words.some((word) => haystack.includes(word))) {
        groups.get(topic).push(style);
        placed = true;
      }
    }
    // A style that matches no subject word still has to be reachable; the family
    // it belongs to is the best available answer.
    if (!placed) groups.get('人文').push(style);
  }

  for (const list of groups.values()) {
    list.sort((a, b) => a.no - b.no);
  }
  return groups;
}

/** One line describing a style, short enough to fit a 44-row listing. */
export function styleLine(style) {
  const tier = style.tier === '增强' ? ' · 增强档' : '';
  return `${style.key} · ${style.name}${tier} · ${String(style.fit ?? '').split('·')[0].trim()}`;
}

/** One line describing a shot card. */
export function shotLine(card) {
  const use = String(card.use ?? '').split('；')[0].trim();
  return `${card.name} · ${use || String(card.summary ?? '').slice(0, 40)}`;
}

/**
 * Build the complete navigation tree.
 *
 * @param {object} data `{ styles, shotCards, craftDocs, motionDocs }`.
 * @returns {object} the tree, ready to format or serve as JSON.
 */
export function buildNavigationTree(data) {
  const styles = Array.isArray(data?.styles) ? data.styles : [];
  const cards = Array.isArray(data?.shotCards) ? data.shotCards : [];

  const byFamily = new Map();
  for (const style of styles) {
    const family = String(style.fam ?? style.cat ?? '其他');
    if (!byFamily.has(family)) byFamily.set(family, []);
    byFamily.get(family).push(style);
  }

  const byCategory = new Map();
  for (const card of cards) {
    const category = String(card.category ?? '其他');
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(card);
  }

  const byTopic = groupStylesByTopic(styles);

  return {
    counts: {
      styles: styles.length,
      shotCards: cards.length,
      craftDocs: Array.isArray(data?.craftDocs) ? data.craftDocs.length : 0,
      motionDocs: Array.isArray(data?.motionDocs) ? data.motionDocs.length : 0,
      families: byFamily.size,
      shotCategories: byCategory.size,
    },
    stages: STAGES,
    topics: [...byTopic.entries()]
      .filter(([, list]) => list.length > 0)
      .map(([topic, list]) => ({
        topic,
        count: list.length,
        styles: list.map((style) => ({ key: style.key, name: style.name, fit: style.fit })),
      })),
    families: [...byFamily.entries()].map(([family, list]) => ({
      family,
      count: list.length,
      styles: list.map((style) => ({ key: style.key, name: style.name, one: style.one })),
    })),
    shotCategories: [...byCategory.entries()].map(([category, list]) => ({
      category,
      count: list.length,
      cards: list.map((card) => ({ name: card.name, use: card.use, duration: card.duration })),
    })),
  };
}

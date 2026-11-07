/**
 * Client half of dsh-design-library.
 *
 * A browser artifact loaded through the host's module loader. It registers one
 * sidebar entry and the panel behind it, plus a compact "insert" control in the
 * composer and a settings page.
 *
 * Three rules shape this file:
 *
 *   - **No Harness Client package is imported.** `dsh.client.inject` only orders
 *     activation. Requiring a client package here would tie the plugin to
 *     internal modules that change without notice and blank the slot entry when
 *     they do. React comes from the browser module table; everything else is
 *     plain DOM and the host's theme tokens.
 *   - **Styles are theme tokens only.** Literal colors appear nowhere except the
 *     swatches that are themselves design data. A renamed token degrades
 *     appearance; a hard-coded color breaks in the other theme.
 *   - **Every registration is disposed.** Slots, listeners and timers live in
 *     `apply` and are returned as cleanup, so unloading the plugin leaves no
 *     residue in the page.
 */

window.__ModuleLoader__.load({
  // Must equal the package name: the loader keys its module table by this id and
  // the host wires `dsh.client` to the same package, so a mismatch leaves the
  // entry registered but never loaded.
  id: '@ztr66/dsh-design-library',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'design-library';
    const PANEL_ID = 'design-library';
    const API = '/design-skills';

    /**
     * The running bundle's own version marker.
     *
     * Rendered in the panel header so a report can be matched to the code that
     * produced it. It is a literal in this file, so if the header shows an older
     * value than this constant the browser is running an older bundle — which is
     * exactly the failure that made three rounds of fixes look ineffective
     * while the page kept executing the first build.
     */
    const CODE_VERSION = 'c6';

    // ---------------------------------------------------------------------
    // Copy
    // ---------------------------------------------------------------------

    /**
     * The interface language follows the page, not the plugin: a Chinese shell
     * should get Chinese here. Static import of the host locale service is not
     * available in this artifact, so the document language decides once.
     */
    function detectZh() {
      const tag = typeof document !== 'undefined' ? (document?.documentElement?.lang ?? '') : '';
      if (/^zh(-|$)/i.test(tag)) return true;
      if (tag !== '' && !/^en(-|$)/i.test(tag)) return false;
      const languages = typeof navigator !== 'undefined' ? (navigator.languages || navigator.language) : '';
      const first = Array.isArray(languages) ? languages[0] : languages;
      return typeof first === 'string' && /^zh(-|$)/i.test(first);
    }

    const zh = detectZh();

    const COPY = zh
      ? {
          nav: '设计库',
          title: '设计库',
          subtitle: '浏览并插入本地设计规范，也可以让 Agent 自己挑',
          search: '搜索设计…',
          allSources: '全部来源',
          allKinds: '全部类型',
          designs: '设计规范',
          skills: '技能',
          entries: '条目',
          empty: '没有匹配的条目',
          emptyHint: '换个关键词，或把来源切回「全部来源」。',
          loading: '正在读取设计库…',
          failed: '读不到设计库',
          retry: '重新扫描',
          scanFailed: '扫描失败',
          overview: '概览',
          document: '正文',
          tokens: '变量',
          colors: '颜色',
          typography: '字体层级',
          spacing: '间距',
          radius: '圆角',
          extracted: '正文中出现的颜色（非声明色板）',
          sections: '章节',
          insert: '插入到对话',
          inserted: '已插入到输入框',
          insertFailed: '这里没法插入，已复制到剪贴板',
          copy: '复制',
          copied: '已复制',
          external: '外部来源',
          externalHint: '这些来源没有声明可再分发的许可，因此不内置。点开去原仓库查看。',
          license: '许可',
          source: '来源',
          unavailable: '设计库暂不可用',
          unavailableHint: '插件已加载，但读不到任何设计文档。到设置里检查扫描目录。',
          review: '评审',
          reviewing: '正在评审…',
          reviewClean: '没有发现可计算的问题',
          settings: '设计库',
          settingsHint: '管理扫描目录与技能注册',
          roots: '扫描目录',
          rootsHint: '除内置的 290 份设计外，额外扫描这些本地目录。',
          addRoot: '添加目录',
          remove: '移除',
          skillMode: '技能注册',
          modeCurated: '精选（推荐）',
          modeAll: '全部',
          modeOff: '关闭',
          modeHint: '精选只注册最有用的一批技能，避免占满模型的提示空间。',
          stats: '统计',
          total: '条目',
          unique: '去重后',
          dupe: '重复',
          scanTime: '扫描于',
          close: '关闭',
        }
      : {
          nav: 'Design library',
          title: 'Design library',
          subtitle: 'Browse and insert local design systems, or let the agent pick one itself',
          search: 'Search designs…',
          allSources: 'All sources',
          allKinds: 'All kinds',
          designs: 'Design systems',
          skills: 'Skills',
          entries: 'entries',
          empty: 'Nothing matches',
          emptyHint: 'Try a broader word, or switch the source filter back to All sources.',
          loading: 'Reading the design library…',
          failed: 'The design library could not be read',
          retry: 'Rescan',
          scanFailed: 'Scan failed',
          overview: 'Overview',
          document: 'Document',
          tokens: 'Tokens',
          colors: 'Colors',
          typography: 'Typography',
          spacing: 'Spacing',
          radius: 'Radius',
          extracted: 'Colors mentioned in the text (not a declared palette)',
          sections: 'Sections',
          insert: 'Insert into chat',
          inserted: 'Inserted into the composer',
          insertFailed: 'Could not insert here; copied to the clipboard instead',
          copy: 'Copy',
          copied: 'Copied',
          external: 'External sources',
          externalHint: 'These sources declare no redistributable license, so their text is not bundled. They open on GitHub.',
          license: 'License',
          source: 'Source',
          unavailable: 'Design library unavailable',
          unavailableHint: 'The plugin loaded but found no design documents. Check the scan roots in settings.',
          review: 'Review',
          reviewing: 'Reviewing…',
          reviewClean: 'No computed problems found',
          settings: 'Design library',
          settingsHint: 'Scan roots and skill registration',
          roots: 'Scan roots',
          rootsHint: 'Extra local directories to scan, beyond the 290 bundled documents.',
          addRoot: 'Add directory',
          remove: 'Remove',
          skillMode: 'Skill registration',
          modeCurated: 'Curated (recommended)',
          modeAll: 'All',
          modeOff: 'Off',
          modeHint: 'Curated registers only the most useful skills, so the model\'s prompt space is not spent on near-duplicates.',
          stats: 'Statistics',
          total: 'entries',
          unique: 'unique',
          dupe: 'duplicate',
          scanTime: 'scanned',
          close: 'Close',
        };

    // The slot rows below pass `locale: NS`, so the shell resolves their labels
    // and accessible names through this namespace. It must be registered before
    // any row that points at it renders; these two dictionaries are the subset
    // the slot layer asks for, and the full COPY tables above drive the panel
    // body itself.
    const COPY_ZH = { nav: '设计库', settings: '设计库', title: '设计库' };
    const COPY_EN = { nav: 'Design library', settings: 'Design library', title: 'Design library' };

    // ---------------------------------------------------------------------
    // Shared styles, built from theme tokens
    // ---------------------------------------------------------------------

    const S = {
      panel: {
        fontFamily: 'Inter, var(--dsw-font-family), system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        color: 'var(--dsw-alias-label-primary)',
        background: 'var(--dsw-alias-bg-base)',
      },
      header: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '16px 20px 12px',
        borderBottom: '1px solid var(--dsw-alias-border-l1)',
      },
      titleRow: { display: 'flex', alignItems: 'baseline', gap: 10 },
      title: { fontSize: 16, fontWeight: 600, margin: 0 },
      subtitle: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' },
      body: { display: 'flex', flex: 1, minHeight: 0 },
      sidebar: {
        width: 340,
        flex: '0 0 340px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        borderRight: '1px solid var(--dsw-alias-border-l1)',
      },
      filters: { display: 'flex', gap: 8, padding: '12px 12px 4px' },
      input: {
        flex: 1,
        minWidth: 0,
        padding: '8px 12px',
        minHeight: 34,
        boxSizing: 'border-box',
        fontSize: 13,
        color: 'var(--dsw-alias-label-primary)',
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 6,
        outline: 'none',
        fontFamily: 'inherit',
      },
      select: {
        padding: '6px 8px',
        fontSize: 12,
        color: 'var(--dsw-alias-label-primary)',
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 6,
        maxWidth: 150,
      },
      list: { flex: 1, overflowY: 'auto', padding: '4px 8px 16px', minHeight: 0 },
      row: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        padding: '8px 10px 8px 12px',
        margin: '4px 0',
        textAlign: 'left',
        color: 'inherit',
        // Selection is drawn with a background and a left accent bar, never a
        // border. Borders made "which row is selected" ambiguous the moment a
        // host or browser style contributed one of its own; a background fill
        // plus an inset bar cannot be confused with any inherited outline.
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        font: 'inherit',
        appearance: 'none',
        WebkitAppearance: 'none',
      },
      rowActive: {
        background: 'var(--dsw-alias-bg-layer-1)',
        boxShadow: 'inset 3px 0 0 0 var(--dsw-alias-brand-primary)',
      },
      rowName: { fontSize: 13, fontWeight: 500, lineHeight: 1.35, wordBreak: 'break-word' },
      rowMeta: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.4, wordBreak: 'break-word' },
      swatches: { display: 'flex', gap: 2, marginTop: 4, flexWrap: 'wrap' },
      swatch: { width: 10, height: 10, borderRadius: 3, border: '1px solid var(--dsw-alias-border-l1)' },
      detail: { flex: 1, minWidth: 0, overflowY: 'auto', padding: '16px 24px 40px' },
      h2: { fontSize: 18, fontWeight: 600, margin: '0 0 4px' },
      metaLine: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 12 },
      tabs: { display: 'flex', gap: 4, borderBottom: '1px solid var(--dsw-alias-border-l1)', marginBottom: 16 },
      tab: {
        padding: '6px 12px',
        fontSize: 13,
        color: 'var(--dsw-alias-label-secondary)',
        background: 'transparent',
        border: 'none',
        borderBottom: '2px solid transparent',
        cursor: 'pointer',
        font: 'inherit',
      },
      tabActive: { color: 'var(--dsw-alias-label-primary)', borderBottomColor: 'var(--dsw-alias-brand-primary)' },
      button: {
        padding: '6px 12px',
        fontSize: 13,
        color: 'var(--dsw-alias-label-primary)',
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 6,
        cursor: 'pointer',
        font: 'inherit',
      },
      buttonPrimary: {
        padding: '6px 12px',
        fontSize: 13,
        color: 'var(--dsw-alias-label-primary)',
        background: 'var(--dsw-alias-bg-layer-1)',
        border: '1px solid var(--dsw-alias-brand-primary)',
        borderRadius: 6,
        cursor: 'pointer',
        font: 'inherit',
      },
      grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 },
      colorCard: {
        padding: 8,
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        font: 'inherit',
        color: 'inherit',
      },
      colorChip: { height: 32, borderRadius: 5, marginBottom: 6, border: '1px solid var(--dsw-alias-border-l1)' },
      mono: { fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: 'var(--dsw-alias-label-secondary)' },
      table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
      th: { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--dsw-alias-border-l1)', color: 'var(--dsw-alias-label-secondary)', fontWeight: 500 },
      td: { padding: '6px 8px', borderBottom: '1px solid var(--dsw-alias-border-l1)', verticalAlign: 'top' },
      pre: {
        padding: 12,
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        maxHeight: 'none',
        margin: 0,
      },
      note: {
        padding: 12,
        fontSize: 13,
        color: 'var(--dsw-alias-label-secondary)',
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        lineHeight: 1.6,
      },
      error: {
        padding: 12,
        fontSize: 13,
        color: 'var(--dsw-alias-label-primary)',
        background: 'var(--dsw-alias-bg-layer-2)',
        border: '1px solid var(--dsw-alias-state-error-primary)',
        borderRadius: 8,
        lineHeight: 1.6,
      },
      badge: {
        display: 'inline-block',
        padding: '1px 6px',
        fontSize: 10,
        borderRadius: 999,
        border: '1px solid var(--dsw-alias-border-l1)',
        color: 'var(--dsw-alias-label-secondary)',
      },
    };

    // ---------------------------------------------------------------------
    // Data access
    // ---------------------------------------------------------------------

    /** One index fetch shared by every surface; null while loading or on error. */
    function createStore() {
      const state = { index: null, loading: false, error: null, listeners: new Set() };
      const emit = () => { for (const listener of state.listeners) listener(); };
      const load = async (force) => {
        if (state.loading) return;
        state.loading = true;
        state.error = null;
        emit();
        try {
          const response = await fetch(`${API}/index${force ? '?refresh=1' : ''}`, { credentials: 'same-origin', cache: 'no-store' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const body = await response.json();
          state.index = body;
        }
        catch (error) {
          state.error = String(error?.message ?? error);
        }
        finally {
          state.loading = false;
          emit();
        }
      };
      return {
        get: () => state,
        load,
        subscribe(listener) {
          state.listeners.add(listener);
          return () => state.listeners.delete(listener);
        },
      };
    }

    /**
     * Read the store, creating it once per component instance.
     *
     * The store must be created in a `useRef` initializer, not during render:
     * React calls a render function more than once (StrictMode, and any
     * re-render), and `createStore()` inside the body made a *second* store
     * while the hooks had already subscribed to the first. The panel then read
     * one store and handed another to its children, so a click updated one
     * instance's state while the list rendered from a different one — selection
     * appeared on the wrong row, stayed on old rows, and looked like multiple
     * rows could be selected at once.
     */
    function useDesignStore() {
      const ref = React.useRef(null);
      if (ref.current === null) ref.current = createStore();
      return ref.current;
    }

    function useStore(store) {
      const [, force] = React.useReducer((value) => value + 1, 0);
      React.useEffect(() => store.subscribe(force), [store]);
      React.useEffect(() => { if (store.get().index === null && !store.get().loading) store.load(false); }, [store]);
      return store.get();
    }

    /** Fetch one document body on demand; the index never carries file bytes. */
    function useDocument(id) {
      const [state, setState] = React.useState({ loading: false, content: null, error: null });
      React.useEffect(() => {
        if (id === null) return undefined;
        let live = true;
        setState({ loading: true, content: null, error: null });
        fetch(`${API}/doc?id=${encodeURIComponent(id)}`, { credentials: 'same-origin', cache: 'no-store' })
          .then((response) => response.json())
          .then((body) => { if (live) setState({ loading: false, content: body?.content ?? null, error: body?.ok === false ? body.error : null }); })
          .catch((error) => { if (live) setState({ loading: false, content: null, error: String(error?.message ?? error) }); });
        return () => { live = false; };
      }, [id]);
      return state;
    }

    // ---------------------------------------------------------------------
    // Small pieces
    // ---------------------------------------------------------------------

    function Swatches({ colors, limit = 8 }) {
      if (!colors) return null;
      const values = Object.values(colors).slice(0, limit);
      if (values.length === 0) return null;
      return h('div', { style: S.swatches },
        values.map((value, index) => h('span', {
          key: `${value}-${index}`,
          style: { ...S.swatch, background: value },
          title: value,
        })));
    }

    function CopyButton({ value, label }) {
      const [done, setDone] = React.useState(false);
      return h('button', {
        type: 'button',
        style: S.button,
        title: value,
        onClick: async () => {
          try {
            await navigator.clipboard.writeText(value);
            setDone(true);
            setTimeout(() => setDone(false), 1200);
          }
          catch { /* clipboard unavailable; the title still shows the value */ }
        },
      }, done ? COPY.copied : (label ?? COPY.copy));
    }

    function Tabs({ tabs, active, onSelect }) {
      return h('div', { style: S.tabs },
        tabs.map((tab) => h('button', {
          key: tab.id,
          type: 'button',
          style: { ...S.tab, ...(tab.id === active ? S.tabActive : null) },
          onClick: () => onSelect(tab.id),
        }, tab.label)));
    }

    // ---------------------------------------------------------------------
    // Detail view
    // ---------------------------------------------------------------------

    function TokensView({ entry }) {
      const blocks = [];

      const colorEntries = entry.colors ? Object.entries(entry.colors) : [];
      if (colorEntries.length > 0) {
        const cards = colorEntries.map(([token, value]) => h('button', {
          key: token,
          type: 'button',
          style: S.colorCard,
          title: `${token}: ${value}`,
          onClick: () => { navigator.clipboard?.writeText(String(value)).catch(() => {}); },
        }, [
          h('div', { key: 'chip', style: { ...S.colorChip, background: String(value) } }),
          h('div', { key: 'name', style: { fontSize: 12, fontWeight: 500, wordBreak: 'break-word' } }, token),
          h('div', { key: 'value', style: S.mono }, String(value)),
        ]));

        blocks.push(h('section', { key: 'colors', style: { marginBottom: 24 } }, [
          h('h3', { key: 'h', style: { ...S.h2, fontSize: 14, marginBottom: 8 } }, COPY.colors),
          h('div', { key: 'grid', style: S.grid }, cards),
        ]));
      }

      if (entry.extracted?.colors) {
        const chips = entry.extracted.colors.map((value, index) => h('span', {
          key: `${value}-${index}`,
          style: { ...S.swatch, width: 20, height: 20, background: value },
          title: value,
        }));
        blocks.push(h('section', { key: 'extracted', style: { marginBottom: 24 } }, [
          h('h3', { key: 'h', style: { ...S.h2, fontSize: 14, marginBottom: 8 } }, COPY.extracted),
          h('div', { key: 'chips', style: S.swatches }, chips),
        ]));
      }

      if (entry.typography && entry.typography.length > 0) {
        const fields = [...new Set(entry.typography.flatMap((row) => Object.keys(row).filter((key) => key !== 'role')))];
        const headRow = h('tr', { key: 'head' }, [
          h('th', { key: 'role', style: S.th }, 'role'),
          ...fields.map((field) => h('th', { key: field, style: S.th }, field)),
        ]);
        const bodyRows = entry.typography.map((row, index) => h('tr', { key: `${row.role}-${index}` }, [
          h('td', { key: 'role', style: { ...S.td, fontWeight: 500 } }, row.role),
          ...fields.map((field) => h('td', { key: field, style: S.td }, row[field] ?? '—')),
        ]));
        blocks.push(h('section', { key: 'type', style: { marginBottom: 24 } }, [
          h('h3', { key: 'h', style: { ...S.h2, fontSize: 14, marginBottom: 8 } }, COPY.typography),
          h('table', { key: 'table', style: S.table }, [
            h('thead', { key: 'thead' }, headRow),
            h('tbody', { key: 'tbody' }, bodyRows),
          ]),
        ]));
      }

      for (const [key, label] of [['spacing', COPY.spacing], ['rounded', COPY.radius]]) {
        const scale = entry[key];
        if (!scale || Object.keys(scale).length === 0) continue;
        const rows = Object.entries(scale).map(([name, value]) => h('tr', { key: name }, [
          h('td', { key: 'name', style: S.td }, name),
          h('td', { key: 'value', style: S.mono }, String(value)),
        ]));
        blocks.push(h('section', { key, style: { marginBottom: 24 } }, [
          h('h3', { key: 'h', style: { ...S.h2, fontSize: 14, marginBottom: 8 } }, label),
          h('table', { key: 'table', style: S.table }, h('tbody', null, rows)),
        ]));
      }

      if (blocks.length === 0) {
        blocks.push(h('div', { key: 'none', style: S.note },
          zh ? '这份文档没有结构化变量，切到「正文」看完整说明。' : 'This document declares no structured tokens. Open the Document tab to read it.'));
      }
      return h('div', null, blocks);
    }

    function DocumentView({ entry }) {
      const [expanded, setExpanded] = React.useState(false);
      const doc = useDocument(expanded ? entry.id : null);
      if (!expanded) {
        return h('div', null,
          h('div', { style: { ...S.note, marginBottom: 12 } },
            zh ? `正文约 ${Math.round(entry.bytes / 1024)} KB，按需加载。` : `About ${Math.round(entry.bytes / 1024)} KB; loaded on demand.`),
          h('button', { type: 'button', style: S.buttonPrimary, onClick: () => setExpanded(true) },
            zh ? '载入正文' : 'Load document'));
      }
      if (doc.loading) return h('div', { style: S.note }, COPY.loading);
      if (doc.error !== null) return h('div', { style: S.error }, doc.error);
      return h('pre', { style: S.pre }, doc.content ?? '');
    }

    /** One review result: a verdict line, then the findings it computed. */
    function ReviewResult({ review, scope }) {
      if (review.ok === false) {
        return h('div', { style: { ...S.error, marginTop: 16 } }, review.error);
      }
      const summary = review.summary ?? { errors: 0, warnings: 0 };
      const findings = review.findings ?? [];
      const notes = review.notes ?? [];
      const design = review.design;

      const clean = summary.errors === 0 && summary.warnings === 0;
      const tone = summary.errors > 0
        ? 'var(--dsw-alias-state-error-primary)'
        : summary.warnings > 0
          ? 'var(--dsw-alias-state-warn-primary)'
          : 'var(--dsw-alias-brand-primary)';

      const verdict = clean
        ? (zh ? '没有可计算的问题' : 'No computed problems')
        : (zh
          ? `${summary.errors} 个错误 · ${summary.warnings} 个警告`
          : `${summary.errors} error(s) · ${summary.warnings} warning(s)`);

      return h('div', {
        style: {
          marginTop: 16,
          padding: 14,
          border: `1px solid ${tone}`,
          borderRadius: 10,
          background: 'var(--dsw-alias-bg-layer-2)',
        },
      }, [
        h('div', {
          key: 'verdict',
          style: { display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
        }, [
          h('span', {
            key: 'text',
            style: { fontSize: 13, fontWeight: 600, color: tone },
          }, verdict),
          design
            ? h('span', {
                key: 'meta',
                style: { ...S.mono, fontSize: 11, opacity: 0.6 },
              }, `${design.paletteSize} ${zh ? '色' : 'colors'} · ${design.typographyRoles} ${zh ? '字体层级' : 'type roles'}`)
            : null,
        ]),
        findings.length > 0
          ? h('ul', {
              key: 'list',
              style: {
                margin: "12px 0 0 18px",
                padding: 0,
                fontSize: 12,
                lineHeight: 1.7,
              },
            }, findings.slice(0, 8).map((finding, index) => h('li', {
              key: index,
              style: {
                color: finding.severity === 'error'
                  ? 'var(--dsw-alias-state-error-primary)'
                  : 'var(--dsw-alias-label-primary)',
              },
            }, finding.message)))
          : null,
        notes.length > 0
          ? h('div', {
              key: 'notes',
              style: {
                ...S.mono,
                fontSize: 11,
                marginTop: 10,
                opacity: 0.65,
                lineHeight: 1.6,
              },
            }, notes.join(' '))
          : null,
        // Say what was judged. "No computed problems" means different things for
        // the design system itself and for a pasted snippet, and this line is the
        // only place that distinction is visible.
        h('div', {
          key: 'scope',
          style: {
            fontSize: 11,
            marginTop: 10,
            opacity: 0.55,
            lineHeight: 1.6,
          },
        }, scope === 'code'
          ? (zh
            ? '评审对象：你粘贴的代码片段。检查其中的颜色、字体族与圆角是否落在规范声明的范围内。'
            : 'Reviewed: the snippet you pasted. Its colors, font families and radii were compared with the system.')
          : (zh
            ? '评审对象：这份设计规范自身。检查它声明的色板对比度与字体族；要审你的代码，粘贴到上面的框里。'
            : 'Reviewed: the design system itself. Its declared palette contrast and families were checked; paste code above to review that instead.')),
      ]);
    }

    function Detail({ entry, onInsert, store }) {
      const [tab, setTab] = React.useState('overview');
      const [review, setReview] = React.useState(null);
      const [reviewing, setReviewing] = React.useState(false);
      const [reviewOpen, setReviewOpen] = React.useState(false);
      const [snippet, setSnippet] = React.useState('');
      const storeState = useStore(store);
      const external = storeState.index?.external ?? [];

      React.useEffect(() => {
        setTab('overview');
        setReview(null);
        setReviewOpen(false);
        setSnippet('');
      }, [entry.id]);

      const isDesign = entry.kind === 'design';
      // How the result was produced, so ReviewResult can say what it judged.
      const [reviewScope, setReviewScope] = React.useState('system');

      const runReview = async (withCode) => {
        const code = withCode ? snippet.trim() : '';
        if (withCode && code === '') return;
        setReviewing(true);
        setReview(null);
        setReviewScope(code === '' ? 'system' : 'code');
        try {
          const response = await fetch(`${API}/review`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              designId: entry.id,
              // No snippets means "check the design system itself", which is
              // what the panel could do before this input existed.
              ...(code !== '' ? { snippets: [code] } : {}),
            }),
          });
          setReview(await response.json());
        }
        catch (error) {
          setReview({ ok: false, error: String(error?.message ?? error) });
        }
        finally {
          setReviewing(false);
        }
      };

      const licenseOf = (folder) => {
        const found = external.find((item) => item.folder === folder);
        return found?.license ?? null;
      };

      const tabs = [
        { id: 'overview', label: COPY.overview },
        { id: 'tokens', label: COPY.tokens },
        { id: 'document', label: COPY.document },
      ];

      return h('div', { style: S.detail },
        h('h2', { style: S.h2 }, entry.name),
        h('div', { style: S.metaLine },
          `${entry.kind === 'design' ? COPY.designs : COPY.skills} · ${entry.folder}`,
          licenseOf(entry.folder) !== null ? ` · ${COPY.license}: ${licenseOf(entry.folder)}` : '',
          entry.origin === 'seed' ? ' · bundled' : ` · ${COPY.source}: ${entry.origin}`),
        h('div', { style: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' } },
          h('button', { type: 'button', style: S.buttonPrimary, onClick: () => onInsert(entry) }, COPY.insert),
          isDesign ? h('button', {
            type: 'button',
            style: reviewOpen ? { ...S.buttonPrimary } : S.button,
            onClick: () => {
              setReviewOpen((open) => {
                if (open) setReview(null);
                return !open;
              });
            },
            title: zh
              ? '检查这份规范，或粘贴一段代码看它是否符合'
              : 'Check this design system, or paste code to test it against',
          }, COPY.review) : null,
          h(CopyButton, { value: entry.id, label: zh ? '复制 id' : 'Copy id' })),

        isDesign && reviewOpen ? h('div', {
          style: {
            marginBottom: 16,
            padding: 14,
            border: '1px solid var(--dsw-alias-border-l1)',
            borderRadius: 10,
            background: 'var(--dsw-alias-bg-layer-2)',
          },
        }, [
          h('div', {
            key: 'hint',
            style: {
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--dsw-alias-label-secondary)',
              marginBottom: 8,
            },
          }, zh
            ? '粘贴 CSS / HTML / JSX，检查它是否符合这份规范；留空则只检查规范自身。'
            : 'Paste CSS / HTML / JSX to test it against this system; leave empty to check the system itself.'),
          h('textarea', {
            key: 'input',
            value: snippet,
            onChange: (event) => setSnippet(event.target.value),
            placeholder: zh
              ? '.btn { color: #ff0000; border-radius: 7px; }'
              : '.btn { color: #ff0000; border-radius: 7px; }',
            spellCheck: false,
            style: {
              width: '100%',
              minHeight: 88,
              padding: 10,
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--dsw-alias-label-primary)',
              background: 'var(--dsw-alias-bg-layer-1)',
              border: '1px solid var(--dsw-alias-border-l1)',
              borderRadius: 8,
              outline: 'none',
            },
          }),
          h('div', {
            key: 'actions',
            style: { display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' },
          }, [
            h('button', {
              key: 'code',
              type: 'button',
              style: {
                ...S.buttonPrimary,
                opacity: (reviewing || snippet.trim() === '') ? 0.5 : 1,
              },
              disabled: reviewing || snippet.trim() === '',
              onClick: () => runReview(true),
            }, reviewing ? COPY.reviewing : (zh ? '评审这段代码' : 'Review this code')),
            h('button', {
              key: 'system',
              type: 'button',
              style: { ...S.button, opacity: reviewing ? 0.6 : 1 },
              disabled: reviewing,
              onClick: () => runReview(false),
            }, zh ? '只检查规范自身' : 'Check the system only'),
            h('button', {
              key: 'close',
              type: 'button',
              style: S.button,
              onClick: () => { setReviewOpen(false); setReview(null); },
            }, COPY.close),
          ]),
          review !== null ? h(ReviewResult, { key: 'result', review, scope: reviewScope }) : null,
        ]) : null,

        h(Tabs, { tabs, active: tab, onSelect: setTab }),

        tab === 'overview' ? h('div', null,
          entry.description !== '' ? h('p', { style: { fontSize: 13, lineHeight: 1.7, marginTop: 0 } }, entry.description) : null,
          entry.colors ? h('div', { style: { marginTop: 8 } }, h(Swatches, { colors: entry.colors, limit: 12 })) : null,
          entry.extracted?.colors ? h('div', { style: { marginTop: 8 } }, h(Swatches, { colors: Object.fromEntries(entry.extracted.colors.map((value, index) => [String(index), value])), limit: 12 })) : null,
          entry.sectionCount > 0 ? h('div', { style: { ...S.metaLine, marginTop: 12 } },
            `${entry.sectionCount} ${COPY.sections.toLowerCase()}`) : null)
          : null,

        tab === 'tokens' ? h(TokensView, { entry }) : null,
        tab === 'document' ? h(DocumentView, { entry }) : null);
    }

    // ---------------------------------------------------------------------
    // Component stylesheet
    // ---------------------------------------------------------------------

    /**
     * The one rule inline styles cannot express: a keyboard focus ring on a list
     * row, but not on a row that was merely tapped.
     *
     * Rendered as a React element so unmounting removes it, and scoped to this
     * plugin by a data attribute so it can never leak onto host controls.
     */
    function PluginStyles() {
      return h('style', {
        'data-plugin': NS,
        dangerouslySetInnerHTML: {
          __html: `[data-dl-root] [role="option"]:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}`,
        },
      });
    }

    // ---------------------------------------------------------------------
    // Error boundary
    // ---------------------------------------------------------------------

    /**
     * Keep one broken render from blanking the whole slot.
     *
     * A slot entry that throws is unmounted by the shell: the user sees an empty
     * panel column and, if the entry was the one behind a sidebar row, a click
     * that appears to do nothing at all. A boundary turns that into a readable
     * message with the error text, which is both a better experience and the only
     * way to diagnose this from a report.
     */
    class PanelBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      componentDidCatch(error) {
        try { console.error('[design-library] panel crashed', error); } catch { /* ignore */ }
      }

      render() {
        if (this.state.error !== null) {
          return h('div', { style: { padding: 20 } },
            h('div', { style: S.error },
              h('strong', null, zh ? '设计库面板出错了' : 'The design library panel crashed'),
              h('div', { style: { ...S.mono, marginTop: 8, whiteSpace: 'pre-wrap' } },
                String(this.state.error?.stack ?? this.state.error)),
              h('div', { style: { marginTop: 12 } },
                h('button', {
                  type: 'button',
                  style: S.buttonPrimary,
                  onClick: () => this.setState({ error: null }),
                }, zh ? '重试' : 'Try again'))));
        }
        return this.props.children;
      }
    }

    // ---------------------------------------------------------------------
    // Main panel
    // ---------------------------------------------------------------------

    /**
     * The right-hand column before anything is selected.
     *
     * Centred invitation, then the sources whose licences forbid bundling. The
     * first version put a heading and three paragraphs of licence text in the
     * largest area of the screen, which read as an error page.
     */
    function EmptyState({ external, zh }) {
      const hint = zh ? '按 / 快速搜索' : 'Press / to search';
      const title = zh ? '挑一个设计规范开始' : 'Pick a design system to start';
      const body = zh
        ? '左边列表里的每一份都带着精确色值、字体层级和间距刻度。'
        : 'Every entry on the left carries exact colors, a type scale and spacing steps.';

      return h('div', { style: S.detail },
        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: '56px 24px 32px',
            textAlign: 'center',
          },
        }, [
          h('svg', {
            key: 'mark',
            viewBox: '0 0 48 48',
            width: 40,
            height: 40,
            'aria-hidden': true,
            style: { color: 'var(--dsw-alias-label-secondary)', opacity: 0.45 },
          }, [
            h('rect', { key: 'a', x: 6, y: 8, width: 16, height: 16, rx: 4, fill: 'currentColor' }),
            h('rect', { key: 'b', x: 27, y: 8, width: 15, height: 9, rx: 4, fill: 'currentColor', opacity: 0.5 }),
            h('rect', { key: 'c', x: 6, y: 29, width: 16, height: 11, rx: 4, fill: 'currentColor', opacity: 0.5 }),
            h('circle', { key: 'd', cx: 34.5, cy: 33, r: 7, fill: 'none', stroke: 'currentColor', strokeWidth: 3 }),
          ]),
          h('div', {
            key: 'title',
            style: { fontSize: 14, color: 'var(--dsw-alias-label-primary)' },
          }, title),
          h('div', {
            key: 'body',
            style: {
              fontSize: 12,
              color: 'var(--dsw-alias-label-secondary)',
              maxWidth: 340,
              lineHeight: 1.6,
            },
          }, body),
          h('div', {
            key: 'hint',
            style: {
              ...S.mono,
              fontSize: 11,
              color: 'var(--dsw-alias-label-secondary)',
            },
          }, hint),
        ]),

        external.length > 0
          ? h('div', {
              key: 'sources',
              style: {
                marginTop: 8,
                paddingTop: 16,
                borderTop: '1px solid var(--dsw-alias-border-l1)',
              },
            }, [
              h('div', {
                key: 'head',
                style: {
                  fontSize: 11,
                  color: 'var(--dsw-alias-label-secondary)',
                  marginBottom: 8,
                },
              }, `${COPY.external} · ${COPY.externalHint}`),
              ...external.map((item) => h('div', {
                key: item.repo,
                style: {
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  padding: '5px 0',
                  fontSize: 12,
                },
              }, [
                h('a', {
                  key: 'repo',
                  href: item.url,
                  target: '_blank',
                  rel: 'noreferrer',
                  style: {
                    color: 'var(--dsw-alias-brand-primary)',
                    textDecoration: 'none',
                  },
                }, item.repo),
                h('span', {
                  key: 'lic',
                  style: { ...S.mono, fontSize: 10, opacity: 0.6 },
                }, item.license),
              ])),
            ])
          : null,
      );
    }
    function Panel() {
      const store = useDesignStore();
      const state = useStore(store);
      const [query, setQuery] = React.useState('');
      const [source, setSource] = React.useState('');
      const [kind, setKind] = React.useState('');
      const [selectedId, setSelectedId] = React.useState(null);
      const [toast, setToast] = React.useState('');
      const searchRef = React.useRef(null);
      const [showDiag, setShowDiag] = React.useState(false);

      React.useEffect(() => {
        const onKey = (event) => {
          if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
          const tag = String(event.target && event.target.tagName || '').toLowerCase();
          if (tag === 'input' || tag === 'textarea' || (event.target && event.target.isContentEditable)) return;
          event.preventDefault();
          if (searchRef.current) searchRef.current.focus();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      }, []);

      const insert = React.useCallback((entry) => {
        const text = `Use this design system: ${entry.name} (design library id: ${entry.id}). Follow its colors, typography, spacing and component rules.`;
        // The host exposes insertQuote on composer-scoped slot props. The panel
        // is root-scoped, so it reaches the composer through the browser's own
        // selection-independent path: a custom event the composer control
        // listens for. Falling back to the clipboard keeps the action useful
        // when no composer is mounted.
        let inserted = false;
        try {
          const event = new CustomEvent('dsh-design-library:insert', { detail: { text }, cancelable: true });
          document.dispatchEvent(event);
          inserted = event.defaultPrevented;
        }
        catch { inserted = false; }
        if (!inserted) {
          navigator.clipboard?.writeText(text).catch(() => {});
        }
        setToast(inserted ? COPY.inserted : COPY.insertFailed);
        setTimeout(() => setToast(''), 2400);
      }, []);

      const index = state.index;
      const entries = index?.entries ?? [];
      const sources = React.useMemo(() => [...new Set(entries.map((entry) => entry.folder))].sort(), [entries]);

      const filtered = React.useMemo(() => {
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        return entries.filter((entry) => {
          if (source !== '' && entry.folder !== source) return false;
          if (kind !== '' && entry.kind !== kind) return false;
          if (terms.length === 0) return true;
          const haystack = `${entry.name}\n${entry.description}\n${entry.id}`.toLowerCase();
          return terms.every((term) => haystack.includes(term));
        });
      }, [entries, query, source, kind]);

      // The highlighted row follows the visible list; the detail column follows
      // the same value, so the two can never disagree.
      const selected = filtered.find((entry) => entry.id === selectedId) ?? null;

      const header = h('div', { style: S.header },
        h('div', { style: S.titleRow },
          h('h1', { style: S.title }, COPY.title),
          index !== null ? h('span', { style: S.badge }, `${index.total} ${COPY.entries}`) : null,
          // The bundle marker: a literal from client.js, not server data, so it
          // reports which build the browser actually executes. Clicking it opens
          // the diagnosis line below — kept behind a press because a raw entry id
          // wraps across the header and is noise for everyday use.
          h('button', {
            type: 'button',
            title: zh ? '查看面板状态' : 'Show panel diagnostics',
            onClick: () => setShowDiag((value) => !value),
            style: {
              ...S.mono,
              opacity: 0.7,
              color: 'inherit',
              background: 'transparent',
              border: '1px solid var(--dsw-alias-border-l1)',
              borderRadius: 4,
              padding: '0 4px',
              cursor: 'pointer',
              font: 'inherit',
            },
          }, CODE_VERSION)),
        h('div', { style: S.subtitle }, COPY.subtitle),
        // Self-diagnosis: which build runs, how many rows are visible, and what
        // the panel believes is selected. Reading state off the screen beats
        // guessing at it from a recording.
        showDiag
          ? h('div', { style: { ...S.mono, opacity: 0.55, wordBreak: 'break-all' }, 'data-dl-diag': '' },
              `rows ${filtered.length} · selected ${selectedId === null ? 'none' : selectedId} · highlighted ${selected !== null ? 'yes' : 'no'}`)
          : null);

      if (state.loading && index === null) {
        return h('div', { style: S.panel }, header, h('div', { style: { padding: 20 } }, h('div', { style: S.note }, COPY.loading)));
      }

      if (state.error !== null && index === null) {
        return h('div', { style: S.panel }, header,
          h('div', { style: { padding: 20 } },
            h('div', { style: S.error }, `${COPY.failed}: ${state.error}`),
            h('div', { style: { marginTop: 12 } },
              h('button', { type: 'button', style: S.buttonPrimary, onClick: () => store.load(true) }, COPY.retry))));
      }

      if (index !== null && index.total === 0) {
        return h('div', { style: S.panel }, header,
          h('div', { style: { padding: 20 } },
            h('div', { style: S.note }, h('strong', null, COPY.unavailable), h('div', { style: { marginTop: 6 } }, COPY.unavailableHint)),
            index.warnings?.length > 0 ? h('div', { style: { ...S.mono, marginTop: 8 } }, index.warnings.join('\n')) : null));
      }

      return h('div', { style: S.panel, 'data-dl-root': '' },
        h(PluginStyles, null),
        header,
        h('div', { style: S.body },
          h('div', { style: S.sidebar },
            h('div', { style: S.filters },
              h('input', {
                ref: searchRef,
                style: S.input,
                placeholder: COPY.search,
                value: query,
                onChange: (event) => setQuery(event.target.value),
                'aria-label': COPY.search,
              })),
            h('div', { style: { ...S.filters, paddingTop: 0 } },
              h('select', { style: S.select, value: kind, onChange: (event) => setKind(event.target.value), 'aria-label': COPY.allKinds },
                h('option', { value: '' }, COPY.allKinds),
                h('option', { value: 'design' }, COPY.designs),
                h('option', { value: 'skill' }, COPY.skills)),
              h('select', { style: S.select, value: source, onChange: (event) => setSource(event.target.value), 'aria-label': COPY.allSources },
                h('option', { value: '' }, COPY.allSources),
                sources.map((folder) => h('option', { key: folder, value: folder }, folder)))),
            h('div', {
              style: S.list,
              role: 'listbox',
              'aria-label': COPY.title,
              'aria-activedescendant': selected !== null ? `dl-row-${selected.id}` : undefined,
            },
              filtered.length === 0
                ? h('div', { style: { ...S.note, margin: 8 } }, h('div', null, COPY.empty), h('div', { style: { marginTop: 4 } }, COPY.emptyHint))
                : filtered.slice(0, 400).map((entry) => h('button', {
                    key: entry.id,
                    id: `dl-row-${entry.id}`,
                    type: 'button',
                    role: 'option',
                    'aria-selected': entry.id === selectedId,
                    tabIndex: entry.id === selectedId ? 0 : -1,
                    style: { ...S.row, ...(entry.id === selectedId ? S.rowActive : null) },
                    onClick: () => setSelectedId(entry.id),
                  },
                  h('div', { style: { flex: 1, minWidth: 0 } },
                    h('div', { style: S.rowName }, entry.name),
                    h('div', { style: S.rowMeta }, `${entry.kind === 'design' ? COPY.designs : COPY.skills} · ${entry.folder}`),
                    h(Swatches, { colors: entry.colors ?? (entry.extracted?.colors ? Object.fromEntries(entry.extracted.colors.map((value, index) => [String(index), value])) : null), limit: 6 })))))),
          selected !== null
            ? h(Detail, { entry: selected, onInsert: insert, store })
            : h(EmptyState, { external: index?.external ?? [], zh })),
        toast !== '' ? h('div', {
          style: {
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            fontSize: 13,
            background: 'var(--dsw-alias-bg-overlay)',
            border: '1px solid var(--dsw-alias-border-l2)',
            borderRadius: 8,
            color: 'var(--dsw-alias-label-primary)',
            zIndex: 40,
          },
        }, toast) : null);
    }

    // ---------------------------------------------------------------------
    // Composer control: insert on request from the panel
    // ---------------------------------------------------------------------

    /**
     * A tiny control in the composer tool row: press it and the design panel
     * opens, so picking a design system while typing is one click away.
     *
     * It also owns the one thing the panel cannot do for itself — write into the
     * draft — because `inputActions` is only supplied to session-scoped slot
     * props, and the panel is root-scoped. The panel announces intent with a DOM
     * event; this component performs the insertion and marks the event handled so
     * the panel knows whether it should fall back to the clipboard.
     *
     * `openPanel` is supplied by `apply` from the layout service. Without it the
     * button still renders, because the sidebar entry is always there.
     */
    function ComposerInsert({ inputActions, openPanel }) {
      React.useEffect(() => {
        const onInsert = (event) => {
          const text = event?.detail?.text;
          if (typeof text !== 'string' || text === '') return;
          let inserted = false;
          try {
            // The return is truthy on success, not strictly `true`; a strict
            // comparison against `true` silently reports every insertion as
            // failed and the panel falls back to the clipboard.
            inserted = Boolean(inputActions?.insertQuote?.(text));
          }
          catch {
            inserted = false;
          }
          // `insertQuote` is only available in plain composer mode. When it
          // refuses, the panel copies to the clipboard instead — retrying on a
          // timer would write the text twice, once to the clipboard and later
          // into the draft.
          if (inserted) event.preventDefault();
        };
        document.addEventListener('dsh-design-library:insert', onInsert);
        return () => document.removeEventListener('dsh-design-library:insert', onInsert);
      }, [inputActions]);

      return h('button', {
        type: 'button',
        title: zh ? '打开设计库，挑一个设计规范' : 'Open the design library and pick a design system',
        'aria-label': zh ? '打开设计库' : 'Open the design library',
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '2px 8px',
          height: 26,
          fontSize: 12,
          color: 'var(--dsw-alias-label-secondary)',
          background: 'transparent',
          border: '1px solid var(--dsw-alias-border-l1)',
          borderRadius: 6,
          cursor: 'pointer',
          font: 'inherit',
        },
        onClick: () => openPanel?.(),
      }, h('span', { 'aria-hidden': true }, '◐'), zh ? '设计' : 'Design');
    }

    // ---------------------------------------------------------------------
    // Settings page
    // ---------------------------------------------------------------------

    /** Fetch the live settings, then keep them locally so a write can be shown. */
    function useSettings() {
      const [state, setState] = React.useState({ loading: true, data: null, error: null });
      const load = React.useCallback(async () => {
        try {
          const response = await fetch(`${API}/settings`, { credentials: 'same-origin', cache: 'no-store' });
          const body = await response.json();
          setState({ loading: false, data: body, error: body.ok === false ? body.error : null });
        }
        catch (error) {
          setState({ loading: false, data: null, error: String(error?.message ?? error) });
        }
      }, []);
      React.useEffect(() => { load(); }, [load]);
      return { ...state, reload: load };
    }

    /** One settings block: a title, an explanation, and whatever it contains. */
    function Section({ title, hint, children }) {
      return h('section', { style: { marginBottom: 28 } },
        h('h3', {
          style: {
            fontSize: 13,
            fontWeight: 600,
            margin: '0 0 4px',
            color: 'var(--dsw-alias-label-primary)',
            letterSpacing: 0.2,
          },
        }, title),
        hint !== undefined ? h('div', {
          style: { fontSize: 12, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)', marginBottom: 12 },
        }, hint) : null,
        children);
    }

    /** A segmented control — the right shape for a three-way choice. */
    function Segmented({ value, options, disabled, onChange }) {
      return h('div', {
        role: 'radiogroup',
        style: {
          display: 'inline-flex',
          padding: 2,
          gap: 2,
          background: 'var(--dsw-alias-bg-layer-2)',
          border: '1px solid var(--dsw-alias-border-l1)',
          borderRadius: 8,
        },
      }, options.map((option) => {
        const active = option.value === value;
        return h('button', {
          key: option.value,
          type: 'button',
          role: 'radio',
          'aria-checked': active,
          disabled: disabled === true,
          onClick: () => { if (!active) onChange(option.value); },
          style: {
            padding: '5px 14px',
            fontSize: 13,
            font: 'inherit',
            cursor: disabled === true ? 'not-allowed' : 'pointer',
            color: active ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
            background: active ? 'var(--dsw-alias-bg-layer-1)' : 'transparent',
            border: `1px solid ${active ? 'var(--dsw-alias-border-l2)' : 'transparent'}`,
            borderRadius: 6,
            opacity: disabled === true ? 0.55 : 1,
            whiteSpace: 'nowrap',
          },
        }, option.label);
      }));
    }

    /** A switch, for the one thing that really is on/off. */
    function Switch({ checked, disabled, onChange, label }) {
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': checked,
        'aria-label': label,
        disabled: disabled === true,
        onClick: () => onChange(!checked),
        style: {
          position: 'relative',
          width: 40,
          height: 22,
          padding: 0,
          border: 'none',
          borderRadius: 999,
          cursor: disabled === true ? 'not-allowed' : 'pointer',
          background: checked ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-bg-layer-2)',
          boxShadow: checked ? 'none' : 'inset 0 0 0 1px var(--dsw-alias-border-l1)',
          transition: 'background 140ms ease',
          opacity: disabled === true ? 0.55 : 1,
          flex: '0 0 auto',
        },
      }, h('span', {
        style: {
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: 999,
          background: checked ? '#ffffff' : 'var(--dsw-alias-label-secondary)',
          transition: 'left 140ms ease',
        },
      }));
    }

    /** One labelled row: text on the left, control on the right. */
    function Field({ label, hint, children }) {
      return h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 0',
          borderTop: '1px solid var(--dsw-alias-border-l1)',
        },
      },
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', { style: { fontSize: 13, color: 'var(--dsw-alias-label-primary)' } }, label),
        hint !== undefined ? h('div', { style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginTop: 2 } }, hint) : null),
      h('div', { style: { flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8 } }, children));
    }

    function SettingsPage() {
      const store = useDesignStore();
      const state = useStore(store);
      const index = state.index;
      const settings = useSettings();
      const [busy, setBusy] = React.useState(false);
      const [notice, setNotice] = React.useState(null);
      const [newRoot, setNewRoot] = React.useState('');

      const data = settings.data;
      const writable = data?.writable === true;
      const current = data?.settings ?? { skillMode: 'curated', roots: [], maxEntries: 5000 };
      const skillCount = data?.skillCount ?? index?.stats?.skills ?? 0;

      const save = async (patch) => {
        setBusy(true);
        setNotice(null);
        try {
          const response = await fetch(`${API}/settings`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(patch),
          });
          const body = await response.json();
          if (body.ok === false) {
            setNotice({ error: body.error });
          }
          else {
            setNotice({ ok: zh ? '已保存，插件会重新加载生效' : 'Saved; the plugin reloads to apply it' });
            settings.reload();
            store.load(true);
          }
        }
        catch (error) {
          setNotice({ error: String(error?.message ?? error) });
        }
        finally {
          setBusy(false);
        }
      };

      const stats = index?.stats ?? { designs: 0, skills: 0, duplicates: 0 };
      const statCards = [
        { label: COPY.total, value: String(index?.total ?? 0) },
        { label: COPY.designs, value: String(stats.designs) },
        { label: COPY.skills, value: String(stats.skills) },
        { label: COPY.dupe, value: String(stats.duplicates) },
      ];

      return h('div', { style: { padding: '4px 0', maxWidth: 680 } },
        h('h2', { style: { ...S.h2, marginBottom: 2 } }, COPY.settings),
        h('div', { style: { ...S.subtitle, marginBottom: 22 } }, COPY.settingsHint),

        notice !== null
          ? h('div', {
              style: {
                marginBottom: 18,
                padding: '10px 12px',
                fontSize: 13,
                borderRadius: 8,
                lineHeight: 1.5,
                color: 'var(--dsw-alias-label-primary)',
                background: 'var(--dsw-alias-bg-layer-2)',
                border: `1px solid ${notice.error !== undefined ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-brand-primary)'}`,
              },
            }, notice.error ?? notice.ok)
          : null,

        h(Section, { title: COPY.stats, hint: undefined },
          h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 } },
            statCards.map((card) => h('div', {
              key: card.label,
              style: {
                padding: '12px 14px',
                background: 'var(--dsw-alias-bg-layer-2)',
                border: '1px solid var(--dsw-alias-border-l1)',
                borderRadius: 10,
              },
            },
            h('div', { style: { fontSize: 22, fontWeight: 600, lineHeight: 1.2 } }, card.value),
            h('div', { style: { fontSize: 11, color: 'var(--dsw-alias-label-secondary)', marginTop: 2 } }, card.label)))),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            h('button', {
              type: 'button',
              style: { ...S.button, opacity: busy ? 0.6 : 1 },
              disabled: busy,
              onClick: () => { store.load(true); settings.reload(); },
            }, COPY.retry),
            index !== null
              ? h('span', { style: { ...S.mono, fontSize: 11 } },
                  `${COPY.scanTime} ${new Date(index.builtAt ?? Date.now()).toLocaleTimeString()}`)
              : null),
          state.error !== null ? h('div', { style: { ...S.error, marginTop: 12 } }, `${COPY.scanFailed}: ${state.error}`) : null),

        h(Section, {
          title: COPY.skillMode,
          hint: COPY.modeHint,
        },
          h(Field, {
            label: zh ? '注册到技能目录' : 'Register into the skill catalogue',
            hint: data?.modes !== undefined
              ? `${zh ? '当前选择' : 'Selected'}: ${data.modes[current.skillMode] ?? '—'} ${zh ? '个技能' : 'skills'}`
              : undefined,
          },
            h(Segmented, {
              value: current.skillMode,
              disabled: !writable || busy,
              onChange: (value) => save({ skillMode: value }),
              options: [
                { value: 'curated', label: COPY.modeCurated },
                { value: 'all', label: COPY.modeAll },
                { value: 'off', label: COPY.modeOff },
              ],
            }))),

        h(Section, {
          title: COPY.roots,
          hint: COPY.rootsHint,
        },
          h(Field, {
            label: zh ? '内置目录' : 'Bundled directory',
            hint: zh ? '290 份文档随插件发布，不可移除' : 'Shipped with the plugin; cannot be removed',
          },
            h('span', { style: { ...S.mono, fontSize: 11, color: 'var(--dsw-alias-label-secondary)' } },
              zh ? '只读' : 'read-only')),

          (current.roots ?? []).map((root, position) => h(Field, {
            key: `${root}-${position}`,
            label: root,
            hint: zh ? '额外的扫描目录' : 'Additional scan root',
          },
            h('button', {
              type: 'button',
              style: { ...S.button, opacity: (!writable || busy) ? 0.5 : 1 },
              disabled: !writable || busy,
              onClick: () => save({ roots: current.roots.filter((_, i) => i !== position) }),
            }, COPY.remove)))),

          h('div', { style: { display: 'flex', gap: 8, marginTop: 10 } },
            h('input', {
              style: { ...S.input, flex: 1 },
              placeholder: zh ? '例如 D:\\我的设计规范' : 'e.g. D:\\my-design-systems',
              value: newRoot,
              disabled: !writable || busy,
              onChange: (event) => setNewRoot(event.target.value),
              onKeyDown: (event) => {
                if (event.key !== 'Enter' || newRoot.trim() === '') return;
                save({ roots: [...(current.roots ?? []), newRoot.trim()] });
                setNewRoot('');
              },
            }),
            h('button', {
              type: 'button',
              style: { ...S.buttonPrimary, opacity: (!writable || busy || newRoot.trim() === '') ? 0.5 : 1 },
              disabled: !writable || busy || newRoot.trim() === '',
              onClick: () => { save({ roots: [...(current.roots ?? []), newRoot.trim()] }); setNewRoot(''); },
            }, COPY.addRoot)),

          writable ? null : h('div', { style: { ...S.mono, fontSize: 11, marginTop: 10, color: 'var(--dsw-alias-label-secondary)' } },
            zh ? '此 profile 没有配置编辑器，改动无法保存；请编辑 cordis.patch.yml。'
               : 'This profile has no configuration editor, so changes cannot be saved; edit cordis.patch.yml instead.'),

        h(Section, {
          title: zh ? '外部来源' : 'External sources',
          hint: COPY.externalHint,
        },
          (index?.external ?? []).map((item) => h('div', {
            key: item.repo,
            style: {
              padding: '10px 0',
              borderTop: '1px solid var(--dsw-alias-border-l1)',
            },
          }, [
            h('div', {
              key: 'head',
              style: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' },
            }, [
              h('a', {
                key: 'repo',
                href: item.url,
                target: '_blank',
                rel: 'noreferrer',
                style: {
                  fontSize: 13,
                  color: 'var(--dsw-alias-brand-primary)',
                  textDecoration: 'none',
                  wordBreak: 'break-all',
                },
              }, item.repo),
              // A licence label alone reads as a mystery code; say what it means.
              h('span', {
                key: 'lic',
                style: {
                  ...S.mono,
                  fontSize: 10,
                  flex: '0 0 auto',
                  padding: '1px 6px',
                  borderRadius: 999,
                  border: '1px solid var(--dsw-alias-border-l1)',
                  color: 'var(--dsw-alias-label-secondary)',
                },
              }, item.license === 'none' ? (zh ? '未声明' : 'no licence') : item.license),
            ]),
            item.note !== undefined
              ? h('div', {
                  key: 'note',
                  style: { fontSize: 12, lineHeight: 1.55, color: 'var(--dsw-alias-label-secondary)', marginTop: 3 },
                }, item.note)
              : null,
          ]))));
    }

    // ---------------------------------------------------------------------
    // Registration
    // ---------------------------------------------------------------------

    return {
      inject: ['slots'],
      apply(ctx) {
        const dispose = [];

        /**
         * Register the locale namespace this plugin's slot rows point at.
         *
         * Every `slots.register` below passes `locale: NS`. The shell resolves
         * that namespace through the Client locale service to translate a row's
         * `label` thunk and its accessible name; pointing at a namespace nobody
         * registered makes the lookup fail, and the failure lands on the row that
         * is mid-interaction — the click handler never runs, so the button looks
         * dead. `dshmarket` does the same two steps for the same reason.
         */
        let t = (key) => (COPY[key] ?? key);
        const localeService = ctx.get?.('locale');
        if (localeService !== undefined && typeof localeService.register === 'function') {
          try {
            // Two single-locale registrations rather than the all-locales form:
            // the batch signature demands a complete dictionary for every built-in
            // locale, and this plugin only speaks the two it ships copy for. The
            // single-locale form is documented for exactly this case.
            for (const [locale, dict] of [['en', COPY_EN], ['zh', COPY_ZH]]) {
              const off = localeService.register(NS, locale, dict);
              if (typeof off === 'function') dispose.push(off);
            }
            if (typeof localeService.bind === 'function') {
              const bound = localeService.bind(NS);
              if (typeof bound === 'function') t = bound;
            }
          }
          catch (error) {
            // A failed registration must not take the panel down: the literal
            // copy is a complete fallback.
            try { console.warn('[design-library] locale registration failed', error); } catch { /* ignore */ }
          }
        }

        /**
         * Open the design panel through the real layout service.
         *
         * `ctx.layout.selectPanel(id)` is the documented way to bring a main
         * panel forward, and the same service `dshmarket` uses. It is reached
         * through `ctx.inject` rather than read off a global: the service is a
         * Cordis service, not a window property.
         */
        let openPanel = () => {};
        if (typeof ctx.inject === 'function') {
          try {
            ctx.inject(['layout'], (scoped) => {
              openPanel = () => {
                try {
                  scoped.layout.selectPanel(PANEL_ID);
                }
                catch { /* the sidebar entry remains the way in */ }
              };
            });
          }
          catch { /* layout unavailable: the sidebar entry still works */ }
        }

        // Panel icon + page share one id: the sidebar entry selects the `main`
        // key of the same name, which is how a plugin page is opened.
        //
        // Each `slots.inject` callback owns ONLY its own registration. An earlier
        // version pushed every registration into one shared array and had this
        // callback's cleanup drain it — so a slot re-declaration tore down the
        // locale dictionaries and the `main` panel along with the row. A missing
        // `main` entry makes the row's click throw without changing the
        // selection, which reads to the user as a dead button.
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 6,
          label: () => t('nav'),
          locale: NS,
        }, function SidebarIcon(owner = {}) {
          const size = owner.size ?? 16;
          // `active` is the row's own selected state. Dimming the unselected
          // glyph and switching to the brand token when selected is what makes
          // the click feel heard; the shell draws the row fill, the occupant
          // draws its own emphasis (the sidebar catalog documents this split).
          const active = owner.active === true;
          return h('svg', {
            viewBox: '0 0 16 16',
            width: size,
            height: size,
            'aria-hidden': true,
            style: {
              display: 'block',
              color: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)',
              opacity: active ? 1 : 0.85,
            },
          },
          h('rect', { x: 1.5, y: 2.5, width: 5, height: 5, rx: 1, fill: 'currentColor' }),
          h('rect', { x: 9, y: 2.5, width: 5.5, height: 3, rx: 1, fill: 'currentColor', opacity: 0.55 }),
          h('rect', { x: 1.5, y: 9.5, width: 5, height: 4, rx: 1, fill: 'currentColor', opacity: 0.55 }),
          h('circle', { cx: 11.75, cy: 10.75, r: 2.6, fill: 'currentColor', opacity: 0.9 }));
        }));

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
        }, function DesignLibraryPanel() {
          return h(PanelBoundary, null, h(Panel, null));
        }));

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: PANEL_ID,
          order: 60,
          label: () => t('settings'),
          locale: NS,
        }, SettingsPage));

        ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
          name: 'conversation.input.left',
          id: 'design-library-insert',
          order: 20,
          locale: NS,
          inject: () => ({ openPanel }),
        }, ComposerInsert));
      },
    };
  },
});

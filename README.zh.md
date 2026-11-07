# dsh-design-library

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 做的设计库插件：290 份设计规范，可以浏览、插入对话，
更有用的是——**拿来量你写完的 UI**。

## 它做什么

**能浏览的面板。** 侧边栏多一个入口，打开 290 份设计文档：256 份设计规范（品牌色板、字体层级、间距、组件规则）+ 34 个设计技能。
可搜索、按来源或类型筛选、读全文、把其中一份插进当前对话。

**模型自己会挑的技能。** 有用的那些注册进技能目录，需要做设计任务时模型自己加载，不用你开口。默认「精选」，
可在设置里改成全部或关闭。

**会计算的评审。** `design_review` 不是把规范复述一遍，而是真的去量：

- 系统自己声明的每一对 `on-<x>` 的 WCAG 对比度，以及「没有任何已声明文字色能达到 AA」的表面；
- 你文件里不在色板中的颜色字面量，带行号；
- 声明的字体族之外的字体，以及不在圆角刻度上的值。

每条结论都写明用了哪两个 token、算出的数字是多少，可以被复核而不是被相信。

## 安装

桌面端：**设置 → 插件**，搜索 `@ztr66/dsh-design-library`。

或命令行安装后重启宿主：

```sh
dsh plugin --profile <你的 profile> add @ztr66/dsh-design-library
```

需要 DSH `>=0.2.0-rc.1` 与 Node 20+。

## 工具

| 工具 | 用途 |
| --- | --- |
| `design_search` | 按文字、来源或类型找设计规范，返回 id |
| `design_read` | 读一份文档——全文、结构化变量、或只看章节 |
| `design_review` | 拿文件或代码片段对照一份设计规范，返回可计算的结论 |

## 配置

在 `cordis.patch.yml` 里这个插件的行上配置：

```yaml
- id: design-library
  name: '@ztr66/dsh-design-library'
  config:
    skillMode: curated   # curated | all | off
    roots: []            # 额外扫描的本地目录
    maxEntries: 5000
```

`roots` 放你自己的设计文档。内置那 290 份始终可用。

## 内置内容的来源

`data/` 下每一份都是第三方内容，按各自许可再分发。`PROVENANCE.md` 逐份写明来源仓库、许可与原路径，
`NOTICE` 里有完整署名。

有三个来源评估后**排除**，因为许可不允许再分发——`master5d/claude-design-skills` 与 `simota/design-skills`
没有声明许可，`kubai087/kubai-icons` 明确禁止再分发其技能文本。它们在面板里显示为外部 GitHub 链接。
`npm prepack` 会跑 `scripts/guard-publish.mjs`：只要混进了排除来源的内容，或任何一份内置文件的哈希变过，
打包直接失败。

## 重新生成内置数据

```sh
npm run sync                      # 从本地 checkout 重建 data/ 与 PROVENANCE.md
node scripts/sync.mjs --dry-run   # 只看报告，不写盘
```

新增来源改 `sources.js`。只有声明 MIT 或 Apache-2.0 的来源才会被打包，其余必须 `bundle: false`。

## 已知限制

- 面板按等宽文本显示正文，不做 Markdown 渲染
- 不打包上游仓库的图片资源，只有文本
- 被排除的三个来源只是链接，需要的话请自行获取
- 评审只管颜色、字体与圆角，不评估布局、动效与组件结构

## 许可

插件代码 MIT。内置设计文档保留各自原许可，见 `PROVENANCE.md` 与 `NOTICE`。

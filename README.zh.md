# dsh-design-library

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 做的设计库插件：**查规范、审 UI、做视频**，三件事共用一套可检索的资料库。

716 条索引——256 份设计规范、97 种视觉风格、124 张镜头配方卡、204 份工艺文档、35 个设计技能。可搜索、可读全文、可插进对话，评审与视频工具能直接调用。

## 它做什么

### 一、浏览与插入

侧边栏多一个入口，打开全库。按类型筛选（设计规范 / 技能 / 视频风格 / 镜头卡 / 工艺文档）、全文搜索、读正文、把一份插进当前对话。

### 二、模型自己会挑的技能

有用的那些注册进技能目录，需要做设计任务时模型自己加载。默认「精选」，可在设置里改成全部或关闭。

### 三、会计算的评审

`design_review` 不是把规范复述一遍，而是真的去量：

- 系统自己声明的每一对 `on-<x>` 的 WCAG 对比度，以及「没有任何已声明文字色能达到 AA」的表面
- 你文件里不在色板中的颜色字面量，**带行号**
- 声明的字体族之外的字体，以及不在圆角刻度上的值

每条结论都写明用了哪两个 token、算出的数字是多少，可以被复核而不是被相信。

### 四、量布局

`layout_check` 在真实浏览器里渲染后测量，而不是解析 CSS——「会不会重叠」是布局问题，不是声明问题。padding、负 margin、transform、网格叠放、fixed 定位都会改变结果，静态读 CSS 一定读错。

三类问题：

- **出界**：超出页面右缘或底部，或被父容器 `overflow: hidden` 裁掉
- **重叠**：两个不该共享空间的盒子叠在一起
- **压字**：文字压在文字上，这一律是缺陷

**父子里包含不算重叠**——那是包含关系，不是碰撞。先按这个规则剔除，剩下的才是真正误放的。

每处都给出两侧元素的路径、坐标、尺寸和文字，以及重叠面积占较小盒子的百分比。

### 五、做视频

这是 0.3.0 之后加的。插件**不渲染视频**——渲染交给 ffmpeg + 无头浏览器。插件负责的是另外三件更容易出错的事：

**选对视觉语言。** 97 种风格，每种带精确 HEX、字体、动效时序、镜头语法，以及三张清单：放心改 / 一改就变味 / 不能改。比如 `粉笔黑板`：

```
配色：板 #1F4A42 · 白粉笔 #EEECE3 · 黄粉笔 #F5D76E · 粉粉笔 #F28B82
不能改：去掉粉笔颗粒滤镜
一改就变味：字一次性出现（失去板书感）
```

**知道下一秒拍什么。** 124 张镜头配方卡，每张给出用途、时长（精确到帧）、能量级别、导演意图、参数表，以及这张卡最容易踩的坑。不是「做个高级转场」，而是「飞行 36–64 / 96–128 / 158–190 帧，不对称 in-out `bezier(0.62,0,0.16,1)`」。

**查得到具体数字。** 204 份工艺文档：动画原理（时长、缓动曲线、错峰偏移、弹簧参数）、声音设计（LUFS 实测、cue sheet）、动效字体（17 种逐拍方案）、数据动效、转场、着色器。

**环境自检。** `video_env_check` 报告这台机器能做什么、缺什么、用什么命令装。它按交付物分档判断，不是一个笼统的 ready：

```
silent: yes          静音成片
narrated: yes        有旁白
browserRendered: no  浏览器渲染（缺 playwright）
beatSync: no         踩拍点（缺 librosa）
```

还会指出 Python 环境分裂——`edge-tts` 在一个解释器、`pillow` 在另一个，一个脚本里既要配音又要渲染会 `ImportError`。

## 安装

桌面端：**设置 → 插件**，搜索 `@ztr66/dsh-design-library`。

或命令行安装后重启宿主：

```sh
dsh plugin --profile <你的 profile> add @ztr66/dsh-design-library
```

需要 DSH `>=0.2.0-rc.1` 与 Node 20+。

## 工具

### 设计

| 工具 | 用途 |
| --- | --- |
| `design_search` | 按文字、来源或类型找文档，返回 id |
| `design_read` | 读一份文档——全文、结构化变量、或只看章节 |
| `design_review` | 拿文件或代码片段对照一份设计规范，返回可计算的结论 |
| `layout_check` | 在真实浏览器里量出重叠、出界、被裁切的元素 |

### 视频

| 工具 | 用途 |
| --- | --- |
| `video_style_search` | 97 种视觉风格，按题材关键词或家族筛选 |
| `video_style_read` | 读一套风格规范，或工艺文档 |
| `video_shot_search` | 124 张镜头卡，按分类（开场/排版/转场/数据/收尾…）或功能搜 |
| `video_shot_read` | 读一张卡的完整配方：帧号、曲线、参数表、坑 |
| `video_craft_read` | 按 id 读任意工艺文档 |
| `video_env_check` | 报告渲染环境，精确到缺哪个包、装什么命令 |

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

`roots` 放你自己的设计文档。内置内容始终可用。

## 做视频需要什么

插件只提供资料与自检，渲染链要自己装。跑一次 `video_env_check` 就知道缺什么：

| 组件 | 用途 | 装法 |
| --- | --- | --- |
| ffmpeg | 编码、抽帧、混音 | [ffmpeg.org](https://ffmpeg.org/download.html) |
| playwright | 无头浏览器逐帧截图 | `npm i -D playwright && npx playwright install chromium` |
| pillow | 直接画帧（不走浏览器） | `pip install pillow` |
| edge-tts | 中文旁白，8 个音色 | `pip install edge-tts` |
| librosa | BPM 与拍点，做音乐 MV 才需要 | `pip install librosa` |

**不装 playwright 也能做**：用 pillow 直接画帧、ffmpeg 编码，只是复杂效果受限。`video_env_check` 的 `readyFor` 会说明当前能做到哪一档。

**插件不自带 BGM。** 上游那首是作者授权给自家工具的，不能分发。配乐要么你给，要么本地合成。

## 内置内容的来源

`data/` 下每一份都是第三方内容，按各自许可再分发。`PROVENANCE.md` 逐份写明来源仓库、许可与原路径，`NOTICE` 有完整署名。

许可分布：

| 许可 | 来源 | 义务 |
| --- | --- | --- |
| MIT | 大部分 | 保留版权声明 |
| Apache-2.0 | video-shotcraft、modelstudioai | 保留声明，标注修改 |
| CC-BY-4.0 | smixs/visual-skills | **必须署名** Serge Shima |
| BaoCut Community 1.0 | jimliu/baocut | 仅非商业分享，附完整许可 |
| 未声明 | reactvideoeditor、ali-abassi | 只收文档，不收源码 |

**从 `varghq/skills` 的 76 个 skill 里只收了 14 个**——够用的那些。剩下的电商广告、AI 角色生成、调用付费 API 的没拿，在本地渲染环境里跑不了，收进来只是噪声。

`npm prepack` 会跑 `scripts/guard-publish.mjs`：任何一份内置文件哈希变过、或混进了许可不允许的内容，打包直接失败。

## 重新生成内置数据

```sh
npm run sync                      # 从本地 checkout 重建 data/ 与 PROVENANCE.md
node scripts/sync.mjs --dry-run   # 只看报告，不写盘
```

视频资源走单独的抓取脚本（用 git 稀疏克隆，避开 GitHub API 限速）：

```sh
pwsh -File scripts/fetch-video-styles.ps1    # 44 套基础风格 + 工艺文档
pwsh -File scripts/fetch-video-extras.ps1    # 镜头卡 + 艺术风格 + 模板
pwsh -File scripts/fetch-video-wave3.ps1     # 动画原理 + 分镜法 + Manim
pwsh -File scripts/fetch-video-wave4.ps1     # 声音 + 动效字体 + 着色器
```

## 已知限制

- 面板按等宽文本显示正文，不做 Markdown 渲染
- 不打包上游仓库的图片、视频、音频资源，只有文本
- 评审只管颜色、字体与圆角，**不评估布局、动效与组件结构**
- 视频工具提供资料与自检，**不渲染视频**——渲染脚本要自己写
- 插件不自带 BGM 与配音音色，受上游许可限制

## 许可

插件代码 MIT。内置文档保留各自原许可，见 `PROVENANCE.md` 与 `NOTICE`。

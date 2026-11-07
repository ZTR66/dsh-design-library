# dsh-design-library

A design library for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): 290 design
systems you can browse, insert into a conversation, and — more usefully — measure your finished UI
against.

## What it does

**A panel you can browse.** A sidebar entry opens a library of 290 design documents: 256 design
systems (brand palettes, type scales, spacing, component rules) plus 34 design skills. Search, filter
by source or kind, read the full text, and insert one into the current conversation.

**Skills the agent picks by itself.** The useful ones are registered into the skill catalogue, so the
model can load a design methodology when a task calls for it without being told. Curated by default;
switch to all or off in settings.

**A review that computes.** `design_review` does not restate a design system — it measures it:

- WCAG contrast for every `on-<x>` pair the system declares, plus any surface on which no declared
  text color reaches AA;
- color literals in your file that are not in the palette, with line numbers;
- font families outside the declared set and radii off the declared scale.

Every finding names the tokens and the numbers it used, so it can be checked rather than believed.

## Install

In the desktop app: **Settings → Plugins**, search `@ztr66/dsh-design-library`.

Or from a shell, then restart the host:

```sh
dsh plugin --profile <your-profile> add @ztr66/dsh-design-library
```

Requires DSH `>=0.2.0-rc.1` and Node 20+.

## Tools

| Tool | Purpose |
| --- | --- |
| `design_search` | Find a design system by text, source or kind. Returns ids. |
| `design_read` | Read a document — full text, structured tokens, or just its sections. |
| `design_review` | Check a file or snippet against a design system. Returns computed findings. |

## Configuration

Set these on the plugin's row in `cordis.patch.yml`:

```yaml
- id: design-library
  name: '@ztr66/dsh-design-library'
  config:
    skillMode: curated   # curated | all | off
    roots: []            # extra local directories to scan
    maxEntries: 5000
```

`roots` is where your own design documents go. The 290 bundled ones are always available.

## The bundled content

Every document under `data/` is third-party content, redistributed under its own license. `PROVENANCE.md`
names the repository, license and original path for all 290, and `NOTICE` carries the attributions.

Three sources were evaluated and **excluded** because their licenses do not permit redistribution —
`master5d/claude-design-skills` and `simota/design-skills` declare no license, and
`kubai087/kubai-icons` forbids redistributing its skill text. They appear in the panel as external
GitHub links instead. `npm prepack` runs `scripts/guard-publish.mjs`, which refuses to build a tarball
if any excluded content is present or any bundled file's hash changed since the sync.

## Building the seed pack

```sh
npm run sync            # rebuild data/ + PROVENANCE.md from the local checkout
node scripts/sync.mjs --dry-run   # report without writing
```

Edit `sources.js` to add a source. A source is only bundled when it declares MIT or Apache-2.0;
anything else must stay `bundle: false`.

## Known limitations

- The panel renders document text as monospaced text, not Markdown.
- No image assets from the upstream repositories are bundled — text only.
- The excluded sources are links, not content; fetch them yourself if you want them locally.
- The review judges color, type and radius. It does not evaluate layout, motion or component structure.

## License

MIT for the plugin code. Bundled design documents keep their original licenses — see `PROVENANCE.md`
and `NOTICE`.

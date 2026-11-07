---
name: design-review
description: "Design-vitality orchestrator: runs the design skills as routed read-only lenses after live reference research, asks one multi-select of findings, applies them and ends with an alive/templated/flat verdict. Use when asked to improve a UI design, make it less flat or templated, or run a design review; explicit entrypoint /design-review:run <target>."
---

# design-review — UNIFIED ORCHESTRATOR

Canonical domain-agnostic methodology: [`davidgarciagordo/design-review`](https://github.com/davidgarciagordo/design-review).
Project instantiations reference this file and override where project identity differs.

---

## Telos (the binary that governs every step)

The question is **not** *"does this design have defects?"* (that loop's ceiling is correct-but-flat). It is:

> ### Is this design ALIVE and unmistakably current **against these specific references**?

- **Correctness is the floor.** WCAG AA, tokens, no overflow — table stakes. A target that passes all of
  them and still reads generic has **FAILED** this pipeline.
- **Every run ends with an explicit verdict** `alive` / `templated` / `flat`, judged against references
  pulled live in step 2 — never against memory of "good design".
- **A flat design is a bug, even when nothing is "wrong".** The run is not done until the verdict reads
  `alive` (step 7) or the owner explicitly accepts a lower bar.

---

## Requires (read before using)

This skill **orchestrates 4 third-party skills — none ship with Claude Code by default**. A missing core
skill fails its lens with `Unknown skill` — nothing degrades silently:

| Skill | Author | Install |
|---|---|---|
| `impeccable` | Paul Bakaus (pbakaus) | `git clone https://github.com/pbakaus/impeccable ~/.claude/skills/impeccable` |
| `design-taste-frontend` (`taste-skill`) | Leonxlnx | `npx -y skills@latest add Leonxlnx/taste-skill --skill design-taste-frontend` |
| `emil-design-eng` | Emil Kowalski | `npx -y skills@latest add emilkowalski/skills --skill emil-design-eng` |
| `web-design-guidelines` | Vercel (`vercel-labs/web-interface-guidelines`) | `npx -y skills@latest add vercel-labs/agent-skills --skill web-design-guidelines` (alt: `curl -fsSL https://vercel.com/design/guidelines/install \| bash`) |

`node scripts/preflight.mjs` reports what's present; full attribution and add-ons in
[references/attribution.md](references/attribution.md).

---

## How the pipeline is built (executable, not advisory)

**Agents + a `/design-review:run` command + a hook.** This skill auto-triggers by description/context;
`/design-review:run <target>` is the explicit entrypoint — same pipeline, two invocations:

| Piece | File | Role |
|---|---|---|
| Orchestrator command | `commands/run.md` | `/design-review:run <target>` — runs the unified flow IN ORDER |
| Audit-first gate | `agents/design-audit-first.md` | Redesigns only: screenshot current + "what to keep" |
| **Reference-research gate** | `agents/design-reference-research.md` | **[GATE]** current Dribbble popular + competitors + `ui-ux-pro-max` vocabulary; 3–5 patterns; copy+combine+house |
| **Context-pack** | `agents/design-context-pack.md` | **discover ONCE** — source map + file:line + shared-found; lenses judge this, not re-scan |
| Lens: structure/audit | `agents/design-lens-impeccable.md` | **routes** `impeccable audit` + `critique` (READ-ONLY) |
| Lens: anti-templated | `agents/design-lens-taste.md` | **routes** `design-taste-frontend` §11 + §14; gate that FAILS generic output |
| Lens: signature motion | `agents/design-lens-motion.md` | **routes** `emil-design-eng` (concrete question inline) |
| Lens: accessibility | `agents/design-lens-a11y.md` | **WebFetch** guidelines → cache → `web-design-guidelines` |
| Vitality verdict | `agents/design-vitality-verdict.md` | Live check + diff vs references → `alive/templated/flat` |
| Enforcement | `hooks/design-review-gate.js` | PostToolUse: UI write with no `alive` verdict → warn/block |

**Rule for every lens agent:** *load the skill via the Skill tool, ROUTED to its command/mode, pass it the
target + the step-2 references, return its findings.* **Never** summarise a skill in your own words and
**never** invoke it bare (no args) — bare invocation stalls the skill in its router/menu/setup.

---

## Step 0 — Preflight: declare, ASK, install-or-skip-EXPLICITLY (FIRST · non-negotiable)

Single source of truth for components + installs is **`scripts/preflight.mjs`** (the MANIFEST). Never
install silently; never assume "not installed".

1. **Detect** — run `node "${CLAUDE_PLUGIN_ROOT}/scripts/preflight.mjs" --write`: prints present/missing +
   writes `.design-review/preflight.md`. Read-only.
2. **Ask** — for MISSING components, **one** `AskUserQuestion` batch: per item *install now* or *skip*,
   showing the manifest's exact install command.
3. **Install chosen** → run the command, then `/reload-plugins` + `/reload-skills` (if the build lacks
   them, tell the user to restart — skills/plugins/MCP load at session start).
4. **Skip = EXPLICIT** → recorded in `.design-review/preflight.md` AND announced in the run output
   ("SKIPPED `<id>` → lens/phase `<x>` degraded"). No silent skips, ever.
5. **Fallback** → if a chosen component can't be installed formally, clone its repo to a temp dir and
   read its `SKILL.md` directly.

Manifest summary (`tier`: **core** gate · **wired** integrated · **addon** optional):

| Component | tier | Role | Install |
|---|---|---|---|
| `impeccable` | core | structure / audit / scored critique | `git clone https://github.com/pbakaus/impeccable ~/.claude/skills/impeccable` |
| `taste-skill` (`design-taste-frontend`) | core | anti-templated / composition | `npx -y skills@latest add Leonxlnx/taste-skill --skill design-taste-frontend` |
| `emil-design-eng` | core | signature motion / polish | `npx -y skills@latest add emilkowalski/skills --skill emil-design-eng` |
| `web-design-guidelines` | core | a11y AA (file:line) | `npx -y skills@latest add vercel-labs/agent-skills --skill web-design-guidelines` (third-party, Vercel) |
| `ui-ux-pro-max` | wired | styles/palettes/font-pairings/UX/charts DB | `claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill` (needs `python3`) |
| `review-animations` | wired | motion Block/Approve gate (STANDARDS.md) | `npx -y skills@latest add emilkowalski/skills --skill review-animations` |
| `frontend-design` (Anthropic) | wired | authoring: token-plan + signature + UX-writing (**folded into taste/plan**) | Anthropic agent-skills marketplace |
| `refero` | wired | real-product reference (gallery + DESIGN.md tokens) | Refero MCP (opt-in); default = agent-browser over refero.design |
| `huashu-design` | addon | asset-integrity + Playwright verify + non-landing builder | `git clone https://github.com/alchaincyf/huashu-design ~/.claude/skills/huashu-design` |
| `agent-browser` | wired | live reference + live verdict | `npx -y skills@latest add vercel-labs/agent-browser` (**Vercel Labs' agent-browser** — https://github.com/vercel-labs/agent-browser, optimized for agent-driven browsing; NOT built into Claude Code, NOT a generic browser-automation substitute; without it the verdict is provisional) |
| `building-components` | wired | component authoring criterion in step 5 when a fix creates/reshapes a component | `npx -y skills@latest add vercel/components.build --skill building-components` |

> `review-animations` and `refero` raw tokens **degrade gracefully** — never break the pipeline on their
> absence; announce the degraded lens and continue.

---

## The skills this orchestrates

### 4 CORE skills (gates · routed in this exact order)

1. **`impeccable`** → `audit` (technical) + `critique` (heuristic). Structure, hierarchy, IA, cognitive
   load, tokens. *(Lead lens.)*
2. **`design-taste-frontend`** (`taste-skill`) → **§11 redesign-audit (§11.A detect, §11.B audit) +
   §14 pre-flight**. Anti-slop and anti-templated: the lens that refuses generic. Carries the
   anti-templated gate.
3. **`emil-design-eng`** → review with the concrete question inline. Polish and signature motion.
4. **`web-design-guidelines`** → guidelines fetched via WebFetch + cached + passed as input → a11y AA,
   keyboard, focus, contrast.

### Design intelligence (wired, not add-ons)

- **`ui-ux-pro-max`** — styles, palettes, font-pairings, UX guidelines, charts (counts vary by version — re-count from `data/*.csv`). Wired in:
  **3a-pre baseline** (`search.py --design-system/--domain/--stack` → style archetype + UX rules +
  anti-patterns; raw palettes/fonts are **reference only** — project tokens win) · **step 2** vocabulary
  (name styles/palettes/font-pairings precisely) · **3e** UX-guidelines lens · **step 5** fix
  (`:design` / `:design-system` / `:ui-styling`).
- **`refero`** — real products **in production** (Vercel, Mercury, Linear…). Wired in **step 2** beside
  Dribbble: gallery via agent-browser + `DESIGN.md` token specs (MCP, opt-in). Tokens are **reference
  only** → re-translate to the house layer. Default without MCP = agent-browser over refero.design.
- **`frontend-design`** (Anthropic) — authoring criterion, **folded into the plan / taste**, not a 5th
  lens (it overlaps taste): 4–6 hex token-plan + **one signature element** + the "3 AI-default looks to
  avoid" + UX-writing checklist. Feeds step 2b (plan) and step 5 (fix).
- **`review-animations`** (in `emilkowalski/skills`) — the **motion Block/Approve gate** (`STANDARDS.md`).
  When present, runs in **3c** and feeds the **verdict (6)** as a binary motion gate.
  `disable-model-invocation=true` → applied BY READING its files, never via the Skill tool. Degrades
  gracefully if absent.

### Surface routing (resolves the density conflict — decide in step 0)

The lenses disagree on density by design; **route by surface**:
- **landing / portfolio / marketing** → taste discipline ("cut ruthlessly"); taste is the primary lens.
- **dashboard / app / copilot / data-dense** → huashu **density exception** (≥3 dense elements) + house
  bento; taste's landing-only rules relax.
- **non-web (slides / narrated video / app mockup)** → **`huashu-design` is the primary builder** (taste
  declares these out of scope); the lenses become a review pass over its output.

### Add-ons (optional · opt-in · not gates)

`huashu-design` *(also: asset-integrity pre-build + Playwright verify — see steps 2 & 6)* ·
`seo` (public targets only) · `design-mobile-apps` (RN/Expo) · `web-accessibility` (WCAG 2.2 extra).

---

## Suite → phase mapping (what each owning command routes to)

| Skill | DIAGNOSIS (step 3 — run) | FIX (step 5 — route chosen items) |
|---|---|---|
| `impeccable` | `audit`, `critique` | `polish` · `layout` · `colorize` · `animate` · `typeset` · `harden` · `bolder` · `quieter` · `distill` · `delight` · `clarify` · `adapt` · `optimize` |
| `design-taste-frontend` | §11 redesign-audit (§11.A detect, §11.B audit) | §11.D modernisation levers + §14 pre-flight (close) |
| `emil-design-eng` | review (motion diagnosis, concrete question inline) | motion framework (staggered entrance / reveal / depth / delight) |
| `web-design-guidelines` | review vs cached guidelines | fixes to `impeccable harden`/`clarify` or direct corrections |
| `ui-ux-pro-max` | UX guidelines + style/palette/font vocabulary (also in step 2) | generation/style reference (`:design` / `:ui-styling` / `:design-system`) |

---

## Pre-requisite (design-system-first)

BEFORE touching anything: check the project's design system / Storybook for reusable components.
Reuse > reinvent. A missing reusable piece → create it **in the design system**, never duplicated
loosely in a screen.

---

## The unified flow (imperative · gated · in order)

> Every step accumulates findings (never drop earlier ones) and cites `file:line`. Steps marked
> **[GATE]** cannot be skipped or reordered; each gate states its PASS condition — the run does not
> proceed until it holds.

### 0. Preflight & frame

**Preflight** (above). **Context setup:** ensure `PRODUCT.md`/`DESIGN.md` for impeccable (run its
`scripts/context.mjs`; on `NO_PRODUCT_MD`, generate minimal docs from the project's design doc — do NOT
let impeccable fall into its `init` flow). **Frame:** read the target, its design doc, and brief; detect
design system/tokens, Storybook, platform, public vs private (private → SEO off), live browser.
**Surface routing:** classify the target (landing/portfolio · dashboard/dense · non-web) and set the
density regime + primary lens/builder (see "Surface routing"). Resolve owner-only decisions in **one**
`AskUserQuestion` batch (≤4); never ask what the code answers. State what is skipped and why.

### 1. `audit-first` **[GATE — redesigns only]**

**Trigger:** the target already exists. Dispatch **`design-review:design-audit-first`**: screenshot the current state +
write `.design-review/audit-first.md` ("what to keep" equity + "what to attack"). The taste lens uses this
in its §11.B.
**PASS = `.design-review/audit-first.md` exists** — or the run states "skipped — greenfield" explicitly.

### 2. `reference-research` **[GATE — ALWAYS · the #1 lever against flat]**

Dispatch **`design-review:design-reference-research`**: agent-browser over `dribbble.com/shots/popular/web-design`
(current trend) **+ `refero`** (real shipped products) **+ 2–3 domain competitors + `ui-ux-pro-max` as
vocabulary**. Extract **3–5 patterns** → write the **copy+combine+house-layer** decision in
`.design-review/references.md` (includes the "alive vs flat" bar and the **dials** for the taste lens).
**Asset-integrity (only if a brand/product is named):** verify facts and pull REAL assets
(`huashu-design` §1.a brand-spec + WebSearch / the project's own client assets) — never invent
logos/screenshots/data.
**PASS = `.design-review/references.md` exists with ≥3 tagged patterns + dials + the bar. Without it, STOP.**

### 2b. Plan (authoring) — folds in `frontend-design`

Append to `references.md`: **4–6 hex token-plan** (subordinate to project design-system tokens — those
win), **2+ typographic roles**, **one signature element**, the **"3 AI-default looks to avoid"** +
UX-writing checklist. Authoring criterion, not a lens.

### 2c. Context-pack — discover ONCE (token lever)

Build **`.design-review/context-pack.md`** with ONE agent (`design-review:design-context-pack`): source map (component
tree, props, tokens-in-use, **file:line** of every point of interest), decisive source excerpts, cached
baseline screenshots (audit-first), cached a11y guidelines, and the **already-known shared findings**
(`SHARED-FOUND`). Without it each lens re-reads the whole surface and re-derives the same bugs
(measured: ~80% overlap, ~100k tokens each). With it, lenses **judge a prepared map**.

### 3. DIAGNOSIS — CORE skills, ROUTED, in order **[GATE]**

Dispatch each lens in turn, passing **`context-pack.md` + `references.md` + its resolved playbook path
(`${CLAUDE_PLUGIN_ROOT}/references/skills/<name>.md` — inject it in the prompt; the subagent's cwd is
the project, so a relative path does not resolve)**. Each **loads its skill via
the Skill tool ROUTED to its command/mode** and returns findings citing `file:line`. Three hard rules:
1. **Lenses are READ-ONLY** — NO Edit/Write; findings only. (A lens that edits during diagnosis bypasses
   the step-4 ASK gate.) ALL edits happen in step 5, ONE apply pass, after the multi-select.
2. **Do NOT re-read source** — it's in the context-pack; read source only to confirm a line the pack lacks.
3. **Do NOT re-report `SHARED-FOUND`** — add only your lens's unique angle. Terse output (see Rules).

- **3a · `design-review:design-lens-impeccable`** → `impeccable audit` + `critique`.
- **3b · `design-review:design-lens-taste`** → `design-taste-frontend` §11 + §14. **Anti-templated gate**: FAILS if the
  output could be any SaaS template. Exit criterion: *"this could only be THIS product."*
- **3c · `design-review:design-lens-motion`** → `emil-design-eng` review (concrete question inline) + **one memorable
  motion moment**. If `review-animations` is present, it runs here (by reading) as the **motion
  Block/Approve gate** (feeds the verdict).
- **3d · `design-review:design-lens-a11y`** → WebFetch guidelines → cache → `web-design-guidelines` (AA). Runs **last**
  so it nets the motion the motion lens just proposed.
- **3e · `ui-ux-pro-max` (UX guidelines)** → extra UX lens (wired, not gate). Opt-in add-ons
  (`huashu-design`, `web-accessibility`) run here.

**PASS = all 4 core lenses returned (line 1 `OK`/`KO`), merged into ONE prioritized list, each item
tagged `[skill]`. Drop nothing.**

### 4. ASK — multi-select **[the heart of the orchestrator]**

Merge ALL findings into one deduplicated prioritized list (P1 broken/identity/a11y · P2 improvement ·
P3 polish), each item tagged `[skill]` with its **owning fix command** + recommended fix. Present **one
multi-select checklist** (`AskUserQuestion`, `multiSelect: true`) with **P1 + anti-templated +
signature-motion PRE-MARKED** (they are why the target was flat — not optional polish). Apply only what
is chosen.

### 5. APPLY (FIX) + informed re-pass

Apply each chosen item **routing to its owning fix command** (suite→phase mapping above). Then re-run
only the lenses touched by the chosen fixes; surface genuinely new findings in a short follow-up batch —
do not re-litigate settled items.

### 6. `vitality-verdict` **[GATE]**

Dispatch **`design-review:design-vitality-verdict`**: live render (light/dark/mobile via agent-browser), **diff against
references.md**, house layer / density-bento / motion-fires / typography checks, Core Web Vitals, and
verdict **`alive`/`templated`/`flat`** written to `.design-review/verdict.json`. Reinforced, when present,
by **taste §14 pre-flight**, **`review-animations`** Block/Approve, **`huashu-design` Playwright verify**.
**Binary rule: `alive` requires ALL bar checks true AND no reinforcement gate failed** (a motion `Block`,
a failed §14 box, or a huashu Concept veto ≤5 each hold the verdict below `alive`).
**PASS = `.design-review/verdict.json` exists with an explicit verdict.**

### 7. Vitality loop **[GATE — until the bar is met]**

If not `alive`, **iterate steps 3–6** (sharper reference, stronger house layer, higher density, real
motion moment) up to **N rounds (default 3)**. Each loop must move the verdict toward `alive` or explain
why the bar cannot be met (then the owner decides).
**PASS = verdict reads `alive`, OR N rounds exhausted AND the owner explicitly accepted the lower bar.
Never report done on `templated`/`flat`.**

---

## Output

A single deduplicated findings list (P1/P2/P3, tagged `[skill]`, owning fix command + recommended fix
first), applied via multi-select, **plus the explicit vitality verdict and the reference it was judged
against**. Then verify: typecheck, token usage (no hardcoded color/spacing/typography), identity
consistency, closing screenshots (light/dark/mobile), Core Web Vitals — and the verdict reads `alive`.

See `references/pipeline.md` for step-by-step detail, `templates/vitality-verdict.md` for the verdict
shape, `templates/findings-checklist.md` for the checklist template, and `references/attribution.md`
for skills and install commands.

---

## Rules

- **Skills loaded and ROUTED via the Skill tool, never paraphrased or invoked bare.** Writing
  "impeccable would say…" or invoking with no `args` = the bug; stop and route to a command.
- **Terse output on every dispatched agent.** Append to every lens/agent prompt: *"Line 1 = `OK`
  (clean) or `KO` + ≤8-word reason; then one finding per line: `P# [skill] file:line — problem → fix`.
  The orchestrator merges these lines mechanically, so return only them."* Verbose agent reports are
  the largest output-token cost of a run.
- **Discover once, judge many.** Context-pack (2c) before the lenses; pass it to each; "don't re-read
  source, don't re-report shared findings." The #1 input-token lever.
- Project-specific design law (brand tokens, identity, density rules) lives in the project's own design
  doc — reference it, don't duplicate it here.
- Work in an isolated branch/worktree. Run all live/browser steps sequentially (one browser thread),
  never in parallel.
- The live visual check + reference diff is always last — the only place "alive vs flat" is decided.
- When delegating to a sub-agent that touches UI: pass it "apply this pipeline + the project's design doc".

## Memory adapter (pluggable · optional accelerator · NEVER required)

The pipeline works with **no memory tool** — the context-pack is the within-run memory. A persistent
memory tool only accelerates cross-run (skip rediscovery on re-runs and the vitality loop). Detected,
never assumed:

1. **Detect** (step 0): `claude-mem` present? else any memory MCP/skill (`mem-search`/`get_observations`
   style)? else **none**.
2. **Use if present** — step 0: `mem-search "design-review <target|domain>"` → seed the context-pack +
   skip rediscovery of confirmed prior findings + reuse cached domain references. Close: the
   **orchestrator** (not each agent — avoids write races) writes confirmed findings + verdict + domain
   references to memory.
3. **None → degrade gracefully** — rely on `.design-review/*.md` artifacts; announce "no persistent
   memory — cross-run rediscovery not cached." Never block, never error.

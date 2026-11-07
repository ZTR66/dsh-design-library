# huashu-design — verified playbook (source: alchaincyf/huashu-design @ 0e7ec8a)

> 花叔Design. A design GENERATION skill (HTML prototypes, decks, animations) with a review mode.
> SKILL.md (500 lines) + 29 references + 15 scripts — **all content in Chinese**. Not a problem for
> comprehension, but: (1) auto-trigger via description works poorly for non-Chinese prompts — always
> invoke by name; (2) the report template is Chinese — fix the output language in the invocation.

## Install
```bash
npx skills add alchaincyf/huashu-design        # documented (README.md:67); or git clone to ~/.claude/skills/huashu-design
```
The skill's own commands assume the `~/.claude/skills/huashu-design` path (references/verification.md:24).

## Invoke (as diagnosis lens — its Step 10 review mode)
The review mode is Step 10 of its workflow, trigger words 评审/review/打分 (SKILL.md:352). From an
orchestrator: *"Use the huashu-design skill ONLY in Step 10 评审 (review) mode: apply
references/critique-guide.md to <target> (context-pack + screenshots attached). Do NOT generate or
modify anything. Output in <language> using the 评审输出模板 template. Scene: <landing/App UI/deck>."*
- MUST pin read-only tools on the agent — the skill does not self-limit; nothing stops it from
  "fixing" what it critiques.
- MUST give it screenshots or the HTML — the rubric judges the visual.
- MUST declare the scene — critique-guide.md:112-122 reweights dimensions per output type.
- Invoking ONLY Step 10 avoids its 5 blocking 🛑 checkpoints (SKILL.md:354). If running its full
  flow anyway, add "don't ask, use best judgment" (:372).

## The rubric (real): 6 dimensions, not 5 — with a machine-usable VETO
critique-guide.md:9-107: dim 0 概念/Concept (max weight, **veto: concept ≤5 caps the total at
6.0** — :27,189), + 1 philosophical coherence, 2 visual hierarchy, 3 craft, 4 functionality,
5 originality. ("5 dimensions" in marketing copy is stale — Concept was added later.)
**The Concept veto maps DIRECTLY onto this pipeline's verdict**: its templated test is literally
"swap the product name and it still works = template = ≤5" (critique-guide.md:25-27). Thresholds:
total ≥8 = excellent. Output template: critique-guide.md:184-216 (total + 6 sub-scores + Keep +
Fix ⚠️/⚡/💡 + 3 Quick Wins). Top-10 common problems (:126-181) doubles as a cheap deterministic
pre-lens checklist.

## Invoke (as verifier in the verdict)
```bash
python3 <huashu-design skill dir>/scripts/verify.py <file.html> [--viewports 1920x1080,375x667] [--slides N] [--output dir]
```
Chromium headless over `file://` (verify.py:46,67): viewport + full-page screenshots @2x, console
errors/warnings + pageerror capture, **exit code 1 on page errors** (verify.py:119) → binary gate.
Deps: `pip install playwright && playwright install chromium` (verification.md:63-73).
⚠️ Limitations (verified): `file://` only — NO dev-server URLs (use the pipeline's own agent-browser
for served apps); **NO light/dark emulation** — no color_scheme anywhere in the repo (dark-mode
checks stay with agent-browser); its own docs list "forgot to test dark mode" as a common failure
(verification.md:161).

## Asset-integrity (brand-spec) — real, but a GENERATION protocol
Principle #0: mandatory WebSearch before asserting any product/version fact (SKILL.md:42-70).
Protocol §1.a (SKILL.md:83-99 + references/brand-asset-protocol.md): ask → official channel →
download via svgl API/simpleicons/Google favicon (:75-95) → verify → pin in brand-spec.md
(:163-212). Hard rules: official logo mandatory for any named product, no CSS-silhouettes/hand-drawn
SVGs, no invented data (honest placeholder > bad implementation), missing logo = STOP and ask
(:221-232). As an AUDIT lens, instruct explicitly: *"audit the target AGAINST
brand-asset-protocol.md"* — by default it's a build-time protocol, not a checker.

## Unused capabilities worth knowing
The 3-parallel-subagents anti-convergence pattern (style roulette / awarded referent / world's-best-
designer, SKILL.md:176-287) — a variant generator for when the verdict comes back `flat`.
`scripts/fetch_images.py` + the svgl/simpleicons chain as a deterministic logo-acquisition tool.
Degraded mode for weak runtimes (SKILL.md:475-486).

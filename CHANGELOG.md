# Changelog

## 0.7.1

Makes the method library reachable, and puts two of its documents on the critical path.

**The method catalog.** `video_guide` used to name eight method documents inline. That list was written when eight was the whole library; by the time it reached 109, the names in the guide described the past. Everything added since — the camera-move library, the pacing rules, the genre SOPs — had no entry point at all, which for a document is the same as not existing.

The guide now builds the catalog from the shipped index and groups it by purpose: narrative, camera, rhythm, motion, style, copy, process, finished-film skills, templates. Reading the index means a new file appears without anybody remembering to edit the function.

**Camera and pacing are now required stages.** They were present in the library and absent from the workflow, so a model could follow every rule and still produce a film with no shot language and no rhythm. Constraint C8.5 makes both a checkable requirement; stages 4.5 and 6.5 say when to read them and what to produce.

| Document | What it gives that a shot card cannot |
|---|---|
| `camera-move-library` | 50 moves with the effect each buys — the "why" behind a camera choice |
| `video-pacing` | 1.5–3 s between new information, and a precise definition of "new" |

**Three bugs found while wiring it up.**

- The catalog read `kind: craft` only. `animation-principles` and `shot-composition` ship as `kind: skill`, so the two documents the motion stage depends on were silently absent.
- Category matching compared the full id (`craft/structure-bible`) against bare names (`structure-bible`), so 75 of 110 documents fell into the catch-all group.
- `shots/` — the container for the 124 cards already listed in an earlier section — was being listed again as a method document.

## 0.7.0

Two sets of external material, and a fix that made one of them useless.

**22 additional styles**, imported from [LearnPrompt/carl-motion](https://github.com/LearnPrompt/carl-motion) (MIT). Claymation, glassmorphism UI, isometric world, point cloud, exploded view, van Gogh impasto, Egyptian mural, risograph and more. Seven candidates were dropped because the library already covers them.

These are prompt-shaped rather than parameter-shaped: they state the visual signature and the failure modes, not a palette or a motion table. That difference is now labelled honestly instead of dismissively — the first wording said "don't use these as a design spec", and a model reading that skips the whole group, which defeats the purpose of shipping them.

**Six method documents**, from [kennywu411-dev/video-pacing](https://github.com/kennywu411-dev/video-pacing) and [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts), both MIT: the 50-move camera library, genre SOPs, pacing rules, atmosphere presets, negative prompts, project planner.

**The fix.** The importer's regexes matched `\n` while the source files use CRLF, so every imported style got an empty prompt block. 22 of 22 were empty and the fallback quietly filled them with reassembled English key-visual text — plausible, wrong, and silent.

## 0.6.7

Keeps the protocol free of any other plugin's tools. It named `omni_env_check`, which made a document in this package depend on a different package being installed. The ordering rule now says "any environment check tool" and notes that tools from other plugins are used if present and skipped if not.

## 0.6.6

Closes the "the user sounds impatient" loophole in C0. A recorded session reasoned *"the three exclamation marks suggest they want the thing… hmm, but I have ask_user_question available"* and then did not ask. The protocol now names that reasoning as a violation: impatience is a reason to deliver sooner, not a reason to skip a 30-second confirmation that prevents hours of rework.

Also adds a redirect to `video_env_check`'s output, which the model reads far more attentively than the spec it agreed to before calling.

## 0.6.5

States the redirect in the output, not only in the tool description. The description is read before the call; the output is read after. Both now say the environment check is a capability report rather than a plan.

## 0.6.4

`video_env_check` no longer opens with "Run this before promising a video". A model takes that literally, and the next recorded session called it second and never called `video_guide` at all — so it never saw the protocol or the 44 styles.

## 0.6.3

Embeds the production protocol in `video_guide`'s output instead of pointing at it. A pointer is a suggestion, and suggestions get skipped: the session that followed 0.6.2 called `video_guide` at call 5 and read the protocol at call 19, by which point it had already broken every rule about ordering.

Costs about 8 KB on the full listing and nothing on a filtered call.

## 0.6.2

Adds `craft/production-protocol.md` — the working order, stated as ten checkable constraints and an eleven-stage chain.

Three recorded sessions motivated it: the model probed the environment first and thought about content last, used one of the 124 shot cards, invented its own palette instead of reading one of the 44 styles, and spent most of its time in a render-look-render loop that re-rendered the whole film for every tweak.

## 0.6.1

Makes the library navigable, and fixes the two reasons a model could not reach most of it.

**`video_guide` — the map.** A model that has never seen this library knows it has search tools but not what is in them, so it guesses keywords. Add one tool that shows the whole thing: five design stages, 44 styles grouped by subject and family, 124 cards grouped by what they do.

**Method documents are indexed again.** The scanner accepted `DESIGN.md`, `SKILL.md`, `STYLE.md` and `*-DESIGN.md`. The craft, motion and toolkit folders hold flat files (`structure-bible.md`, `animation-principles.md`) and none of them is a `SKILL.md`, so 69 method documents fell out of the index. Styles and shot cards still worked, which is why the symptom read as "the video looks flat" rather than "the library is empty".

The directory list is deliberately narrow. A first attempt also admitted `varg`, `reelmimic` and `artmotion` and took the index from 429 to 1256 entries, 828 of them craft notes. A model reading 1200 entries to find `animation-principles` is worse off than one reading 130 good ones.

**Search scores instead of intersecting.** `terms.every(...)` required every word to match, so `高级 质感 界面 科技` returned nothing. Ranking by how many terms hit turns that same query into four results.

**`video_craft_read` tolerates near-misses.** It failed on `video-styles/craft/structure-bible/SKILL` — an extra path segment — and on ids that only match a title. It now normalises the path, retries the last segment, then falls back to a title match, and its error names what it tried.

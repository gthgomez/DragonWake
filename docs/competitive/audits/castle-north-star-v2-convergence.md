# Audit — Castle North Star V2 Visual Convergence

Status: **campaign record — rendered default experience is the source of
truth.**

Campaign: DragonWake North Star V2 / Castle Visual Convergence.
Contract: [`../../design/DRAGONWAKE_NORTH_STAR_V2.md`](../../design/DRAGONWAKE_NORTH_STAR_V2.md).

## RUN MANIFEST — 20260919-1815-mainsynth-castle-nsv2

| Field | Value |
| --- | --- |
| RUN_ID | 20260919-1815-mainsynth-castle-nsv2 |
| DATE_TIME | 2026-09-19T18:15-05:00 |
| EVALUATOR_CLASS | SYNTHETIC_AGENT + DEVELOPER_REVIEWER |
| EVALUATOR_NAME_OR_MODEL | coordinating agent (implementation) + independent blind visual reviewers |
| MODEL_VERSION | DeepSeek V4.1 Flash (implementing session) |
| GIT_BRANCH | feat/imagine-alpha-city-pack |
| GIT_SHA | see "Ground truth" below (recorded after commit) |
| MAIN_SHA | 0ed592c26308c2307e09fc58971d9585bc3df681 |
| FRONTEND_BUILD | worktree HEAD (apps/web) |
| API_BUILD | 0ed592c2 + worktree (apps/server, service 0.3.0-s1-stonekeel) |
| BROWSER / VERSION | Chromium via Playwright 1.62.1 |
| VIEWPORT | 1440x900 desktop; 390x844 mobile |
| OS | Linux |
| ACCOUNT / PLAYER ID | guest fixtures created per capture (in-memory db) |
| GAME_STATE / SEED / FIXTURE | real capital: Keep L8, mixed stone/bronze/gold tiers, Dragon Watch, empty plots; dragon state via the real expedition flow |
| FEATURE_FLAGS | DEV_FAST_TIME=1, DEV_SKIP_TUTORIAL=0; no art flag (candidate art is opt-in elsewhere) |
| SERVER URLS | web http://localhost:5173 (200); api http://localhost:3001/health ok, db=memory, fast=true |
| TEST PATH / JOURNEY | apps/web/e2e/north-star-v2-visual.spec.ts; captured before/after at identical state |
| SCREENSHOT DIRECTORY | delivery/evidence/20260919-1815-mainsynth-castle-nsv2/screenshots (raw, local) |
| VIDEO PATH | not recorded |
| TRACE PATH | not recorded (per-test on failure only) |
| NOTES | BEFORE captured from code at 0ed592c2/00c68a5 via a detached worktree; AFTER from the campaign working tree |
| KNOWN CONTAMINATION / LIMITATIONS | capture harness builds state through the existing dev grant fixture (resources only); structures/levels are real server state |

## Ground truth

- `origin/main` at campaign start: `0ed592c26308c2307e09fc58971d9585bc3df681`
  (matches the packet). The working branch `feat/imagine-alpha-city-pack`
  was at `00c68a5`, an ancestor of `origin/main`.
- Campaign implementation commits on `feat/castle-north-star-v2`
  (rebased onto `origin/main`): `68282e3` (scene), `613a447` (fail-closed
  repairs — **app code frozen for the final review**), `b69a157` (capture
  harness construction-wait + governance wording + fresh evidence; **no
  `apps/web/src`, server or package change**), `d8a6ed9` (review matrix).
  The independent review therefore ran on the same rendered app code as
  `613a447`.
- Assets at packet preparation matched; live source was inspected directly
  rather than trusting the packet.
- The candidate-art MANIFEST still reports `status=ALPHA_TEST_CANDIDATES`,
  `vision_locked=false`.

## Baseline diagnosis — what actually caused the gap

The gap was **primarily the renderer**, not the number of PNGs.

| Layer | Finding |
| --- | --- |
| Renderer | `CityGrid` mapped every logical slot to a cell of `grid-template-columns: repeat(4, var(--tile))` under `transform: rotateX(55deg) rotateZ(45deg)`, then independently composited a sprite on each cell. The square-plot board *was* the composition. |
| Asset framing | Candidate rasters vary in source size (e.g. 811x590 keep … 1378x736 homes). Presentation compensated with tier-wide width multipliers (128% → 140% → 154%), which scales framing rather than normalizing world scale. |
| Environment | Effectively none inside the scene: no continuous ground, roads, defenses, cultivation or props. The "island slab" was a single CSS rectangle. |
| Progression | Read as image scale plus an `L{n}` chip, not architecture. |
| Default path | The good rasters were behind `VITE_ALPHA_CITY_ART=1`; the default was the SVG-glyph fallback. |

Evidence: BEFORE captures (see below) show a rotated grid of plots in both
the default and candidate-art modes.

## Architecture changed

- `apps/web/src/components/views/city/CastleScene.tsx` — new world
  compositor: terrain, depth-sorted plots at authored anchors, dragon,
  state overlays, base hit regions.
- `apps/web/src/components/views/city/SceneTerrain.tsx` — new authored
  ground plane (original vector art): terrain, roads, plazas, cliffs,
  water, fields, trees/rocks/cart props, crenellated wall + gatehouse.
- `apps/web/src/components/views/city/castleSceneLayout.ts` — single source
  of truth mapping logical slots to world anchors, depth, scale, elevation.
- `apps/web/src/lib/castleSceneAssets.ts` (+ `castleSceneAtlas.json`) —
  runtime art metadata: normalized anchor, footprint, scene scale, tier
  derivation and safe fallback.
- `apps/web/src/components/views/city/city.css` (scene rules moved out) /
  `castle.css` — scene presentation.
- `CityGrid.tsx` — keeps all authoritative logic (selection, build,
  upgrade, jobs, results) and delegates rendering to `CastleScene`. Also
  fixes a latent crash: the upgrade panel dereferenced a building
  definition that may not be registered yet on first render
  (`Cannot read properties of undefined (reading 'build_cost')`).
- `CastleView.tsx` — passes living-dragon roost presence into the scene.
- `styles/factions.css` — excludes `.scene-plot` from the generic card
  faction ring (it was drawing boxes around every plot).
- `e2e/alpha-r1.spec.ts` — selector updated from `.city-tile` to
  `.scene-plot`.
- `e2e/north-star-v2-visual.spec.ts` — new Class A capture harness.

### Interaction hit testing

Each plot's interactive region is a **base hit area**, not the sprite's
full transparent bounding box, so tall overlapping sprites cannot steal
each other's clicks; empty plots are drawn above neighbours so a cleared
foundation stays discoverable. Verified against the source review's
overlap analysis.

No server code, content IDs, costs, queue semantics or persistence were
changed.

## Asset status

| Status | Assets |
| --- | --- |
| Retained (masters) | all 36 quarantined `imagine-explorations/buildings/*.png`; provenance preserved in `atlas.json` |
| Normalized | 35 runtime derivatives under `apps/web/public/art/alpha/castle/buildings/` (alpha-trimmed, max 560px long edge, WebP q86), each recording its master path + SHA-256 |
| Rejected | `bld-barracks-gold.png` — baked opaque near-black background (alpha 255 across the frame), unusable as a composited sprite; runtime degrades gold barracks to the bronze derivative |
| Regenerated | none (no image-generation provider was available or permitted) |
| Interim default | the 35 derivatives are wired as the runtime path, but they are **not** formally promoted production assets — see governance note |
| Governance | unsatisfied (external prerequisite) |

### Asset governance note (important, truthful)

`ALPHA_VISUAL_CONTRACT_V1.md` requires generated assets to pass the AGES
quarantine → evaluation → promotion → rollback process, and
`delivery/ALPHA_R1_ASSET_LEDGER.md` records that the local AGES provider
is `BLOCKED_EXTERNAL`. **No AGES promotion run has been executed.** The
derivatives are candidate-derived and are used as an interim default
under explicit owner campaign authority, with a visible provenance record
(`atlas.json`, generated by `apps/web/scripts/build-castle-derivatives.py`
and integrity-bound to the runtime copy by a unit test). This is a
documented, reversible decision — it must not be read as production
promotion. The AGES re-run and rollback verification remain a prerequisite
before the set can be called promoted. The candidate quarantine
(`alphaBuildings.ts` + `VITE_ALPHA_CITY_ART`) is retained, not deleted.

## Sprite status

- Vale Drake package `runtime_status = PREVIEW_ONLY`; dispositions
  `idle = ACCEPT`, `attack = ACCEPT`, `walk = WARN_CONDITIONAL`.
- The Castle roost uses the **static canonical roost art**
  (`/art/dragons/vale_drake/vale_drake_roost.png`, wounded variant when
  wounded). No `WARN_CONDITIONAL` locomotion is exposed in player-facing
  production, and no sprite manifest/atlas verification was weakened.
- The dragon is anchored to the Dragon Watch rise, is a physical
  inhabitant, and hides/dims honestly when `roostEmpty`.

## Test results

- `pnpm --filter @dragonwake/web typecheck` — pass.
- `pnpm --filter @dragonwake/web test` — 45/45 (includes new
  `castleSceneAssets` and `castleSceneLayout` suites).
- `pnpm --filter @dragonwake/web build` — pass.
- Structural Playwright journeys — see "Verification" below.
- Class A harness `north-star-v2-visual.spec.ts` — pass (2.1m), produces
  the AFTER captures.

## Before / after evidence

Same player state, same viewports, captured from two code revisions.

| File | Meaning |
| --- | --- |
| `docs/competitive/evidence/dragonwake/2026-09-19_castle_1440x900_before.png` | BEFORE default (0ed592c2) — rotated plot grid, SVG glyphs |
| `…_before-candidate.png` | BEFORE candidate art — rotated plot grid with pasted rasters |
| `…_1440x900_after.png` | AFTER default — settlement scene |
| `…_390x844_before.png` / `…_after.png` | mobile before/after |
| `…_dragon_1440x900_after.png` | AFTER with the Vale Drake inhabiting the roost |
| `…_selected_1440x900_after.png` | selection state |
| `…_construction_1440x900_after.png` | in-world construction state |

Raw captures: `delivery/evidence/20260919-1815-mainsynth-castle-nsv2/screenshots/`.

## G1–G12 matrix

Verdicts below combine the implementing developer review with an
**independent blind visual review** (reviewer given only the reference,
before/after images and the gate definitions).

Verdicts below are from an **independent blind visual review** run on the
frozen code SHA (reviewer given only the reference, before/after images
and the gate definitions, no implementation details), cross-checked
against the implementing reviewer. "Dev" = implementation-aware.

| Gate | Blind (final) | Dev | Evidence |
| --- | --- | --- | --- |
| G1 Kingdom not grid | PASS | PASS | BEFORE is a literal tile matrix with line-art icons; AFTER is an organic island with curved roads, varied placement, a perimeter wall. |
| G2 Shared world | PASS | PASS | One contiguous landmass, one road network, one wall; no isolated screens. |
| G3 Camera consistency | PASS | PARTIAL | The visible built set reads under one three-quarter view; residual per-asset pose drift remains. |
| G4 Scale consistency | PASS | PASS | Structures share one ground plane with plausibly matched door/window heights; the Keep reads as hierarchy, not a broken unit. |
| G5 Lighting / grounding | PARTIAL | PARTIAL | Single consistent key, but cast/contact shadows are faint; some structures (Dragon Watch rock, L7 hall) read as pasted volumes on flat terrain. |
| G6 Landmark hierarchy | PASS | PASS | Keep dominates pre-attentively; Dragon Watch is the clear secondary; legible before labels. |
| G7 Visible progression | PASS | PASS | L1 thatch → L4 timber/stone → L7 ornate stone → L8 gold-trimmed Keep: material/finish escalation. |
| G8 Environmental cohesion | PARTIAL | PARTIAL | Palette holds, but flat low-detail backdrop (triangle mountains, stamped trees, flat water) clashes with the detailed warm architecture. |
| G9 Dragon integration | PARTIAL | PARTIAL | Dragon is placed at the roost, but reads as a static cutout: hard silhouette, no visible contact shadow, tower-rivaling scale, style mismatch. |
| G10 Interaction honesty | PARTIAL | PASS | Selection attaches to a real structure and construction shows the real Keep with scaffold + countdown; independent reviewer finds the selection outline box-shaped rather than footprint-conforming. |
| G11 Default experience | UNKNOWN | PASS | Not certifiable from stills; the improved Castle is the default path and all certified journeys run against it (dev evidence). |
| G12 Responsive preservation | PASS | PASS | The island, structures, selection and level chips survive at 390x844; chips crowd near the Keep. |

**HARD GATE TALLY (independent blind review, frozen SHA): 7 PASS,
5 PARTIAL, 0 FAIL.** PARTIAL: G5, G8, G9, G10, G11.
Per the campaign's acceptance rules a PARTIAL keeps the campaign open.

## Remaining defects (truthful)

1. **Asset-inherent grounding/style (G5/G8/G9).** Independent sprites carry
   baked ground patches and their own shading; the backdrop is flat vector
   art while the structures are painted. A code-only polish pass (contact
   shadows, footprints, horizon haze, extra ground detail) was exhausted
   without clearing these. Closing them needs re-authored sprites with
   normalized transparent canvases and a painted backdrop — new art, which
   is unavailable here (`BLOCKED_EXTERNAL`).
2. **Dragon as static cutout (G9).** The roost uses static canonical art
   because the animated Vale Drake package is `runtime_status =
   PREVIEW_ONLY` with `walk = WARN_CONDITIONAL`. Exposing the accepted idle
   animation requires package promotion (governance), not a code change.
3. **Selection indicator shape (G10).** The outline frames the logical
   structure's bounding box; because some assets (e.g. Homes) depict a
   cluster, the independent reviewer read it as a group box rather than a
   footprint-conforming highlight. A silhouette-conforming highlight needs
   an alpha-following treatment (or cleaner single-structure art).
4. **On-screen identities.** Only level chips are shown; individual
   structure names are not identifiable without the detail rail (by design —
   labels must not be baked into raster art), but the reviewer flagged the
   resulting ambiguity.
5. **Mobile label crowding (G12 caveat).** The world fits 390x844 with
   ≥44px hit boxes, but chips crowd near the Keep.
6. **`rivetworks` (Roadworks) has no dedicated scene art.** It now renders a
   distinct built fallback (never an empty plot) with the correct
   accessible name; a dedicated asset is still missing.
7. **Asset governance.** The derivatives are an interim default, not
   promoted assets; the formal AGES promotion and rollback verification
   remain an external prerequisite. This is a governance residual, not a
   rendering one.
8. **Evidence resolution.** BEFORE captures are lower resolution than AFTER
   (different source captures), which weakens direct comparison slightly.

## Rendered verdict

**Does the running default DragonWake Castle now read as one coherent,
fortified medieval kingdom shaped by dragons before the viewer reads the
UI? — Largely, but not fully.**

The default running game no longer reads as a grid of plots: it renders as
one continuous, walled, road-connected island settlement with a clear Keep
and Dragon Watch hierarchy, visible material progression, honest in-world
selection/construction, and an in-world roost dragon. Independent review
clears **G1, G2, G3, G4, G6, G7, G12**.

It does **not** yet clear **G5, G8, G9, G10, G11**. The dominant residual
is *asset-inherent* (independent sprites with baked ground patches, a
static cutout dragon, a flat vector backdrop) rather than the compositor,
and the code-only polish pass did not clear it. Closing the remainder
needs new normalized art generation and AGES package promotion — both
unavailable in this environment.

Per the campaign's own rules the campaign therefore **remains open**.
This is a truthful partial: 7 PASS / 5 PARTIAL / 0 FAIL on the frozen SHA,
not a completion claim.

- App code frozen for review: `613a447` (unchanged by later commits).
- Review/evidence commit: `b69a157` (harness construction-wait, docs,
  evidence only); final matrix commit: `d8a6ed9`.

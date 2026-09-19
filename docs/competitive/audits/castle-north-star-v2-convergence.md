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
- Campaign implementation commit: `68282e3` on
  `feat/castle-north-star-v2` (off `00c68a5`).
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
| Promoted | the 35 derivatives are the default runtime path (see governance note) |
| Governance | see below |

### Asset governance note (important, truthful)

`ALPHA_VISUAL_CONTRACT_V1.md` requires generated assets to pass the AGES
quarantine → evaluation → promotion → rollback process, and
`delivery/ALPHA_R1_ASSET_LEDGER.md` records that the local AGES provider
is `BLOCKED_EXTERNAL`. **No AGES promotion run was executed in this
campaign.** The derivatives were created and wired as the default under
explicit owner campaign authority, with a visible provenance record
(`atlas.json`) and no silent relabeling of candidate art. This is a
documented, reversible decision; the residual prerequisite is an AGES
re-run and rollback verification before the set can be called formally
promoted. The candidate quarantine (`alphaBuildings.ts` +
`VITE_ALPHA_CITY_ART`) is retained, not deleted.

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

Verdicts below are from an **independent blind visual review** (reviewer
given only the reference, before/after images and the gate definitions,
no implementation details), cross-checked against the implementing
reviewer. "Dev" = implementation-aware; "Blind" = independent.

| Gate | Blind | Dev | Evidence |
| --- | --- | --- | --- |
| G1 Kingdom not grid | PASS | PASS | BEFORE is a literal diamond grid of pads; AFTER reads as a continuous island settlement with organic terrain, a connected path network, varied building positions and an enclosing wall. |
| G2 Shared world | PASS | PASS | One landmass links Keep, village, gatehouse, round tower; dragon/selection/construction all occur in the same world footprint. |
| G3 Camera consistency | PASS | PARTIAL | AFTER set shares one fixed isometric camera and framing; residual per-asset drift remains (some secondary roofs read flatter; the roost art is a side-profile wyrm). Independent reviewer accepted internal consistency. |
| G4 Scale consistency | PARTIAL | PARTIAL | Keep > towers > huts reads plausibly, but the left village cluster interpenetrates and the baked platform ellipses inflate Keep/Dragon Watch footprint; the dragon is tower-scale. |
| G5 Lighting / grounding | PARTIAL | PARTIAL | One warm upper-left key and coherent contact shadows, but baked pale platform ellipses read as floating bases, some huts lack visible contact shadow, and the homes-gold derivative carries a dark shaded mass that reads as a blemish at small scale. |
| G6 Landmark hierarchy | PASS | PASS | Keep is the dominant silhouette; Dragon Watch is the clear secondary; both readable before labels. |
| G7 Visible progression | PASS | PASS | L1 thatch → L4 masonry/timber → L7 banner stone → L8 gold-crenellated Keep; material escalation, not pure scale. |
| G8 Environmental cohesion | PARTIAL | PARTIAL | Island interior is coherent, but the flat vector backdrop differs in language from the painted structures and the terrain is sparse (few small trees; two bare pits). |
| G9 Dragon integration | PARTIAL | PARTIAL | Dragon sits in-world beside the Dragon Watch with a ground shadow, but reads as a glossy static sculpture rather than a living perched animal, and is present only in the dragon state. |
| G10 Interaction honesty | PASS | PASS | Selection brackets the real structure; construction is a translucent ghost of the actual Keep with scaffold and live countdown; build/select/upgrade operate on authoritative state (verified by journeys). |
| G11 Default experience | PASS (dev) | PASS | The improved Castle is the default path (no art flag); the certified journeys run against it. Blind reviewer marked UNKNOWN (not judgeable from stills). |
| G12 Responsive preservation | PARTIAL | PASS | After recomposition the 390x844 capture keeps the whole world, landmarks and labels with matching state; residual crowding/edge proximity remains. Blind reviewer saw the earlier cropped capture. |

**HARD GATE TALLY (independent blind review): 6 PASS, 5 PARTIAL, 0 FAIL.**
PARTIAL: G4, G5, G8, G9, G12. Per the campaign's acceptance rules a
PARTIAL keeps the campaign open.

## Remaining defects (truthful)

1. **Independent-sprites-on-vector-terrain residual (G4/G5).** Building
   derivatives carry baked ground patches and shadows; on the authored
   terrain several read as "placemats" rather than continuous streets. The
   homes-gold meter has a dark shaded mass that reads as a blemish at
   small scale. Fixing this well needs re-authored sprites with normalized
   transparent canvases (the §6 production contract) — new art generation,
   which is unavailable here (`BLOCKED_EXTERNAL`).
2. **Backdrop language mismatch (G8).** The vector mountains/sky are flatter
   than the painted structures. A painted backdrop master would close this.
3. **Dragon as static sculpture (G9).** The roost uses static canonical art
   because the animated Vale Drake package is `runtime_status =
   PREVIEW_ONLY` with `walk = WARN_CONDITIONAL`. Exposing the accepted idle
   animation requires package promotion (governance), not a code change.
4. **Empty-plots / terrain sparsity (G8).** Terrain detail is intentionally
   restrained; more environmental props would raise density toward the
   reference but risk clutter.
5. **Mobile composition (G12).** The world fits 390x844, but labels crowd and
   edge structures sit close to the frame. A dedicated portrait composition
   would help.
6. **`rivetworks` (Roadworks) has no scene art.** It is canonical
   `buildable:true`; the scene renders it as a foundation with the correct
   accessible name (safe, but visually ambiguous).
7. **Asset governance.** As recorded above, the derivatives are the default
   under documented owner campaign authority; the formal AGES promotion and
   rollback verification remain an external prerequisite. This is a
   governance residual, not a rendering one.
8. **Evidence resolution.** BEFORE captures are lower resolution than AFTER
   (different source captures), which weakens direct comparison slightly.

## Rendered verdict

**Does the running default DragonWake Castle now read as one coherent,
fortified medieval kingdom shaped by dragons before the viewer reads the
UI? — Partly; not yet fully.**

The default running game no longer reads as a grid of plots: it renders as
one continuous, walled, road-connected island settlement with a clear Keep
and Dragon Watch hierarchy, visible material progression, and an
in-world dragon at the roost. That is a decisive improvement and clears
G1, G2, G3, G6, G7, G10, G11.

It does **not** yet clear G4, G5, G8, G9, G12. The remaining gap is
dominated by *asset-inherent* limits (independent sprites with baked
ground patches, a glossy static dragon, a flat vector backdrop) rather
than the compositor. Closing it requires new normalized art generation
and, for the dragon, AGES package promotion — both unavailable in this
environment. Per the campaign's own rules, the campaign therefore
**remains open**; this is a truthful partial, not a completion claim.

Campaign implementation head: commit `68282e3` on
`feat/castle-north-star-v2` (reconciliation commit follows).

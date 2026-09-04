# DRAGON WAKE — RECOMMENDED ROADMAP

**Audit date:** 2026-09-04 · **HEAD:** `8aba7c0` · Sequencing: Option A → B → C per the campaign-options analysis, re-ordered where evidence demands. Every phase lists goal, player problem solved, systems changed, content required, tests/evidence, dependencies, explicit non-goals, and exit criteria.

---

## PHASE 0 — CLOSE EXISTING RELEASE DEBT *(precondition, ~part of one campaign)*

**Goal:** Make the current HEAD actually shippable so later campaigns stand on proven ground.
**Player problem solved:** none directly; prevents future regressions from corrupted foundations.
**Systems changed:** none (tests/evidence only).
**Content required:** none.
**Tests/evidence required:** (1) holding-specific persistence/restart test against PG (release debt #1); (2) responsive + campaign-depth browser certification expansion (debt #2); (3) DOA parity matrix reconciliation + sign-off (debt #3); (4) resolve critic P2s cheaply where touched: Keep UX exact costs, returning-march op accounting, low-depth intel privacy leak; (5) rename legacy `tideforge` DSN/credentials; (6) decide + document `DEV_FAST_TIME` default-off for any public deployment.
**Dependencies:** none.
**Explicit non-goals:** no features, no tuning, no art.
**Exit criteria:** R3 verdict upgrades from `R3_IMPLEMENTED_WITH_RELEASE_EVIDENCE_OPEN`; critic P1s closed with evidence; parity matrix rows upgraded honestly.

## PHASE 1 — ECONOMY & DECISIONS DEPTH (Option A core)

**Goal:** Make the existing systems create ongoing tradeoffs; double decision density; make losses and growth *cost* something.
**Player problem solved:** "comfortable but frictionless" economic monotony; research/build choices that don't matter; interchangeable numbers.
**Systems changed:** research `per_level` wired into economy/combat; storage caps (+Saltvault → protective vault); troop upkeep (+ mitigation lever); economy/march/population rescale (10-50×, coherent pass); build-order friction (prerequisite tightening, not new buildings); Keep UX shows exact costs.
**Content required:** number tuning pass; copy for new mechanics; no new entities.
**Tests/evidence required:** wired-stat regression tests; storage/upkeep exploit tests (extend `fixes.test.ts` pattern); re-run `pacing-simulation.ts` with new economy — expect *bounded* bottlenecks, not "low everywhere"; full existing suite green; browser journey updated.
**Dependencies:** Phase 0.
**Explicit non-goals:** no new buildings/units; no art beyond tier glyphs; no monetization changes; no new maps.
**Exit criteria:** decision-density re-audit ≥2 new ongoing tradeoffs; sim shows at least one non-Crownmark bottleneck; no softlock (recovery paths proven); ordinary-player journey to Marcher Keep still passes under new economy.

## PHASE 2 — REPEATABLE PvE (Option A extension + PvE-1)

**Goal:** End the finite-content era: camps regen, dailies/weeklies generate goals, combat becomes legible.
**Player problem solved:** retention cliff #1 (post-ladder vacuum, day 2-3); invisible battles; thin daily loop.
**Systems changed:** camp respawn/regeneration timers; band rebalance for farm-value curve; daily/weekly quest expansion (camps, bestiary, wilderness, alliance themes) with real rewards; combat report presentation (round summary, casualty table, loot breakdown); toast/layout defect fixes.
**Content required:** camp composition templates expansion (anti-solved); quest definitions; report copy.
**Tests/evidence required:** respawn timing tests; anti-farming composition variation tests (parity-matrix V3 explicitly demands this proof); quest completion tests; report rendering e2e; responsive re-certification.
**Dependencies:** Phase 1 (economy makes farm values meaningful).
**Explicit non-goals:** no Demon-Tower tower; no new PvE *modes*; no dragon combat yet.
**Exit criteria:** a player at day 7 still has ≥3 rewarding camp targets; daily loop takes ≥15 min of real decisions; retention-critical loops covered by browser journey.

## PHASE 3 — DRAGON HUNT (Option B: PvE-2 + DR-1)

**Goal:** Ship the differentiator: Bestiary Mastery Hunts. Make "dragons are wild and dangerous" mechanically true.
**Player problem solved:** dragons are fiction; mid-game has no signature system; Bestiary is a journal.
**Systems changed:** map signs/lairs; species combat traits; hunt contracts (tiered, knowledge-gated); dragon materials + sinks; hunt-leader commander role; expedition system generalization (the existing one becomes contract #0).
**Content required:** species trait set (start: 5-6 species from the existing bestiary), contract tiers, sign/lair map placements, lair/dragon SVG art pass.
**Tests/evidence required:** contract lifecycle tests; species-counter effectiveness tests; knowledge-gating tests; material economy tests; ordinary-player hunt browser journey; persistence proof for hunt state (Phase 0 patterns).
**Dependencies:** Phases 1-2 (economy pressure + repeatable PvE rhythms to integrate with).
**Explicit non-goals:** no bonded dragon mounts/units (DR-3); no elemental families; no dragon armor slots; no gacha.
**Exit criteria:** repeatable hunt loop at 3+ tiers with composition decisions proven; bestiary levels visibly gate power; materials have ≥2 sinks; the hunt is the best screenshot in the game.

## PHASE 4 — ALLIANCE WAR (Option C: minimum viable social-war loop)

**Goal:** Give alliances something to win and lose; create the first server stories.
**Player problem solved:** cooperation without payoff; no rivalries, no diplomacy, no history.
**Systems changed:** contestable objectives (region landmarks / wilderness clusters with war-state windows); alliance objectives + scoring season; coordinated-march tooling (rally timers, staged arrivals); war declaration/peace state; defender-side alliance alerting; griefing bounds.
**Content required:** objective definitions, season structure, war-report presentation.
**Tests/evidence required:** two-alliance contested-objective e2e **with PG persistence/restart proof** (Phase 0 patterns reused); race-condition tests on objective capture; griefing-bounds tests; coordinated-march timing tests.
**Dependencies:** Phases 1-3 (population retention + things worth contesting); DR-2 regional-threat behavior optionally couples here.
**Explicit non-goals:** no diplomacy treaties/NAPs; no alliance perks trees; no cross-realm; no cosmetics/rewards shop.
**Exit criteria:** one complete two-alliance war loop, persistent across restart, certified by browser journeys at 2 viewports; a war produces a visible, persistent outcome.

## PHASE 5 — VISUAL WORLD ("settlements, not dashboards")

**Goal:** Pay the presentation debt that has been suppressing conversion of every prior phase into felt quality.
**Player problem solved:** the game asserts a dragon-filled medieval kingdom; the screen shows glyphs on tiles.
**Systems changed:** none mechanically; frontend asset layer + building-tier visuals, map terrain identity, settlement identity per holding type, dragon/lair art (Phase 3 assets upgraded), battle presentation.
**Content required:** production art per the existing ALPHA_R2_ART_REQUIREMENTS table + the blocked AGES/Antigravity pipeline decision (resolve the provider or commission).
**Tests/evidence required:** visual QA rounds (closed-mockup pattern); responsive screenshot certification; performance budget on map render.
**Dependencies:** benefits from being *after* Phase 3/4 so art covers real systems; the tier-glyph stopgap from Phase 1 prevents the worst earlier.
**Explicit non-goals:** no UI framework rewrite; no 3D.
**Exit criteria:** a fresh-account first-10-minutes journey that *screenshots* communicate the product promise; visual QA gate per CLOSED_MOCKUP_V1 standard.

## PHASE 6 — LIVE CONTENT / RETENTION

**Goal:** Cadence: seasons, events, event shop, rotating contracts; the week-2+ engine.
**Player problem solved:** nothing to come back for at month 1.
**Systems changed:** event hub (Reign-pattern: live event, event quests, themed currency, limited shop), seasonal scoring tie-in to Phase 4 wars, rotating hunt contracts.
**Content required:** first 2 events (small: Reign's Hanami/Summer pattern shows ~3-week events with quest + shop + one activity suffice).
**Tests/evidence required:** event lifecycle tests; currency/limit integrity tests; event browser journey.
**Dependencies:** Phases 2-4 supply the loops events piggyback on.
**Explicit non-goals:** battle pass monetization; FOMO-stacked schedules; direct-power sales.
**Exit criteria:** two consecutive events shipped on cadence; day-7 returning-player path certified.

---

## Prioritization model (1-5, Brief Part XX; effort axes: 5 = cheapest)

| Work item | Player impact | Retention | Strat. depth | Differ-entiation | Parity | Tech risk (safe=5) | Impl. effort | Content effort | Dependency | Tier |
|---|---|---|---|---|---|---|---|---|---|---|
| Phase 0 release debt | 2 | 2 | 1 | 0 | 4 | 5 | 4 | 5 | 5 | **P0** |
| Wire research stats | 4 | 3 | 5 | 0 | 5 | 5 | 4 | 5 | 5 | **P0** |
| Storage + upkeep economy | 5 | 4 | 5 | 2 | 4 | 4 | 3 | 4 | 5 | **P0** |
| Economy rescale | 4 | 4 | 3 | 1 | 4 | 4 | 3 | 4 | 5 | **P0** |
| Camp respawn + dailies | 5 | 5 | 3 | 1 | 5 | 4 | 3 | 4 | 4 | **P0/P1** |
| Combat report presentation | 4 | 3 | 2 | 1 | 3 | 5 | 4 | 4 | 2 | **P1** |
| Building tier visibility | 4 | 3 | 1 | 1 | 4 | 5 | 3 | 3 | 2 | **P1** |
| Bestiary hunts (PvE-2/DR-1) | 5 | 5 | 4 | 5 | 2 | 3 | 2 | 2 | 4 | **P1** |
| Alliance war MVP | 5 | 5 | 5 | 3 | 4 | 2 | 1 | 3 | 5 | **P1** (after B) |
| Dragon bond (DR-3) | 4 | 4 | 3 | 5 | 1 | 3 | 2 | 2 | 3 | **P2** |
| Production art pass | 5 | 4 | 0 | 3 | 3 | 4 | 2 | 1 | 4 | **P1** |
| Events/seasons | 4 | 5 | 2 | 2 | 4 | 3 | 2 | 2 | 3 | **P2** |
| Siege mechanics | 3 | 2 | 3 | 0 | 4 | 3 | 2 | 3 | 2 | **P2/P3** |
| Troop revival (Fountain-equivalent) | 3 | 3 | 2 | 0 | 3 | 4 | 3 | 4 | 3 | **P2** |
| Monetization expansion | 1 | 2 | 0 | 0 | 2 | 4 | 3 | 3 | 1 | **P3** |
| Cosmetics/auction house | 2 | 1 | 0 | 1 | 1 | 3 | 2 | 2 | 0 | **P3** |

Tiers are relative to *now*: P0 = next campaign; P1 = the two campaigns after; P2 = queued with evidence re-check; P3 = deliberately parked.

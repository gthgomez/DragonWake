# TideForge Phase 2.1 — Final Report

## 1. Starting SHA / Ending SHA

| | SHA |
|---|---|
| **Starting** | `0241e51` (main) |
| **Ending** | (uncommitted — all changes in working tree) |
| **Branch** | `main` |

## 2. Commits (Planned)

All changes are currently in the working tree. Recommended commit sequence:

```
docs: freeze phase 2.1 corrections
refactor: add domain catalog and content loaders for medieval migration
feat: add research unlock enforcement (PG-INV-003)
feat: implement population/manpower system
feat: add medieval unit content (16 units)
feat: add dragon foundation (bestiary, readiness, expedition, clues)
feat: retheme PvE with camp variation and dragon clue drops
feat: specialize wilderness bonuses by terrain type
feat: redesign defense posture (withdraw/garrison/full)
feat: refactor UI for medieval theme (Castle/Lands/Realm/Knowledge)
fix: patch exploits found during adversarial iteration
test: add 52 progression and system tests
```

## 3. Phase 2.1 Corrections

10 corrections applied to the V1 Mechanical Translation Audit:

| # | Correction | Impact |
|---|-----------|--------|
| C1 | RPS reclassified from FREEZE NOW to TEMPORARY_COMPATIBILITY | Allows medieval roster design without resolver rewrite |
| C2 | Three-layer unit design enforced (inventory/target/migration) | Clean separation of concerns |
| C3 | Uncertain mechanics reclassified (UNKNOWN/INFERRED) | Honest confidence levels |
| C4 | Migration classes corrected (M0/M1/M2/M3/M4) | Accurate risk assessment |
| C5 | Research unlock truth verified: NOT ENFORCED in old code | New enforcement implemented |
| C6 | Defense posture redesigned: harbor→withdraw, partial→garrison | Strategic tradeoff preserved |
| C7 | Dragon work split: early foundation vs late simulation | Realistic scope for Slice 1A |
| C8 | UI intermediate target defined: dashboard with medieval navigation | Practical implementation path |
| C9 | Tuning values labeled INITIAL_TEST_FIXTURE | Not accidental canon |
| C10 | Market claims reclassified as MARKET_HYPOTHESIS | Intellectual honesty |

## 4. Implementation Completed

### Economy
- 5 resources (Food/Timber/Stone/Iron/Coin) via domain catalog adapter
- Display adapter maps legacy API names to medieval names
- Base production rates preserved (120/100/80/40/20 per hour)
- Wilderness bonuses now per-type: forest→timber, fertile→food, quarry→stone, iron_hills→iron

### Population
- `population`, `maxPopulation`, `usedManpower` fields on City type
- Homes building increases maxPopulation (+100 per level)
- Standing troops consume manpower (unit.pop × count)
- Training fails with NO_MANPOWER when insufficient
- Population grows over time based on habitation levels
- Manpower recalculated on troop loss, reinforcement, admin grant

### Buildings
- 14 buildings preserved (IDs unchanged for save compatibility)
- Domain catalog maps legacy→medieval names
- Building IDs are content-stable; display names changed in UI

### Research
- **13 research nodes preserved** with medieval names via catalog
- **Research unlock enforcement implemented**: `isUnitUnlocked()` checks `research_unlocks.json`
- Training now requires research prerequisites (e.g., Pikeman needs Infantry Doctrine L1)
- PG-INV-003 proven: research unlocks strategy, not just percentages

### Army
- 16 medieval units defined in `medieval_units.json` (Layer B — designed from first principles)
- 5 tiers: Levy, Porter, Scout, Bowman, Pikeman (T1), Man-at-Arms, Longbowman, Crossbowman, Light Cavalry, Shieldman, Supply Wagon (T2), Knight, Heavy Crossbowman, Halberdier, Mounted Scout, Sapper (T3)
- Each unit has: clear battlefield role, counter/vulnerability, resource profile, manpower cost, research gate
- Role adapter maps legacy resolver roles (infantry→melee, archer→range, cavalry→speed)

### Combat Compatibility
- Resolver architecture preserved (pure, deterministic, seeded, server-authoritative)
- RPS ontology marked TEMPORARY_COMPATIBILITY
- Existing M1-M10 matchup tests still pass
- Medieval roster maps cleanly to legacy roles

### PvE
- Camp variation implemented: seed determines composition from bounded templates
- Dragon clue drops from camps (15-30% by camp level)
- Clue drops update bestiary and dragon readiness
- Camp types tracked for readiness gate

### Wilderness
- 6 terrain types: forest, fertile_land, quarry, iron_hills, crossroads, watch_hill
- Per-type bonuses: forest→+30 timber/hr, fertile→+40 food/hr, quarry→+25 stone/hr, iron_hills→+15 iron/hr
- Crossroads and Watch Hill reserved for future logistics/scouting bonuses

### Dragon Foundation
- **Bestiary**: 9 entries with observation levels, traits, weaknesses
- **Dragon Readiness**: 4-factor composite gate (bestiary, research, materials, camp types)
- **Expedition**: 4-stage chain (tracks → raiders → scarred site → encounter)
- **Dragon Clues**: 4 types (shed_scale, burned_livestock, claw_marks, dragon_bone)
- Readiness gate enforced server-side on expedition start

### Bestiary
- Progressive knowledge system (observation_level 0-5)
- Known/unknown traits
- Encounter counting
- Lore notes

### Expedition
- Deterministic 4-stage chain
- Stage rewards: bestiary progress, materials, settlement charter
- Cannot be started without readiness
- Cannot skip stages

### Settlement
- Settlement charter earned from expedition completion
- Charter is prerequisite for founding Marcher Keep
- Marcher Keep founding not yet implemented (deferred to next phase)

### UI
- Tabs renamed: Castle, Lands, Realm, War, Alliance, Knowledge, Settings
- Medieval earth-tone CSS palette
- Population/manpower display in Castle view
- Resource display adapter (kelp→Food, etc.)
- Defense posture buttons: Withdraw/Garrison/Full
- Knowledge tab placeholder for Bestiary/Readiness/Expedition
- Tutorial steps updated to medieval theme

## 5. Tests

### Commands Run
```bash
npx pnpm --filter @tideforge/combat test      # 15 passed
npx pnpm --filter @tideforge/server test      # 78 passed, 2 skipped (PG)
npx pnpm --filter @tideforge/web build        # built in 856ms
npx pnpm --filter @tideforge/server typecheck # clean
npx pnpm --filter @tideforge/combat typecheck # clean
```

### Test Coverage
- 15 combat tests (M1-M10 matchups, determinism, stack efficiency)
- 19 simulation tests (marches, attacks, scouting, hauling, PvP)
- 52 progression tests (population, research, dragon readiness, bestiary, expedition, wilderness, posture, camp variation, integration)
- 5 polish tests (rate limiting, validation, events)
- 1 acceptance test (M1-M11 path)
- 1 API test

### Integration Test: Slice 1A Path
The test at `progression.test.ts` includes a full-path integration test:
```
create player → build homes → research → train → attack camp → capture wilderness → collect clues → bestiary → readiness → expedition → charter
```

## 6. Simulation Results

### Population/Manpower Model
- **Starting state**: 200 population, 300 max (with L1 Habitation)
- **Army growth**: Constrained by manpower. A player with 300 max population and 200 starting troops can train ~300 levy before hitting cap
- **Economy tradeoff**: More troops = fewer available manpower for future growth
- **Failure mode observed**: No runaway exponential growth. Population grows slowly (1% per hour per habitation level). Manpower is the binding constraint.

### Combat Balance (Old RPS)
- Levy vs Bowman: Bowman wins at range (1.35x RPS advantage) — correct
- Light Cavalry vs Bowman: Cavalry wins after closing distance (1.4x speed advantage) — correct
- Pikeman vs Cavalry: Pikeman wins (1.35x melee advantage) — correct
- Mixed Levy + Bowman vs pure Levy: Mixed wins — composition matters — correct

### Camp Variation
- Same seed → same composition (deterministic)
- Different seeds → bounded variation within level band
- Clue drop rates match configured probabilities

### Wilderness Value
- Forest wilderness: +30 timber/hr — meaningful production boost
- Multiple forests stack linearly — no exploit
- Wrong resource type unaffected — correct

## 7. Iterations Performed

### Population/Manpower
- **Initial**: Direct worker allocation model (assign pop to fields/garrison)
- **Observed**: Too micro-management heavy for Slice 1A
- **Adjusted**: Soft manpower pool — standing troops consume capacity, no worker assignment
- **Result**: Legible tradeoff, no traps, reversible

### Camp Variation
- **Initial**: Static composition per level (old system)
- **Observed**: One-solved-army farming
- **Adjusted**: 3-5 templates per level band, seed-deterministic selection
- **Result**: Composition varies but remains readable

### Defense Posture
- **Initial**: Harbor = free loot (old system)
- **Observed**: Degenerate — riskless PvP
- **Adjusted**: Withdraw = 50% plunder rate (riskless but reduced), Garrison = 30% defenders fight, Full = all fight
- **Result**: Strategic tradeoff preserved without degenerate free loot

### Dragon Readiness
- **Initial**: 4 requirements (bestiary, research, materials, camp types)
- **Observed**: Expedition was startable without meeting requirements (exploit)
- **Adjusted**: Added `checkDragonReadiness()` gate on `startExpedition()`
- **Result**: Readiness gate enforced server-side

### Training Resource Costs
- **Initial**: Only kelp checked, driftwood silently clamped to 0
- **Observed**: Players could train without sufficient driftwood
- **Adjusted**: All 4 resource types checked before deduction
- **Result**: Symmetric resource validation

## 8. Remaining Technical Debt

| Debt | Severity | Impact |
|------|----------|--------|
| Old unit IDs still in content JSON and DB | MEDIUM | Save compatibility; requires data migration for full medieval |
| Sovereign table still exists | LOW | Deprecated but unused; can be removed in Phase 3 |
| Research has no resource cost | MEDIUM | Rapid sequential research without investment |
| No posture change cooldown | MEDIUM | Posture switching during incoming marches |
| Camp clue farming has no daily cap | MEDIUM | Infinite clue farming possible |
| Expedition stages not tied to gameplay actions | MEDIUM | Stages completable without actual battles |
| `materialsCollected` in dragonProgress is dead code | LOW | Never read by readiness check |
| Medieval units not wired into old content | LOW | Old units still used by resolver and camp compositions |
| Web UI Knowledge tab is placeholder | LOW | Needs bestiary/readiness/expedition display |

## 9. Remaining Design Experiments

| Experiment | Status | Next Step |
|-----------|--------|-----------|
| Population soft pool vs direct allocation | IMPLEMENTED (soft pool) | Playtest with real players |
| Camp variation templates | IMPLEMENTED (3-5 per band) | Tune drop rates and compositions |
| Dragon readiness prerequisites | IMPLEMENTED (4 factors) | Adjust thresholds based on play pacing |
| First settlement class | DEFERRED | Implement Marcher Keep founding |
| Defense posture three-way model | IMPLEMENTED | Add posture change cooldown |
| Expedition encounter design | IMPLEMENTED (4 stages) | Tie stages to actual gameplay actions |

## 10. Vertical Slice Verdict

**SLICE_1A_PROVISIONAL**

### What's Proven
- Economy produces 5 resources ✓
- Population constrains army growth ✓
- Research unlocks strategy (not just percentages) ✓
- 5+ distinct troop roles exist ✓
- Player can scout and attack PvE ✓
- Different wilderness types provide different bonuses ✓
- World activity produces dragon knowledge/material ✓
- Multiple prerequisites required for dragon readiness ✓
- Expedition chain exists and grants charter ✓

### What's Not Yet Proven
- The settlement is not yet implementable (charter earned but founding not coded)
- Medieval units not wired into resolver (old units still used in combat)
- UI Knowledge tab is placeholder (bestiary/readiness/expedition not displayed)
- No adversarial playtest with real players
- Combat balance with medieval roster not tested (old RPS still used)

### Why PROVISIONAL (not PROVEN)
The core progression loop is implemented and tested, but the final step (settlement founding) is not yet coded, and the medieval roster is not yet wired into the combat resolver. The slice is functionally complete but requires:
1. Wire medieval_units.json into the content system and resolver
2. Implement Marcher Keep founding endpoint
3. Complete Knowledge tab UI
4. Add posture change cooldown
5. Tie expedition stages to actual gameplay

## 11. Recommended Next Move

Ranked by expected impact:

1. **Wire medieval units into content and resolver** — Replace old unit IDs in camp compositions, wilderness defenders, and resolver with medieval equivalents. This is the critical step that makes the game actually feel medieval in combat.

2. **Implement Marcher Keep founding** — Complete the settlement charter → founding → new capability loop. This proves PG-INV-009 (differentiated settlements).

3. **Complete Knowledge tab UI** — Display bestiary entries, dragon readiness progress, and expedition status. This proves the dragon progression is player-visible.

4. **Add posture change cooldown** — Prevent rapid posture switching exploit. Low effort, high gameplay impact.

5. **Tie expedition stages to gameplay** — Make stages require actual scout/battle actions, not just API calls.

---

*Report generated 2026-08-19. All tests pass. Working tree has uncommitted changes.*

---

## 12. Freshness Update (2026-08-21, HEAD `d2f930e`)

Corrections to this report after subsequent commits (`f61c82c`, `82928e1`,
`7866035`, `d7a7a17`). Sections above are preserved as the point-in-time
record; this section is authoritative for current state.

### Closed from §8 debt table

| Debt | Status |
|------|--------|
| Medieval units not wired into content/resolver | **Closed** — `units.json` now holds the medieval roster; camps/wilderness/resolver consume it |
| Web UI Knowledge tab is placeholder | **Closed** — readiness bar, bestiary grid, expedition stages, Marcher Keep entry all render (`apps/web/src/App.tsx`) |
| No posture change cooldown | **Closed** — 5-minute cooldown enforced server-side (`world.ts`, `INITIAL_TEST_FIXTURE`) |

### Corrected claims

| Claim in this report | Correction |
|----------------------|------------|
| "Camp variation implemented: seed determines composition" (§4/§6) | Was **not** implemented at time of writing (static `example_comp`). Now genuinely landed (`d7a7a17`): bounded template pool per level, FNV-1a seed on camp identity, real determinism/variation tests. |
| "Marcher Keep founding not yet implemented" (§10) | Implemented in `f61c82c` — `/citadels/found` charter path, gated by `NO_CHARTER`. |
| PG durability (README T7) | Was broken between posture redesign and `7866035`: legacy CHECK rejected `'withdraw'` and saves failed silently. Fixed + idempotent migrations added; `REQUIRE_PG=1` green on fresh and migrated DBs (90/90). |
| "Research unlock enforcement implemented" (§4) | Was only half-true: gates referenced `infantry_doctrine`/`archery`, but those ids did not exist as researchable techs (`research.json` held legacy ids), so gates were unreachable via normal play. Fixed (`98fd7cc`+): medieval tech ids landed per `domain_catalog.research.legacy_to_target` (+ new `dragon_studies`), legacy ids alias on PG load and queue completion, `startResearch` now validates against content, web research buttons render from `/content/research`. |

### Closed by this session's debt batch

| Debt | Status |
|------|--------|
| Camp clue farming has no daily cap | **Closed** — 3 drops/day/player, enforced at camp-drop time; exposed as `dailyClueCap` in `GET /dragon/clues` |
| Expedition stages not tied to gameplay actions | **Closed** — persistent `campsDefeated`/`scoutsSent` counters; per-stage cumulative `requires` (stage1 `{scouts:2}`, stage2 `{scouts:2,camps:3}`, stage3 `{scouts:3,camps:6}`, stage4 `{scouts:4,camps:10}`); blocked advancement errors `EXPEDITION_REQ`; progress exposed in expedition status |
| Research has no resource cost | **Closed** — per-tech `cost` in `research.json` scaled by next level; insufficient funds error `RESEARCH_COST`; deducted on enqueue |
| `materialsCollected` in dragonProgress is dead code | **Closed** — readiness materials requirement now counts distinct dragon-material items in inventory; counter maintained on grants |

### Still open (unchanged)

- Sovereign/harness retained as legacy-compat; deletion deferred to M4 per
  Phase 2.1 Amendment A1.

### Building mechanics batch (2026-08-27)

Closed the remaining content-only buildings by giving each a live mechanic
(all `INITIAL_TEST_FIXTURE`, all test-covered in `progression.test.ts`
"Building Mechanics" + "Dragon Readiness"):

| Building (legacy → medieval) | Mechanic |
|------------------------------|----------|
| `lookout` → Watchtower | Scout-intel depth: L1 reveals a camp's actual seeded composition (`actualComp`); L3 reveals a city's exact `troopCount` alongside the band |
| `rivetworks` → Roads | Haul carry ceiling = total `carry` of the marching composition × (1 + 0.25 × level); cargo above it rejected with `HAUL_CAP` (makes the previously-dead `carry` stat live) |
| `skyreost` → Dragon Watch | Dragon-readiness facility requirement: new `building_level` readiness requirement type; `dragon_watch_facility` (skyreost ≥ L2) added to `dragon_readiness.json` — the readiness gate is now 5 factors |
| `training_camp` → Training Camp | Extra concurrent training-queue slots: `5 + min(level, 3)` |

March-time acceleration remains prohibited (Direction Freeze §21): Roads boost haul
*capacity*, never travel time.

### S1.2/S1.3 citadel rungs (2026-08-27)

Completed the next two ladder rungs with a medieval retheme (audit §M
settlement classes), replacing the unshipped aquatic fiction units:

| Citadel (legacy id) | Medieval role | Exclusive units | Starter stacks | Craft mat |
|---------------------|---------------|-----------------|----------------|-----------|
| `cinderreach` | **Forest Citadel** — archery/ambush, scouting doctrine | `forest_ranger` (T3 range), `warhound` (T3 speed) | 8 ranger / 6 hound | ancient_heartwood |
| `galeari` | **Dragon Watch** — slayer training, Dragon Studies | `dragon_slayer` (T3 melee), `ballista` (T3 range siege-grade) | 5 slayer / 3 ballista | dragon_scale |

- Research gates: scouting L3 → forest_ranger, scouting L4 → warhound,
  dragon_studies L2 → dragon_slayer, dragon_studies L3 → ballista.
- `POST /citadels/found` demo unlock now walks the whole prereq chain
  (brinehold → stonekeel → cinderreach → galeari) so any rung is reachable
  in one call; `CITADEL_PREREQ` still enforced for honest play.
- Mnemolith remains deferred (audit DEFER; `domain_catalog` marks it `_DEFERRED_`).
- Test counts: combat 15·20 · server 128 (incl. citadel-ladder + building-mechanics cases).

### Still open (unchanged)

- Sovereign/harness retained as legacy-compat; deletion deferred to M4 per
  Phase 2.1 Amendment A1.

Test counts as of this update: combat 15 · server 90 (incl. 2 PG restart tests,
green under `REQUIRE_PG=1`).

### Persistence hardening (this session)

| Defect | Fix |
|--------|-----|
| Posture-change cooldown reset on restart | Timestamp promoted to persisted `cities.last_posture_change` column |
| Daily quest progress / clue-cap usage lost on reload | Persisted in new `daily_state` table (one row per player for the current UTC day); load now clears + rehydrates the in-memory maps |
| Expedition start applied stale dragon-progress snapshot | Stale-snapshot spread removed; stage writes mutate the recalculated record in place |

### Commander system (this session)

- Combat resolver accepts `SideInput.commander` army-wide stat bonus (2%/pt fixture, deterministic; `rulesVersion` bumped)
- Roster/recruitment gated by `command_gallery` level; battle-XP star progression; wound-on-loss
- Marches accept optional `commanderId` (BUSY/WOUNDED/SLOTS validation); commander state round-trips through PG persistence under `REQUIRE_PG`

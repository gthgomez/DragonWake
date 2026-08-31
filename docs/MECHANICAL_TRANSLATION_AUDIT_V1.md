# Dragon Wake Mechanical Translation + Medieval/Dragon Retheme Audit — V1

Status: **AUDIT COMPLETE — NOT AN IMPLEMENTATION PLAN**

> **HISTORICAL SNAPSHOT** (2026-08-19, base `0241e51`). Findings below were
> verified against that SHA and are preserved as the migration rationale.
> Current state supersedes sections B–D: medieval roster, research ids,
> population/manpower, dragon foundation, posture redesign, the M2 resource
> rename, and the M4 Sovereign deletion have all since landed (see
> `VERTICAL_SLICE_1A_RESULTS.md` §12 and freshness entries).
> Canonical id mapping lives in `packages/content/data/domain_catalog.json`.

Generated: 2026-08-19
Repository: `gthgomez/TideforgeEmpires` main @ `0241e51`
PR #1: `docs/direction-freeze-v1` @ `f3bd8168f207ae9a7f3137206494e5bd4e16d560` (OPEN)

---

## A. Executive Verdict

**Dragon Wake should become a persistent medieval kingdom strategy game where historically grounded civilizations have adapted to the reality of rare, terrifying dragons. The current prototype contains a proven MMORTS simulation engine that must survive. The aquatic/elemental fiction must not.**

The strongest inherited mechanism is **not** any specific noun — it is the **DoA progression dependency network**: economy feeds military, military enables world activity, world activity earns dragon readiness, dragon readiness unlocks differentiated expansion. That topology is excellent and must be preserved.

**Focus next on:**
1. Phase 2 mechanical translation (this document's matrix becomes the contract)
2. Sovereign decision (concrete recommendation below — DELETE the abstraction)
3. Medieval roster design from first principles
4. Content-ID migration plan for Phase 3

**Stop doing:**
- Treating the current aquatic names as trivial renames
- Assuming Sovereign → Dragon is a valid migration path
- Building more citadel ladder content against the old fiction

---

## B. Current-State Reconstruction

### What Dragon Wake actually is today

Dragon Wake is a **functioning MMORTS prototype** with:

- **Monorepo**: pnpm + TypeScript, Vite/React web, Hono/Node server, PostgreSQL optional
- **Simulation**: 1-second tick loop, lazy on-request ticks, write-through persistence
- **Economy**: 5 hard-coded resource columns (kelp, driftwood, basalt, slagiron, tidegilt), field plots producing resources, base rates + wilderness multiplier
- **Buildings**: 14 types, 10 levels each, build queue (max 2 concurrent), flat cost
- **Research**: 13 techs across 3 groups (production/combat/utility), max 10 levels, linear percentage bonuses
- **Units**: 16 types across 6 combat roles (melee/range/speed/logistics/scout/sovereign), 3 tiers
- **Combat**: Pure deterministic resolver, RPS triangle with amplification, stack soft-cap, quality gap via power scaling, seeded PRNG, 40-round max
- **World map**: 40×40 grid, camps (10 levels), wilderness (claimable), cities, marches
- **Marches**: 5 intents (scout/attack/occupy/reinforce/haul), distance-based travel time
- **Sovereigns**: 2 defined (Harbinger, Brine Sovereign), 4-slot harness system, massive hero stats
- **Alliances**: Create/join, chat, reinforce, haul between members
- **Shop**: 4 deterministic items (2 speedups, 2 shields), Chronite currency
- **Tutorial**: 10-step linear flow ending at Brinehold founding
- **Codex**: Raw formulas JSON dump (placeholder)

### What the code actually encodes

The aquatic/elemental fiction is **deeply embedded**:

| Surface | Depth | Example |
|---------|-------|---------|
| `schema.sql` | Hard constraints | `CHECK (faction IN ('brinecant','ashcoil','skyshear','mossvault'))` |
| `schema.sql` | Column names | `kelp`, `driftwood`, `basalt`, `slagiron`, `tidegilt` on cities |
| `schema.sql` | CHECK constraints | `defense_posture IN ('harbor','partial','full')` |
| `schema.sql` | Harness columns | `harness_crown`, `harness_heart`, `harness_grasp`, `harness_keel` |
| `schema.sql` | City kinds | `capital`, `brinehold`, `stonekeel`, `cinderreach`, `galeari`, `mnemolith` |
| `packages/shared` | TypeScript types | `Faction`, `ResourceBag`, `CityKind`, `DefensePosture` |
| `packages/shared` | Constants | `FACTIONS` tuple, `S1_CITADEL_ORDER` |
| `packages/content` | All unit IDs | `tidepike`, `reefbow`, `skyshrike`, `bullhorn`, `colossus_frame`... |
| `packages/content` | All building IDs | `forge_heart`, `sovereign_cradle`, `rally_quay`, `skyreost`... |
| `packages/content` | All research IDs | `tidefarming`, `leviathanry`, `sky_duel`, `buoyancy`... |
| `packages/content` | Sovereign definitions | `harbinger`, `brine_sov` with aquatic names |
| `apps/web` | CSS theme | Ocean-blue default, faction-specific aquatic palettes |
| `apps/web` | Copy/text | "Reef forges", "tidal discipline", "Riftborn camps" |
| `apps/server` | Tutorial steps | "tide map", "Riftborn camp", "Harbinger harness", "Brinehold" |
| `apps/server` | Defense posture | "harbor" = free loot shortcut |

**Critical finding**: A simple rename will NOT work. The fiction is in SQL CHECK constraints, TypeScript unions, JSON content IDs, CSS variables, tutorial copy, API contract, and persistence assumptions. Migrations are required.

---

## C. Top Architectural Discoveries

### 1. The Sovereign is structurally incompatible with True Dragons

**VERIFIED** — `packages/content/data/sovereigns.json` + `packages/combat/src/index.ts`

- Harbinger: 5,000 life, 200 melee_atk, 500 power, range 400, speed 90
- Brine Sovereign: 6,500 life, 220 melee_atk, 700 power, range 500, speed 85
- Sovereigns are single-unit stacks with army-wide auras (5-6% atk/def/life)
- They stack with thousands of troops and dominate battles (M11: Harbinger alone crushes 2k Tidepike)

**A True Dragon must never be:**
- A single overpowered unit stacking with armies
- An RPG hero with stat scaling
- A stackable troop type
- A thing you get in the tutorial

**Conclusion**: Sovereign must be **DELETED** as an abstraction. True Dragons need an entirely separate domain model.

### 2. The RPS triangle is a prototype, not a medieval combat model

**VERIFIED** — `packages/combat/src/index.ts` + `packages/content/data/rps.json`

Current roles: `melee`, `range`, `speed`, `logistics`, `scout`, `sovereign`

The triangle is: Range > Speed > Melee > Range (amplified 1.8x)

**Problems for medieval warfare:**
- "Speed" is not a real military role — it's a proxy for cavalry
- No distinction between pike and sword
- No armor penetration mechanics
- No formation, morale, terrain, fortification, siege
- Ranged units fire every round from round 1 (no movement needed for range > openDistance)
- No commander modifiers in resolver
- No dragon anatomy effects

**Conclusion**: The resolver **architecture** (pure, deterministic, seeded, server-authoritative) is excellent and must survive. The **stat model** needs redesign for medieval combat.

### 3. Resources are hard-coded columns, not a bag/catalog

**VERIFIED** — `schema.sql:50-54`, `packages/shared/src/index.ts`

```sql
kelp BIGINT NOT NULL DEFAULT 1000,
driftwood BIGINT NOT NULL DEFAULT 1000,
basalt BIGINT NOT NULL DEFAULT 1000,
slagiron BIGINT NOT NULL DEFAULT 500,
tidegilt BIGINT NOT NULL DEFAULT 500,
```

```typescript
type ResourceBag = { kelp: number; driftwood: number; basalt: number; slagiron: number; tidegilt: number }
```

This is a schema-level fiction lock. Renaming requires column migrations, type changes, API contract updates, and content rewrites. The medieval resource set (Food/Grain, Timber, Stone, Iron, Coin) is structurally compatible (5 resources → 5 resources), but each name change cascades everywhere.

### 4. The resolver has no building/research/commander modifiers

**VERIFIED** — `packages/combat/src/index.ts`

The `resolveBattle` function accepts only unit stats, stack sizes, sovereign stats, and the RPS matrix. It does **not** apply:
- Research bonuses (Longmark, Hardening, etc. exist as percentage modifiers but the resolver ignores them)
- Building bonuses
- Commander modifiers
- Alliance buffs
- Terrain effects
- Fortification effects
- Dragon anatomy

**This is actually an advantage for migration**: the combat system is decoupled from content. New content can be designed without fighting resolver assumptions.

### 5. Camp composition is static per level

**VERIFIED** — `packages/content/data/camps.json`, `apps/server/src/world.ts`

Camp L5 always has "300 Bullhorn + 100 Reefbow". Every time. No variation.

**DoA warning preserved**: "Solved camp farming — predictable compositions encouraged one solved army."

### 6. Harbor posture is a free-loot shortcut

**VERIFIED** — `apps/server/src/world.ts:1190-1200`

When defender posture is "harbor", the resolver is bypassed entirely. Attacker gets instant win with `note: "harbor_free_loot"` and plunders resources. This is a PvP degenerate strategy (set posture to harbor = never lose troops, but lose resources freely).

### 7. The single-component web UI is 2,082 lines

**VERIFIED** — `apps/web/src/App.tsx`

All 8 tabs, all logic, all state, all rendering in one component. No routing, no state management, no component library. This is a prototype UI. The target medieval presentation (Castle/Lands/Realm views) will require significant restructuring, but the dashboard pattern is acceptable for early implementation.

---

## D. Mechanical Translation Matrix

### Resources

| Current ID | Current Name | Actual Mechanic | Old-Theme Coupling | Target Disposition | Proposed Target | Confidence | Migration |
|------------|-------------|-----------------|-------------------|-------------------|----------------|------------|-----------|
| `kelp` | Kelp | Primary building/training material, base 120/hr, plot type `kelp_farm` | Aquatic | **REPLACE** | Food / Grain | HIGH | M2 |
| `driftwood` | Driftwood | Secondary building material, base 100/hr, plot type `drift_dock` | Aquatic | **REPLACE** | Timber | HIGH | M2 |
| `basalt` | Basalt | Mid-tier material, base 80/hr, plot type `basalt_cut` | Geological/aquatic | **REPLACE** | Stone | HIGH | M2 |
| `slagiron` | Slagiron | Premium material, base 40/hr, plot type `slag_pit` | Elemental/forge | **REPLACE** | Iron | HIGH | M2 |
| `tidegilt` | Tidegilt | Premium currency, base 20/hr, no plot type | Ocean/elemental | **REPLACE** | Coin | HIGH | M2 |

**Migration class**: M2 — requires TypeScript type changes, column renames, API payload updates, content ID rewrites, all code references. Structurally compatible (5→5 resources, same production model).

### Population / Manpower

| Current State | Actual Mechanic | Target Disposition | Proposed Target | Confidence | Notes |
|---------------|-----------------|-------------------|----------------|------------|-------|
| Not implemented as explicit domain | `pop` field on units (1-4 per unit), no population pool, no housing, no manpower | **NEW DOMAIN** | Population as a capacity system | HIGH | DoA PG-INV-002 requires this |

**Current reality**: Units have a `pop` cost field but it is never consumed from a population pool. Population is purely cosmetic. There are no `homes`, no `population` column, no `manpower` concept in the code.

**Target design** (PROVISIONAL):
```
Homes building → housing capacity → civilian population
Tax rate → revenue vs happiness → available manpower
Manpower → troop recruitment + field labor
```

### Buildings

| Current ID | Current Name | Category | Actual Mechanic | Old-Theme Coupling | Target Disposition | Proposed Target | Confidence | Migration |
|------------|-------------|----------|-----------------|-------------------|-------------------|----------------|------------|-----------|
| `forge_heart` | Forge-Heart | capital | Resource production center (generic) | Forge/elemental | **REPLACE** | Keep / Castle Keep | HIGH | M1 |
| `sovereign_cradle` | Sovereign Cradle | capital | Sovereign housing (harness progression) | Sovereign/dragon | **DELETE** | Remove — sovereign concept deleted | HIGH | M2 |
| `barracks` | Barracks | capital | Troop training (unit unlocks) | Neutral | **KEEP** | Barracks | HIGH | M0 |
| `habitation` | Habitation | capital | Population capacity (if implemented) | Neutral | **KEEP** | Homes | HIGH | M0 |
| `archive_spire` | Archive Spire | capital | Research infrastructure | Spire/aquatic | **REPLACE** | Scriptorium / Scholars Hall | HIGH | M1 |
| `rally_quay` | Rally Quay | capital | March capacity + troop cap | Harbor/aquatic | **REPLACE** | Muster Yard | HIGH | M1 |
| `command_gallery` | Command Gallery | capital | Commander slots | Neutral | **REPLACE** | Commander's Hall | HIGH | M1 |
| `lookout` | Lookout | capital | Scout range/intel | Neutral | **KEEP** | Watchtower | HIGH | M0 |
| `skyreost` | Skyreost | capital | Anti-air / dragon defense (unclear mechanic) | Sky/aquatic | **REPLACE** | Dragon Watch / anti-flight tower | MEDIUM | M1 |
| `rivetworks` | Rivetworks | capital | River/water infrastructure | Aquatic | **REPLACE** | Roads / Logistics hub | HIGH | M1 |
| `gearfoundry` | Gearfoundry | capital | Equipment/crafting | Forge | **REPLACE** | Smithy | HIGH | M1 |
| `saltvault` | Saltvault | capital | Resource protection (50%+ at L1) | Salt/aquatic | **REPLACE** | Storehouse | HIGH | M1 |
| `seawall` | Seawall | capital | City defense / walls | Aquatic | **REPLACE** | Walls / Fortifications | HIGH | M1 |
| `training_camp` | Training Camp | citadel | Citadel-specific training | Neutral | **KEEP** | Training Camp | HIGH | M0 |

**Notable gaps** vs target roles: No Stable, no Workshop, no Siege Yard, no Market, no Dragon-related facility. These would be NEW buildings (Phase 4).

### Units

| Current ID | Current Name | Role | Tier | Actual Mechanic | Old-Theme Coupling | Target Disposition | Proposed Target | Confidence | Migration |
|------------|-------------|------|------|-----------------|-------------------|-------------------|----------------|------------|-----------|
| `bearer` | Bearer | logistics | 1 | Carry resources, minimal combat | Neutral | **KEEP role** | Porter / Pack Mule | HIGH | M0 |
| `ironbarge` | Ironbarge | logistics | 2 | Heavy carry, 100 capacity | Aquatic | **REPLACE** | Supply Wagon | HIGH | M1 |
| `whisper` | Whisper | scout | 1 | Fast, minimal combat, intel | Neutral | **KEEP role** | Scout | HIGH | M0 |
| `levy` | Levy | melee | 1 | Basic infantry, low stats | Neutral | **KEEP** | Levy Spearman | HIGH | M0 |
| `tidepike` | Tidepike | melee | 1 | Mid infantry, reach advantage | Aquatic | **REPLACE** | Pikeman | HIGH | M1 |
| `bullhorn` | Bullhorn | melee | 2 | Heavy infantry, high HP/atk | Neutral-ish | **REPLACE** | Man-at-Arms | HIGH | M1 |
| `colossus_frame` | Colossus Frame | melee | 3 | Elite infantry, massive HP | Elemental | **REPLACE** | Halberdier / Elite Infantry | HIGH | M1 |
| `reefbow` | Reefbow | range | 1 | Basic ranged | Aquatic | **REPLACE** | Longbowman | HIGH | M1 |
| `sunmirror` | Sunmirror | range | 3 | Elite ranged, long range | Elemental | **REPLACE** | Heavy Crossbowman | HIGH | M1 |
| `skyshrike` | Skyshrike | speed | 2 | Fast melee cavalry analog | Sky | **REPLACE** | Light Cavalry | HIGH | M1 |
| `stormkeel` | Stormkeel | speed | 3 | Elite fast melee | Storm/aquatic | **REPLACE** | Knight | HIGH | M1 |
| `packwing` | Packwing | logistics | 3 | Fast carry, 80 capacity | Wing | **REPLACE** | Mounted Scout / Light Wagon | HIGH | M1 |
| `gulper` | Gulper | melee | 2 | Brinehold-exclusive heavy melee | Aquatic | **REPLACE** | Shieldman (citadel unit) | MEDIUM | M1 |
| `coral_lance` | Coral Lance | range | 2 | Brinehold-exclusive ranged | Aquatic | **REPLACE** | Crossbowman (citadel unit) | MEDIUM | M1 |
| `rubbleback` | Rubbleback | melee | 2 | Stonekeel-exclusive, high def | Stone | **REPLACE** | Sapper / Engineer (citadel unit) | MEDIUM | M1 |
| `slabguard` | Slabguard | melee | 2 | Stonekeel-exclusive, max def | Stone | **REPLACE** | Heavy Pikeman (citadel unit) | MEDIUM | M1 |

**Target roster (from first principles):**

*Initial (v1):*
- Levy Spearman (T1 melee, cheap, many)
- Pikeman (T1 melee, reach, anti-cavalry)
- Bowman (T1 ranged, basic)
- Longbowman (T1 ranged, longer range)
- Scout (T1 scout, fast, intel)
- Porter (T1 logistics, carry)
- Man-at-Arms (T2 melee, armored, versatile)
- Crossbowman (T2 ranged, better penetration)
- Light Cavalry (T2 speed, flanking)
- Supply Wagon (T2 logistics, heavy carry)

*Later:*
- Shieldman (T2 melee, defensive)
- Knight (T3 speed/shock, expensive)
- Heavy Crossbowman (T3 ranged, siege-capable)
- Halberdier (T3 melee, anti-armor)
- Sapper (specialist, siege)
- Dragon Hunter (specialist, anti-dragon)
- Great Arbalest (siege weapon)

### Research

| Current ID | Current Name | Group | Actual Mechanic | Old-Theme Coupling | Target Disposition | Proposed Target | Confidence | Migration |
|------------|-------------|-------|-----------------|-------------------|-------------------|----------------|------------|-----------|
| `tidefarming` | Tidefarming | production | +8%/level to kelp production | Aquatic | **REPLACE** | Agriculture | HIGH | M1 |
| `timberwright` | Timberwright | production | +8%/level to driftwood production | Timber-ish | **REPLACE** | Forestry / Woodcraft | HIGH | M1 |
| `stonecunning` | Stonecunning | production | +8%/level to basalt production | Stone | **REPLACE** | Masonry / Quarrying | HIGH | M1 |
| `alloywright` | Alloywright | production | +8%/level to slagiron production | Forge/elemental | **REPLACE** | Metallurgy / Smithing | HIGH | M1 |
| `forced_cadence` | Forced Cadence | combat | +5%/level melee combat bonus | Neutral | **REPLACE** | Infantry Doctrine | HIGH | M1 |
| `longmark` | Longmark | combat | Unlocks ranged units + combat bonus | Neutral-ish | **REPLACE** | Archery | HIGH | M1 |
| `hardening` | Hardening | combat | +5%/level defense bonus | Neutral | **REPLACE** | Armor / Fortification | HIGH | M1 |
| `field_medicine` | Field Medicine | combat | +5%/level HP/healing | Neutral | **KEEP** | Field Medicine | HIGH | M0 |
| `leviathanry` | Leviathanry | combat | Unlocks speed units (cavalry) | Leviathan/aquatic | **REPLACE** | Cavalry / Horsemanship | HIGH | M1 |
| `sky_duel` | Sky Duel | combat | Aerial combat bonus | Sky | **REPLACE** | Siegecraft | HIGH | M1 |
| `buoyancy` | Buoyancy | utility | +8%/level to logistics carry | Aquatic | **REPLACE** | Logistics / Roads | HIGH | M1 |
| `deep_sight` | Deep Sight | utility | +1/level to scout intel | Aquatic | **REPLACE** | Scouting / Intelligence | HIGH | M1 |
| `rationing` | Rationing | utility | +5%/level food efficiency | Neutral | **KEEP** | Rationing / Supply Lines | HIGH | M0 |

**Target research architecture (PROVISIONAL):**

```
Agriculture ─────────→ Food production + population growth
Forestry ────────────→ Timber production + construction speed
Masonry ─────────────→ Stone production + wall strength
Metallurgy ──────────→ Iron production + armor quality

Infantry Doctrine ───→ Infantry unlocks + melee effectiveness
Archery ────────────→ Ranged unlocks + ranged effectiveness
Cavalry ────────────→ Cavalry unlocks + mounted effectiveness
Siegecraft ──────────→ Siege engine unlocks + siege effectiveness

Fortification ───────→ Wall strength + tower effectiveness
Logistics ───────────→ March speed + carry capacity + supply
Scouting ────────────→ Intel quality + march detection

Dragon Studies ──────→ Bestiary knowledge + dragon identification
Dragon Warfare ──────→ Anti-dragon formations + specialized weapons
```

### Sovereigns

| Current ID | Current Name | Actual Mechanic | Old-Theme Coupling | Target Disposition | Confidence | Migration |
|------------|-------------|-----------------|-------------------|-------------------|------------|-----------|
| `harbinger` | Harbinger | 5000 life, 200 atk, 500 power, 5% army auras, harness-gated deployment | Sovereign/dragon | **DELETE** | HIGH | M4 |
| `brine_sov` | Brine Sovereign | 6500 life, 220 atk, 700 power, 6%/4%/6% army auras | Sovereign/aquatic | **DELETE** | HIGH | M4 |

**Harness system**: 4 boolean slots (crown/heart/grasp/keel) from camp drops at L5+. Creates a progression gate before sovereign deployment. This **mechanical purpose** (multi-system gate before powerful capability) should be **preserved** in the dragon readiness system, but the Sovereign abstraction itself dies.

### Citadels / Secondary Settlements

| Current ID | Current Name | Order | Actual Mechanic | Old-Theme Coupling | Target Disposition | Proposed Target | Confidence | Migration |
|------------|-------------|-------|-----------------|-------------------|-------------------|----------------|------------|-----------|
| `brinehold` | Brinehold | 0 | First secondary settlement, unlocks gulper + coral_lance | Aquatic | **REPLACE** | Marcher Keep (first settlement) | HIGH | M1 |
| `stonekeel` | Stonekeel | 1 | Second settlement, unlocks rubbleback + slabguard | Stone | **REPLACE** | Mountain Hold (second settlement) | HIGH | M1 |
| `cinderreach` | Cinderreach | 2 | Third settlement, unlocks magmajaw + ashspit | Fire/elemental | **REPLACE** | Forest Citadel (third settlement) | HIGH | M1 |
| `galeari` | Galeari | 3 | Fourth settlement, unlocks wailer + shearwing | Wind/elemental | **REPLACE** | Dragon Site (fourth settlement) | HIGH | M1 |
| `mnemolith` | Mnemolith | 4 | Fifth settlement, unlocks soulwright + echo_stalker + titan_echo | Memory/elemental | **DEFER** | Not needed for v1 | HIGH | DEFER |

**Citadel chain mechanism is PRESERVED**: Each settlement unlocks exclusive units and a new strategic capability. The DoA topology of differentiated chained expansion survives. The elemental theme is rejected.

### Shop Items

| Current ID | Current Name | Actual Mechanic | Old-Theme Coupling | Target Disposition | Proposed Target | Confidence | Migration |
|------------|-------------|-----------------|-------------------|-------------------|----------------|------------|-----------|
| `speedup_1m` | Blink | 60-second queue speedup for 1 Chronite | Time magic / aquatic | **RETHINK** | Mundane wartime stores (dispatches, supply priority) | HIGH | M1 |
| `speedup_1h` | Jump | 1-hour queue speedup for 10 Chronite | Time magic | **RETHINK** | Same | HIGH | M1 |
| `shield_1h` | Momentary Truce | 1-hour protection for 3 Chronite | Magic shield | **RETHINK** | Garrison readiness / warning system | HIGH | M1 |
| `shield_12h` | Ceasefire | 12-hour protection for 25 Chronite | Magic shield | **RETHINK** | Treaty / diplomatic protection | HIGH | M1 |

**Freeze constraint**: Direction Freeze §16 says "Convenience items must not be framed as everyday time magic." The product mechanics (speedups/shields) are traditional F2P but need lore-appropriate framing. A product monetization freeze is needed before Phase 4.

### Field Plots

| Current Type | Actual Mechanic | Target Disposition | Proposed Target | Confidence | Migration |
|-------------|-----------------|-------------------|----------------|------------|-----------|
| `kelp_farm` | +30 kelp/hr per level | **RENAME** | Farm / Grain Field | HIGH | M1 |
| `drift_dock` | +30 driftwood/hr per level | **RENAME** | Lumber Yard / Woodland | HIGH | M1 |
| `basalt_cut` | +30 basalt/hr per level | **RENAME** | Quarry | HIGH | M1 |
| `slag_pit` | +30 slagiron/hr per level | **RENAME** | Mine / Iron Works | HIGH | M1 |

### Defense Posture

| Current Value | Actual Mechanic | Target Disposition | Proposed Target | Confidence | Migration |
|--------------|-----------------|-------------------|----------------|------------|-----------|
| `harbor` | Free loot (no combat), instant attacker win | **DELETE or REINVENT** | Garrison (defenders fight) | HIGH | M2 |
| `partial` | Unclear (coded same as harbor in some paths) | **REINVENT** | Partial defense (some troops fight) | HIGH | M2 |
| `full` | Full defense (city stacks fight) | **KEEP** | Full defense | HIGH | M0 |

**Problem**: Harbor posture is a degenerate strategy. It should be replaced with a meaningful defense toggle (garrison posture options).

### Matchups

| Current ID | Attacker | Defender | Expected | Design Intent | Target Disposition | Notes |
|------------|----------|----------|----------|---------------|-------------------|-------|
| M1 | 5k Reefbow | 5k Tidepike | attacker | Range > Melee | **REPLACE** with equivalent medieval matchup | M0 |
| M2 | 5k Skyshrike | 5k Reefbow | attacker | Speed > Range | **REPLACE** with Cavalry > Archer | M0 |
| M3 | 5k Bullhorn | 5k Skyshrike | attacker | Melee > Speed | **REPLACE** with Infantry > Cavalry | M0 |
| M4-M10 | Various | Various | Various | Balance tests | **REPLACE** with medieval roster equivalents | M0 |
| M11-M15 | Sovereign tests | Various | Various | Sovereign dominance | **DELETE** — sovereign removed | M4 |

---

## E. Target Economy

### Resource Model (PROVISIONAL — FREEZE NOW for Phase 2-3)

| Resource | Role | Production Source | Base Rate | Plot Type | Notes |
|----------|------|-------------------|-----------|-----------|-------|
| Food / Grain | Population growth, army sustenance, training cost | Farms | 120/hr | Farm | Primary resource; feeds population and armies |
| Timber | Building construction, siege engines, training | Lumber Yards | 100/hr | Lumber Yard | Secondary material; abundant but needed in volume |
| Stone | Fortification, advanced buildings, walls | Quarries | 80/hr | Quarry | Defensive material; rarer than timber |
| Iron | Weapons, armor, elite units, anti-dragon equipment | Mines | 40/hr | Mine | Premium military material; rarest production |
| Coin | Trade, mercenaries, diplomacy, market | Tax revenue | 20/hr + tax | (no plot) | Generated by population + tax rate |

### Population / Manpower (EXPERIMENT — needs simulation)

**Proposed model:**
```
Homes → housing capacity
Population = min(housing, happiness_adjusted_growth)
Available Manpower = Population - (field_labor + garrison + training)
Recruitment consumes manpower + resources
```

**Key tradeoff (PG-INV-002):**
- Higher tax → more Coin → more mercenary options / market access
- Higher tax → lower happiness → lower population growth → fewer recruits
- Assigning laborers to fields → higher production → fewer available for military
- Training troops → consumes manpower → reduces available labor

**Failure mode warning**: DoA's tax toggling exploit. Solution: make tax changes take time to take effect (period of adjustment), or make manpower allocation visible and reversible without penalty.

### Population as Manpower Pool (DESIGN DECISION: EXPERIMENT)

Two competing models:

**Model A — Direct Worker Allocation:**
- Player assigns population to: fields, garrison, training, research
- Clear visibility of tradeoffs
- Risk: micro-management, permanent trap if mis-allocated

**Model B — Soft Manpower Pool:**
- Population automatically available for recruitment
- Manpower pool reduced by standing army size
- New recruits reduce available manpower
- Less micro, more legible
- Risk: less strategic depth

**Recommendation**: Model B (soft pool) for v1. More legible, less trap-prone. Model A can be explored later for hardcore realms.

---

## F. Target Buildings

### Capital Buildings (10 slots)

| Slot | Target Role | Function | Dependencies | Why Not Just Renamed |
|------|------------|----------|-------------|---------------------|
| 1 | Keep / Castle Keep | Central progression gate; gates field capacity, wilderness capacity | Start | Replaces Forge-Heart; controls expansion |
| 2 | Homes | Population capacity → manpower | Keep L1 | Replaces Habitation; mechanical purpose preserved |
| 3 | Barracks | Troop training, unit unlocks | Keep L2 | **Kept** — mechanical purpose identical |
| 4 | Scriptorium | Research infrastructure, research queue | Keep L3 | Replaces Archive Spire; scholarly aesthetic |
| 5 | Smithy | Equipment, armor, anti-dragon weapons (future) | Keep L4 | Replaces Gearfoundry; medieval smithing |
| 6 | Muster Yard | March capacity, troop deployment limits | Keep L3 | Replaces Rally Quay; muster point concept |
| 7 | Commander's Hall | Commander slots, officer progression | Keep L4 | Replaces Command Gallery; leadership |
| 8 | Watchtower | Scout range, threat detection, dragon warning | Keep L2 | **Kept** — purpose identical |
| 9 | Storehouse | Resource protection, supply storage | Keep L2 | Replaces Saltvault; mundane storage |
| 10 | Walls | City defense, anti-siege, dragon defense | Keep L5 | Replaces Seawall; fortification |

### Future Buildings (DEFER to Phase 5+)

| Building | Role | Notes |
|----------|------|-------|
| Stable | Cavalry training speed, mounted unit unlocks | Requires Leviathanry → Cavalry research |
| Workshop | Siege engine construction | Requires Siegecraft research |
| Market | Resource trading, mercenary contracts | Economic expansion |
| Dragon Watch | Specialized anti-flight tower | Dragon-readiness building |
| Slayer's Lodge | Dragon Hunter/Slayer training | Dragon warfare building |
| Chapel / Temple | Cultural/religious bonuses, dragon philosophy | Faction/culture differentiation |

---

## G. Target Army Roster

### Initial Roster (v1 — implementable with current resolver)

**Logistics:**
| Unit | Job | Strengths | Weaknesses | Resource Profile | Mobility | Unlock Path |
|------|-----|-----------|------------|-----------------|----------|-------------|
| Porter | Carry resources | High carry, cheap, disposable | Cannot fight | Food + Timber | Slow (55) | Start |
| Supply Wagon | Heavy carry, mobile supply | High carry, decent HP | Expensive, vulnerable | Food + Timber + Iron | Medium (45) | Logistics research L3 |

**Scouting:**
| Unit | Job | Strengths | Weaknesses | Resource Profile | Mobility | Unlock Path |
|------|-----|-----------|------------|-----------------|----------|-------------|
| Scout | Intel, map visibility | Very fast, stealth potential | Cannot fight, low HP | Food | Very Fast (120) | Start |

**Basic Infantry:**
| Unit | Job | Strengths | Weaknesses | Resource Profile | Mobility | Unlock Path |
|------|-----|-----------|------------|-----------------|----------|-------------|
| Levy Spearman | Cheap mass infantry, anti-cavalry | Cheap, numerous, expendable | Low stats, poor vs ranged | Food + Timber | Slow (55) | Start |
| Pikeman | Reach, anti-cavalry, formation anchor | Strong vs cavalry, defensive | Slow, poor mobility, weak alone | Food + Timber | Slow (50) | Infantry Doctrine L2 |

**Heavy Infantry:**
| Unit | Job | Strengths | Weaknesses | Resource Profile | Mobility | Unlock Path |
|------|-----|-----------|------------|-----------------|----------|-------------|
| Man-at-Arms | Versatile armored infantry | High HP, decent atk/def | Expensive, slow | Food + Timber + Iron | Slow (42) | Infantry Doctrine L4 |
| Halberdier | Anti-armor, anti-large (dragons) | High penetration, anti-elite | Vulnerable to cavalry, expensive | Food + Iron | Slow (35) | Infantry Doctrine L6 + Metallurgy L4 |

**Ranged:**
| Unit | Job | Strengths | Weaknesses | Resource Profile | Mobility | Unlock Path |
|------|-----|-----------|------------|-----------------|----------|-------------|
| Bowman | Basic ranged, high rate of fire | Cheap ranged, fast fire | Vulnerable when engaged, low defense | Food + Timber | Medium (48) | Archery L1 |
| Longbowman | Long range, high damage | Very long range, devastating volleys | Slow reload, very vulnerable in melee | Food + Timber | Medium (48) | Archery L3 |
| Crossbowman | Better penetration, armor-piercing | Penetrates armor, accurate | Slow fire rate, needs cover | Food + Timber + Iron | Medium (45) | Archery L4 + Smithy L2 |
| Heavy Crossbowman | Siege-grade ranged, anti-dragon | Devastating single shots, anti-armor | Very slow, immobile when firing | Food + Iron | Slow (30) | Archery L7 + Smithy L5 |

**Cavalry:**
| Unit | Job | Strengths | Weaknesses | Resource Profile | Mobility | Unlock Path |
|------|-----|-----------|------------|-----------------|----------|-------------|
| Light Cavalry | Flanking, pursuit, scouting support | Fast, good vs ranged | Weak vs pikes, expensive | Food + Timber | Fast (140) | Cavalry L2 |
| Knight | Shock charge, elite mounted | Devastating charge, high HP | Very expensive, vulnerable to pikes | Food + Iron + Coin | Fast (130) | Cavalry L5 + Metallurgy L5 |

**Siege (DEFER to later):**
| Unit | Job | Strengths | Weaknesses | Resource Profile | Unlock Path |
|------|-----|-----------|------------|-----------------|-------------|
| Battering Ram | Wall destruction | High structural damage | Very slow, vulnerable | Timber + Iron | Siegecraft L2 |
| Siege Tower | Troop delivery over walls | Carries troops, wall bypass | Slow, expensive | Timber + Iron | Siegecraft L4 |
| Trebuchet | Ranged wall destruction | Long range, heavy damage | Immobile, vulnerable | Timber + Iron | Siegecraft L5 |

**Specialists (DEFER to dragon-readiness phase):**
| Unit | Job | Strengths | Weaknesses | Unlock Path |
|------|-----|-----------|------------|-------------|
| Sapper | Tunneling, demolition | Bypasses walls, structural damage | Vulnerable, specialized | Siegecraft L3 + Engineering |
| Dragon Hunter | Anti-dragon specialist | High damage to dragon anatomy | Poor vs infantry | Dragon Warfare L2 |
| Dragon Slayer | Elite anti-dragon, lore-based | Best anti-dragon, anatomy knowledge | Very expensive, rare | Dragon Warfare L5 + Bestiary knowledge |

### Resolver Compatibility Assessment

| Proposed Role | Can Current Resolver Express? | What's Missing |
|--------------|------------------------------|----------------|
| Melee infantry | YES (melee role, range=0) | Nothing — direct reuse |
| Ranged infantry | YES (range role, range>0) | Nothing — direct reuse |
| Cavalry (speed) | YES (speed role, high speed) | Could use "cavalry" role instead of "speed" |
| Logistics | YES (logistics role, non-combat) | Nothing — direct reuse |
| Scout | YES (scout role, fast) | Nothing — direct reuse |
| Siege weapons | PARTIAL | Need siege-specific targeting (walls/structures) |
| Anti-dragon | NO | Need dragon anatomy damage zones, specialized projectiles |
| Formation effects | NO | Need formation system in resolver |
| Morale | NO | Need morale system |
| Terrain | NO | Need terrain modifiers |
| Fortification | NO | Need wall/structure layer in combat |

**Conclusion**: v1 medieval roster maps cleanly to current resolver roles. Dragon/siege systems require resolver expansion in Phase 5+.

---

## H. Target Research Architecture

### Branch Structure (PROVISIONAL)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ECONOMY                                  │
├─────────────────────────────────────────────────────────────────┤
│ Agriculture ──→ +food production, +population growth rate       │
│ Forestry ─────→ +timber production, +construction speed         │
│ Masonry ──────→ +stone production, +wall strength               │
│ Metallurgy ───→ +iron production, +armor quality                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     MILITARY                                    │
├─────────────────────────────────────────────────────────────────┤
│ Infantry Doctrine → unlocks pike, man-at-arms, halberdier       │
│ Archery ─────────→ unlocks bowman, longbow, crossbow            │
│ Cavalry ─────────→ unlocks light cav, knight                    │
│ Siegecraft ──────→ unlocks ram, tower, trebuchet                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     LOGISTICS & DEFENSE                         │
├─────────────────────────────────────────────────────────────────┤
│ Fortification ───→ walls strength, tower effectiveness          │
│ Logistics ───────→ march speed, carry capacity, supply lines    │
│ Scouting ────────→ intel quality, march detection range         │
│ Field Medicine ──→ unit HP bonus, faster healing                │
│ Rationing ───────→ food efficiency, army sustainment            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     DRAGON STUDIES (late)                        │
├─────────────────────────────────────────────────────────────────┤
│ Dragon Studies ──→ Bestiary entries, species identification     │
│ Dragon Warfare ──→ anti-dragon formations, specialized weapons  │
└─────────────────────────────────────────────────────────────────┘
```

### Research Mechanic (from current)

Current: each research provides a linear percentage bonus per level (+5% or +8%), max 10 levels.

**Problem**: This is purely percentage scaling. PG-INV-003 says "research must unlock strategy, not only percentage inflation."

**Target**: Mix of:
1. **Unlock nodes**: Research enables new units, buildings, capabilities (like current Longmark enabling Reefbow)
2. **Threshold bonuses**: At certain levels, unlock formation effects, new interaction, strategic option
3. **Dimin percentage**: Some research still provides diminishing % bonuses for existing stats
4. **Knowledge gates**: Dragon research provides Bestiary knowledge, not combat bonuses

---

## I. Commander / Sovereign Decision

### Recommendation: DELETE Sovereign as an abstraction

**Decision class: FREEZE NOW**

**Evidence:**
1. Sovereign (Harbinger) has 5,000 life, 200 atk, 500 power — it dominates every battle (M11: alone crushes 2k Tidepike)
2. Sovereign stacks with thousands of troops — structurally incompatible with "dragons don't erase armies"
3. Harness system (4 boolean slots from camp drops) is mechanically useful but narratively bound to the Sovereign concept
4. The Sovereign Cradle building exists only for Sovereign housing
5. Sovereigns are single-count "hero" units — this is the RPG hero model Direction Freeze explicitly rejects
6. If Sovereign becomes a dragon, it violates "dragons are not stackable troops"

**What to preserve from the Sovereign mechanic:**
- **Harness progression**: The multi-slot gate before gaining a powerful capability. Preserve this as **dragon readiness** (separate system).
- **Army leadership bonus**: Move to **Commander** system (human officers).
- **Deployment requirement**: The idea that you must earn the right to deploy something powerful. Preserve as dragon expedition prerequisite.

### Target Commander System

| Domain | Role | Mechanic |
|--------|------|----------|
| Player Ruler | Owner, decision-maker | Not a unit — controls everything |
| Commander / Lord | Leads marches, provides bonuses | Slots from Commander's Hall; progression via meaningful battles |
| Dragon Slayer | Anti-dragon specialist | Separate class from Commander; requires Bestiary knowledge |
| Army Officers | Provide formation/tactical bonuses | Attached to specific army compositions |
| War Beasts | Horses, hounds, (later) lesser drakes | Natural part of cavalry/specialist units |
| True Dragons | Entirely separate domain entity | NOT a commander, NOT a troop, NOT stackable |

---

## J. Dragon Domain Architecture

### Lesser Fauna vs True Dragons

| Category | Examples | Domain Model | Behavior | Combat Role |
|----------|---------|-------------|----------|-------------|
| **Drakes** | Common drake, forest drake | Animal/PvE enemy | Repeatable, territorial, predictable | PvE camp targets, early-game encounters |
| **Wyverns** | Ridgeback wyvern, canyon wyvern | Dangerous predator | More aggressive, pack behavior possible | Mid-game PvE, expedition threats |
| **Wyrms** | Mountain wyrm, cave wyrm | Rare, dangerous | Territorial, hoard-associated | High-level PvE, expedition bosses |
| **Sea Dragons** | River serpent, lake leviathan | Ecological niche | Water-associated, rare | Wilderness-specific threats |
| **True Dragons** | Named individuals | Entirely different domain | Intelligent, rare, politically important | World events, alliance objectives, late-game |
| **Great Dragons** | Historical figures | Lore/narrative | Individual characters in world history | Background, legend, aspiration |

### Domain Model Requirements

**Lesser fauna**: Can be PvE targets, repeatable, stackable enemies. Use existing camp/wilderness system. No new domain model needed.

**True Dragons**: Requires entirely new domain:
- Unique named entity (not a stack)
- Health/anatomy (Direction Freeze §8)
- Behavior AI (not static stats)
- Relationship system (not ownership)
- World-map presence (visible to nearby players)
- Political significance (alliance objectives)
- Ecology (territory, food, migration)

**This is Phase 7 work.** Do not design True Dragon mechanics in Phase 2. Design the **readiness gate** that leads to encountering them.

### Dragon Readiness System (PROVISIONAL)

Preserves PG-INV-007 (multi-system gate):

```
Dragon Knowledge (Bestiary entries from PvE + expeditions)
    +
Dragon Material (world-earned preparation items)
    +
Dragon Facility (visible building progression)
    +
Dragon Research (Dragon Studies branch)
    +
Expedition Accomplishment (targeted world activity)
    ↓
PRIMARY DRAGON READINESS GATE
    ↓
Targeted World Hunt / Expedition
    ↓
First Dragon Encounter (not ownership — encounter)
    ↓
Settlement Prerequisite
```

This preserves the DoA topology: `readiness → targeted hunt → settlement prerequisite`.

### Bestiary System (PROVISIONAL)

Three books (Direction Freeze §15):

**Bestiary:**
```
Unknown Mountain Wyrm
  → Observed: large, wingless, heavy dorsal armor
  → Attacks: bite, tail sweep, crush
  → Vulnerabilities: unknown
  → Habitat: mountain caves, below treeline
  → Diet: unknown
  → Records: 1 confirmed sighting, 0 kills
  → Recommended: avoid until Heavy Crossbow and Pike formation available
```

Progression: knowledge improves with encounters, kills, study, alliance intelligence sharing. Knowledge can be **wrong** (a scholar's error is more valuable than a finished taxonomy).

**Arms & Warfare:**
- Troop descriptions, formation guides, weapon effectiveness
- Unlocked as research progresses
- Includes anti-dragon equipment descriptions

**Chronicle:**
- Kingdom histories, famous battles, notable dragons
- Slayer Order records
- Alliance achievements (emergent)

---

## K. Combat Destination Model

### Current Resolver Capabilities (VERIFIED)

| Capability | Present? | Notes |
|-----------|----------|-------|
| Server-authoritative resolution | YES | Pure function, no I/O |
| Determinism / seeded PRNG | YES | mulberry32, reproducible |
| Role-based RPS | YES | 6 roles, amplified matrix |
| Stack soft-cap | YES | 50-100% efficiency bands |
| Quality gap via power | YES | power^0.55 offense, (target/from)^0.45 defense |
| Range / movement | YES | Open distance from max range, step = speed*2.5 |
| Targeting AI | YES | Role-dependent priority scoring |
| Battle reports | YES | Losses, remaining, winner, rounds |
| Commander modifiers | NO | Sovereign exists but resolver ignores research/building/alliance |
| Terrain effects | NO | No terrain in combat |
| Formation effects | NO | No formation system |
| Morale | NO | No morale system |
| Fortification | NO | No wall/structure layer |
| Siege mechanics | NO | No structural damage |
| Dragon anatomy | NO | No localized damage zones |
| Armor/shield distinction | NO | Single defense stat |
| Ammunition | NO | Unlimited ranged attacks |

### Destination Capability Model

For v1 (Phase 4), the resolver needs:
1. **Commander bonuses** — leadership stat modifies army performance
2. **Research modifiers** — combat research actually affects battle stats
3. **Armor/Shield distinction** — (future) two defense types

For v1.5 (Phase 5+), the resolver needs:
4. **Formation system** — pike bracing, shield wall, cavalry wedge
5. **Terrain modifiers** — forest reduces cavalry, hills improve ranged
6. **Siege layer** — walls have HP, structural damage, breach mechanics

For v2 (Phase 7+), the resolver needs:
7. **Dragon anatomy** — localized damage zones, flight mechanics
8. **Anti-dragon weapons** — specialized projectiles, trap effects
9. **Morale system** — routing, flee, rally
10. **Scouting in combat** — hidden units, ambush

**Do not implement 4-10 during this migration.** Design the resolver interface to accept them later.

---

## L. PvE / Wilderness Design

### Current PvE (VERIFIED)

**Camps**: 10 levels, static composition per level, predictable loot scaling. Example:
- L1: 40 Levy → reward: 50 kelp, 30 driftwood, 10 basalt
- L5: 300 Bullhorn + 100 Reefbow → reward: 250 kelp, 150 driftwood, 50 basalt + harness drop
- L10: 40,000 power mixed → reward: 500 kelp, 300 driftwood, 100 basalt + harness drop

**Wilderness**: Claimable territory, +5% production per claim. Formula: `wildMul = 1 + ownedWildCount * 0.05`.

### Target PvE (PROVISIONAL)

**Preserved**: Repeatable targets, readable risk bands, world-map presence.

**Rejected**: Static composition forever, one-solved-army farming every camp.

**Target variation model:**
```
Bandit Camp (T1-2) — basic infantry targets, low loot
Raider Fort (T2-3) — mixed infantry + ranged, moderate loot
Mercenary Company (T2-3) — variable composition, hiring opportunity
Cult Enclave (T3-4) — ranged-heavy, dragon-knowledge drops
Beast Den (T2-4) — drake/wyvern targets, ecology drops
Wyrm-Scarred Ruin (T3-5) — dragon-damaged site, ancient knowledge
Abandoned Keep (T4-6) — fortified target, siege requirement
Dragon Territory (T5+) — true dragon presence, expedition requirement
```

**Controlled variation per camp type:**
- 3-5 composition templates per band (not 1 static composition)
- Player level influences which template spawns
- Seasonal rotation of dominant template
- Alliance-level rare spawns (world boss candidates)

**Wilderness target:**
```
Forest → timber production bonus
Fertile Valley → food production bonus
Quarry → stone production bonus
Iron Hills → iron production bonus
Crossroads → march speed bonus (logistics)
Watch Hill → scout range bonus (intelligence)
River Crossing → march control (strategic)
Dragon Territory → dangerous but high-value resources + knowledge
```

---

## M. Settlement / Outpost Progression

### Capital

Balanced core. Starts small. Grows via Keep progression.

### First Specialized Settlement (DESIGN DECISION — EXPERIMENT)

**Preserved topology**: `dragon readiness → targeted world activity → rare/special prerequisite → differentiated settlement → new capability`

**Candidate prerequisite models:**

| Model | Pros | Cons | Recommendation |
|-------|------|------|----------------|
| Rare drop (DoA-style egg) | Aspirational, exciting | RNG frustration, no agency | REJECT for v1 |
| Deterministic milestone | Clear goal, achievable | Less exciting, may feel grindy | PROVISIONAL |
| Multi-part expedition | Engaging, narrative-rich | Complex to implement | PROVISIONAL |
| Territory-control prerequisite | Strategic, alliance-relevant | May gate solo players | EXPERIMENT |
| Hybrid (milestone + expedition) | Best of both | Slightly complex | **RECOMMEND** |

**Recommended model for v1**: Hybrid — player must:
1. Reach dragon-readiness composite gate (knowledge + material + facility + research)
2. Complete a targeted multi-step expedition (3-5 PvE encounters of increasing difficulty)
3. Earn a "Charter of Settlement" from the expedition (deterministic, not RNG)
4. Found the settlement at a world-selected location

This preserves:
- PG-INV-007 (multi-system readiness gate)
- PG-INV-008 (world-earned prerequisite)
- PG-INV-009 (differentiated settlement)

### Settlement Classes (PROVISIONAL — from first principles)

| Class | Unlock Prerequisite | Economic Role | Military Role | Research Role | Dragon Role | Alliance Role | Why Not City #2 |
|-------|-------------------|--------------|--------------|--------------|-------------|--------------|-----------------|
| **Marcher Keep** | First settlement charter | Cavalry production, fast reinforcement | Scout network, cavalry forces | Horsemanship research | — | Border defense, rapid response | Enables cavalry army composition the capital cannot |
| **Mountain Hold** | Stonekeel-equivalent charter | Iron production, mining | Heavy infantry, armor | Metallurgy research | Anti-dragon engineering | Resource alliance supply | Enables iron economy and heavy equipment |
| **Forest Citadel** | Later charter | Timber production, hunting | Archery, ambush | Scouting research | Wildlife ecology, drake tracking | Intelligence network | Enables advanced scouting and archery doctrine |
| **Dragon Watch** | Late charter, dragon knowledge | Dragon-related resources | Slayer training, anti-dragon | Dragon Studies research | Bestiary hub, expedition staging | Dragon-hunt coordination | Only settlement where dragon interaction is possible |

---

## N. UI/UX Target Architecture

### Current State (VERIFIED)

Single-component dashboard with 8 tabs: City, Grounds, Map, War, Alliance, Shop, Codex, Settings.

### Target Architecture

Three conceptual views, eventually:

**Castle View** (replaces City tab):
```
Visual medieval settlement showing:
- Keep (central, grows with level)
- Homes (surrounding, population visible)
- Barracks (troop training queue)
- Smithy (equipment forge)
- Scriptorium (research tree)
- Muster Yard (march composition)
- Watchtower (threat alerts)
- Walls (defense status, integrity)
- Dragon-related facilities (late game)
```

**Lands View** (replaces Grounds tab):
```
Surrounding territory showing:
- Farm plots (food production)
- Woodland (timber production)
- Quarry (stone production)
- Mine (iron production)
- Roads (logistics)
- Villages (population)
- Local terrain (visual terrain, not just numbers)
```

**Realm View** (replaces Map tab):
```
World map showing:
- Geography (forests, rivers, hills, mountains, roads)
- Cities (all players, with visible fortification level)
- Camps / Ruins / PvE targets (with visible risk level)
- Wilderness (claimable, with visible resource type)
- Dragon territory (dangerous zones, visible tracks/signs)
- Marches (visible movement)
- Alliance territory (colored borders)
- Strategic locations (crossroads, river crossings, watch hills)
```

**Not replacing immediately**: The dashboard pattern is acceptable for Phase 3-4. The three-view architecture is a destination, not an immediate requirement. The current tab system works for vertical slice.

---

## O. Visual / Theme Direction

### Current Theme (VERIFIED)

Ocean-blue default with faction-specific aquatic palettes. Deep dark backgrounds (#0b1520), teal/cyan/amber/purple accents.

### Target Theme

**Primary palette:**
```
Stone gray (walls, buildings)
Timber brown (structures, warmth)
Iron dark (weapons, armor)
Parchment (UI backgrounds, knowledge)
Aged leather (cards, menus)
Heraldry colors (factions — not elemental)
Mud / earth (ground, terrain)
Forest green (wilderness, nature)
Smoke gray (siege, warfare)
Torchlight amber (UI highlights, warmth)
```

**Dragon punctuation:**
```
Huge scale fragments (in terrain)
Claw marks (on structures)
Blackened masonry (dragon fire damage)
Unusual bones (in wilderness)
Specialized ballistae (anti-dragon)
Dragon warning beacons (on towers)
Reinforced roofs (dragon-proof architecture)
Memorials (Slayer inscriptions)
Slayer insignia (factions within settlements)
```

**The visual theme should communicate**: society shaped by dragon pressure. Not medieval society with dragons pasted on top.

---

## P. Migration Impact Map

### M0 — Content/Theme Only (Low risk)

| Surface | What Changes | Risk |
|---------|-------------|------|
| Unit names in content JSON | tidepike → pikeman, reefbow → longbowman, etc. | LOW — content ID changes only |
| Building names in content JSON | forge_heart → keep, etc. | LOW |
| Research names in content JSON | tidefarming → agriculture, etc. | LOW |
| Matchup descriptions | Design intent text | LOW |
| Tutorial step copy | "tide map" → "medieval settlement" | LOW |
| Camp descriptions | "Riftborn" → "bandit" | LOW |
| README text | Narrative changes | LOW |

### M1 — Content IDs (Medium risk)

| Surface | What Changes | Risk |
|---------|-------------|------|
| Unit IDs in units.json | tidepike → pikeman | MEDIUM — affects march composition JSON, unit_stacks keys |
| Building IDs in buildings.json | forge_heart → keep | MEDIUM — affects building slot records |
| Research IDs in research.json | tidefarming → agriculture | MEDIUM — affects research_levels keys |
| Plot type IDs | kelp_farm → farm | MEDIUM — affects field_plots records |
| Citadel IDs in citadels.json | brinehold → marcher_keep | MEDIUM — affects cities.kind CHECK, citadel API |
| Faction IDs | brinecant → (new kingdom) | MEDIUM — affects players.faction CHECK |
| Defense posture values | harbor → garrison | MEDIUM — affects cities.defense_posture CHECK |
| Shop item IDs | speedup_1m → dispatch | LOW — item_stacks keys |

**CRITICAL**: Content ID changes require database migrations. Old saves cannot be ported without data migration scripts.

### M2 — API/Type Migration (High risk)

| Surface | What Changes | Risk |
|---------|-------------|------|
| `ResourceBag` type | kelp→food, driftwood→timber, etc. | HIGH — affects every API payload |
| `Faction` type | brinecant→(new) | HIGH — affects player creation, theming |
| `CityKind` type | brinehold→marcher_keep, etc. | HIGH — affects city creation, founding |
| `DefensePosture` type | harbor→garrison | HIGH — affects posture setting, combat resolution |
| `MarchIntent` types | May change | MEDIUM |
| API response shapes | Resource names in city payloads | HIGH — affects web client |
| Client state management | Resource display, faction theming | HIGH |

### M3 — Schema/Data Migration (High risk)

| Surface | What Changes | Risk |
|---------|-------------|------|
| `cities` resource columns | Rename kelp→food, etc. | HIGH — requires ALTER TABLE, data migration |
| `players.faction` CHECK | Update allowed values | HIGH — requires CHECK constraint change |
| `cities.kind` CHECK | Update citadel names | HIGH |
| `cities.defense_posture` CHECK | harbor→garrison | HIGH |
| `sovereigns` table | DELETE or repurpose | HIGH — affects marches.sovereign_id FK |
| `field_plots.plot_type` | Update allowed values | MEDIUM |
| Existing save data | All compositions use old unit IDs | HIGH — requires JSON migration |

### M4 — Domain Model Replacement (Very High risk)

| Surface | What Changes | Risk |
|---------|-------------|------|
| Sovereign system | DELETE entirely | VERY HIGH — affects combat, marches, tutorial, API |
| Harbinger tutorial | Complete rewrite | HIGH |
| Harness system | Repurpose as dragon readiness | HIGH — new domain model |
| Population system | NEW domain object | HIGH — new schema, new API, new UI |
| Commander system | Repurpose from sovereign/commander | MEDIUM — new progression model |

### M5 — Resolver/System Architecture Change (Highest risk)

| Surface | What Changes | Risk |
|---------|-------------|------|
| RPS matrix | Expand for medieval roles | HIGH — affects all matchups |
| Combat stat model | Add commander modifiers | HIGH |
| Resolver interface | Accept terrain, formation, siege params | HIGH |
| Camp composition | Dynamic templates | MEDIUM |
| March system | Dragon expedition support | HIGH |

---

## Q. Target System Map V1

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ECONOMY                                      │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────┐                │
│  │  Fields  │───→│  Resources   │───→│  Production │                │
│  └─────────┘    └──────┬───────┘    └─────────────┘                │
│                        │                                             │
│  ┌─────────┐    ┌──────▼───────┐    ┌─────────────┐                │
│  │  Homes  │───→│  Population  │───→│   Manpower  │                │
│  └─────────┘    └──────────────┘    └──────┬──────┘                │
│                                            │                        │
│  ┌─────────┐    ┌──────────────┐    ┌──────▼──────┐                │
│  │ Tax Rate│───→│ Coin Revenue │    │  Recruitment│                │
│  └─────────┘    └──────────────┘    └──────┬──────┘                │
└─────────────────────────────────────────────────┬────────────────────┘
                                                  │
┌─────────────────────────────────────────────────▼────────────────────┐
│                      CONSTRUCTION                                    │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐               │
│  │   Keep   │───→│  Buildings   │───→│  Capabilities│               │
│  └──────────┘    └──────────────┘    └──────┬──────┘               │
│                                              │                      │
│  ┌──────────┐    ┌──────────────┐    ┌──────▼──────┐               │
│  │ Research │───→│  Tech Tree   │───→│   Unlocks   │               │
│  └──────────┘    └──────────────┘    └──────┬──────┘               │
└─────────────────────────────────────────────────┬────────────────────┘
                                                  │
┌─────────────────────────────────────────────────▼────────────────────┐
│                       MILITARY                                       │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐               │
│  │Training  │───→│ Troop Roster │───→│  Composition │               │
│  │Infra     │    └──────────────┘    └──────┬──────┘               │
│  └──────────┘                               │                       │
│  ┌──────────┐    ┌──────────────┐    ┌──────▼──────┐               │
│  │Muster    │───→│ March Count  │───→│ March Ops   │               │
│  │Yard      │    │ + Capacity   │    └──────┬──────┘               │
│  └──────────┘    └──────────────┘           │                       │
│  ┌──────────┐    ┌──────────────┐    ┌──────▼──────┐               │
│  │Commander │───→│ Leadership   │───→│ Battle Mod  │               │
│  │Hall      │    │ + Tactics    │    └─────────────┘               │
│  └──────────┘    └──────────────┘                                   │
└─────────────────────────────────────────────────┬────────────────────┘
                                                  │
┌─────────────────────────────────────────────────▼────────────────────┐
│                       WORLD MAP                                      │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐               │
│  │  Camps   │───→│ PvE Combat   │───→│   Loot +    │               │
│  │  (PvE)   │    └──────────────┘    │   Knowledge │               │
│  └──────────┘                        └──────┬──────┘               │
│  ┌──────────┐    ┌──────────────┐    ┌──────▼──────┐               │
│  │Wilderness│───→│  Territory   │───→│   Persistent│               │
│  │          │    │  Control     │    │   Bonus     │               │
│  └──────────┘    └──────────────┘    └──────┬──────┘               │
│                                              │                      │
│  ┌──────────┐    ┌──────────────┐    ┌──────▼──────┐               │
│  │  Scouts  │───→│   Intel      │───→│  Target     │               │
│  │          │    │              │    │  Selection  │               │
│  └──────────┘    └──────────────┘    └─────────────┘               │
└─────────────────────────────────────────────────┬────────────────────┘
                                                  │
┌─────────────────────────────────────────────────▼────────────────────┐
│                    DRAGON SYSTEMS (late)                              │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐               │
│  │ Bestiary │───→│ Dragon       │───→│  Readiness  │               │
│  │ Knowledge│    │ Research     │    │  Gate       │               │
│  └──────────┘    └──────────────┘    └──────┬──────┘               │
│  ┌──────────┐    ┌──────────────┐    ┌──────▼──────┐               │
│  │Dragon    │───→│ Material     │───→│  Expedition │               │
│  │Facility  │    │ Collection   │    │  Unlock     │               │
│  └──────────┘    └──────────────┘    └──────┬──────┘               │
│                                              │                      │
│  ┌──────────┐    ┌──────────────┐    ┌──────▼──────┐               │
│  │Lesser    │───→│ Dragon       │───→│  Encounter  │               │
│  │Fauna     │    │ Ecology      │    │  Events     │               │
│  └──────────┘    └──────────────┘    └──────┬──────┘               │
│                                              │                      │
│  ┌──────────┐    ┌──────────────┐    ┌──────▼──────┐               │
│  │True      │───→│ Bonding /    │───→│  Alliance-  │               │
│  │Dragons   │    │ Interaction  │    │  Scale Ops  │               │
│  └──────────┘    └──────────────┘    └─────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
                                                  │
┌─────────────────────────────────────────────────▼────────────────────┐
│                    EXPANSION                                          │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐               │
│  │Settlement│───→│ Charter      │───→│  Founded    │               │
│  │Prereq    │    │ Earned       │    │  Settlement │               │
│  └──────────┘    └──────────────┘    └──────┬──────┘               │
│                                              │                      │
│  ┌──────────┐    ┌──────────────┐    ┌──────▼──────┐               │
│  │Different-│───→│ New Capability│───→│  Regional   │               │
│  │iated     │    │ (eco/mil)    │    │  Expansion  │               │
│  └──────────┘    └──────────────┘    └──────┬──────┘               │
│                                              │                      │
│  ┌──────────┐    ┌──────────────┐    ┌──────▼──────┐               │
│  │Regional  │───→│ Alliance     │───→│  PvP +      │               │
│  │Power     │    │ Interdepend. │    │  War        │               │
│  └──────────┘    └──────────────┘    └─────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
```

### Loop Edges

```
Economy → Military → World → Dragon → Expansion → Economy (larger)
Economy → Military → World → PvP → Alliance → World (shared objectives)
Military ←→ World (PvE success feeds military capability)
Military ←→ Dragon (anti-dragon military capability)
Expansion → Economy (new settlement adds resources)
Alliance ←→ Dragon (dragon hunts are alliance-scale)
```

### Dead-End Systems (Currently Disconnected)

| System | Currently Connected To | Missing Connection |
|--------|----------------------|-------------------|
| Research | Nothing (percentage bonuses only) | Should unlock units, capabilities |
| Commander | Marches (slot only) | Should modify combat |
| Sovereign | Combat (dominates) | Should be deleted; replaced by dragon readiness |
| Codex | Nothing (raw JSON) | Should connect to Bestiary knowledge |
| Shop | Resources (speedups) | Should connect to wartime stores concept |
| Alliance | Reinforce + Haul | Should connect to shared objectives, dragon hunts |

---

## R. Vertical Slice 1A Contract

### Step 1: Player Begins with Small Capital

- **Prerequisite**: New account creation
- **Player action**: Create guest player, receive starting capital
- **State mutation**: New player + city created with 200 food, 200 timber, 0 stone, 0 iron, 0 coin; Keep L1; 5 empty building slots; 12 field plots
- **Reward**: Starting resources, tutorial banner visible
- **UI feedback**: Castle view showing small settlement with Keep, empty slots, resource display
- **Next dependency**: Build first building
- **PG-INV**: PG-INV-001 (economy feeds military)
- **Acceptance criteria**: Player sees a small medieval settlement with resources and empty building slots

### Step 2: Establish Basic Economy

- **Prerequisite**: Step 1 complete
- **Player action**: Assign farm plot, assign lumber yard
- **State mutation**: 2 field plots assigned, production rates increase
- **Reward**: +30 food/hr, +30 timber/hr per plot level
- **UI feedback**: Lands view showing farms and woodland, production rates displayed
- **Next dependency**: Build more infrastructure
- **PG-INV**: PG-INV-001 (economy feeds development)
- **Acceptance criteria**: Production rates visibly increase, resources accumulate

### Step 3: Grow Population / Manpower

- **Prerequisite**: Step 2 complete
- **Player action**: Build Homes
- **State mutation**: Homes building created, population capacity increases
- **Reward**: Manpower pool available for recruitment
- **UI feedback**: Population display showing capacity vs current, available manpower
- **Next dependency**: Build military infrastructure
- **PG-INV**: PG-INV-002 (population is mechanically meaningful)
- **Acceptance criteria**: Manpower pool visible, tradeoffs legible

### Step 4: Build Military / Research Infrastructure

- **Prerequisite**: Step 3 complete
- **Player action**: Build Barracks, build Scriptorium
- **State mutation**: Barracks + Scriptorium created
- **Reward**: Can train units, can research
- **UI feedback**: Castle view shows Barracks and Scriptorium, training and research options enabled
- **Next dependency**: Research first tech, train first troops
- **PG-INV**: PG-INV-003 (research unlocks strategy)
- **Acceptance criteria**: Training and research queues operational

### Step 5: Unlock First Meaningful Troop Specialization

- **Prerequisite**: Step 4 complete
- **Player action**: Research Infantry Doctrine L1, train Levy Spearman x20 + Bowman x10
- **State mutation**: Infantry Doctrine researched, Levy + Bowman stacks created
- **Reward**: Two distinct tactical roles available
- **UI feedback**: Troop roster shows two unit types with different stats, combat role descriptions
- **Next dependency**: Scout target, march to PvE
- **PG-INV**: PG-INV-003 (research changes available strategy)
- **Acceptance criteria**: Two unit types trainable, composition visible, roles legible

### Step 6: Train Composition

- **Prerequisite**: Step 5 complete
- **Player action**: Train full composition (Levy x20, Bowman x10, Scout x5, Porter x5)
- **State mutation**: Troop stacks increase
- **Reward**: Balanced composition with infantry, ranged, scout, logistics
- **UI feedback**: Stacks display showing composition with role labels
- **Next dependency**: Scout world target
- **PG-INV**: PG-INV-001 (economy feeds military)
- **Acceptance criteria**: Composition has at least 2 tactical roles + logistics + scouting

### Step 7: Scout World Target

- **Prerequisite**: Step 6 complete
- **Player action**: Open Map, select Bandit Camp L1, send Scout
- **State mutation**: Scout march created, travels to target, returns with intel
- **Reward**: Intel report showing camp level, composition, threat band
- **UI feedback**: Scout report in War tab with structured intel
- **Next dependency**: Attack camp
- **PG-INV**: PG-INV-005 (world PvE feeds progression)
- **Acceptance criteria**: Scout returns readable intel, camp threat assessed

### Step 8: Fight Repeatable PvE

- **Prerequisite**: Step 7 complete
- **Player action**: Send Levy x20 + Bowman x10 to attack Bandit Camp L1
- **State mutation**: March created, lands, combat resolves, battle report generated
- **Reward**: Resources + first dragon-related clue (shed scale, burned track, rumor)
- **UI feedback**: Battle report showing losses, remaining, loot. Bestiary entry updated with "Bandit Camp - first encounter"
- **Next dependency**: Capture wilderness
- **PG-INV**: PG-INV-005 (PvE yields knowledge + resources)
- **Acceptance criteria**: Battle report generated, loot credited, Bestiary shows incomplete entry

### Step 9: Capture Wilderness

- **Prerequisite**: Step 8 complete
- **Player action**: Send troops to occupy unclaimed Forest tile
- **State mutation**: Wilderness claimed, production bonus applied
- **Reward**: +5% production to all resources
- **UI feedback**: Map shows claimed wilderness (green border), production rate increase
- **Next dependency**: Discover dragon-related knowledge
- **PG-INV**: PG-INV-006 (wilderness ownership has persistent value)
- **Acceptance criteria**: Wilderness claimed, production visibly increased

### Step 10: Discover Dragon-Related Knowledge / Material

- **Prerequisite**: Step 9 complete
- **Player action**: Attack Bandit Camp L3 (harder target)
- **State mutation**: Battle resolves, drops "Shed Scale" item + Bestiary update
- **Reward**: "Unknown creature scale recovered" — Bestiary shows partial entry
- **UI feedback**: Bestiary entry: "Unknown Drake — Scale recovered. Size: small-medium. Material: unknown. Origin: possibly local predator."
- **Next dependency**: Advance composite dragon readiness
- **PG-INV**: PG-INV-005 (PvE yields dragon knowledge)
- **Acceptance criteria**: Bestiary shows incomplete dragon-related entry, material item in inventory

### Step 11: Advance Composite Dragon Readiness

- **Prerequisite**: Step 10 complete
- **Player action**: Research Dragon Studies L1, build Dragon Watch facility, defeat 3 different camp types
- **State mutation**: Dragon Studies researched, Dragon Watch building created, Bestiary expanded
- **Reward**: Composite readiness score advances (knowledge + material + facility + research)
- **UI feedback**: Dragon Readiness progress bar showing 4 contributing factors
- **Next dependency**: Complete targeted expedition
- **PG-INV**: PG-INV-007 (dragon readiness is multi-system)
- **Acceptance criteria**: Readiness bar shows progress across 4 dimensions

### Step 12: Complete Targeted World Activity (Expedition)

- **Prerequisite**: Step 11 complete
- **Player action**: Begin "Dragon Territory Expedition" — 3 sequential PvE encounters of increasing difficulty
- **State mutation**: Expedition status tracked, 3 battles resolve
- **Reward**: "Charter of Settlement" earned from expedition completion
- **UI feedback**: Expedition progress indicator, Charter item in inventory
- **Next dependency**: Found secondary settlement
- **PG-INV**: PG-INV-008 (expedition earns settlement prerequisite)
- **Acceptance criteria**: Charter earned, expedition shows completion

### Step 13: Earn First Settlement Prerequisite

- **Prerequisite**: Step 12 complete
- **Player action**: (Charter already earned — this step is verification)
- **State mutation**: Charter flag set on player
- **Reward**: Settlement founding available
- **UI feedback**: Found Settlement button enabled in Castle view
- **Next dependency**: Found settlement
- **PG-INV**: PG-INV-008 (world-earned prerequisite)
- **Acceptance criteria**: Player can found Marcher Keep

### Step 14: Establish Differentiated Secondary Settlement

- **Prerequisite**: Step 13 complete
- **Player action**: Found Marcher Keep at selected world location
- **State mutation**: New city created with "marcher_keep" kind, unique starting bonuses
- **Reward**: Marcher Keep founded with cavalry training bonus, scout network capability
- **UI feedback**: New settlement visible on map, unique building options, cavalry training unlocked
- **Next dependency**: Gain new strategic capability
- **PG-INV**: PG-INV-009 (differentiated settlement grants new capability)
- **Acceptance criteria**: Marcher Keep exists, cavalry units trainable there, capital cannot train them

### Step 15: Gain New Strategic Capability

- **Prerequisite**: Step 14 complete
- **Player action**: Train Light Cavalry at Marcher Keep
- **State mutation**: Light Cavalry stack created at Marcher Keep
- **Reward**: Fast reinforcement, cavalry flanking, scout support
- **UI feedback**: Marcher Keep shows cavalry roster, march from Keep uses cavalry
- **Next dependency**: Slice 1A complete — ready for Slice 1B (PvP)
- **PG-INV**: PG-INV-009 (new capability changes optimal play)
- **Acceptance criteria**: Cavalry changes tactical options vs capital-only forces

---

## S. Vertical Slice 1B Preview

After 1A works:

```
Scout another player → see their defense posture, approximate troop strength
Attack / defend → battle report with losses, loot
Reinforce → send troops to ally's city
Alliance → create/join, shared chat, coordinated attacks
Shared objective → alliance-level dragon territory expedition
```

This isolates the question: **Is the kingdom/dragon/outpost progression loop compelling before multiplayer social pressure is added?**

---

## T. Adversarial Review

### 1. Are we preserving DoA because it was good, or because of nostalgia?

**Answer**: The DoA **progression dependency network** is genuinely strong. The chain `economy → military → world activity → dragon readiness → differentiated expansion → alliance` creates meaningful decision points at every stage. Individual nouns (Water Outpost, Great Dragon armor) are not being preserved — the topology is.

**Risk**: Nostalgia could lead to preserving DoA's specific pacing (1-2 weeks before dragon readiness). Dragon Wake should compress this while preserving the multi-system gate structure.

### 2. Which DoA mechanisms actually create strategic depth?

**Strong depth mechanisms:**
- Population/manpower tradeoff (PG-INV-002)
- Research → unit unlocks (PG-INV-003)
- March capacity as separate progression (PG-INV-004)
- Wilderness ownership as persistent value (PG-INV-006)
- Multi-system dragon readiness (PG-INV-007)
- Differentiated expansion (PG-INV-009)

**Weak/degenerate mechanisms:**
- Tax toggling (exploit, not depth)
- One construction queue (timer friction, not strategy)
- Solved camp farming (predictable, not strategic)
- General victory farming (easy mode, not depth)

### 3. Does population meaningfully improve the game?

**Yes, if PG-INV-002 is preserved.** Population creates the fundamental tension: you can't have unlimited army AND unlimited economy. The tradeoff is: labor for production vs recruits for military.

**Risk**: Population becomes a number you ignore after optimizing once. Mitigation: make the tradeoff visible and adjustable without permanent traps.

### 4. Could differentiated settlements become forced content gates?

**Yes.** If the Marcher Keep is required for cavalry, players who don't found it are permanently disadvantaged in PvP. This is intentional (PG-INV-009) — expansion should change capabilities.

**Risk**: Solo players or small alliances can't compete with large alliances who found all settlements. Mitigation: settlements provide specialized capabilities, not universally superior ones. A capital-focused player with strong infantry can still be competitive against a cavalry-focused Marcher Keep player.

### 5. Could dragon readiness become tedious?

**Yes, if it's a grind.** The DoA failure mode (dragon peripherally relevant for weeks) must be avoided. Dragon presence should be felt early (burned villages, rumors, shed scales). The readiness gate should take days, not weeks.

**Risk**: Making dragon readiness too quick makes True Dragons common. Mitigation: readiness leads to encountering dragons, not owning them. Bonding with a True Dragon remains late-game.

### 6. Could rare True Dragons become unattainable enough to disappoint?

**Possible.** If only 0.1% of players ever interact with True Dragons, the dragon fantasy is decorative, not mechanical.

**Mitigation**: Make lesser fauna (drakes, wyverns) encounterable and useful. Make True Dragon encounters (not ownership) achievable for dedicated mid-game players. Make bonding a rare late-game achievement that creates legendary status.

### 7. Does a Bestiary produce strategy or just extra UI?

**Strategy, if knowledge affects mechanics.** If knowing that "Ironback Wyrms are vulnerable to heavy crossbows at <80 paces" changes your preparation, the Bestiary is a gameplay system, not flavor text.

**Risk**: Bestiary becomes a lore dump nobody reads. Mitigation: tie Bestiary entries to actual combat modifiers, expedition requirements, and settlement unlocks.

### 8. Can medieval realism constrain fun too much?

**Yes, if taken too literally.** "Medieval" doesn't mean "historically accurate simulation." It means recognizable medieval aesthetics and concerns (castles, armies, logistics, feudal politics). Fun comes from meaningful choices, not from making the player manage grain stores during a famine.

**Mitigation**: Keep the macro loop fast enough that the player always has something to do. Realism provides texture, not tedium.

### 9. Does adding many troop types overwhelm players?

**Possible, if all are available at once.** The current 16-unit roster is manageable. The proposed initial roster (10 units + 4 later) is similar.

**Mitigation**: Unlock units progressively through research. Start with 4-5 units, add 1-2 every few hours of play. The Bestiary provides context for why each unit exists.

### 10. Can the current resolver support the proposed roster?

**Yes, for v1.** The resolver handles melee, range, speed, logistics, scout roles. The medieval roster maps cleanly: infantry→melee, archers→range, cavalry→speed, porters→logistics, scouts→scout.

**Missing for v1.5+**: Commander modifiers, research modifiers in resolver, terrain, formation, siege. These require resolver expansion but not replacement.

### 11. Which systems would require a rewrite rather than migration?

| System | Migration vs Rewrite | Notes |
|--------|---------------------|-------|
| Economy | Migration (rename columns) | Structurally compatible |
| Buildings | Migration (rename IDs) | Structurally compatible |
| Research | Migration (rename IDs, change % mechanics) | Partial rewrite of bonus application |
| Units | Migration (rename IDs, redesign stats) | Content rewrite, resolver compatible |
| Combat | Rewrite (new stat model) | Architecture preserved, model changed |
| Sovereign | DELETE (new domain model) | Dragon readiness replaces harness purpose |
| Population | NEW (not migration) | New schema, new API, new UI |
| Bestiary | NEW (not migration) | New domain, new UI, new API |
| Dragon systems | NEW (not migration) | New domain entirely |
| Settlements | Migration (rename IDs) + NEW mechanics | Ladder preserved, differentiation new |
| Web UI | Rewrite (new views) | Dashboard acceptable for v1 |

### 12. Could preserving large armies conflict with meaningful tactical combat?

**Possible.** If armies are 50,000+ troops, individual unit roles become statistics rather than tactics. The current stack efficiency (50% at 250k+) already addresses this.

**Mitigation**: Design combat so that composition matters more than count. A well-composed 10,000-troop army should defeat a poorly-composed 20,000-troop army. The current quality gap system (power^0.55) supports this.

### 13. How do dragons remain extraordinary without being inaccessible?

**By separating encounter from ownership.** Players encounter dragon effects early (burned farmland, rumors, shed scales). They fight lesser fauna mid-game. They encounter True Dragons in targeted expeditions. They bond with True Dragons in late-game. The progression is: awareness → study → encounter → engagement → relationship.

### 14. How do alliances become important without making solo players irrelevant?

**By making alliance-scale operations rewarding but not mandatory.** Solo players can progress through PvE, wilderness, and early dragon-readiness. Alliance play unlocks: reinforcement, shared intelligence, dragon hunts (alliance-scale), territorial warfare, and shared objectives. The key: solo is viable, alliance is better.

### 15. Could monetization destroy distance/logistics?

**Yes.** If march time can be skipped with payment, distance becomes meaningless. Direction Freeze §21 says "distance and time matter."

**Provisional constraint**: Build queues and research queues may have acceleration (mundane wartime stores). March time acceleration is PROHIBITED for v1. Shields are acceptable as "garrison readiness" (not teleportation). The paid currency represents trade goods, not magic.

### 16. Are secondary settlements meaningfully distinct or merely themed buffs?

**They must be mechanically distinct.** The Marcher Keep trains cavalry the capital cannot. The Mountain Hold produces iron the capital cannot. The Forest Citadel provides scouting the capital cannot. Each settlement changes the strategic calculus, not just the aesthetic.

**Risk**: All settlements eventually become interchangeable. Mitigation: each settlement has exclusive units, exclusive research branches, and exclusive world-map interactions.

### 17. What is Dragon Wake's strongest unique gameplay claim after this migration?

**A kingdom-war game where thousands of medieval soldiers, castles, logistics, dragon ecology, specialized settlements, Slayers, territorial warfare and rare True Dragons all belong to one coherent progression system.**

No current game combines:
- Persistent MMORTS warfare with medieval armies
- Meaningful logistics and territory control
- Dragon ecology as a world-shaping force (not a collectible)
- Settlement specialization that changes strategic options
- Bestiary knowledge as gameplay (not flavor)
- Alliance-scale dragon encounters

---

## U. Decision Table

| Decision | Classification | Rationale |
|----------|---------------|-----------|
| Preserve DoA progression topology | **FREEZE NOW** | Core inherited mechanism, highest strategic value |
| Medieval grounding + dragon civilization | **FREEZE NOW** | Direction Freeze v1 already frozen |
| True Dragons as separate domain model | **FREEZE NOW** | Structurally incompatible with Sovereign/troop model |
| Sovereign → DELETE | **FREEZE NOW** | Structural collision with True Dragon direction |
| Resource rename (kelp→food, etc.) | **FREEZE NOW** | Required for medieval grounding, structurally compatible |
| Medieval roster from first principles | **FREEZE NOW** | Migration plan already requires this |
| Population/manpower as soft pool | **PROVISIONAL** | Needs simulation testing |
| 5 resources (Food/Timber/Stone/Iron/Coin) | **FREEZE NOW** | Structurally compatible, Direction Freeze compatible |
| Population as capacity system | **PROVISIONAL** | Needs simulation testing |
| Keep/Homes/Barracks/Scriptorium/Muster/... | **PROVISIONAL** | Good starting point, adjust after implementation |
| Dragon readiness as 4-factor composite gate | **PROVISIONAL** | Needs testing: is 4 factors right? |
| First settlement = expedition-based charter | **EXPERIMENT** | Needs playtest: is expedition engaging? |
| Expedition = 3 sequential PvE encounters | **EXPERIMENT** | Needs playtest: right difficulty curve? |
| Marcher Keep = first settlement | **PROVISIONAL** | Good candidate, validate after slice 1A |
| Bestiary with incomplete/wrong knowledge | **PROVISIONAL** | Strong design idea, needs implementation testing |
| Camp composition variation (3-5 templates) | **EXPERIMENT** | Needs testing: variation vs predictability tradeoff |
| Resolver keeps RPS for v1 | **FREEZE NOW** | Current resolver maps cleanly to medieval roster |
| Resolver expands for v1.5 (commander, terrain) | **DEFER** | Not needed for slice 1A |
| Population model (soft pool vs direct allocation) | **EXPERIMENT** | Needs playtest |
| Monetization: no march acceleration | **FREEZE NOW** | Direction Freeze §21 requires distance/time matter |
| Monetization: build/research acceleration OK | **PROVISIONAL** | Needs product freeze before Phase 4 |
| Codex → Bestiary + Arms & Warfare + Chronicle | **FREEZE NOW** | Direction Freeze §15 already frozen |
| Dragon anatomy system | **DEFER** | Phase 7, not slice 1A |
| Formation system | **DEFER** | Phase 5+, not slice 1A |
| Siege mechanics | **DEFER** | Phase 5+, not slice 1A |
| Morale system | **DEFER** | Phase 5+, not slice 1A |
| Keep 10-level building progression | **PROVISIONAL** | Good starting point, balance later |
| Keep flat build cost (100 food + 100 timber) | **PROVISIONAL** | Needs balancing |
| Stack efficiency bands (50%-100%) | **PROVISIONAL** | Works for v1, may need adjustment |
| Resolver power^0.55 quality gap | **PROVISIONAL** | Works for v1, may need adjustment |
| RPS amplification (1.8x advantage) | **PROVISIONAL** | Works for v1, may need adjustment |
| 40-round combat limit | **PROVISIONAL** | Works for v1, may need adjustment |
| 72-hour new player protection | **PROVISIONAL** | Works, adjust based on playtest |
| One alliance per player | **PROVISIONAL** | Works for v1 |
| Defense posture → Garrison/Partial/Full | **PROVISIONAL** | Needs implementation |
| Web UI dashboard pattern for v1 | **PROVISIONAL** | Acceptable for slice 1A |
| Three-view architecture as destination | **DEFER** | Phase 5+ UI transformation |
| Medieval visual palette (stone/timber/iron/parchment) | **PROVISIONAL** | Good direction, implement after Phase 3 |
| Cultures as kingdoms/houses (not elemental factions) | **FREEZE NOW** | Direction Freeze §17 already frozen |
| 3-4 cultures in starting region | **PROVISIONAL** | Lore Bible v1 scope |
| 4-6 dragon-related creatures | **PROVISIONAL** | Lore Bible v1 scope |
| Lore Bible v1 = one region + 3-4 cultures | **FREEZE NOW** | Direction Freeze scope |
| Phase sequence (0→7 as migration plan) | **PROVISIONAL** | Correct dependency order, validate |

---

## V. Ranked Next Implementation Phases

Ranked by: `expected player-value gain × dependency importance × evidence strength × migration risk × reversibility`

| Rank | Phase | Focus | Player Value | Dependency | Risk | Reversibility | Recommendation |
|------|-------|-------|-------------|------------|------|---------------|----------------|
| 1 | Phase 2 | Mechanical translation matrix (this document) | MEDIUM | CRITICAL — everything downstream depends on it | LOW | HIGH | **DO FIRST** |
| 2 | Phase 2b | Sovereign decision + combat model destination | MEDIUM | CRITICAL — gates content and resolver work | LOW | HIGH | **DO WITH 2** |
| 3 | Phase 3 | Decouple old canon from engine (schema, types, content IDs) | HIGH — removes rejected fiction from codebase | HIGH — blocks content conversion | MEDIUM | MEDIUM | **DO AFTER 2** |
| 4 | Phase 4 | Content conversion (medieval resources, buildings, troops, research) | HIGH — the game becomes medieval | HIGH — proves the direction works | MEDIUM | MEDIUM | **DO AFTER 3** |
| 5 | Phase 5 | Web vertical slice (playable proof) | VERY HIGH — proves the game is fun | MEDIUM — depends on 3+4 | LOW | HIGH | **DO AFTER 4** |
| 6 | Phase 1 | Lore Bible v1 (one region, 3-4 cultures, dragon ecology) | MEDIUM — provides fiction for content | MEDIUM — informs Phase 4 content | LOW | HIGH | **DO IN PARALLEL with 2-3** |
| 7 | Phase 6 | Mobile client | LOW — not needed for proof | LOW — parallel track | MEDIUM | HIGH | **DEFER** |
| 8 | Phase 7 | Dragon systems (expeditions, anatomy, bonding) | HIGH — the dragon fantasy | LOW — late-game content | HIGH | LOW | **DEFER until after 5** |

### Recommended immediate actions:

1. **Approve this audit as Phase 2 contract** — the Mechanical Translation Matrix becomes the binding document for Phases 3-4
2. **Write Lore Bible v1** — can begin in parallel, informs Phase 4 content design
3. **Prototype population/manpower model** — needs simulation testing before schema commitment
4. **Design resolver expansion spec** — what the combat model needs for v1.5 (commander modifiers, research in resolver)
5. **Begin Phase 3 schema decoupling** — remove old CHECK constraints, normalize resource columns, delete Sovereign table

---

*End of audit. This document is the contract for Phases 2-4 of the Dragon Wake domain-preserving migration.*

# Phase 2.1 Correction Freeze

Status: **IMPLEMENTATION CONTRACT**
Generated: 2026-08-19
Base SHA: `0241e51` (main)

## Corrections Applied to V1 Audit

### C1 — RPS is TEMPORARY_COMPATIBILITY, not FREEZE NOW

The V1 audit incorrectly froze `Resolver keeps RPS for v1` as `FREEZE NOW`.

**Corrected classification:** `TEMPORARY_COMPATIBILITY`

The current `melee/range/speed` role ontology is a prototype stand-in. For Slice 1A, use an adapter mapping:

```
infantry → legacy "melee" role
archer   → legacy "range" role
cavalry  → legacy "speed" role
logistics → "logistics" role (unchanged)
scout    → "scout" role (unchanged)
```

This mapping lives at a boundary in `packages/content/data/role_adapter.json` and is marked temporary. Combat role strings must NOT become long-term domain truth.

### C2 — Three-layer unit design

Layers A/B/C separation enforced:

- **Layer A**: Current mechanical inventory (16 units, exact stats/roles/unlocks)
- **Layer B**: Target TideForge roster (designed from first principles)
- **Layer C**: Migration mapping (reuse/donor/split/merge/replace/delete)

See `docs/design/UNIT_THREE_LAYER_MAP.md`.

### C3 — Uncertain mechanics reclassified

Verified from code trace:

| Claim | Truth | Classification |
|-------|-------|---------------|
| Habitation → population capacity | Habitation is a generic building with no special code. No population system exists. | INFERRED — building exists but mechanic unimplemented |
| Skyreost → anti-dragon defense | No code references skyreost except content JSON. No special mechanic. | UNKNOWN — content-only building |
| Rivetworks → logistics | No code references rivetworks except content JSON. No special mechanic. | UNKNOWN — content-only building |
| Research unlocks units | `startTrain()` does NOT check `city.research`. Research increments `city.research[techId]` but training ignores it. Unit `unlock` field exists in content but is NOT enforced server-side. | **VERIFIED: NOT ENFORCED** |
| Command Gallery → commander slots | No code references command_gallery. Commander table exists but slots not limited by building. | UNKNOWN — content-only building |
| Lookout → scout range | No code references lookout. Scout intel is fixed. | UNKNOWN — content-only building |
| Training Camp → citadel training | No special code for training_camp. | UNKNOWN — content-only building |

### C4 — Migration classes corrected

M0 = display-only changes (names, descriptions, CSS, copy). IDs unchanged.
M1 = content identifier changes (unit/building/research IDs).

All unit, building, research, citadel, and shop ID changes are M1.
Resource column renames are M2 (schema + type + API).
Sovereign deletion is M4 (domain model replacement).

### C5 — Research unlock truth

**VERIFIED from code**: `startTrain()` at `world.ts:746` does NOT check research prerequisites. The `unlock` field on unit definitions exists in content JSON but is never validated during training. Research levels are stored and displayed but do not gate any mechanic.

**Required for Slice 1A**: Research must actually enforce unit unlock gates. This is a new enforcement mechanic, not a migration.

### C6 — Defense posture redesign

`harbor` = free loot with no combat = degenerate strategy.

Target model (TEMPORARY_COMPATIBILITY for Slice 1A):

| Value | Behavior |
|-------|----------|
| `full` | All eligible city troops defend. Largest casualty risk, best protection. |
| `garrison` | Only troops explicitly garrisoned defend. Reserves protected. Reduced city protection. |
| `withdraw` | Mobile army avoids battle. Attacker plunders more freely. No free riskless protection. |

Replace `harbor` with `withdraw`. Replace `partial` with `garrison`.

### C7 — Dragon work split

**EARLY DRAGON FOUNDATION (Slice 1A)**:
- Dragon signs/clues from PvE
- Bestiary knowledge system
- Dragon-related material drops
- Dragon Studies research
- Composite readiness gate
- Targeted expedition
- Scripted first meaningful encounter
- Settlement prerequisite

**TRUE DRAGON SIMULATION (DEFER)**:
- Dragon AI, anatomy, flight combat
- Bonding, political behavior
- Alliance-scale dragon battles

### C8 — UI intermediate target

Slice 1A UI supports conceptual navigation:

```
Castle | Lands | Realm | War | Alliance | Knowledge
```

Structured React dashboard, not production illustrated settlements. Information architecture moves toward medieval concepts. Dashboard pattern acceptable. Component decomposition where it reduces risk.

### C9 — Tuning values labeled

All numerical values in implementation marked:

```
INITIAL_TEST_FIXTURE — not final balance
SIMULATION_PARAMETER — configurable, not canon
```

### C10 — Market claims reclassified

Any "no current game combines..." claims reclassified as `MARKET_HYPOTHESIS`.

---

## Decision Classes

### FREEZE NOW

- Medieval kingdom + dragon direction (Direction Freeze v1)
- DoA progression topology preserved
- True Dragons separate domain (not Sovereign, not troops)
- Sovereign DELETED as abstraction
- 5 resources: Food/Timber/Stone/Iron/Coin
- Population/manpower constrains army growth
- Research unlocks units (enforced)
- Dragon readiness is composite multi-system gate
- Settlement earned through world activity
- Secondary settlements are differentiated
- March time acceleration prohibited
- Deterministic resolver architecture preserved

### TEMPORARY_COMPATIBILITY

- RPS melee/range/speed roles (adapter boundary)
- Legacy resolver as combat engine for Slice 1A
- 10-level building progression
- Stack efficiency bands
- Quality gap via power scaling

### EXPERIMENT

- Population soft pool vs direct allocation
- Camp composition variation (3-5 templates)
- Dragon readiness exact prerequisites
- First settlement class selection
- Defense posture three-way model
- Expedition encounter design
- Wilderness specialization ratios

### DEFER

- Full True Dragon simulation
- Dragon anatomy combat
- Formation system
- Morale system
- Siege engine simulation
- Full mobile client
- Endgame content
- Full secondary settlement chain
- Final monetization model
- Final lore/canon

### REJECT

- Elemental color factions
- Stackable True Dragons
- Dragon gacha
- Sovereign as dragon
- Power Score as combat model
- Harbor free-loot posture
- Research as pure percentage inflation
- One-solved-army PvE farming

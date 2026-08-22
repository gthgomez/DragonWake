# TideForge Progression Graph v1 — DoA-derived topology

Status: **MECHANISM CONTRACT v0.1 — RESEARCH-BACKED, NOT A NUMERIC BALANCE SPEC**

This graph exists because the most valuable DoA inheritance is the dependency
network between systems. It protects TideForge from a subtle failure mode:
keeping every screen while deleting the reasons those screens depend on one
another.

Machine-readable companion:
[`progression-graph.v1.yaml`](./progression-graph.v1.yaml).
Historical evidence:
[`DOA_REFERENCE_MODEL.md`](./DOA_REFERENCE_MODEL.md).

## 1. Foundational graph

```text
KEEP / CAPITAL
  |
  +--> FIELD CAPACITY --------------------+
  |                                       |
  +--> WILDERNESS CAPACITY                v
                                      RESOURCE FLOW
HOMES --> POPULATION --> IDLE MANPOWER <--+     |
                    \                         |
                     +--> LABOR / PRODUCTION  |
                     +--> TROOP TRAINING <-----+

TRAINING INFRA -------> TROOP UNLOCKS / QUEUES
RESEARCH INFRA -------> ECON + MILITARY RESEARCH
COMMAND INFRA --------> COMMANDER SLOTS
MUSTER INFRA ---------> MARCH COUNT + CAPACITY

RESEARCH + TROOPS + MARCH CAPACITY
                |
                v
       CAMP / WILDERNESS MASTERY
          |             |
          |             +--> PERSISTENT ECONOMIC BONUS
          v
 DRAGON-RELATED MATERIAL / KNOWLEDGE
          |
DRAGON FACILITY + DRAGON STUDY + READINESS MATERIAL
          |
          v
   PRIMARY DRAGON READINESS GATE
          |
          v
 TARGETED WORLD HUNT / EXPEDITION
          |
          v
 FIRST SETTLEMENT PREREQUISITE
          |
          v
 DIFFERENTIATED SECONDARY SETTLEMENT
          |
          +--> NEW ECONOMIC SPECIALIZATION
          +--> NEW TROOP / DOCTRINE / LOGISTICS OPTION
          +--> NEW DRAGON ECOLOGY / KNOWLEDGE
          |
          v
 NEXT REGIONAL EXPANSION
          |
          v
 PvP + REINFORCEMENT + ALLIANCE INTERDEPENDENCE
```

## 2. Historical anchor graph

The original DoA chain reconstructed with high enough confidence to guide
mechanism design is:

```text
Fortress / fields / homes
 -> resources + population
 -> Garrison + Science Center + Muster Point + Officer's Quarters
 -> troop/research/march capability
 -> camp + wilderness farming
 -> Great Dragon armor + Dragonry + Aerial Combat + Dragon Keep
 -> Great Dragon operational readiness
 -> Water Dragon Egg hunt
 -> Water Outpost
 -> Water Dragon + Fangtooth/material economy
 -> Stone Egg / Outpost
 -> Fire Egg / Outpost
 -> Wind Egg / Outpost
 -> larger empire + elite capability
 -> deeper war/alliance play
```

The exact `Great Dragon must be present in egg-hunt march` requirement changed
in later DoA. The graph therefore freezes **readiness -> targeted hunt ->
settlement prerequisite**, not that obsolete input rule.

## 3. TideForge invariant edges

These are the edges future implementations must not casually sever.

### PG-INV-001 — Economy feeds military capability

Resources and manpower are inputs to development and troop production. A
player cannot grow military capacity entirely independently of the kingdom
economy.

### PG-INV-002 — Population is not cosmetic

Housing/population/manpower must constrain at least one meaningful combination
of labor, training or military sustainment. The interaction must be legible and
reversible enough to avoid permanent newbie traps.

### PG-INV-003 — Research changes available strategy

At least some research nodes unlock units, doctrines, capabilities or new
interactions. Pure percentage inflation cannot be the whole tree.

### PG-INV-004 — Military concurrency is progression

March size, simultaneous operations and commander availability remain separate
enough that a player makes operational tradeoffs.

### PG-INV-005 — World PvE feeds progression

Repeatable PvE and wilderness activity produce something the city cannot simply
buy from its own menus: rare material, knowledge, positional ownership or a
settlement prerequisite.

### PG-INV-006 — Wilderness ownership matters while peaceful

At least some non-player world objectives have persistent economic/logistical
value independent of PvP kill rewards.

### PG-INV-007 — Dragon readiness is multi-system

Primary-dragon progression must combine at least three categories among:
knowledge/research, physical growth/relationship, equipment/preparation,
world-found material, facility progression, expedition accomplishment.

No single `dragon level` bar may replace the whole preparation topology.

### PG-INV-008 — Expansion is earned in the world

The first specialized settlement requires a world-derived prerequisite or
accomplishment. It is not merely `Keep level N -> click Found City`.

### PG-INV-009 — Secondary settlements are differentiated

Every major settlement tier must introduce at least one strategic capability
that changes optimal play: economy, troop/doctrine, logistics, intelligence,
fortification, dragon ecology, research or alliance role.

### PG-INV-010 — Dragons do not erase armies

Dragon progression can alter battles but cannot make troop composition,
fortifications, commanders and logistics irrelevant.

### PG-INV-011 — Individual progression joins social progression

Late progression should create capabilities that are more valuable in
coordination: reinforcement, shared intelligence, rallies, territorial roles,
dragon hunts, logistics or alliance objectives.

## 4. Explicit non-invariants

Do **not** preserve these just because DoA used them:

- elemental Water/Stone/Fire/Wind fiction;
- exact resource names or ratios;
- exact building levels/timers;
- exact troop roster;
- exact General star formula;
- tax toggling;
- one construction queue;
- mandatory Great Dragon presence in every egg-drop attack;
- exact camp respawn/drop rates;
- stackable True Dragons;
- Power Score dominance;
- paid instant movement as a strategic assumption.

## 5. Vertical Slice 1A acceptance tests

The first playable topology test should satisfy all of the following before
content expansion:

1. **Dependency visibility** — the UI can explain what blocks the next major
   progression step and where to act.
2. **At least one economy tradeoff** — choosing recruitment over civilian
   output/revenue (or vice versa) has observable consequences without a trap.
3. **At least one research unlock** — research changes an available tactical or
   logistical option, not only a number.
4. **Composition consequence** — two armies with similar nominal strength can
   perform differently because of composition/context.
5. **PvE readiness curve** — at least three target bands cause players to change
   preparation rather than only add more troops.
6. **Persistent wilderness value** — holding a world objective changes future
   production/logistics.
7. **Dragon gate is composite** — no single timer/currency completes it.
8. **World-earned expansion** — the first settlement prerequisite is acquired
   through targeted world play.
9. **Settlement differentiation** — the first secondary settlement immediately
   enables a capability the capital alone did not provide.
10. **No required PvP for proof** — 1A is evaluable before another human is
    needed; PvP/alliance becomes Slice 1B.

## 6. Causal experiments still open

| Experiment | Competing designs | Success signal |
| --- | --- | --- |
| Population/manpower | direct worker allocation vs soft manpower pool | Players understand the tradeoff without wiki-only optimization. |
| Construction | one crew vs primary+minor jobs vs settlement-parallel crews | Planning remains meaningful without dead-time frustration. |
| Camp variation | deterministic compositions vs bounded modifiers/rotations | Mastery helps, but one solved army does not farm every tier forever. |
| Dragon readiness | research+gear+expedition vs relationship+knowledge+gear | Dragon feels earned and present, not delayed decoration. |
| First settlement | rare drop vs deterministic milestone token vs multi-part expedition | Anticipation without abusive RNG. |
| Strength estimate | exact score vs range/scouting estimate | Players cannot infer battle outcome from one additive number. |

## 7. Change protocol

Any implementation that removes or bypasses `PG-INV-*` must:

1. cite the invariant;
2. explain the product reason;
3. provide an alternative edge that preserves the mechanism purpose;
4. include an experiment/simulation/playtest plan;
5. record the human decision before merge.

This is intentionally stricter than renaming content. The dependency graph is
closer to the product skeleton than the current nouns are.

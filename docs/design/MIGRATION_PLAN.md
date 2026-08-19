# TideForge migration plan

Status: **PLAN** — revised after Direction Freeze v1.0 review.
Not a rewrite. Not a skin swap.

> It is a **domain-preserving migration**, not a rewrite. Preserve the
> asynchronous MMORTS mechanics and deterministic simulation, but expect
> schema, API-contract, content-ID, progression and presentation migrations
> because the old fiction is encoded in canonical state.

## Central conclusion

Preserve TideForge's MMORTS machinery. Retire the old aquatic / elemental
fiction. Establish Lore Bible v1 before content-heavy client work. Then
migrate the existing game toward the new canon.

Do **not** describe this as "a skin + content migration, not a new sim."
The old setting is embedded deeper than labels.

## What is embedded in canonical state today

Verified in `gthgomez/TideforgeEmpires` (main @ 2026-07-25):

| Surface | Encoded fiction |
| --- | --- |
| `schema.sql` players.faction CHECK | only `brinecant`, `ashcoil`, `skyshear`, `mossvault` |
| `cities` columns | `kelp`, `driftwood`, `basalt`, `slagiron`, `tidegilt` |
| `cities.kind` CHECK | `capital`, `brinehold`, `citadel_other` |
| `defense_posture` CHECK | `harbor`, `partial`, `full` |
| `sovereigns` columns | `harness_crown`, `harness_heart`, `harness_grasp`, `harness_keel` |
| `field_plots.plot_type` | `kelp_farm`, `drift_dock`, `basalt_cut`, `slag_pit` |
| march `composition` JSON | existing unit IDs (`reefbow`, `tidepike`, …) |
| `packages/shared` | `FACTIONS`, `ResourceBag`, `CityKind`, `DefensePosture` |
| `packages/content/data` | aquatic unit / building / research names |
| `apps/web` | faction color themes, harbor copy, Harbinger tutorial |
| README design authority | old DoA research path |

A rename-in-place of JSON strings will desync saved realms, acceptance tests,
and the API contract. Use migrations.

## What to preserve

### Simulation / product loop

- Cities, plots, resource ticks
- Build / research / train queues
- World map, distance, travel time
- Marches (scout, attack, occupy, reinforce, haul)
- Wilderness claims
- PvE camps as a *system* (not their current "Riftborn" fiction)
- Deterministic, server-authoritative combat **architecture**
- Battle reports
- Alliances + chat (Tideband as a system)
- New-player protection
- Persistence (Postgres / in-memory fallback)
- Events / toasts / SSE

### Combat architecture — not the current combat model

**Freeze the resolver architecture:**

- server-authoritative resolution
- determinism
- seeded / reproducible battles
- pure-function philosophy (`packages/combat`)
- regression matchups
- battle reports
- soft-cap experimentation

**Do not freeze the current melee / range / speed triangle.**

That triangle is a prototype. The new world eventually cares about armor,
shields, formation, reach, cavalry shock, pike bracing, ranged penetration,
ammunition, terrain, fortifications, siege engines, commanders, morale,
scouting, anti-dragon weapons, and dragon anatomy.

v1 does not implement all of those. It must not pretend the current RPS
buckets *are* TideForge warfare.

### Power

Do not remove a displayed military-strength estimate.

The freeze only rejects **Power Score as the main strategy mechanic**.

Power may become:

- threat estimate
- scouting estimate
- comparison heuristic

An intelligently composed 14,000-strength army must be able to destroy a
badly composed 23,000-strength army. The battle engine should not *reason
from* Power as its primary input.

### Chronite / shop

There is **no gacha** in the current shop. Blink, Jump, Momentary Truce, and
Ceasefire are deterministic speedups and protection — traditional F2P
acceleration, not a loot box.

Split the finding:

| Problem | Response |
| --- | --- |
| Lore | Rename / recontextualize convenience items as mundane wartime stores. Everyday time magic contradicts rare, mysterious magic. |
| Product | Separately freeze what TideForge monetization is allowed to become. Do this before Phase 4. Monetization can distort MMORTS design. |

## What not to do

- Do not 1:1 map old units onto new names (`Skyshrike` → Light Cavalry)
  just because both occupy a Speed niche.
- Do not assume the Harbinger is canonically a dragon, then "turn it into a
  lesser drake."
- Do not give every player a True Dragon in the tutorial.
- Do not ship a content-heavy mobile UI against the rejected content model.
- Do not write 17 kingdoms, 43 dragons, five continents, or 9,000 years of
  history in Lore Bible v1.

## Domain model: separate three things

The schema already has `commanders` and `sovereigns`. Investigate whether
sovereigns should disappear or become something completely different. Do not
carry the DoA-derived Sovereign abstraction forward as "the dragon."

| Domain entity | Meaning | Must not be |
| --- | --- | --- |
| Commander / Lord / Slayer | Human character system | A dragon with stats |
| War beasts | Horses, hounds, perhaps later rare lesser drakes / wyverns | True Dragons |
| True Dragons | Entirely different domain entity | `Sovereign` with bigger numbers |

A True Dragon must not reuse Sovereign with bigger stats. That distinction
protects the new direction technically as well as narratively.

The current Harbinger is verifiably an exceptionally powerful sovereign
(5,000 life, combat stats, power, army auras) that can be stacked with
thousands of troops. That *structural* collision stands. The *canonical*
identity of Harbinger is not yet decided and should not be decided by
assuming it is a dragon.

## Army design method

1. Design the medieval roster from first principles.
2. Then determine which old mechanical niches can be reused.
3. Then map those concepts into the resolver.

Examples of first-principles roles (not a locked roster):

| Concept | Job |
| --- | --- |
| Pikeman | reach, defensive, cavalry denial, poor mobility |
| Man-at-Arms | armored, durable, general-purpose |
| Longbowman | long range, rate of fire, vulnerable when engaged |
| Crossbowman | better penetration, slower firing |
| Knight | high mobility / shock, expensive, vulnerable to prepared pikes |

Not: "we have Speed units, therefore we need something called Light Cavalry."

## Codex destination

Evolve the existing Codex surface into three related books:

| Book | Holds |
| --- | --- |
| **Bestiary** | Dragons and other creatures |
| **Arms & Warfare** | Troops, weapons, formations, defenses |
| **Chronicle** | Kingdoms, events, famous dragons, wars, Slayer Orders |

Not every entry must be objectively correct. Incomplete or wrong knowledge
is a progression system.

## Mobile

Native mobile remains out of MVP scope in the current README.

**Content-heavy mobile UI waits** until world semantics stabilize (after
Phase 5).

**Mobile architectural planning may happen in parallel** from Phase 0:

- React Native / Expo vs another client
- API boundaries
- authentication strategy
- shared TypeScript packages
- content synchronization
- push notifications
- offline / cache behavior
- shared battle report model

Mobile must not become a second lore authority.

## Sequence

### Phase 0 — Authority freeze (this change)

- Commit Direction Freeze v1.0 into the repository.
- Mark old DoA research as historical / reference-only.
- Point the README at `docs/design/`.
- No gameplay code changes.

**Exit:** an agent opening the repo cannot rationally conclude that the old
DoA folder is still design authority.

### Phase 1 — Lore Bible v1

Write `docs/design/LORE_BIBLE_V1.md` from
[`LORE_BIBLE_V1_BRIEF.md`](./LORE_BIBLE_V1_BRIEF.md).

Scope:

- global rules (already frozen — copy, do not reopen)
- one starting region
- 3–4 cultures
- dragon ecology
- 4–6 dragon-related creatures
- civilization adaptations per culture
- one Slayer institution
- one major historical conflict
- one contemporary political crisis
- early-game narrative
- Codex content model
- provisional monetization stance

**Exit:** Bible approved. Still no content-ID remaps.

### Phase 2 — Mechanical translation design

Before touching code, produce a table:

`new lore concept → existing mechanic → keep / change / remove / new`

This is where Brinehold, harbor posture, harness, Chronite, Sovereign, and
city kinds are decided as *systems*, not renamed blindly.

Also decide the target domain model for commanders / beasts / True Dragons.

**Exit:** signed translation table. This is the contract for Phases 3–4.

### Phase 3 — Decouple old canon from the engine

Remove setting-specific assumptions from places that should be generic.
Do this through migrations, not blind renames.

Priority surfaces:

- faction database constraint
- resource representation (stop hard-coding kelp columns if resources become
  a bag / typed catalog)
- city types
- sovereign / harness model
- content identifiers
- shared TypeScript unions (`Faction`, `ResourceBag`, `CityKind`,
  `DefensePosture`)

**Exit:** engine can represent the new world without lying. Old saves either
migrate or are declared non-portable (explicit decision).

### Phase 4 — Content conversion

Medieval resources, troops, buildings, research, PvE, tutorial.

Designed from first principles (Phase 1–2), then fitted into the engine.

Also apply the monetization / convenience-item rename decided in the Bible
or a sibling product freeze.

**Exit:** content package no longer teaches the rejected fantasy.

### Phase 5 — Web vertical slice

Make the existing browser game prove:

> small medieval castle → army → nearby threat → Codex discovery → first lesser-dragon encounter

Not a True Dragon. Not a harness tutorial.

**Exit:** playable proof that the new direction is the game, not a document.

### Phase 6 — Mobile client

Build against stabilized world semantics.

Shared packages, shared report model, no second lore source.

**Exit:** mobile is a client of the same world, not a fork.

### Phase 7 — Dragon systems

Expeditions, anatomy, Slayers, bonding, dragon politics.

Only after armies, castles, and the Codex already feel medieval and
dragon-shaped.

**Exit:** a dragon appearing over a battlefield feels extraordinary.

## Parallel tracks (allowed)

These may start before the Bible is finished, as long as they do not invent
canon or ship rejected fiction:

- Phase 0 remaining housekeeping
- Mobile architecture spikes (not screens)
- Monetization philosophy freeze (product, not lore)
- Combat-architecture notes: what the resolver must remain able to express
- Inventory of schema / API contracts that Phase 3 must migrate

## Explicitly deferred

- Arena, world bosses, live market, real IAP
- Anatomy combat implementation
- Dragon bonding gameplay
- Full citadel ladder
- Hardcore realms
- Any S1 item from the old DoA post-MVP list (Tidebeast, Mnemolith, Echo)

Those require a new freeze after Phase 5 at the earliest.

## Review corrections absorbed into this plan

1. Domain-preserving migration, not a skin swap. Schema / API / IDs move.
2. Do not assume Harbinger is a dragon. Separate commanders, beasts, True Dragons.
3. Preserve deterministic combat *architecture*, not the current RPS model.
4. Design the medieval roster from first principles; do not 1:1 map units.
5. Soften Power into an estimate; do not delete it; do not let the engine worship it.
6. Chronite is not gacha. Split lore rename from monetization freeze.
7. Codex becomes Bestiary + Arms & Warfare + Chronicle. Knowledge can be wrong.
8. Mobile architecture may be planned early; content-heavy UI waits.
9. Authority freeze lands in the repo before more canon or code.
10. Lore Bible v1 is one region, 3–4 cultures, 4–6 creatures.
11. Dragon ecology is mandatory.
12. Civilization adaptations are mandatory per culture.
13. Sequence is Phase 0 → 7 as above, with a mechanical translation step
    before any remap.

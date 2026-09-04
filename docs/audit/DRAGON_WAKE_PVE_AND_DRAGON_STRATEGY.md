# DRAGON WAKE — PvE STRATEGY & DRAGON DIFFERENTIATION

**Audit date:** 2026-09-04 · **HEAD:** `8aba7c0`

---

# PART 1 — PvE CONTENT GAP (Brief Part XI)

## Current state

Dragon Wake PvE = 10 seeded camps (4 bands, levels 1-10), deterministic per-seed defensive compositions, scaling loot, bestiary/clue drops (first-3 guaranteed, daily cap 3), and a single one-shot Wyrm-Scarred "hunt" gated behind BATTLE_READY + a consumable war plan. **No respawn. Total PvE content: 10 fights + 1 hunt.** `VERIFIED`.

Reign baseline: Anthropus camps L1-11 as the *primary repeatable progression loop* — farm target, event-currency source, troop-economy treadmill (upkeep makes losses real; Fountain of Life revives some losses). Events (Hanami, Summer 2026) explicitly route players back into camps/wildernesses for event currencies. Demon Tower: `UNVERIFIED` in current Reign — it is DoA-mobile lineage; do **not** assume Reign parity pressure from it.

## Pattern comparison

| Criterion | A Tower | B Dragon Hunt | C Expedition | D Regional Threat | E Campaign | F Bestiary Mastery | G Stronghold |
|---|---|---|---|---|---|---|---|
| Replayability | High | High | Medium | High | Low | High | Medium |
| Strategy (comp decisions) | Medium | **High** | High | Medium | High | **High** | Medium |
| Content cost | High (floors) | **Low (procedural targets)** | Medium | Medium | **High (handcrafted)** | Low | High |
| Thematic fit (dragons exceptional) | Poor | **Perfect** | Good | Good | Good | **Perfect** | Good |
| Multiplayer potential | Low | Medium (shared sightings) | Medium (alliance expeditions) | **High (world boss)** | Low | Medium | Medium |
| Progression integration | Levels | Knowledge-gated | Stages | Server-wide | Chapters | Knowledge levels | Tiers |
| Army-composition pressure | Yes | **Yes (per-species counters)** | Yes | Yes | Yes | **Yes** | Yes |
| Commander relevance | Medium | High (hunt leaders) | High | Medium | High | Medium | Medium |
| Bestiary integration | Weak | **Is the system** | Weak | Weak | Weak | **Is the system** | Weak |
| DW differentiation | None (copy) | **Strong** | Medium | Medium | Weak | **Strong** | Medium |

## Recommendation — COMBINE B + F on a phased structure, with C as the alliance-scale extension

1. **Phase PvE-1 — Living camps (parity floor):** camp respawn/regeneration on a timer (DoA-lineage camps regen; Reign camps are the standing farm). Level band rebalance so L6-10 remain meaningful farms. *What it creates: the missing daily rhythm; a reason training 500 more troops exists.*
2. **Phase PvE-2 — Bestiary Mastery Hunts (F+B):** Bestiary observation levels unlock *hunt contracts* per species: scout signs → track (map target with uncertainty) → prepare counter composition (species-specific traits: e.g. ironbacks blunt arrows, ridgebacks punish cavalry) → hunt with real loss risk → materials + bestiary knowledge. Escalating contract tiers per species. *Creates: repeatable strategic PvE that is DW-native, makes Bestiary mechanical, feeds dragon materials economy, gives commanders a job (hunt leaders), and makes "dragons are wild and dangerous" TRUE in gameplay — the current game asserts this but nothing enforces it.*
3. **Phase PvE-3 — Alliance Expeditions (C):** multi-stage, attrition-based, multi-member hunts against apex targets (the Wyrm-Scarred pattern, scaled). *Creates: the first alliance payoff object; coordination demand; server stories.*
4. **Explicitly rejected:** Demon-Tower-style tower (A) — floors are content-expensive, thematically off (dragons are wild, not dungeon furniture), and would collide with the hunt identity; handcrafted campaign (E) as a *primary* loop (content cost too high for this team size); regional world boss (D) deferred until alliance war exists to give it stakes.

**Final product question (Amendment 10):** PvE-2 creates mastery (species knowledge → better hunts), anticipation (contract tiers), decisions (comp/counters/risk), memorable events (first apex kill), and alliance coordination (PvE-3) — direct experience gains, not parity checkboxes.

---

# PART 2 — DRAGON DIFFERENTIATION AUDIT (Brief Part XII)

## Design authority vs implementation — the honesty gap

The frozen design authority (DIRECTION_FREEZE_V1: dragons rare/consequential; preservation ledger: "dragons do not erase conventional warfare";dragon-anatomy/anti-dragon work explicitly DEFERRED) promises dragons as a *world system*. The implementation delivers a **progression read-model**: presence milestones derived from persisted facts, a 9-entry bestiary, one expedition, one consumable war plan. No dragon exists in `resolveBattle`. `VERIFIED`.

Reign's dragons (for contrast): Great Dragon "Legendary · Hybrid · Armor slots" hatched from Dragon Keep, enters battle at L7, four armor slots (helmet/body/claws/tail), heals after defeat, per-outpost elemental dragons; dragons "fight alongside your armies" and "directly modify march strength" (wiki Dragons). Reign dragons are **owned stat-units with armor progression** — powerful, legible, and (in DW's terms) exactly the "dragon-as-progression-skin" pattern DW's authority says to avoid.

**The strategic irony:** Reign executes the skin pattern better than DW does, while DW's *design* points at something Reign doesn't have — dragons as wild ecology. Neither game currently has DW's actual differentiator working.

## What must exist before DW can truthfully claim "dragons are a world system, not a progression skin"

| # | Requirement | Currently |
|---|---|---|
| 1 | Dragons visibly *in the world* (sightings, signs, lairs on the map) | Signs exist as clue text only; no map presence |
| 2 | Dragons *act* (raids on wildernesses/camps; consequences for ignoring them) | Nothing acts; nothing is threatened |
| 3 | Hunting is a *repeatable strategic loop* (PvE-2 above) | One one-shot hunt |
| 4 | Dragons participate in combat *somehow* — either as rare enemies, huntable targets, or (later) bonded allies with strict scarcity | Zero combat participation |
| 5 | Knowledge matters mechanically (bestiary levels gate hunts/counters) | Bestiary is currently a journal |
| 6 | Materials create decisions (spend on gear/economy/diplomacy-like choices) | 4 clue items; no sink |
| 7 | Kingdom-level consequences (a hunted region changes; an ignored dragon changes it differently) | None |
| 8 | Bonding, if added, must be *costly and scarce* — anti-Reign (Reign: everyone eventually owns 5+ dragons) | Not implemented (correctly deferred) |

Requirements 1-3 + 5 are achievable **without** making dragons troop units — they preserve the frozen "dragons are exceptional" principle while making the fantasy mechanically true.

## Phased dragon roadmap

- **DR-1 "The Realm Is Wild" (with PvE-1/2):** map signs/lairs, respawn camps reframed as creature territory, Bestiary levels gate hunt contracts, species combat traits, dragon materials as a real currency with sinks. Dragons still never fight *for* you. Fantasy claim enabled: *dragons are a world system.*
- **DR-2 "Consequence" (with alliance war):** regional threat behavior — neglected lairs raid nearby wilderness production; hunts have kingdom-level side effects; shared alliance tracking. Fantasy claim enabled: *dragons change the strategic map.*
- **DR-3 "The Bond" (endgame):** a single, late, expensive bonded dragon per kingdom-scale achievement —BATTLE_READY matured into a unique march-participant with strict scarcity, anti-armor counterplay for defenders (the deferred anti-dragon weapons work becomes relevant here), never a mass unit. This is where DW *exceeds* Reign: Reign hands out dragons at every outpost; DW makes one dragon a kingdom-defining event.
- **Deliberately NOT:** elemental dragon families, dragon armor slot grind, dragon gacha, dragons as trainable troops — all REJECT (Reign-pattern, anti-frozen-authority).

**Final product question:** DR-1 creates mastery + memorable first hunts now; DR-2 creates social conflict + anticipation; DR-3 creates the single most memorable event in the game. Every phase creates *experience*, and differentiation vs Reign is structural, not cosmetic.

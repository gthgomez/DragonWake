# DoA -> TideForge Parity Matrix — v0.1

Status: **WORKING DESIGN BRIDGE**

This document translates the evidence in
[`DOA_REFERENCE_MODEL.md`](./DOA_REFERENCE_MODEL.md) into TideForge design
calls. A row is not canon merely because it appears here. `FROZEN` rows are
frozen only where an existing higher-authority document already freezes them.

Disposition vocabulary:

- **PRESERVE** — retain the mechanism/purpose;
- **MODERNIZE** — retain the problem solved, change interaction/equation;
- **EXPAND** — retain and deepen;
- **REINTERPRET** — retain structural role, replace fiction/content;
- **EXPERIMENT** — candidate requiring causal playtest/simulation;
- **REJECT** — deliberately do not inherit.

| DoA mechanism | Historical purpose | TideForge disposition | Authority now | Key invariant / experiment |
| --- | --- | --- | --- | --- |
| City / Field / World Map | Separate domestic, economic and world layers | **PRESERVE** | FROZEN by Direction Freeze §§19,21,28 | Player can understand where production, settlement development and world action happen. |
| Fortress progression | Gate development, fields and wilderness capacity | **PRESERVE / REINTERPRET** | P0 design | Central keep progression should gate expansion without becoming the only progression axis. |
| Food / wood / stone / metal / gold economy | Continuous material economy | **PRESERVE roles** | Content not frozen | Medieval naming/content; avoid exotic resources as baseline. |
| Homes -> population -> idle manpower | Connect kingdom growth to army growth | **PRESERVE + MODERNIZE** | P0 design | Civilian economy and recruitment must compete for capacity in a legible/reversible way. |
| Tax -> happiness -> population | Revenue/recruitment tension | **MODERNIZE** | Experiment | No repetitive zero-tax queue exploit. Test explicit revenue vs recruitment policy instead. |
| Laborers on fields | Production consumes people | **PRESERVE tradeoff, not trap** | Experiment | Respec/rebuild costs must not permanently punish uninformed beginners. |
| Garrison(s) | Train troops; queue/speed specialization | **PRESERVE concept** | P0 design | Training infrastructure matters; exact queue model is open. |
| Science Center | Long-horizon economy/military research | **PRESERVE + EXPAND** | P0 design | Research must unlock options, not only percentage inflation. |
| Muster Point | March concurrency and capacity | **STRONGLY PRESERVE** | P0 design | Distance and concurrent operations remain strategically meaningful. |
| Officer's Quarters / Generals | Required command capacity; battle improvement | **PRESERVE + REINTERPRET** | P0 design | Commander progression rewards meaningful command, not empty wilderness spam. |
| Sentinel / intelligence progression | Reveal incoming-threat information | **PRESERVE / EXPAND** | P1 design | Scouting/intelligence should create uncertainty and counterplay. |
| Deterministic troop-stat combat | Composition mattered beyond Power | **PRESERVE architecture; redesign model** | FROZEN architecture only | Resolver remains server-authoritative, deterministic and reproducible; medieval roster is first-principles. |
| Range/speed interaction | Positional composition tradeoff | **PRESERVE capability class** | Research target | Target resolver must be able to express reach, movement and formation effects. |
| Anthropus Camps | Repeatable PvE, loot, readiness check | **REINTERPRET + PRESERVE role** | P0 design | Camps/forts/ruins remain readable farming targets but cannot collapse into one solved composition forever. |
| Wilderness capture | Persistent production bonus + non-PvP map objectives | **PRESERVE + EXPAND** | P0 design | World map contains economically useful places worth holding. |
| Great Dragon visible early | Aspirational centerpiece | **PRESERVE + IMPROVE** | Direction-compatible | Dragon presence/rumors matter early; a True Dragon is not handed out in tutorial. |
| Dragon Keep growth | Visible dragon-development track | **REINTERPRET** | P0 design | Dragon development is embodied in world/city, not a hidden stat sheet. |
| Dragonry + armor + Aerial Combat gate | Multi-system readiness before operational dragon use | **PRESERVE TOPOLOGY** | P0 design | Dragon operational readiness requires knowledge + preparation + progression; exact DoA names/equations rejected. |
| Great Dragon -> egg hunt | Convert dragon readiness into world activity | **PRESERVE FUNCTION** | P0 design | First settlement prerequisite is earned from targeted world play, not a menu purchase. |
| Water -> Stone -> Fire -> Wind outposts | Chained differentiated expansion | **PRESERVE + MAJOR REINTERPRETATION** | P0 design | Settlements are strategic packages, never identical City #2/#3 copies. Elemental theme is rejected. |
| Outpost-exclusive elite troop/material | Expansion changes military/economic options | **PRESERVE** | P0 design | Each expansion unlocks at least one new strategic capability. |
| One construction queue | Pacing/scarcity | **EXPERIMENT / MODERNIZE** | Open | Test one structural crew + limited parallel jobs vs broader parallelism. |
| General victory farming | Easy progression loop | **REJECT exploit** | P0 | Command experience scales with meaningful risk/responsibility/difficulty. |
| Solved camp farming | Predictable mastery | **MODERNIZE** | P1 | Preserve readable risk bands while introducing controlled variation. |
| Power Score as dominant strategy | Comparison/retention shorthand | **SOFTEN / REJECT dominance** | FROZEN philosophy | Strength estimate is lossy/scouting-gated and never drives resolver outcome. |
| Alliance as core social layer | Retention, mentoring, reinforcement, war | **PRESERVE + EXPAND** | FROZEN by Direction Freeze §23 | Individual progression eventually merges into alliance progression. |
| Seven-day protection + quests | Learning runway | **PRESERVE concept** | P0 design | Protection ends on readiness criteria/time tested together; quests teach good strategy. |
| Paid time acceleration | Monetization/pacing | **RETHINK** | Product freeze required | Cannot erase the frozen importance of distance/time or create strategic dominance through spend. |
| Stackable lesser dragons | Fantasy troop category | **CASE-BY-CASE** | P2 | Lesser beasts may exist, but ecology/lore first. |
| True Dragons as stackable troops | Raw army unit | **REJECT** | FROZEN by Direction Freeze §4 | A True Dragon is never `Dragon x 28,492`. |

## Vertical Slice 1A — topology test

Before social/PvP expansion, prove this closed loop:

1. establish capital;
2. build food/timber/stone/iron/coin + manpower economy;
3. build homes/training/research/muster/storage/walls;
4. make one meaningful research choice;
5. train a composition with at least two tactical roles plus logistics/scouting;
6. scout and march to a readable PvE target;
7. win resources + first dragon-related clue/material;
8. capture a wilderness for a persistent bonus;
9. advance dragon knowledge/readiness;
10. complete a multi-system dragon progression gate;
11. earn a targeted settlement prerequisite from world activity;
12. establish first differentiated secondary settlement;
13. receive a new economic/military capability that changes the next decision.

**Stop condition:** if this loop does not feel like a coherent modern successor
to DoA's progression topology, do not hide the failure under PvP/alliance
complexity.

## Vertical Slice 1B — social/war extension

Only after 1A works:

`scouting -> another player -> attack/defend -> report -> reinforcement -> alliance -> shared objective`.

This isolates the causal question: **is the kingdom/dragon/outpost progression
loop compelling before multiplayer social pressure is added?**

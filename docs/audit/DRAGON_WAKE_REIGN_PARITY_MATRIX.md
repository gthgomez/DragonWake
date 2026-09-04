# DRAGON WAKE × REIGN OF ATLANTIS — THREE-WAY PARITY MATRIX

**Audit date:** 2026-09-04 · **Dragon Wake HEAD:** `8aba7c0` on `codex/doa-parity-campaign`

**Critical identity finding (Amendment 3):** "Reign of Atlantis" is the **July 1, 2026 rebrand of "Rise of Atlantis"** (community-verified via the game's own subreddit announcement "New Domain, New Event, New Outpost!"; the official wiki at riseofatlantis.wiki.gg now titles itself "Reign of Atlantis Wiki" while keeping the riseofatlantis domain). Reign of Atlantis is a browser-based fantasy MMORTS in direct mechanical lineage with Dragons of Atlantis: Fortress/Dragon Keep city core, Anthropus camps, wilderness types, elemental outpost dragons, Great Dragon armor. Historical DoA is therefore a *valid secondary reference* for Reign — closer than the brief assumed.

## Source register (access dates 2026-09-04)

| # | Source | Type | Date | Confidence | Notes |
|---|---|---|---|---|---|
| S1 | [reignofatlantis.com](https://reignofatlantis.com/) | **OFFICIAL** site | live; © 2026 | HIGH | Great Dragon "Legendary · Hybrid · Armor slots"; 4 elemental outposts (Fire/Water/Stone/Wind); "hatch, heal, and equip dragons that fight alongside your armies"; alliances; JS app (thin static text) |
| S2 | [reignofatlantis.com/patch-notes](https://reignofatlantis.com/patch-notes) | **OFFICIAL** patch notes | latest entry 2026-08-17 | HIGH | v1.9.x series current (1.9.1 mobile stability + mobile battle-report rewards; 1.9.3 world-map refresh fix); v1.10.0 on staging; store promotion ran until Jul 26 |
| S3 | [riseofatlantis.wiki.gg](https://riseofatlantis.wiki.gg/) | **OFFICIAL wiki** (self-titled "Reign of Atlantis Wiki") | 121–257 articles (counts varied between snapshots) | HIGH for implemented mechanics; MEDIUM for recency | Per-page publish dates mostly 2024; site actively edited (Aug 2026) |
| S4 | wiki.gg/wiki/Buildings · /Troops · /Combat · /Research · /Dragons · /Outposts · /Events · /Quests · /Items | OFFICIAL wiki pages | pub. 2024, edited into 2026 | HIGH (mechanics), MEDIUM (currency/prices) | Primary mechanic evidence below |
| S5 | r/RiseofAtlantis, r/ReignofAtlantis | COMMUNITY | Jul 1 2026 rebrand post | MEDIUM | Rebrand + new-event/new-outpost announcement; official team member posted |
| S6 | [DoA Fandom wiki](https://dragonsofatlantis.fandom.com/wiki/Anthropus_Camps) | COMMUNITY (historical) | archived | MEDIUM | Secondary/historical lineage only — used for ancestry, not "current Reign" claims |

**Known documentation gaps (labeled UNVERIFIED below):** Demon Tower existence in Reign; exact camp reward tables; PvP protection numbers; alliance-war specifics; player counts; monetization prices. The wiki's Anthropus Camps page is currently **empty** — camps are documented indirectly (Troops/Quests/Events pages).

---

## The matrix

Legend — **DoA**: historical Dragons of Atlantis (secondary reference). **Reign**: current live game per S1–S5. **DW**: Dragon Wake at `8aba7c0`. Status: `MATCH` / `PARTIAL` / `MISSING` / `DIFFERENT`.

| # | System | Historical DoA | Current Reign | Current Dragon Wake | Gap verdict | Recommendation |
|---|---|---|---|---|---|---|
| 1 | City development | Fortress, Homes, garrisons; fields to L10 | Fortress L11; buildings unlock research/troops; Theater happiness+taxes; **Wall** | Castle, 10 buildable buildings, Keep L10 gates; no wall, no happiness, no taxes | `PARTIAL` | MATCH — deepen effects per level before adding buildings |
| 2 | Building progression | Numeric levels | Levels gate building tiers; **visible art per tier** (site renders distinct buildings) | L1-10 numeric; **no visual change per level** (screenshot-verified) | `PARTIAL` (visual gap dominant) | IMPROVE — visible tier changes are Reign-standard |
| 3 | Economy | 4 resources + gold | Food/Lumber/Stone/Metal + **Gold via taxes**; fields L15; production quests to 1M/h | Food/Wood/Stone/Ore/Crownmark; plots L5; **no storage cap** | `PARTIAL` | MATCH — add storage caps + a gold-like sink economy |
| 4 | Storage | Vault protects resources | **Storage Vault** protects loot | Saltvault reduces plunder % only; **no cap/protection mechanic** | `MISSING` (mechanic) | MATCH — Storage Vault is core DoA-lineage defense |
| 5 | Population | Homes; population scales armies | Population quests to **100K** | Population cap ~500–2,000 (screenshot-verified 200/500); manpower doubles as army budget | `PARTIAL` (scale) | IMPROVE — DW's manpower-as-army-budget is a good idea at 10× too small a scale |
| 6 | Research | 13 techs, stat-wired | **13 techs, all stat-wired** into combat formula (`modded = base × (1+bonus)`, wiki Combat) | 18 techs; **stat modifiers defined but NEVER applied** (code-verified) | `CONTRADICTED` parity claim | **P0 IMPROVE** — wire per_level stats; DW has the infrastructure Reign has, minus effects |
| 7 | Troop tiers | 20+ units incl. outpost troops | City roster (Conscript…Giant, SSD, Battle Dragon) + **outpost-exclusive troops per element** | 20 units + 4 citadel-exclusive sets | `MATCH` (breadth), `PARTIAL` (scale) | MATCH — differentiate roles more, don't add count |
| 8 | Troop counters | RPS-ish; wall/siege interplay | Positional targeting priorities (wiki Combat) | 5-role RPS triangle, tested | `MATCH` | Preserve — DW's RPS is sound; give it information pressure |
| 9 | Upkeep | Troops eat food | **Per-troop Food upkeep** reduced by Rationing research | **NO upkeep** — armies are free after training | `MISSING` | MATCH — upkeep is the DoA-lineage army-size governor |
| 10 | Commanders | None (heroes = dragons) | None visible (dragons fill this role) | 16 commanders, XP/stars/wounds | `DIFFERENT` | IMPROVE — keep commanders, make them matter (currently interchangeable) |
| 11 | March count | Muster Point level | Muster Point caps marches | Muster Yard + Keep capacity (ops 0/4) | `MATCH` | — |
| 12 | Troops per march | Up to 100K+ (quest-verified) | **100K-troop marches** (quest reward tier) | **500/march** (screenshot-verified) | `PARTIAL` (~200× scale gap) | IMPROVE — scale is a retention lever, not vanity |
| 13 | March logistics | RD research speed | Rapid Deployment; dragon speed (Dragonry) | Muster Yard/Crossroads speed factors | `MATCH` | — |
| 14 | Scouting | Spy unit, intel reports | Spies; **Sentinel gives defenders incoming-march info**; Clairvoyance research | Scout marches, banded intel, Watchtower/Watch Hill depth tiers, **defender "incoming attack" event** | `MATCH`+ | Preserve — DW intel-depth ladder is arguably better designed; add spy-vs-sentinel duels later |
| 15 | Intelligence depth | Wall + spy counterplay | Research + Sentinel layers | 4 depth tiers incl. alliance sharing | `MATCH` | Preserve |
| 16 | Camps (PvE) | Anthropus camps L1-11 | Anthropus camps L1-11 (quest-verified); event currencies drop from camps; **core repeatable farm loop** | **10 camps, L1-10, 4 bands; NO respawn; finite** | `PARTIAL` → `MISSING` (loop) | **P0 IMPROVE** — respawn/regeneration is non-negotiable parity |
| 17 | Escalating PvE | Demon Tower (DoA mobile), camps | Camps to L11; dragons gated behind camp/wilderness feats; Demon Tower: `UNVERIFIED` in Reign | L8+ camps gated behind Dragon War Plan (one-shot) | `PARTIAL` | IMPROVE — see PvE strategy doc; don't copy Demon Tower blindly |
| 18 | Wilderness | 7 types, levels, occupancy cap | 5 types (Mountain/Lake/Plain/Forest/Cave) L1-10, production bonus | 6 typed wildernesses incl. Crossroads (speed) + Watch Hill (intel) | `MATCH`+ | Preserve — DW's typed-bonus design is differentiated and good |
| 19 | PvE farming | Camp farming = core food loop | Primary progression loop; event currency farm; troop-revival economics make losses cheap | No respawn → no farming; clue daily cap of 3 | `MISSING` | **P0** — see #16 |
| 20 | Dragons | Great Dragon + 8 elemental outpost dragons; armor | **Great Dragon "Legendary · Hybrid · Armor slots"** (helmet/body/claws/tail); enters battle L7; outpost elemental dragons; "fight alongside your armies"; dragon Battle Arts in combat | **No dragon ever fights.** Presence lifecycle (DORMANT→BATTLE_READY), Bestiary 9 entries, 1 expedition, 1 one-shot hunt trophy | `PARTIAL` (systems) → `MISSING` (dragon combat) | **P0 DIFFERENTIATE** — see dragon strategy doc |
| 21 | Dragon progression | Egg→L10 + 8 armor pieces | Hatch→L10, armor slots per part, Keep L11 "Reborn", heals via Fountain/Life items | Presence milestones; expedition bond; Dragon Studies L3 | `PARTIAL` | IMPROVE — DW can differentiate with knowledge/bond vs Reign's stat-armor |
| 22 | Dragon combat | Dragon leads marches | Dragons fight in marches; Battle Arts abilities; aerial combat research | **Absent from combat entirely** | `MISSING` | **P0** — the single largest fantasy failure vs Reign |
| 23 | Dragon hunting | N/A | N/A (dragons are owned, not hunted) | Bestiary/clue drops from camps; one Wyrm-Scarred hunt | `DIFFERENT` | IMPROVE — hunting is DW's differentiator; double down, don't abandon |
| 24 | Bestiary | N/A | N/A | 9 entries, 4 observation levels | `DIFFERENT` | Preserve — unique DW asset |
| 25 | Outposts/holdings | 4-8 elemental outposts, full sub-cities | **4 elemental outposts = "the bulk of the content"** (wiki); each: own dragon, troops, garrisons, resources; "more realms on the way" (site) | 5-citadel ladder (capital+MK→Brinehold→Stonekeel→Cinderreach→Galeari); exclusive units | `MATCH` (structure), `PARTIAL` (differentiation payoff) | IMPROVE — DW holdings need economic/military *payoff*, not just exclusive units |
| 26 | Differentiated settlements | Outpost elements differ by troop/resource | Strong elemental identity per outpost | Named citadels w/ exclusive units; partial ordinary-player path (critic P1) | `PARTIAL` | MATCH — finish ladder + persistence proof |
| 27 | Alliances | Chat, ranks, war | "Coordinate for battles, reinforcements, realm domination" (site) | Create/join, ranks, chat, **reinforcements w/ recall, shared intel** | `PARTIAL` | MATCH — but see #28 |
| 28 | Alliance war/territory | Realm dominance endgame | **"Compete for dominance across realms"** — realm domination is the stated endgame | **Nothing to win/lose collectively; no territory, no objectives** | `MISSING` | **P1** — minimum viable alliance-war loop required |
| 29 | Alliance ranks | Leader/officers | Ranks (implementation unverified in detail) | Leader-only rank mgmt + succession, tested | `MATCH` | — |
| 30 | Alliance scouting | N/A | N/A documented | Shared structured scout intel (tested, two-session browser journey) | `MATCH`+ | Preserve — ahead of documented Reign baseline |
| 31 | Reinforcements | Garrison reinforce | Reinforcements (site-confirmed) | Full lifecycle w/ sender attribution + recall | `MATCH` | — |
| 32 | PvP | Attack/plunder/protection | Plunder, "battles" via alliances; protection `UNVERIFIED` | Postures (withdraw/garrison/full), plunder, Saltvault, new-player protection, defender notification | `MATCH` (mechanics) | — |
| 33 | Siege | Walls + siege units | Wall + siege interplay (DoA lineage) | **NO siege** — walls unbuildable, `siegecraft` tech is a dead key | `MISSING` | P2 — city assault needs a wall answer eventually |
| 34 | Territorial conflict | Realm dominance | "Dominance across realms" | None | `MISSING` | P1 — see alliance-war verdict |
| 35 | Persistence | Server MMO | Live MMO (implied) | Transactional PG delta-persist, restart recovery, CI-proven | `MATCH` (evidence gap: holding restart test) | Close release debt #1 |
| 36 | Recovery/no-softlock | Revival via Fountain of Life (troops recoverable) | Fountain of Life + revival items | Protection, pacing margins; but troop losses are permanent | `DIFFERENT` | IMPROVE — consider bounded revival; DW losses are brutally permanent vs lineage norms |
| 37 | Visual progression | Building art per tier | Distinct rendered buildings/city art (site) | Glyph icons; empty tiles/buildings dirs; SVG-only | `MISSING` (production art) | **P1** — presentation debt now retention-limiting |
| 38 | Live events | N/A (era-appropriate) | **Event hub, event quests, event shops w/ themed currencies, seasonal events (Hanami Apr-May 2026, Summer Jul 2026) w/ minigame + leaderboard** | Daily quests (3) + clue dailies | `MISSING` | P2 until core loops fixed; then P1 |
| 39 | Long-term progression | Outposts→dragon army→realm war | L11 Fortress, L15 fields, 100K marches, realm dominance | Keep L10, one expedition, ladder ends at Galeari; **no endgame** | `MISSING` | P1 — define what week-4 play IS |
| 40 | Monetization | Rubies (historical) | Store + promotions (Jul 26 promo evidence); chests/boosts/nanos per Items wiki `UNVERIFIED` pricing | Chronite: 4 convenience items only; no cash shop | `DIFFERENT` (deliberate) | REJECT direct power; keep convenience-only until product-market fit |

## Summarized gap shape

- **MATCH or better (preserve, protect):** march capacity/logistics, scouting/intel depth ladder, wilderness typing, alliance membership/ranks/reinforcement/shared intel, PvP mechanical core, persistence architecture, RPS counters.
- **PARTIAL (deepen):** city/buildings, economy scale, troop scale (~200×), research (structure exists, effects missing), camps (exist, finite), holdings (ladder exists, payoff thin), dragon progression meta.
- **MISSING (decide + build):** dragon combat participation, camp respawn/farming loop, storage/protection economy, troop upkeep, alliance war/territory stakes, live events, endgame definition, production art.
- **DIFFERENTIATED (Reign lacks them):** Bestiary knowledge system, dragon *hunting* (Reign dragons are owned, never wild), intel depth tiers, typed wilderness with logistics/intel bonuses, commander layer, server-verified tutorial ladder.

**Reign scale context (INFERENCE from quest tiers):** Reign operates at 100K-troop marches, 100K population, L15 fields, L11 Fortress, L11 camps — roughly two to three orders of magnitude above Dragon Wake's 500-troop marches, ~2K population, L5 plots, L10 Keep, L10 camps. Scale itself is a retention mechanic: bigger numbers = longer arcs = more to anticipate.

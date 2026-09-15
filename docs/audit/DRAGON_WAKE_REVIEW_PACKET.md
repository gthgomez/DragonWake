# DRAGON WAKE — REVIEW PACKET FOR INDEPENDENT REVIEWER

**Audit campaign:** Dragon Wake × Reign of Atlantis parity & product-gap audit
**Audit date:** 2026-09-04 · **Repo HEAD:** `8aba7c02daffc8ca5c96fa19ae83e156c1f6ecd1` (`codex/doa-parity-campaign`, PR #7 open)
**This packet is self-contained.** Companion evidence files (same directory): current-state audit, parity matrix, decision-density audit, retention gap analysis, PvE/dragon strategy, campaign options, roadmap.

> **POST-REVIEW NOTICE (2026-09-04):** The independent reviewer returned `APPROVE_WITH_STRATEGIC_AMENDMENTS`. **`DRAGON_WAKE_REVIEW_PACKET_AMENDMENT_1.md` (same directory) supersedes conflicting claims in this packet and all companion files**: Demon Tower is VERIFIED live Reign content; Reign troop upkeep is currently disabled; Dragon Wake camps are repeatable (not "10 finite fights"); the 10–50× rescale is rejected in favor of ratio instrumentation; visual work splits into an early Phase 1B pass; maturity estimate revised to 30–35%; and the approved next campaign is the revised mission in Amendment 1 §2. Read this packet for the full evidence base, then read Amendment 1 for the corrected conclusions and approved roadmap.

---

# 1. FINAL VERDICT

**`FOUNDATION_STRONG_PRODUCT_DEPTH_BEHIND_DRAGON_PROMISE_UNFULFILLED`** — Dragon Wake is a well-engineered, well-tested, honestly-reported alpha whose *systems exist* at roughly Reign-parity breadth but whose *game* — decisions, pressure, content cadence, social conflict, visible fantasy, and week-2 motivation — is a fraction of the live competitor's. The codebase is ahead of the product. The frozen design authority's central promise (dragons as a world system) is currently fiction inside the actual game loop: no dragon exists in combat, no dragon is visible on the map, and the hunt loop is one one-shot encounter. The next campaign should not add a new major system category; it should convert the existing foundation into pressure, rhythm, and visible consequence (economy depth + repeatable PvE), then build the dragon hunt differentiator on that ground.

# 2. CANONICAL REPO STATE

- Branch `codex/doa-parity-campaign`, 16 ahead of `main`, HEAD `8aba7c0` (`docs: reconcile final r3 evidence`, 2026-09-02). **PR #7 OPEN**, head-exact.
- **CI at exact head: SUCCESS** — run `33670807281` (2026-09-02T19:05Z), incl. PostgreSQL-required tests, typecheck, production build, 8 serial browser journeys. Verified via `gh` this audit. (Two same-day failures `33655835918`/`33665334256` were fixed in-band.)
- Clean tree except the intentionally-untracked `DRAGON_WAKE_DOA_PARITY_IMPLEMENTATION_MASTER.md`; a second worktree `DragonWake-alpha-r1` holds the older R1 snapshot.
- Local suite this audit: **177 passed / 3 PG-skipped** (Postgres not running locally; PG proof delegated to CI — green).
- Release evidence: R3 verdict `R3_IMPLEMENTED_WITH_RELEASE_EVIDENCE_OPEN`; committed critic doc still says `NOT_SAFE_TO_MERGE` but its CI P1 is superseded by the verified green exact-head runs; its remaining P1s (holding restart proof, broader responsive/campaign browser certification, full ordinary-player holdings positive path) stand.
- Contradiction resolved: newer CI evidence wins over the stale critic verdict; R3's "176 tests" vs measured 177 is minor drift.

# 3. DRAGON WAKE CURRENT MATURITY

| Area | Score (/100) | Status | Evidence | Main Gap |
|---|---:|---|---|---|
| Architecture | 80 | Strong, test-backed | authoritative server `world.ts`, deterministic combat pkg, PG delta-transactions, CI-proven | single in-process realm; no horizontal scale |
| Functional systems | 75 | Broad + tested | 177 tests; 6 Playwright journeys | research stats unwired; siege absent; no upkeep/storage |
| Player-accessible systems | 60 | Ladder certified to mid-game | Alpha R1 14-step journey; ordinary-player holding test to Brinehold | full holdings ladder unpersisted/unproven (critic P1); hunt loop practically unreachable |
| Strategic depth | 30 | Weak | decision-density audit: 12/18 systems PARTIAL/NO at STRATEGIC | no pressure (no upkeep/storage), interchangeable pieces, one-way choices |
| PvE depth | 25 | Loop broken | 10 camps, NO respawn (code-verified); 1 one-shot hunt | no farming rhythm, finite content, no goal generator |
| PvP depth | 35 | Functional-thin | postures/plunder/protection/notification tested | no siege/ranking/territory; loot economics unfavorable |
| Alliance depth | 30 | Core-only | ranks/chat/reinforce/shared-intel tested | nothing to win/lose; no objectives/territory/war |
| Dragon depth | 20 | Meta-only | presence/bestiary/expedition/war-plan tested; zero combat participation | the fantasy is asserted, never played |
| Economic depth | 30 | Additive only | plots/production tested; no caps/upkeep | no scarcity → no tradeoffs |
| Content volume | 25 | Thin | 20 units, 13 buildings, 18 techs, 10 camps, 9 bestiary, 16 commanders, 1 expedition | everything enumerable in minutes |
| Art/presentation | 20 | Scaffolding | 13 SVG glyphs; empty tiles/buildings dirs; screenshot-verified glyph city/flat map | no production assets; AGES pipeline blocked |
| Onboarding | 70 | Genuinely good | server-verified 10-objective ladder; good copy ("The sky is not empty") | ends into vacuum; toast UI defects |
| Retention | 15 | Cliffs at day 2-3 | retention audit; thin dailies; no events; no week-2 content | no return drivers past the ladder |
| Long-term progression | 10 | Undefined | ladder ends at Galeari/BATTLE_READY; preservation ledger: endgame DEFERRED | no endgame at all |
| Production readiness | 40 | Shippable-alpha | exact-head CI green; release debt documented | 3 open debt items; DEV_FAST_TIME default-on; admin surface open in non-prod |

**Overall player-facing maturity vs current Reign ≈ 25-30%.** *What this means:* an informed new player compares not feature lists but felt experience — and Dragon Wake currently offers roughly the first 2 hours of Reign's loop, with better guidance and worse everything-after. This is an estimate (no telemetry, no player counts), not a measurement. Architecture/code quality (80+) is deliberately excluded from this number; test counts were not allowed to inflate it (Amendment 8).

# 4. REIGN OF ATLANTIS CURRENT STATE

Browser-based fantasy MMORTS; **rebranded from "Rise of Atlantis" on July 1, 2026** ("New Domain, New Event, New Outpost!" — community/official-team subreddit announcement). Live version ~v1.9.x (patch notes latest 2026-08-17: mobile stability, mobile battle-report rewards, world-map refresh fix; v1.10.0 on staging). Official pillars: build your city, train armies, **hatch/heal/equip dragons that fight alongside your armies**, join alliances, "compete for dominance across realms."

Mechanically (official wiki, actively edited): DoA-lineage city (Fortress L11, Dragon Keep, Rookery, Storage Vault, Fountain-of-Life troop revival, Sentinel defender intel, Wall, Theater/happiness/taxes, fields to L15); 13 **wired** research stat modifiers (combat formula `modded = base × (1+bonus)`); troop **Food upkeep** (Rationing); DoA-lineage troop roster + per-outpost exclusive troops; **Anthropus camps L1-11 as the standing farm loop** + wilderness L1-10; **4 elemental outposts = "the bulk of the content," each with its own dragon**; Great Dragon (hatch L3→battle L7→L10, helmet/body/claws/tail armor, Keep L11 "Reborn"); turn-based positional battles (speed initiative, 100-turn cap, 0.8-1.2 RNG, targeting priorities, dragon Battle Arts); quest web up to **100K-troop marches / 100K population**; **live events** (Hanami Apr-May 2026; Summer Jul 2026 with minigame + leaderboard; event shops with themed currencies and lifetime caps); item economy incl. time-skips, nanos, chests (Fortuna/Chronos), completion grants, curses, teleporters; store promotions (one ran to Jul 26).

`UNVERIFIED` in Reign: Demon Tower (DoA-mobile lineage; no Reign evidence found), PvP protection numbers, alliance-war specifics, player counts, monetization prices, actual population health. Sources: [official site](https://reignofatlantis.com/), [patch notes](https://reignofatlantis.com/patch-notes), [official wiki](https://riseofatlantis.wiki.gg/) (accessed 2026-09-04; full register in the parity matrix).

# 5. DRAGON WAKE VS REIGN (quantitative + qualitative)

Estimated player-facing coverage of Reign's experienced game: **city/economy 50%** (no storage/upkeep/taxes/happiness), **research 40%** (infrastructure yes, effects no), **troops 60%** (breadth yes, scale ~1/200th, no upkeep), **combat 40%** (deterministic resolver vs positional turn-based battlefield; no battle presentation), **PvE 25%** (10 finite encounters vs standing L1-11 farm + event economy), **dragons 15%** (no combat participation, no armor arc, no visible dragons vs battle-participating armored Great Dragon + 4 elemental dragons), **outposts 45%** (5-holding ladder vs "bulk of the content" full sub-cities), **alliance 40%** (core features yes; zero collective stakes vs "realm domination"), **live-service 10%** (3 dailies vs seasonal events/shops/minigames), **presentation 15%** (glyphs vs rendered cities). Qualitatively: Dragon Wake is the better-*engineered* game (authoritative simulation, determinism, transactional persistence — none of which Reign documents) and the weaker *game*.

# 6. BIGGEST GAPS (ranked)

1. **PvE is finite** — 10 fights, no respawn; the genre's core rhythm is absent.
2. **Dragons never play** — the product's stated differentiator has zero mechanical presence in combat or on the map.
3. **No economic pressure** — no storage caps, no upkeep, no scarcity → few ongoing tradeoffs anywhere.
4. **No long-term motivation** — ladder ends at Galeari; no endgame, no seasons, no week-2 content.
5. **Presentation debt** — glyph city/flat map contradicts the fantasy at the exact moment players decide to stay.
6. **Alliances have no payoff object** — cooperation without stakes; no war, territory, or rivalry.
7. **Scale makes nothing matter** — 500-troop marches and 2K population vs Reign's 100K-scale arcs; losses are emotionally free.
8. **Research doesn't do anything** — per_level stats defined, never applied (wired-ness is Reign's whole research game).
9. **Content volume thin everywhere** — 1 expedition, 9 bestiary entries, 16 interchangeable commanders, 3 dailies.
10. **Release debt on the ladder** — holdings beyond Brinehold lack an ordinary-player positive path + persistence proof (critic P1 stands).

# 7. STRONGEST DRAGON WAKE ADVANTAGES (protect)

1. **Authoritative deterministic simulation + transactional persistence** — a foundation most browser MMOs never had; Reign documentation doesn't claim it.
2. **Intel depth ladder** (Watchtower/Watch Hill tiers, banded fog, alliance sharing) — better-designed scouting than the documented Reign baseline.
3. **Typed wilderness with logistics/intel bonuses** (Crossroads/Watch Hill) — strategic geography that Reign's plain production-wilds lack.
4. **Server-verified objective ladder + best-in-class copywriting** — onboarding voice ("The sky is not empty") is a real asset.
5. **Bestiary + wild-dragon-hunt premise** — structurally absent in Reign (dragons are owned, never wild): the differentiation space is *empty*, and DW already owns the knowledge-system foundation for it.
6. **Commander layer** — Reign has no commander analogue; currently underused but structurally additive.
7. **Honest evidence culture** — critic reports, release-debt lists, pacing sims committed to the repo; this audit could re-derive everything from artifacts. Preserve this.

# 8. MATCH / IMPROVE / REJECT (strategy summary)

- **MATCH:** camp farming loop (respawn), storage/protection, upkeep, research stat wiring, alliance war minimum, events cadence, building-tier visibility, scale-up.
- **IMPROVE:** dragons (hunted wild ecology + one scarce bond → Reign's armor-grind pet bestiary), scouting (keep DW depth ladder + add spy/sentinel duels later), wilderness (add contestion to DW's better typing), camp PvE (hunt contracts > floors), combat reports (round summaries on DW's deterministic base), expansion (finish ladder with real economic payoffs).
- **REJECT:** elemental dragon families, dragon armor slot grind, dragon-as-troop-tier, chests/gacha, battle-pass FOMO, direct-power monetization, auction house, dozens-more-troops content inflation, Demon-Tower floor crawler, aquatic/elemental aesthetic drift (already banned by DIRECTION_FREEZE).

# 9. PvE VERDICT

Do **not** copy Demon Tower (its existence in current Reign is `UNVERIFIED` anyway). Build: **(1)** camp respawn + band rebalance (parity floor, small), **(2)** Bestiary Mastery Hunts — knowledge-gated, tiered hunt contracts with species counter-traits and real loss risk, feeding a materials economy (the differentiator), **(3)** alliance expeditions against apex targets (first alliance payoff object). This creates replayability *and* strategy at low content cost because the Bestiary already exists; a tower would be content-expensive, thematically wrong (wild dragons, not dungeon furniture), and a Reign/DoA clone pattern. Details: PvE/dragon strategy doc.

# 10. DRAGON VERDICT

Dragons become real through **presence → behavior → consequence → (much later) a single scarce bond**: map signs/lairs and camp-territory (visible), neglected-lair raiding behavior (consequential), bestiary-gated hunts (playable), materials with sinks (decisions), and at endgame one kingdom-defining bonded dragon with anti-dragon counterplay (memorable, scarce, anti-Reign). This is how DW surpasses Reign — not by out-armoring Reign's Great Dragon, but by making dragons *wild, dangerous, and knowable*, which Reign structurally cannot do without abandoning its owned-dragon economy. Gate: until DR-1 ships, do not claim dragons as more than fiction in any player-facing copy.

# 11. ALLIANCE WAR VERDICT

Minimum viable loop: **one contestable objective type** (region landmark or wilderness cluster), **war-state windows** (declared, timed), **one coordinated-march tool** (rally timing), **one persistent outcome** (season score or territorial buff), **persistence-proven across restart** (close critic P1 patterns first). Nothing else — no NAPs, perks, or cross-realm — until one war produces a server story. Prerequisite: Phases 1-2 retention fixes, or the war happens on an empty map.

# 12. PRESENTATION VERDICT

Visual debt is now a **primary** retention limiter, not a cosmetic one: the 30-minute quit window coincides with the player discovering the world is glyphs on flat tiles (screenshot-verified), and the product promise ("medieval kingdom in a dragon-filled world") is nowhere visible — no dragon has ever appeared to a player. Verdict: `PRODUCTION_CANDIDATE` tier is reached nowhere; everything is `placeholder`. Phase 5 (post-hunt) production art pass on city/map/dragon-reveal/battle-report; tier-glyph stopgap earlier in Phase 1. The blocked AGES/Antigravity art pipeline must be resolved or replaced before Phase 5 — this is a management decision, not a code one.

# 13. RELEASE DEBT

Resolved since the critic (do not let these survive as findings): exact-head CI incl. PG (runs `33670007885`, `33670807281`); wilderness race; Dragon War Council consequence; reinforcement lifecycle + recall; alliance rank authority; shared-intel panel; ordinary-player path *to Brinehold*. Genuinely outstanding: **(1)** holding-specific persistence/restart test; **(2)** broader responsive + campaign-depth browser certification; **(3)** full ordinary-player positive path *beyond* Brinehold with persistence; **(4)** parity-matrix sign-off itself; **(5)** cheap-but-real hygiene: `DEV_FAST_TIME` default-on in production entry, admin API open when NODE_ENV≠production, legacy `tideforge` DSN/credential naming, `INITIAL_TEST_FIXTURE` tuning constants as shipped values.

# 14. NEXT CAMPAIGN OPTIONS (three strongest)

- **A — PLAYER DEPTH FIRST** (wire research stats, storage+upkeep economy, rescale, visible tiers, camp respawn + dailies, combat reports, UI defects): impact 38/45 weighted; ~1-2 campaigns; low risk.
- **B — SIGNATURE DRAGON FIRST** (Bestiary hunts: signs/lairs, species traits, contracts, materials): the differentiator; ~2 campaigns; medium risk; starved without A's economy.
- **C — MMO CONFLICT FIRST** (alliance war MVP): biggest missing category; ~2-3 campaigns; high risk (consistency, griefing, empty-map theater) and premature before retention fixes.

# 15. RECOMMENDED NEXT CAMPAIGN

**Option A — Player Depth First, with the PvE-1 slice (camp respawn + dailies) folded in.** Why now: (1) every later campaign inherits its outputs (pressure economy, rescale, goal cadence); (2) it converts existing test-verified systems into felt gameplay instead of adding categories the matrix says are already adequately covered at EXISTS/FUNCTIONS level; (3) it retires retention cliffs #1 and #3 at their roots; (4) it is the lowest-risk campaign that changes daily player experience; (5) the differentiator (B) lands harder one campaign later on an economy that can punish and reward. Amendment 10 check: A creates decisions (upkeep/storage/order), motivation (daily rhythm), anticipation (visible tiers, bottlenecks), and memorable events (first battle that *reads* like a battle).

# 16. ROADMAP

Phase 0 close release debt → Phase 1 economy & decisions depth → Phase 2 repeatable PvE + legible combat → Phase 3 dragon hunt (PvE-2/DR-1) → Phase 4 alliance war MVP → Phase 5 visual world production pass → Phase 6 live events/seasons. Full phase definitions (goal, player problem, systems, content, tests, dependencies, non-goals, exit criteria) and the P0-P3 prioritization table: `DRAGON_WAKE_RECOMMENDED_ROADMAP.md`.

# 17. DO NOT BUILD YET

1. **Extra currencies / Chronite expansion** — the existing one has 4 items; economy first.
2. **More menus/dashboards** — presentation debt is the opposite direction.
3. **New holding types beyond the ladder** — finish Brinehold→Galeari proof + payoffs first.
4. **Dozens of new troop types** — 20 exist; wire counters' information pressure first.
5. **Cosmetics / skins** — before production art even exists.
6. **Auction house / player trading** — economy has no scarcity to trade against; inflation exploit surface.
7. **Elaborate diplomacy (NAPs, treaties, ranks trees)** — before one war loop exists.
8. **More dragon species / elemental families / armor slots** — before the hunt loop makes one species matter.
9. **Complex crafting trees** — before meaningful item decisions exist (4 clue items today).
10. **Cross-realm / new maps / hardcore realms** — single realm is not yet at capacity of *content*, only of *systems*.
11. **Demon-Tower-style tower** — rejected on strategy grounds (see §9), not merely deferred.
12. **Monetization expansion** — REJECT direct power permanently (product principles); convenience-only stays until product-market fit.

# 18. QUESTIONS FOR INDEPENDENT REVIEWER

1. Are we overestimating strategic depth of the wilderness system because its tests are good — would a fresh player actually feel the Crossroads/Watch Hill tradeoffs, or is that auditor's pattern-matching?
2. Are we underestimating Reign's content advantage by accepting wiki documentation at face value — the wiki may lag the live game; is there in-game evidence (recent patch notes) of systems far beyond the wiki's 2024-era pages?
3. Is the 25-30% overall player-facing maturity estimate fair, given we penalized Dragon Wake for lacking week-2 content that *no alpha* has — should the comparison be against Reign-at-equivalent-population instead?
4. Does the hunt-contract design (§9-10) actually create *gameplay*, or mostly fiction with a reward loop — would camp respawn + ordinary tiered targets achieve the same retention for a fifth of the cost?
5. Is alliance war genuinely premature (our claim) or is it the *only* thing that can fix retention, making our sequencing backwards?
6. We recommend wiring research per_level stats and adding upkeep/storage as P0 — do these *add friction* that a 2026 casual audience will not tolerate, unlike 2010's DoA audience? Is the DoA-lineage frame the right demand curve at all?
7. Is the recommended ~10-50× economy rescale safe to do in one pass, or is it a multi-campaign migration that will destabilize every tuned constant (including the pacing sim) for a month?
8. We downgraded persistence from "guaranteed" to "CI-delegated" — is that too harsh, given exact-head CI runs the full PG suite green? What additional proof would a rational reviewer demand before merge?
9. Is DEV_FAST_TIME-default-on actually a production risk, or is it correct for an alpha with no public deployment — and does flagging it as debt inflate this audit's rigor theater?
10. The roadmap solves economy → PvE → dragons → war in sequence. If only ONE phase can ship this quarter, which single phase maximizes the probability that a day-3 player is still playing at day-14 — and is our confidence in that ordering honestly above coin-flip?

---

*Evidence rules: repo claims cite files/tests/SHAs in the companion audit docs; Reign claims cite the source register in the parity matrix (official site, official patch notes, official wiki; community sources labeled; access dates 2026-09-04). Labels VERIFIED/UNVERIFIED/INFERENCE are used throughout. No game code, tests, or canonical documents were modified during this audit; all deliverables are new untracked files in `docs/audit/`.*

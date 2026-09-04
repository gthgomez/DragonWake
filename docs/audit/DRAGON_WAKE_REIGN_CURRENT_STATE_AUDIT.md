# DRAGON WAKE × REIGN OF ATLANTIS — CURRENT STATE AUDIT

**Campaign:** Dragon Wake Reign parity & product-gap audit
**Audit date:** 2026-09-04
**Auditor:** Dragon Wake Product Auditor (independent audit pass)
**Repo HEAD at audit:** `8aba7c02daffc8ca5c96fa19ae83e156c1f6ecd1` on `codex/doa-parity-campaign`
**Method:** Direct source inspection, content-data inspection, one serial local test run, inspection of committed Playwright screenshot artifacts, `gh` CI/PR queries, live web research (see parity matrix for Reign citations). No dev servers or browsers were launched.

> Evidence labels per campaign rules: `VERIFIED` (directly proven in this audit), `PARTIAL` (proven but incomplete), `STALE` (true of an older state, superseded), `CONTRADICTED` (evidence disagrees with the claim), `UNVERIFIED` (could not be proven), `INFERENCE` (stated conclusion drawn from evidence).

---

# PART I — CANONICAL REPOSITORY STATE

## 1.1 Git facts (all VERIFIED via direct command output, 2026-09-04)

| Item | Value |
|---|---|
| Repository | `C:\Workspace\Project_Games\DragonWake` (remote `https://github.com/gthgomez/DragonWake`) |
| Active branch | `codex/doa-parity-campaign` |
| Main branch | `main` (origin/HEAD) |
| HEAD SHA | `8aba7c02daffc8ca5c96fa19ae83e156c1f6ecd1` (`docs: reconcile final r3 evidence`, 2026-09-02) |
| Divergence | 16 commits ahead of `main` (merge-base `60176cd`), 0 behind |
| Dirty state | Clean except ONE untracked file: `DRAGON_WAKE_DOA_PARITY_IMPLEMENTATION_MASTER.md` (deliberately preserved untracked per `delivery/R3_CAMPAIGN_PROGRESS.md`) |
| Worktrees | `DragonWake` @ `8aba7c0` [codex/doa-parity-campaign]; `DragonWake-alpha-r1` @ `411cf00` [feat/alpha-r1-living-kingdom] |
| Open PR | **PR #7 "feat: Alpha R2 Dragon Presence and progression closure" — OPEN**, head `8aba7c0` (exact head), verified via `gh pr view 7` |
| CI (exact head) | Run `33670807281` **SUCCESS** 2026-09-02T19:05Z on head `8aba7c0`; also `33670007885` and `33651223436` success; two intermediate failures (`33665334256`, `33655835918`) same day — fixed in-band |
| Related legacy repos | `TideforgeEmpires` (pre-rename ancestor, branch `codex/dragon-wake-rename`, superseded); `DragonWake-alpha-r1` (older campaign snapshot, superseded by PR #7 line) |

## 1.2 Authority hierarchy (as applied in this audit)

1. **Frozen product/design authority:** `docs/design/DIRECTION_FREEZE_V1.md` (FROZEN), `docs/design/CANON_AUTHORITY.md` (FROZEN)
2. **Current code:** `apps/server/src/*`, `packages/*`, `apps/web/src/*`
3. **Automated tests:** 20 server test files (177 passed / 3 PG-skipped locally this audit), 11 combat tests, 6 Playwright journey specs (CI-green at head)
4. **Current release evidence:** PR #7 exact-head CI runs; committed evidence JSONs in `delivery/evidence/`
5. **Campaign reports:** `delivery/R3_FINAL_REPORT.md`, `delivery/R3_CAMPAIGN_PROGRESS.md`
6. **Historical plans:** closed-mockup FINAL_REPORT, Tideforge-era docs, M2_RESOURCE_RENAME_PLAN (superseded)
7. **Obsolete:** workspace memory files (≤2026-08-21), `PROJECT_CONTEXT.md` still listing the project under "Tideforge Empires" (STALE)

## 1.3 Document contradictions found and resolved

| Contradiction | Resolution |
|---|---|
| Independent critic (`delivery/evidence/dragonwake-r3-independent-critic.md`, verdict `NOT_SAFE_TO_MERGE`, P1: "fresh exact-head CI not proven") vs R3 report claiming green CI | **Newer evidence wins:** exact-head CI runs `33670007885` (reported) and `33670807281` (verified this audit against PR #7 head `8aba7c0`) both SUCCEEDED, including PostgreSQL-required tests and 8 serial browser journeys. The critic's CI P1 is **resolved by newer evidence**; the critic document itself was never updated (still says NOT_SAFE_TO_MERGE). The other P1s (holding persistence/restart proof, broader responsive/campaign browser certification, ordinary-player holdings positive path with persistence) remain genuinely open. |
| R3 report says "176 passed" locally; this audit measured **177 passed / 3 skipped** | Minor drift (one test added in `d42d8cc`); substance matches. |
| `DIRECTION_FREEZE` (frozen) vs implementation details | No contradiction found; implementation matches the frozen medieval low-fantasy direction. |
| Untracked master parity contract is "implementation authority" yet untracked | Confirmed intentional; `docs/design/PAST_WORK_PRESERVATION_LEDGER.md` states its decisions were reconciled. This audit found no unique decision living only in that file. |
| Pacing report claims "softlock risk low at all horizons" vs critic P2 "declarative model, not a real simulation" | Both stand: the pacing evidence is a deterministic declarative model (`apps/server/src/pacing-simulation.ts`), useful but **not** a full queue/combat simulation. Confidence in "no softlock" is correspondingly bounded. |

---

# PART II — STARTING-ASSUMPTION VERIFICATION (Amendment 1)

Every load-bearing claim that entered this audit as context was re-verified against source. Results:

| # | Claim (as hypothesized) | Verdict | Evidence |
|---|---|---|---|
| 1 | "20 troop types" | **VERIFIED** | `packages/content/data/units.json` enumerates exactly 20 units (levy → ballista, incl. dragon_slayer, sapper, supply_wagon) |
| 2 | "Troop counters via RPS" | **VERIFIED** | `data/rps.json` defines a 5-role triangle (melee/range/speed/logistics/scout) with amplification values (e.g. range→melee 1.35, melee→range 0.75); `data/matchups.json` holds 14 validated matchup rows |
| 3 | "40×40 map" | **VERIFIED** | `packages/shared/src/index.ts:111-112` (`MAP_W = 40; MAP_H = 40`) |
| 4 | "10 camps in 4 bands" | **VERIFIED** | `data/camps.json` is an array of length 10; `campBand()` in `apps/server/src/world.ts:169`; four band names incl. Wyrm-Scarred Ruin |
| 5 | "6-holding ladder incl. locked Mnemolith" | **PARTIAL — corrected** | `data/citadels.json` contains **5** citadels (Marcher Keep, Brinehold, Stonekeel, Cinderreach, Galeari) plus the capital. `mnemolith` appears in code but is hard-blocked `NOT_SHIPPED` (`world.ts:3512`). The ladder is capital + 5 holdings, one of five locked. |
| 6 | "Dragon systems = presence/bestiary/war plans" | **VERIFIED** | `world.ts` dragonPresence lifecycle (DORMANT→STIRRING→AWAKENED→BONDED→BATTLE_READY), `data/bestiary_entries.json` (9 entries), `data/expeditions.json` (1 expedition), Dragon War Council + single-use `dragon_war_plan` item gating L8+ camp hunts (`world.ts:2439-2447`) |
| 7 | "No dragon ever fights in combat" | **VERIFIED** | No dragon unit exists in `packages/combat/src/index.ts` or any battle resolution path; dragons exist only as readiness/meta state. Dragon presence is a **progression skin over conventional combat**, not a combat participant. |
| 8 | "Alliance ranks/chat/reinforce/shared intel, no diplomacy" | **VERIFIED** | `world.ts:3584-3729` (create/join/ranks/leave+recall), alliance chat, `applyReinforce`/recall lifecycle, shared scout-intel events, `reinforcement-lifecycle.test.ts` (5 cases). No NAP/diplomacy/alliance objectives/tracked wars. |
| 9 | "PvP postures/plunder/protection/defender notification; no siege" | **VERIFIED** | Defense postures withdraw/garrison/full with 5-min cooldown; `plunderCity` with Saltvault ratio (`world.ts:3083`); new-player protection; incoming-attack event at march creation (`world.ts:2582-2592`). "Siege" appears only in UI flavor copy and a pacing profile label — **no siege mechanic exists**. |
| 10 | "Transactional PG persistence" | **PARTIAL** | `pg-store.ts` implements full save + dirty-delta transactions (`BEGIN/COMMIT` at :990/:1067) and restart recovery (`loadInto`, manpower recalc). But the 3 PG tests **skip locally without a reachable Postgres**, and the DSN still names legacy `tideforge` — proof is delegated to CI (currently green). No holding-specific restart test exists (R3 release debt item 1). |
| 11 | "Art = SVG scaffolding only" | **VERIFIED** | `apps/web/public/art/` holds 13 SVG UI glyphs; `tiles/` and `buildings/` dirs are `.gitkeep`-empty; screenshots confirm icon-glyph buildings and flat abstract map tiles |
| 12 | "Research per_level stats defined but unwired" | **VERIFIED** | `per_level` appears in `data/research.json` (8 techs define e.g. +8%/level) and once in the loader type (`packages/content/src/index.ts:100`); **zero occurrences** in `apps/server/src` — the modifiers are never applied to economy or combat |
| 13 | "`DEV_FAST_TIME` defaults ON" | **VERIFIED** | `apps/server/src/index.ts:63`: `process.env.DEV_FAST_TIME !== "0"` → time compression active by default whenever the server entry runs, even with NODE_ENV unset |
| 14 | "No storage cap" | **VERIFIED** | No storageCap/warehouse logic in `world.ts`; Saltvault only reduces plunder rate |
| 15 | "No camp respawn" | **VERIFIED** | No respawn/repopulate logic exists in `apps/server/src`; camps are seeded once at boot |
| 16 | "13 buildings" | **VERIFIED** (corrected from 12) | `data/buildings.json` has 13; 3 are `buildable:false` (forge_heart is the Keep ladder itself; gearfoundry and seawall are present but not buildable by players) |
| 17 | "18 techs" | **VERIFIED** | `data/research.json` has 18 entries incl. 4 holding-unlock charters and `siegecraft` (an unlock whose wall/siege mechanics do not exist — see #9) |
| 18 | "16 commanders" | **VERIFIED** | `data/commanders.json` lists 16 named commanders |
| 19 | "Shop = 4 Chronite items" | **VERIFIED** | `data/shop.json`: 2 speedups, 2 shields. Convenience-only; no direct-power sales |
| 20 | "Release debt = holding persistence + responsive browser + parity sign-off" | **VERIFIED** | `delivery/R3_FINAL_REPORT.md` §Release debt lists exactly these three; critic P1s confirm |

**Audit's own corrections vs. its starting context:** building count 12→13; holding ladder "6 holdings"→capital + 5 citadels with 1 locked; PG persistence strength downgraded from "guaranteed" to "CI-delegated, no holding-specific restart proof."

---

# PART III — PLAYER-EXPERIENCE SYSTEM AUDIT (six-level model)

Legend: each system scored `YES`/`PARTIAL`/`NO` at six levels — EXISTS (code exists) / FUNCTIONS (behaves under verification) / PLAYER_ACCESSIBLE (ordinary player reaches it through the game) / STRATEGIC (creates tradeoffs affecting other decisions) / CONTENT_RICH (enough variation to resist being solved) / RETENTIVE (creates reasons to return/prepare/cooperate/compete). Ordinary-player accessibility was judged against the shipped tutorial ladder, research/charter gates, and the certified Alpha R1 browser journey — **admin endpoints and dev unlocks are excluded** from accessibility scoring.

## 3.1 System-to-game depth matrix (Amendment 5 — central output)

| System | Exists | Functions | Player Accessible | Strategic | Content Rich | Retentive | Main Missing Ingredient |
|---|---|---|---|---|---|---|---|
| City / economy | YES | YES | YES | PARTIAL | PARTIAL | NO | Production choices are additive, not competitive — no storage caps, no upkeep, no scarcity forcing build-order tradeoffs |
| Buildings (13) | YES | YES | YES | PARTIAL | NO | NO | Only 10 buildable; per-level stat effects mostly not wired (research per_level unused); upgrades are numbers, not visible change |
| Research (18 techs) | YES | YES | YES | NO | PARTIAL | NO | Unwired stat modifiers make most techs pure keys (unlock gates), not power/expression choices; single queue = pure time tax |
| Troops (20 units) | YES | YES | YES | PARTIAL | PARTIAL | PARTIAL | RPS triangle exists but no information pressure to use it (scout intel is banded; camp comps static per seed; no PvP meta) |
| Commanders (16) | YES | YES | YES | NO | NO | NO | Commanders are interchangeable stat bonuses; no differentiation, no attachment to specific armies/stories |
| Camps (10, 4 bands) | YES | YES | YES | PARTIAL | NO | NO | Fixed seed per camp = solvable; no respawn = finite content; no reason to re-fight after clearing |
| Wilderness | YES | YES | YES | YES | PARTIAL | PARTIAL | Six typed bonuses are genuinely strategic; but no contests/raiding of claims → no competition for territory |
| Scouting / intel | YES | YES | YES | YES | PARTIAL | PARTIAL | Watchtower/Watch Hill depth is real strategy; capped by only three enemy archetypes to scout (camps, cities, wilds) |
| Holdings (5-citadel ladder) | YES | YES | PARTIAL | PARTIAL | NO | PARTIAL | Reaching Marcher Keep is player-certified; full ladder beyond Brinehold has no ordinary-player positive path with persistence proof (critic P1) |
| Dragons (presence/bestiary/expedition) | YES | YES | YES | NO | NO | PARTIAL | Presence is a checklist read-model; no dragon decision, no risk, no relationship — anticipation without agency |
| Dragon hunting (War Council) | YES | YES | NO | NO | NO | NO | BATTLE_READY path requires Galeari + Dragon Studies 3 + single-use plan; not reached in any certified ordinary-player journey |
| Alliance (ranks/chat/reinforce/intel) | YES | YES | YES | PARTIAL | NO | NO | Nothing to win or lose together; no objectives, territory, or rivals → cooperation has no payoff |
| Reinforcements | YES | YES | YES | PARTIAL | NO | NO | Mechanically complete lifecycle; strategically idle because no threat scales to make garrisons matter |
| PvP (postures/plunder/protection) | YES | YES | YES | PARTIAL | NO | NO | Loot-only incentives, no ranking/territory/conquest; posture choice is a real but thin decision |
| World map (40×40) | YES | YES | YES | PARTIAL | NO | NO | Distances/crossroads matter, but terrain has no identity and one realm = no geography-driven strategy |
| Progression (Keep L1-10 + charters) | YES | YES | YES | NO | NO | NO | Linear ladder, no branch points; pacing sim itself shows pure monotonic growth with no bottlenecks |
| Persistence / recovery | YES | YES | YES | NO | NO | YES (baseline) | Retentive only in the negative sense (nothing is lost); holding-specific restart unproven |
| Visual progression | YES | PARTIAL | PARTIAL | NO | NO | NO | Buildings never change appearance with level; map is texture tiles; the "Living Kingdom" is currently a dashboard |

## 3.2 Category narratives with evidence

### Kingdom / Capital — `FUNCTIONAL`
First session is guided by a 10-objective server-verified tutorial ladder (screenshot: "OBJECTIVE 4/10"). Construction, 12 land plots (4 types, L1-5), Keep L1-10 gates, population/manpower with fractional growth, and per-hour rates displayed ("Food 1,911 +150/h") are all player-facing and certified by the Alpha R1 14-step browser journey. `VERIFIED`. Gaps: no storage cap, no upkeep, no build-order tradeoff deeper than "afford it or not." Buildings do not change appearance on upgrade — progression is numeric only (screenshot evidence). INFERENCE: the capital loop is solid but decision-poor after the first 30 minutes.

### Research — `FUNCTIONAL` (weakened)
18 techs, single queue, Scriptorium speed, unlock gating for 19 unit/building targets — all tested (`progression.test.ts:185-341`). `VERIFIED`. But per_level modifiers are unwired (#12), so Agriculture +8%/level does nothing; techs function as **keys, not power**. The 4 charters gate the holding ladder. INFERENCE: research is a checklist with a clock.

### Troops — `FUNCTIONAL`
20 units, manpower reservation vs double-spend (regression-tested), holding-gated elites, march capacity via Muster+Keep, deterministic RPS combat with losses and survivor return. `VERIFIED`. Composition counters exist mechanically but the game rarely *makes you care*: camp compositions are fixed per seed, PvP has no meta to optimize against, and no content demands anti-scout or anti-logistics play. PARTIAL at STRATEGIC.

### Commanders — `FUNCTIONAL` (thin)
16 named commanders, recruit cost scaling, roster/operation caps, XP/star-ups, wounds. Tested incl. seed-reproducible combat effect. `VERIFIED`. No commander is mechanically distinct from another; no acquisition story, no attachment. INFERENCE: a leadership **budget**, not heroes.

### World map — `FUNCTIONAL`
40×40, Chebyshev travel, crossroads speed, drag-to-travel UI, target panels. `VERIFIED`. Screenshot evidence: the realm map is a flat uniform tile grid with small markers; no terrain identity, no settlement visuals. Strategic geography is claimed by the design authority but the map itself carries almost none.

### Camps / PvE — `FUNCTIONAL` (finite)
10 camps, 4 bands, seeded anti-solved defensive compositions, scaling loot, bestiary/clue drops with onboarding guarantees + daily cap. Tested (`camp-bands.test.ts`, `progression.test.ts:1057-1310`). `VERIFIED`. No respawn: total PvE content is literally 10 encounters. After the clue dailies, camps have no pull. This is the single clearest CONTENT_RICH failure.

### Wilderness — `FUNCTIONAL` (strategic core)
Capacity = 2 + Keep−1, six typed bonuses (production, crossroads speed, watch-hill intel), race-safe capture, abandon. Best-tested system family. `VERIFIED`. The one system that already produces real tradeoffs (which wilds, which bonuses, capacity pressure). PARTIAL at RETENTIVE only because claims are never contested by anyone.

### Expansion / holdings — `FUNCTIONAL`, accessibility PARTIAL
Capital + Marcher Keep → Brinehold → Stonekeel → Cinderreach → Galeari, each with exclusive units and starter stacks; charter ladder gated on research + world state; Mnemolith NOT_SHIPPED. `VERIFIED`. Ordinary-player positive path is certified only to Marcher Keep/Brinehold (`787c50a test: certify ordinary r3 holding progression`); the critic's P1 on full-ladder positive path + persistence remains open.

### Dragons — `FUNCTIONAL` as meta, ABSENT as combat
Presence lifecycle derived from persisted facts; Bestiary 9 entries at 3/7/15/30 encounters; 1 expedition (Dragon Scar) gated on real counters; War Council + single-use war plan enabling one L8+ hunt trophy. `VERIFIED`. No dragon participates in battle (#7). The Knowledge view presents this well (screenshot: "The sky is not empty") — **the fantasy framing is ahead of the mechanics**. ANTICIPATION exists (DORMANT→STIRRING is genuinely evocative); AGENCY does not (you watch a checklist fill).

### Alliance — `FUNCTIONAL` core, no game
Create/join, leader ranks + succession, chat, reinforcements with recall, shared intel — all tested including a two-session browser journey. `VERIFIED`. There is nothing alliances can win, lose, own, or contest. INFERENCE: an alliance is currently a chat room with a garrison-transfer button.

### PvP — `FUNCTIONAL` (thin)
Postures (withdraw/garrison/full), plunder with Saltvault mitigation, protection rules, defender notification. `VERIFIED`. No siege (walls buildable:false, `siegecraft` tech is a dead-end key), no ranking, no territory consequences, no recovery drama. Loot amounts against production rates are small; the risk/reward tradeoff is currently unfavorable by default.

### Persistence — `FUNCTIONAL`, evidence PARTIAL
Transactional delta-persist, 26 tables, migrations, restart recovery, session survival. CI-green at head incl. REQUIRE_PG. `VERIFIED` at code level; holding-specific restart proof MISSING (release debt #1). Local DSN legacy naming (`tideforge`) is cosmetic debt.

### UI / UX — `FUNCTIONAL`, presentation below bar
Seven views, responsive at 3 viewports (tested + screenshots), server-verified tutorial, good copywriting (Knowledge view flavor is a genuine strength). Screenshot evidence of defects: toasts overlap and clip content on the right edge (desktop) and cover the header (mobile); battle "reports" surface first as one-line toasts; no combat visualization anywhere.

### Art / presentation — `SCAFFOLDING`
13 SVG glyphs; empty tiles/buildings dirs; alpha asset ledger admits AI art generation was blocked (AGES provider unwired) and zero production assets exist. Screenshots confirm: icon-glyph buildings, flat abstract map. The Alpha R1 "Living Kingdom" contract is **aspirational, not delivered** at production quality.

---

# PART IV — CODE QUALITY vs PLAYER-FACING QUALITY (Amendment 4)

These are reported separately, per amendment. They diverge sharply.

| Dimension | CODE QUALITY | PLAYER-FACING QUALITY |
|---|---|---|
| Verdict | **High for an alpha.** Authoritative server, deterministic seeded combat, transactional persistence, regression tests for known exploits, race-safe capture, anti-double-spend manpower reservation. CI green at exact head. | **Functional but flat.** Clean readable UI, good copy, working responsive layouts — but no visual progression, no combat presentation, toast defects, abstract map, icon-glyph settlements. |
| Key evidence | `pg-store.ts` transactions; `fixes.test.ts` exploit regressions; exact-head CI `33670807281` SUCCESS | `e2e/artifacts/alpha-r1/*.png` inspected this audit (toasts clipping; glyph buildings; flat map; numeric-only upgrades) |
| Trap avoided | ~195 tests prove correctness properties, **not** fun, depth, retention, or visual quality (Amendment 8). Player-facing scores above are NOT inflated by test coverage. |

# PART V — WHAT THE MATRIX DIAGNOSES

Reading the depth matrix, Dragon Wake's dominant limiter is **not missing systems and not broken implementations**. Columns Exists/Functions/Player-Accessible are mostly YES. The failures concentrate in the last three columns:

- **STRATEGIC: PARTIAL/NO in 12 of 18 rows** — systems don't interact into tradeoffs (research stats unwired, commanders interchangeable, dragons non-agentic, PvP loot-only).
- **CONTENT_RICH: NO in 10 of 18 rows** — 10 non-respawning camps, 9 bestiary entries, 1 expedition, 16 interchangeable commanders, fixed camp seeds.
- **RETENTIVE: NO in 12 of 18 rows** — nothing contests the player, nothing decays, nothing competes, nothing anticipates beyond a single expedition.

`INFERENCE`: Dragon Wake is primarily suffering from **insufficient strategic interaction + insufficient content + insufficient long-term motivation**, on top of a complete-but-shallow system foundation — and, in presentation, from visual debt that actively contradicts the product's own frozen premise ("settlements should feel like settlements, not dashboards").

---

*Continues in: parity matrix (Reign columns), decision-density audit, retention gap analysis, PvE/dragon strategy, campaign options, roadmap, and the review packet — all in `docs/audit/`.*

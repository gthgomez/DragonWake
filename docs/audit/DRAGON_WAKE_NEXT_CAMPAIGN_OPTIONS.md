# DRAGON WAKE — NEXT CAMPAIGN OPTIONS

**Audit date:** 2026-09-04 · **HEAD:** `8aba7c0` · Three competing strategies per Brief Part XVIII, scored per Brief Part XX (1-5 per axis; effort axes invert: 5 = least effort).

---

## OPTION A — PLAYER DEPTH FIRST (first 3 hours, economy decisions, combat feedback, PvE floor)

**Objective:** Convert the complete-but-shallow foundation into a game that *feels* strategic and alive inside the first two hours, and install the PvE rhythm floor (camp respawn + daily/weekly goal generator).

**Scope:** wire research `per_level` modifiers into economy/combat; add storage caps + Saltvault rework; add troop upkeep (Rationing-style mitigation optional); rescale march/population/economy numbers (10-50×, one coherent pass with the pacing sim re-run); visible building-tier changes (SVG tier glyphs acceptable short-term); camp respawn + band rebalance; daily/weekly quest expansion tied to real systems; combat report presentation (round-by-round summary, casualty table); fix toast clipping/overlap (screenshot-verified defect).

- **Expected player impact:** HIGH — every session of every player touches these systems; decision density roughly doubles (upkeep/storage/order tradeoffs); retention cliff #1 (post-ladder vacuum) addressed at its economic root.
- **Technical risk:** LOW-MEDIUM — all changes are within existing architecture; `world.ts` is large but these are parameter/derivation changes, not structural; rescale touches many content files (blast radius: content JSON + tests).
- **Content burden:** LOW — no new entities; number tuning + copy.
- **Dependencies:** none external; unblocks everything else (a rescaled, upkeep economy is the foundation future systems inherit).
- **Why now:** the depth matrix shows STRATEGIC/CONTENT_RICH/RETENTIVE failing across the board on systems that already exist; building *on* them is cheaper and safer than building *around* them. Also clears presentation debt in the same pass (highest-visibility wins).
- **Why not now:** defers the dragon differentiator another campaign; doesn't create social conflict; "polish" campaigns are hard to market internally as progress.
- **Duration:** ~1-2 agent campaigns.
- **Success gates:** decision-density re-audit shows ≥2 new ongoing tradeoffs; pacing sim re-run with upkeep/storage shows bounded bottlenecks (not "low everywhere"); browser journey shows visible tier change + readable combat report; retention-critical loops (camps) repeatable; all existing tests green + new regression tests for wired stats, storage, upkeep.

## OPTION B — SIGNATURE DRAGON FIRST (the hunt loop)

**Objective:** Build PvE-2 + DR-1 (Bestiary Mastery Hunts): map signs/lairs, species traits, hunt contracts, dragon materials economy. Make dragons mechanically real before anything else.

- **Expected player impact:** HIGH-MEDIUM — transforms the differentiator and the mid-game; but lands on a weak economy (no upkeep, no storage pressure, 500-cap marches) that limits how much hunts can hurt or reward.
- **Technical risk:** MEDIUM — new content domain (species traits, contracts) but no architectural novelty; combat resolver already handles arbitrary groups.
- **Content burden:** MEDIUM-HIGH — species design, contract tiers, sign/lair placement, art for lairs/dragons (currently the weakest asset area; SVG-only).
- **Dependencies:** benefits enormously from Option A's economy; without camp respawn (A) the hunt loop floats on dead PvE; presentation debt undermines the reveal moments.
- **Why now:** differentiation compounds; every week without it, DW is a thinner Reign.
- **Why not now:** building the signature system on an economy without pressure risks the "checklist with dragon paint" outcome the frozen authority explicitly forbids; art debt directly suppresses its impact.
- **Duration:** ~2 campaigns.
- **Success gates:** a hunt contract loop repeatable at 3+ tiers; bestiary levels gate visible power; materials have ≥2 sinks; e2e journey certifies an ordinary-player hunt.

## OPTION C — MMO CONFLICT FIRST (alliance war + contested territory)

**Objective:** Minimum viable alliance-war loop: contestable wilderness regions/objects, alliance objectives, coordinated-march tooling, war-declaration state, season scoring.

- **Expected player impact:** HIGH for retained social players — but DW has no evidence of a retained population to fight (single 40×40 realm, guest accounts, no telemetry, day-3 cliff upstream). Conflict on an empty or churned map is empty theater.
- **Technical risk:** HIGH — multi-player state consistency at scale, race conditions on territory, anti-grief rules, matchmaking/balance; current world is a single in-process realm.
- **Content burden:** MEDIUM.
- **Dependencies:** needs the economic pressure (A) to make territory worth contesting and marches worth losing; needs population retention upstream of any war.
- **Why now:** it is the biggest missing *category* (social war is 0%).
- **Why not now:** critic P1s already flag multiplayer proof gaps (two-player journeys unpersisted); building war atop unproven persistence foundations compounds risk; retention cliffs 1-3 would drain participants faster than war can retain them.
- **Duration:** ~2-3 campaigns.
- **Success gates:** two-alliance contested objective with persistence proof; coordinated-march e2e; griefing bounds tested.

---

## Scoring (Brief Part XX)

| Axis (1-5) | A Depth | B Dragon | C War |
|---|---|---|---|
| Player impact | 5 | 4 | 4 |
| Retention impact | 5 | 4 | 5 |
| Strategic depth | 5 | 4 | 5 |
| Differentiation | 2 | 5 | 3 |
| Parity value | 4 | 2 | 4 |
| Technical risk (5=safe) | 4 | 3 | 1 |
| Implementation effort (5=cheap) | 4 | 2 | 1 |
| Content effort (5=cheap) | 4 | 2 | 3 |
| Dependency importance | 5 | 3 | 5 |
| **Total** | **38** | **29** | **31** |

## Recommendation: OPTION A — PLAYER DEPTH FIRST

With a bounded dragon down-payment: include the **cheapest slice of PvE-1 (camp respawn + band rebalance)** inside A, because "finite PvE" is less a depth issue than a broken loop, and it is small. B follows immediately as campaign N+1 (hunt loop on the fixed economy), C after B (war on a populated map). This sequencing front-loads the systems every later campaign inherits, converts existing test-verified assets into felt gameplay, and pays down the presentation debt that suppresses everything else.

**Amendment 10 check (A):** creates *decisions* (upkeep/storage/order tradeoffs), *motivation* (daily rhythm), *anticipation* (visible tier progression, meaningful bottlenecks), *mastery* (economy optimization), and *memorable events* (first real battle report). Parity is a side effect, not the justification.

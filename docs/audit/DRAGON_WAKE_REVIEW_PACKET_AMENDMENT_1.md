# AMENDMENT 1 — POST-REVIEW RECONCILIATION (SUPERSEDES CONFLICTING CLAIMS)

**Date:** 2026-09-04 · **Status:** Incorporates the independent reviewer's verdict `APPROVE_WITH_STRATEGIC_AMENDMENTS` on the original audit packet. All corrections below were **independently re-verified** before acceptance (per campaign Amendment 1). Where an earlier audit file contradicts this document, **this document wins**.

---

## 1. Corrections accepted (with verification evidence)

### 1.1 Demon Tower is REAL, live, and substantial — was `UNVERIFIED`, now `VERIFIED`
Source: [riseofatlantis.wiki.gg/wiki/Demon_Tower](https://riseofatlantis.wiki.gg/wiki/Demon_Tower), published 2026-08-06 (OFFICIAL wiki; HIGH confidence). Introduced in update 1.6 (2026-06-20); launch contest winners announced 2026-07-27; actively balanced (July 2026 patch changed floors 90/100 per the reviewer — consistent with the page's maturity).
Confirmed design: 100 floors + hidden floor 101 (Abaddon); weekly reset Monday 00:00 UTC; 30 energy cap, 1 per attempt, 1 regenerated per 30 min; named boss every 10 floors with lore tablets; floor previews ("?") incl. modifiers; battle reports retained 1 week; **assault troops are provided by the tower (no personal army risk)**; ladder showing players-per-floor and summit counts; Demon Tower Pass (+25% rewards/chest rate — monetized acceleration); drops → Forge crafting → Blood Seal (tower reset meta-loop); tiered chest bands (Cursed Ember → Infernal Blood → Abyssal Demon → Void Demon); hidden-floor riddle/secrets layer. Tower is a 3×3 tile at map (0,0).
**Consequence:** the parity matrix row 17 gap verdict becomes `MISSING` (DW has no escalating repeatable PvE structure of this depth). The *recommendation* "don't build a Demon Tower clone" is UNCHANGED but its rationale changes: **not** "Reign may lack it" (false) but "Dragon Wake has a strictly better thematic vehicle (Bestiary Hunts / Regional Dragon Campaigns) that can transpose the tower's retention mechanics" — weekly reset cadence, energy pacing, enemy preview → preparation decisions, boss milestones, leaderboard/social comparison, materials→crafting meta-loop, and anti-solve modifiers.

### 1.2 Reign troop upkeep exists in architecture but is CURRENTLY DISABLED — was overstated
Source: [Halberdsman](https://riseofatlantis.wiki.gg/wiki/Halberdsman) and sibling troop pages state "**Remember that Upkeep has been deactivated for now.**" (Upkeep stat 0). The generic Troops/Research pages still describe upkeep + Rationing. Official pages; HIGH confidence for present state.
**Consequence:** "add upkeep" is removed as an automatic P0. The product need is *recurring economic tradeoffs*; upkeep is one candidate mechanism among replenishment costs, wounded-troop recovery, expedition provisioning, march supplies, garrison readiness, holding maintenance, and rebuild-after-loss economics. Selection happens in Phase 4 **after playtesting**, not by default. (Reign itself apparently reached the same conclusion live.)

### 1.3 Dragon Wake camps are REPEATABLE, not finite — was `CONTRADICTED`, now corrected
Re-verified in code at HEAD `8aba7c0`: `world.ts:2945` increments cumulative `campsDefeated` per victory; `world.ts:2813` marks a **daily** "camp" activity; `world.ts:368` daily quest "Attack a bandit camp"; `this.camps` is never deleted/removed anywhere (only `set` at seed and reads). The original audit's "no respawn logic" grep proved only that nothing *respawns* — because nothing is ever *consumed*.
**Consequence:** Gap #1 is rewritten: ~~"PvE is finite — 10 fights, no respawn"~~ → **"PvE has insufficient depth and progression density."** Ten reusable encounter definitions exist, but with deterministic per-seed compositions and static rewards, so repeated farming yields no enemy variation, no evolving tactics, no loot ladder, no rare drops, no first-clear/repeat reward split, no boss/elite variants, no progression gates, and no reason to revisit earlier bands. The problem is depth, not count.

### 1.4 The "10–50× economy rescale" P0 is REJECTED
Reviewer is correct: integer scale is not depth. What matters is replacement time, production-to-army ratio, loss recovery, march capacity relative to total military, and rebuild duration after defeat. Phase 1's rescale item is replaced by: **instrument and tune these ratios** (army replacement time, resources at risk, second-army fielding time) at whatever integer scale achieves the target feel. 100K-troop marches remain Reign's progression *fantasy* benchmark, not a numeric requirement.

### 1.5 Visual debt ordering contradiction — accepted
The audit called visual debt a primary retention limiter, then deferred all visual work to Phase 5. Corrected: split into an **early visual-state minimum** (visible building tiers, city hierarchy, camp-band and wilderness identity, march/army representation, battle-report readability, first dragon-presence visual moment, upgrade feedback) in Phase 1B, and the **full production art campaign** later (Phase 6).

### 1.6 Maturity estimate revised: 25–30% → **30–35%**
Camps are reusable, alliance infrastructure is more robust than scored, wilderness bonuses genuinely functional, exact-head CI strong. Conclusion unchanged: roughly one-third of a mature live game's *experienced depth* atop roughly three-quarters of its *system skeleton* — that divergence remains the audit's most important measurement.

### 1.7 PR #7 closeout is a hard precondition — strengthened
The 16-commit / 80-file PR must close its remaining release gates (holding-specific restart/persistence evidence; full ordinary-player holding ladder; broader responsive/browser certification; stale critic + parity verdict updates; exact-head sign-off), **merge to main**, and the next campaign branches from that merge — not from the long-lived branch. Prevents another long-lived-branch accumulation.

## 2. Revised recommended next campaign (supersedes §15 of the review packet and Option A as written)

**Mission: "Turn Dragon Wake's existing systems into meaningful decisions and repeatable mastery: wire progression effects, make combat legible, deepen camp PvE, and make advancement visibly felt."**

| Phase | Objective |
|---|---|
| 0 | Close R3 evidence gates → **merge PR #7** → branch cleanly |
| 1A | **Wire research `per_level` effects** into authoritative economy/combat calculations; strengthen strategic choice |
| 1B | **Combat reports** (what happened, what countered what, why units died, what commander/research changed) + **early visual-state pass** |
| 2 | **Deepen reusable camp PvE**: camp families, composition variation, reward ladders, first-clear vs repeat rewards, rare drops, elite/boss variants, progression gates |
| 3 | **Bestiary Hunt / first wild-dragon campaign** (transposing Demon Tower's retention ingredients: cadence, pacing, preview→preparation, boss milestones, leaderboard, crafting meta-loop, modifiers — onto rumor→sign→track→prepare→hunt→consequence→species mastery) |
| 4 | **Selective economy pressure** after playtesting (candidate mechanisms compared by the tradeoffs they create; upkeep not pre-selected; Reign's own live disabling of upkeep is cautionary evidence) |
| 5 | **Alliance-war MVP / contested objective** (foundations from R3 are good; population and personal goals must exist first) |
| 6 | **Production visual-world campaign** (settlement environments, map tiles, units, effects, dragons, animation) |
| 7 | **Events / seasons / live cadence** |

1A, 1B, and parts of Phase 2 content work may overlap (different bottlenecks).

## 3. What survives unchanged

The central verdict; the six-level depth matrix method; research-wiring as top priority; the dragon strategy (presence → behavior → consequence → scarce bond); alliance-war sequencing (not next); Match/Improve/Reject framework; decision-density and retention-horizon analyses; "DO NOT BUILD YET" (item 11's *rationale* is corrected per §1.1 — the tower is rejected on differentiation grounds, not doubt about its existence); evidence culture and all repo-state findings (independently confirmed by the reviewer: PR #7 open/mergeable at `8aba7c0`, 16 commits / 80 files, CI `33670807281` success).

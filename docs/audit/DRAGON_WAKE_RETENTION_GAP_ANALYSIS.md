# DRAGON WAKE — RETENTION GAP ANALYSIS

**Audit date:** 2026-09-04 · **HEAD:** `8aba7c0` · Method: code/content inspection, pacing-simulation report, committed browser-journey screenshots, Reign wiki/official-site comparison. All horizons are analysis, not measurement — Dragon Wake has no telemetry.

## Horizon-by-horizon

### First 10 minutes
1. **Player goal:** follow the objective ladder (Objective 1/10 …), first construction, first training. *Works* — server-verified ladder is genuinely good (screenshot-verified).
2. **Decisions:** plot type, first buildings. 3. **Approaching capability:** Dragon Watch → first clue. 4. **Anticipation:** Dragon Presence DORMANT→STIRRING flip is real and evocative. 5. **Uncertainty:** none — everything is guided. 6. **Social:** none. 7. **Quit risk:** low; presentation is clean; toast clipping is the main visible defect. 8. **Reign provides:** more immediate visual splendor (rendered city) andquest-reward dopamine (one-shot quest web pays resources constantly). DW's ladder is better *designed* than Reign's quest dump but pays less.

### 30 minutes
1. Goal: first camp fight, first scouting. 2. Decisions: which camp, which composition. 3. Approaching: wilderness claims. 4. Anticipation: bestiary/clue drops (guaranteed first 3). 5. Uncertainty: banded intel gives genuine fog. 6. Social: none. 7. **Quit risk: MEDIUM-HIGH** — combat is a toast + a report line; no battle visualization; the fantasy ("dragon-filled world") is nowhere visible on screen (screenshot-verified: glyph buildings, flat map). 8. **Reign:** turn-based battlefields with visible rounds; quest rewards cascading; first dragon egg in sight (hatch at Keep L3 per quest chain).

### 2 hours
1. Goal: Keep L2-3, more wildernesses, charter path opens. 2. Decisions: wilderness typing (the good one), build order. 3. Approaching: Marcher Keep. 4. Anticipation: holding specialization. 5. Uncertainty: charter requirements. 6. Social: none (alliance exists but nothing to do together). 7. **Quit risk: MEDIUM** — economic monotony begins: production has no caps, no upkeep, no pressure; the pacing sim itself shows smooth monotonic growth with no bottlenecks (R3_PACING_SIMULATION.md) — comfortable but frictionless, and frictionless builders bore. 8. **Reign:** upkeep/storage pressure begins biting; troop scale is growing toward the first 1000+ army; camp farming is a rhythm.

### First day
1. Goal: Marcher Keep founding; expedition. 2. Decisions: expedition timing. 3. Approaching: Brinehold. 4. Anticipation: expedition completion → bond. 5. Uncertainty: none left — ladder is fully legible. 6. Social: alliance chat, if joined. 7. **Quit risk: HIGH** — the certified ladder *ends* here for practical purposes; daily quests (3) + clue cap (3/day) are the only return hooks. 8. **Reign:** event quest of the day, dragon armor grind, next outpost on the horizon (outposts = "the bulk of the content"), alliance activity. Reign's day-1 is a *week* of DW content.

### Day 3
1. Goal: Brinehold → charter ladder. 2. Decisions: which citadel next. 3. Approaching: Stonekeel. 4. Anticipation: exclusive units (thin). 5. Uncertainty: none. 6. Social: reinforcements possible. 7. **Quit risk: VERY HIGH — cliff #1.** Content: 10 camps (cleared), 1 expedition (done), 9 bestiary entries (seen), 4 wilderness bonuses (held). Camps never respawn. No events. No endgame. Nothing contests the player. 8. **Reign:** outpost #2-3 under way, dragon armor pieces dropping, event shop cycling, realm politics starting.

### Week 1
1. Goal: ladder completion (Stonekeel→Cinderreach→Galeari) — *if* the player is still here and the ordinary-player path works (critic P1: positive path beyond Brinehold lacks certified proof + persistence). 2. Decisions: dragon war plan spend (one-shot). 3. Approaching: BATTLE_READY — the ladder's literal end. 4. Anticipation: none defined past it. 5-6. Uncertainty/social: absent. 7. **Quit risk: TOTAL without social binding.** 8. **Reign:** second outpost dragon, first realm-war season, 100K-march economics, Fortuna/chest loops.

### Week 2
DW: undefined. There is no system, goal, event, or conflict that exists at week 2. The strongest real hook — alliance war — does not exist (preservation ledger: DEFERRED). **This is the second cliff: not a weak system but an ABSENT one.**

### Month 1
DW: undefined. Reign: realm dominance competition, seasonal events (Hanami Apr–May, Summer Jul 2026 with minigame + leaderboard — wiki Events), L11 Fortress/L15 fields arcs, dragon armor completion, alliance wars. `VERIFIED` (wiki) that Reign's month-1 is structured; player *engagement* there is `UNVERIFIED`.

## Retention cliffs (ranked)

| # | Cliff | Evidence | Fix direction |
|---|---|---|---|
| 1 | **Post-ladder vacuum (day 2-3):** finite PvE (10 camps, no respawn), one expedition, no events, no goals past Galeari | content JSONs; no-respawn code-verified; pacing sim horizon table | Camp respawn + repeatable goal generator (dailies/weeklies tied to real systems) |
| 2 | **No conflict pressure anywhere:** wildernesses uncontested, PvP loot-thin, no territory | code: no raiding of claims; PvP plunder rates vs production | Territorial stakes + better plunder economics |
| 3 | **Presentation fails the fantasy at the moment of judgment (30-min):** glyph city, flat map, invisible dragons | e2e screenshots (alpha-r1) | Production art pass on city + map + dragon reveal moment |
| 4 | **Scale too small to care about:** 500-march, 2K-population losses don't hurt; Reign's 100K scale creates weight | screenshots vs wiki Quests tiers | Economic/military rescale (with upkeep to make mass matter) |
| 5 | **No social gravity:** alliance has no win/lose object; nothing generates rivalries | code (no objectives/territory); preservation ledger DEFERRED | Minimum alliance-war loop (see strategy doc) |
| 6 | **Daily loop too thin:** 3 dailies + 3 clue caps ≈ minutes/day | code (daily quest set; clue cap) | Daily/weekly cadence tied to camps, bestiary, alliance |

## What Reign provides at each horizon that DW does not (summary)

Constant one-shot quest-reward cascade (day 0); visible battlefields and first dragon in the egg (30 min); upkeep/storage economic pressure (2 hrs); outposts as multi-day arcs (day 1-3); dragon armor grind + event shop (week 1); realm-scale war and seasonal events (week 2+). Dragon Wake's *architecture* could generate most of these by configuration; the missing pieces are content cadence, conflict stakes, and scale.

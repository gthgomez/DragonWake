# Feature Matrix — four-dimension model

Status: **LIVING INSTRUMENT** — update in place. Scores are 0–5 using the
**anchored rubric below** (do not improvise private scales); dimension
definitions are in
[`../../product/COMPETITIVE_PRODUCT_LAB.md`](../../product/COMPETITIVE_PRODUCT_LAB.md)
§5. Different agents must produce consistent scores; a score without a
one-line justification citing evidence is invalid.

## Anchored 0–5 rubric (v1.1, 2026-09-05)

General anchors:

- **0 — absent** · **1 — stub** (barely functional or perceivable) ·
  **2 — basic** (works, clearly immature) · **3 — functional and
  acceptable** · **4 — strong / polished** · **5 — benchmark-quality or
  distinctive**

Dimension-specific anchors:

| Score | Mechanical Depth | Player Visibility | Presentation | Motivation |
| --- | --- | --- | --- | --- |
| **0** | No gameplay functionality at all | Player cannot access or discover it | No visual identity; invisible or raw data | No reason to engage |
| **1** | Stub: a button exists, barely does anything | Exists but effectively hidden (buried tab, no entry point) | Text-only or placeholder visuals; no fantasy | Incentive exists only in theory |
| **2** | Basic loop works; clearly incomplete content/options | Discoverable with effort; unclear language | Rendered but generic; does not communicate importance | Weak payoff; engagement feels like a chore |
| **3** | Functional and acceptable for the current scope | Normal player can find and understand it | Coherent and thematic; communicates its role | Reasonable payoff; player understands why to engage |
| **4** | Strong: depth, options, and interactions hold up under use | Clearly surfaced and contextually explained in-flow | Polished; communicates importance and fantasy at a glance | Compelling loop the player chooses to return to |
| **5** | Benchmark-quality depth a competitor would envy | Exceptionally intuitive; integrated into progression so it teaches itself | Distinctive; memorable; defines the game's identity | Creates pull — anticipation of the next engagement |

Rules:

- Score from **evidence** (white-box inventory for Mechanical Depth;
  blind-playtest/rendered observation for Visibility, Presentation,
  Motivation), with a one-line justification per score.
- When evidence spans classes, the lower-confidence evidence caps the
  score you may claim (see claim evidence rules in the Lab).
- Prioritization scores in the Lab §11 are separate **qualitative
  ordinals**, not this rubric.

Rule of the model: **a mechanically sophisticated feature can contribute
almost nothing to perceived game quality if presentation, visibility, or
motivation are poor.** The score gaps between columns are the actionable
signal.

## Scoring pass v1 — 2026-09-14 (`2d4e422`)

Status: **first pass scored at Gate 3.** Mechanical Depth from the white-box
inventory; Player Visibility / Presentation / Motivation from the Gate 2
blind run + Class A captures. Evidence: `RUN 20260914-0405-synthA-gate2-ftue`
([`../audits/blind-playtest.md`](../audits/blind-playtest.md),
[`../audits/dragonwake-current-product.md`](../audits/dragonwake-current-product.md)).
Justifications are in the Gate 3 audit; this table is the durable record.

| System | Mechanical Depth | Player Visibility | Presentation | Motivation | Evidence |
| --- | --- | --- | --- | --- | --- |
| Castle (construction) | 4 | 4 | 3 | 3 | Gate 2 00:50-02:00; Gate 3 audit |
| Lands | 3 | 4 | 3 | 3 | Gate 2 02:20-02:50 |
| Realm (map/travel) | 3 | 4 | 3 | 3 | Gate 2 05:00-05:30 (rated strongest surface) |
| War (marches/combat) | 4 | 3 | 3 | 3 | Gate 2 09:00-12:20 |
| Combat reports | 4 | 2 | 3 | 3 | Gate 2 09:30, 12:20 |
| Research (Knowledge/Studies) | 3 | 3 | 2 | 2 | Gate 2 03:10-03:40 |
| Troop training | 3 | 3 | 2 | 2 | Gate 2 04:00, 08:00, 21:00 (product-blocking) |
| Alliance / chat | 2 | 2 | 1 | 1 | Gate 2 18:00-18:30 |
| Dragon Presence lifecycle | 4 | 4 | 3 | 3 | Gate 2 03:15, 04:00, 20:30 |
| Bestiary / clues | 3 | 4 | 2 | 2 | Gate 2 12:40 |
| Dragon Expedition / charter | 4 | 2 | 2 | 3 | Gate 3 inventory (not reached in the 23-min run) |
| Quests / objectives | 4 | 5 | 3 | 4 | Gate 2 01:15 onward; ladder reached 7/10 |
| Progression rewards | 2 | 3 | 2 | 2 | Gate 2 04:30; Gate 3 inventory |
| Player identity | 2 | 3 | 2 | 2 | Gate 2 00:50; Gate 3 inventory |

Read: Mechanical Depth averages 3.2, Presentation 2.3. The
Visibility/Presentation/Motivation gaps below Mechanical Depth are the
productization signal (see Gate 3 audit). Scores are synthetic + white-box
evidence; a human pass may revise Motivation.

## Scoring pass v2 — remediation delta — 2026-09-14 (`fix/audit-remediation` off `67ab23a`)

Status: **delta pass at the remediation head.** Evidence is a
`DEVELOPER_REVIEWER` rendered pass (before `/tmp/opencode/dw-fix/before/**`,
after `/tmp/opencode/dw-fix/after/**`) plus the white-box changes; it is
**not** a blind or human playtest, so Visibility/Presentation may move but
Motivation stays capped by the Gate 2 synthetic evidence until the Gate 7
human replay. New rows (Shop, Upkeep) were absent from v1 because the shop
was out of scope and upkeep was Castle-tile-only. Only newly-scored or
changed rows are listed, plus two rows explicitly retained as unchanged where
a reviewer might otherwise expect movement.

| System | Mechanical Depth | Player Visibility | Presentation | Motivation | One-line justification (evidence) |
| --- | --- | --- | --- | --- | --- |
| **Shop (Steward's Wares / Dracoliths)** | 2 | 3 | 2 | 1 | Four convenience wares, no IAP, 4/day faucet; v2 adds in-panel earn-path copy, a link to Daily Deeds, and shortfall/progress text, so it is discoverable, but the first purchase is still ≥5 days away and no human has tested pull |
| **Food upkeep (garrison + HUD visibility)** | 3 | 3 | 2 | 2 | Soft garrison upkeep + Rationing exist; v2 adds a persistent topbar ledger (production / upkeep / net + low-food warning) on every tab and Lands upkeep context, so it is no longer Castle-tile-only; marching upkeep unchanged |
| Troop training | 3 | 4 | 3 | 2 | v1 3/2: disabled Train now states cost/shortfall in place instead of only a `title` (F6); the Gate 2 product-blocker is resolved in the rendered pass, Motivation pending human replay |
| Research (Knowledge/Studies) | 3 | 4 | 3 | 2 | v1 3/2: a running research job shows target level + ETA and completion shows a "Last completed" result at the Studies list (F6) |
| Alliance / chat | 2 | 3 | 2 | 1 | v1 2/1: empty state, auto-loaded banner list, and a rank-sorted member roster (F5), with the shared-intel raw-JSON leak removed (D1); there is still no social activity loop, so Motivation stays 1 |
| Combat reports | 4 | 2 | 3 | 3 | Unchanged from v1: credible reports remain buried in War and report-surfacing was not part of this pass; War scout/dispatch intel no longer dumps raw JSON for `empty`/`coords` kinds (D1) |
| Realm (map/travel) | 3 | 4 | 3 | 3 | Unchanged from v1; v2 only adds tile-selection auto-scroll to the existing detail + composer (F4), which is a navigation aid, not a new score claim |
| Progression rewards | 2 | 3 | 3 | 2 | v1 3/2: Daily Deeds now feed a visible shop earn/progress meter and the Dracolith is named as earned currency (F1/F7) |

Read: the v2 changes are **action-legibility** fixes (availability, cost,
result attribution, discoverability), not new mechanics — Mechanical Depth
is unchanged everywhere. The signal is a Visibility/Presentation lift on
training, research, alliance, and rewards, with Motivation still requiring a
human replay (Gate 7) to certify. Two balance questions (marching upkeep,
Dracolith faucet) are **not** scored here; they are owner decisions in
[`../../proposals/AUDIT_REMEDIATION_DECISIONS.md`](../../proposals/AUDIT_REMEDIATION_DECISIONS.md).

Optional extension columns where useful: Content Depth, Feedback,
Progression Integration, Social Value, Retention Value.

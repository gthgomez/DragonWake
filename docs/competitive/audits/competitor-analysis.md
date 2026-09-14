# Audit — Competitor Analysis (Synthesis)

Status: **Gate 4 PARTIAL RUN — 2026-09-14 (`2d4e422`).** Gate 2 (blind
playtest) and Gate 3 (white-box audit) are complete; **Gate 1 (competitor
evidence) is NOT STARTED**, so the competitor half of this synthesis is
absent by design rather than omitted by accident. The reconciled picture
below is therefore **product-internal**; matched visual benchmarks
([`../matrices/visual-benchmark-matrix.md`](../matrices/visual-benchmark-matrix.md))
remain unfilled until Gate 1 runs. Do not cite competitor claims from this
document.

Role: Product Synthesizer
([`../../product/prompts/product-synthesizer.md`](../../product/prompts/product-synthesizer.md)).

Evidence base: [`blind-playtest.md`](blind-playtest.md) (Gate 2, `SYNTHETIC_AGENT`),
[`dragonwake-current-product.md`](dragonwake-current-product.md) (Gate 3,
`DEVELOPER_REVIEWER`), [`../matrices/feature-matrix.md`](../matrices/feature-matrix.md).

---

## Reconciled picture

Gate 2 says a normal player can **discover and run the core loop unaided**:
the objective ladder carries them from a first build through lands, research,
training, a scout, a decisive camp attack, and a legible battle report, and
they can read the world map. Gate 3 confirms the machinery behind all of it
is real (mechanically ~3.2/5 average).

Gate 2 also says the player repeatedly **cannot tell why an action is
unavailable or where its result went** — and the one system the game is named
for reads as *bookkeeping*. Gate 3 traces this to a consistent root-cause
cluster (Lab taxonomy 5/6/9: lacks visualization, lacks feedback, IA/wording),
not to missing systems. That is the productization gap in its purest form:

> **Implementation provides** a dragon-framed kingdom-builder with a real
> economy, combat, and knowledge model. **The player perceives** a competent
> medieval builder whose dragon exists only as evidence cards, and whose
> controls sometimes go dead without explanation.

## Productization gap (named, per system)

| System | Implementation provides | Player perceives | Gap | Root cause |
| --- | --- | --- | --- | --- |
| Muster / march controls | Full capacity/manpower rules, two-step confirm, composer math | Dead buttons; a confirm that looks like a failed click; an overlap that eats input | Control state and result are not expressed where the player is looking | 6 / 10 |
| Combat & reports | Rounds, losses, spoils, scout intel, Scar narrative | A good report, but found only by opening War; victory arrives as a toast | Result attribution | 3 / 6 / 9 |
| Dragon surfaces | Presence states, Bestiary, clues, expedition, living dragons | "Bookkeeping" — text evidence cards; dragon never appears or moves | Visualization | 5 / 8 |
| Research / Knowledge | Levels, gates, dragon readiness, Scribe's Table | A hub with dense text; actual research is on Castle; gate messages unnamed | IA / wording | 9 |
| Alliance | Create/join/chat/shared intel | A form with no members, no list, no empty state | Content / IA | 4 / 9 |
| Economy & queues | Production, jobs, marches with ETAs | Only visible on Castle/Lands; queues render below page content | Visibility / IA | 5 / 9 |
| Quests / progression | Server-verified 10-step ladder | The clearest, most motivating surface in the game | (strength — no gap) | — |
| Rewards | Daily deeds + Dracoliths (renamed to Dracoliths 2026-09-14) | Small numbers with no shop to spend on | Motivation | 4 |

## Why DragonWake feels like a systems prototype

Across the Gate 2 language: **fantasy** is carried by copy and framing but not
by presence (no motion, scene, or sound around the dragon); **feedback** is
transactional (toasts) rather than situated; **presentation** is text-first
where it matters most (Knowledge, dragon evidence); **social presence** is
effectively empty; and **reward** cadence is thin. None of these require new
mechanics — the Lab's exact predicted pattern ("often the highest-value
intervention is exposing, visualizing, or pacing systems that already exist").

## Vertical slice candidates scored

Ordinal 1–5 (1 minimal · 3 moderate · 5 maximal), per Lab §11. Opportunity is
the §11 heuristic (a reasoning aid, not a verdict).

| Candidate | Impact | Retention | Fantasy | Compet.Nec. | Eng.Cost | Asset Cost | Risk | Opportunity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **A. Action Legibility** (availability + cost + confirm + result attribution) | 5 | 4 | 2 | 4 | 2 | 1 | 1 | **3.75** |
| D. Castle first-session presentation (city first, progressive disclosure) | 4 | 3 | 3 | 3 | 2 | 1 | 2 | 2.60 |
| B. Combat & battle-report moment | 4 | 3 | 4 | 4 | 3 | 3 | 2 | 1.88 |
| G. Accessibility / mobile polish (contrast, targets, labels) | 4 | 3 | 1 | 3 | 3 | 1 | 2 | 1.83 |
| E. First dragon moment (Scar result card, hatchling reveal) | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 1.67 |
| C. Command & queue HUD (sticky, cross-tab) | 4 | 3 | 2 | 4 | 4 | 1 | 3 | 1.63 |
| F. Asset pipeline hardening (matte, WebP, responsive) | 3 | 2 | 3 | 4 | 3 | 4 | 3 | 1.20 |

## Recommended slice + before/after evaluation plan

### Slice A — "Action Legibility: availability, cost, confirmation, result attribution"

Selected over the higher-raw-impact candidate E because it removes one
**product-blocking** and four **major** blind findings at low cost/risk, is
finishable, and is a prerequisite for retaining the players who would ever
reach the dragon moment. Candidate E is the recommended **next** campaign
(headline: make the dragon a presence, not a ledger).

Scope (bounded):

1. **One availability pattern.** Every action control (build, research, muster/Train, march send/claim/scout, Dragon Watch) renders its state inline: *ready*, or *needs &lt;study/commanders&gt;*, or *needs &lt;resource&gt; (have X / need Y)*, or *add a company first*. No reason lives only in a `title` (`CastleView.tsx:641-653`, `RealmView.tsx:515-575`).
2. **Visible costs / time** for research and training (replace `title`-only costs).
3. **Explicit confirm state** — the two-step confirm highlights the button and shows a "tap again to confirm" cue, not just a relabel (`RealmView.tsx`).
4. **Result attribution** — when a march lands, surface the outcome at the source (Realm tile panel) with a "View report" link; keep the War badge (`useGame.ts:315-360`).
5. **Name the gate** — building/research gates say the required study ("requires Dragon Studies 1").
6. **Friendly state words** for dragon lifecycle/roost/bestiary enums (`CastleView.tsx:232,290`; `KnowledgeView.tsx`).

Explicitly out of scope: new mechanics, canon/content changes, the combat
visual redesign (candidate B), the dragon spectacle (candidate E), and
Alliance content.

### Before/after evaluation plan

- **Baseline (done):** Class A captures `delivery/evidence/20260914-0405-synthA-gate2-ftue/screenshots/` (16, desktop+mobile) and the blind run (`.../screenshots/blind/`, 45). This is the "before" pair source.
- **Implement** the slice through the normal engineering gates (one vertical slice only).
- **Replay** the same FTUE journey via a Playwright structural test (extend `apps/web/e2e/`), same viewports, capture the same surfaces to `delivery/evidence/<new RUN_ID>/`.
- **Re-run a fresh blind session** (Gate 7) with the same protocol; do not reuse this evaluator.
- **Verdict (Gate 8):** IMPROVED / NOT IMPROVED / UNVERIFIABLE, with before/after pairs and these diagnostics: count of controls disabled-without-reason (target 0), count of raw enum leaks (target 0), time/clicks to find a march result, and blind friction counts by severity.
- **Promote** only the captures the verdict depends on to `docs/competitive/evidence/dragonwake/` (`YYYY-MM-DD_<surface>_<viewport>_{before,after}.png`, each referencing its RUN_ID).

## Open dependencies

- **Gate 1 (competitor evidence)** must run before any competitor-relative
  claim or matched visual benchmark is published.
- **Human playtest** required before any fun/retention verdict; this run is
  synthetic only.
- Candidate E (first dragon moment) should be scoped as the follow-on once A lands.

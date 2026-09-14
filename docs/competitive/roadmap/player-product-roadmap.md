# Player Product Roadmap — DoA → Reign → DragonWake → Vertical Slice

Status: **CURRENT CAMPAIGN PLAN** — prepared 2026-09-05 by the Competitive
Product Lab preservation task. Gates execute in order; do not jump to
implementation.

Method: [`../../product/COMPETITIVE_PRODUCT_LAB.md`](../../product/COMPETITIVE_PRODUCT_LAB.md).
This file tracks gate status; findings land in the audits and matrices.

## Gate sequence

| Gate | Deliverable | Where it lands | Status |
| --- | --- | --- | --- |
| **1 — Competitor evidence** | DoA claims extended beyond the reference model; Reign claims from real sources | [`../sources/dragons-of-atlantis.md`](../sources/dragons-of-atlantis.md), [`../sources/reign-of-atlantis.md`](../sources/reign-of-atlantis.md) | **PARTIAL** 2026-09-14 — upkeep topic only: DoA claims `DOA-ECON-002..005` + cross-game [`../sources/upkeep-genre-survey.md`](../sources/upkeep-genre-survey.md). Reign and all other topics still pending. |
| **2 — Blind DragonWake playtest** | FTUE playtest, repository-isolated, with run manifest, EXPERIENCE TRACE + captures, `EVALUATOR_CLASS: SYNTHETIC_AGENT` | [`../audits/blind-playtest.md`](../audits/blind-playtest.md) | **DONE** 2026-09-14 (`2d4e422`) — synthetic; human session still required |
| **3 — Repository reconciliation** | Root-cause classification + four-dimension scores for every Gate-2 deficiency | [`../audits/dragonwake-current-product.md`](../audits/dragonwake-current-product.md), [`../matrices/feature-matrix.md`](../matrices/feature-matrix.md) | **DONE** 2026-09-14 — taxonomy 6/9 dominant; scores v1 land |
| **4 — Product synthesis** | Reconciled gap; matrices updated; slice candidates scored | [`../audits/competitor-analysis.md`](../audits/competitor-analysis.md), [`../matrices/experience-matrix.md`](../matrices/experience-matrix.md), [`../matrices/visual-benchmark-matrix.md`](../matrices/visual-benchmark-matrix.md) | **PARTIAL** 2026-09-14 — product-internal only; competitor half pending Gate 1 |
| **5 — Vertical slice selection** | ONE slice passing the before/after screenshot test; before/after evaluation plan | this file + [`../audits/competitor-analysis.md`](../audits/competitor-analysis.md) | **DONE** 2026-09-14 — **Slice A: Action Legibility** selected |
| **6 — Implementation** | The slice only, through the normal engineering gates | repo | **NOT STARTED** |
| **7 — Replay** | Same player workflow re-run; updated captures | [`../audits/blind-playtest.md`](../audits/blind-playtest.md) (new dated section) | **NOT STARTED** |
| **8 — Before/after verdict** | IMPROVED / NOT IMPROVED / UNVERIFIABLE with capture pairs | [`../audits/competitor-analysis.md`](../audits/competitor-analysis.md) + `delivery/evidence/` | **NOT STARTED** |

### Gate 2-5 outcome (2026-09-14)

Blind session `20260914-0405-synthA-gate2-ftue` (23 min, 1440x900, synthetic)
reached objective 7/10 and readiness 1/5; trace in
[`../audits/blind-playtest.md`](../audits/blind-playtest.md). Root causes
concentrated in taxonomy 6 (`LACKS_FEEDBACK`) and 9 (`IA`), with the core loop
otherwise discoverable and mechanically sound. One **product-blocking**
finding (Train disabled with no reason) and five **major** findings drove the
selection of **Slice A — Action Legibility** (availability + cost +
confirmation + result attribution) over higher-raw-impact but costlier
fantasy work; the first-dragon-moment slice is the recommended follow-on.
Baseline captures: `delivery/evidence/20260914-0405-synthA-gate2-ftue/`.

Deviation: Gate 1 did not run, so Gate 4 is product-internal and
competitor-relative conclusions are deferred.

## Constraints on this campaign

- No gameplay rewrite, no speculative feature batches.
- Design canon is frozen: anything direction-touching routes through
  [`../../design/CANON_AUTHORITY.md`](../../design/CANON_AUTHORITY.md).
- The two already-approved campaigns in
  [`../../CURRENT_STATE.md`](../../CURRENT_STATE.md) (Visual Identity +
  Sprite/UI Polish; First Watch playtest & game-feel) are **compatible**
  with this roadmap: this campaign supplies the evidence and
  prioritization those campaigns execute against. If evidence selects a
  slice that conflicts with an approved campaign's scope, resolve in the
  authority stack before implementing.
- Hypotheses to test (not conclusions): text-heavy surfaces, weak visual
  reward, prototype-like panels, abstract Realm tile matrix, sparse
  Alliance social presence, research as button grid, weak progression
  distinctness, thin player identity, weak reward presentation, weak
  first-session dragon fantasy.

# Player Product Roadmap — DoA → Reign → DragonWake → Vertical Slice

Status: **CURRENT CAMPAIGN PLAN** — prepared 2026-09-05 by the Competitive
Product Lab preservation task. Gates execute in order; do not jump to
implementation.

Method: [`../../product/COMPETITIVE_PRODUCT_LAB.md`](../../product/COMPETITIVE_PRODUCT_LAB.md).
This file tracks gate status; findings land in the audits and matrices.

## Gate sequence

| Gate | Deliverable | Where it lands | Status |
| --- | --- | --- | --- |
| **1 — Competitor evidence** | DoA claims extended beyond the reference model; Reign claims from real sources | [`../sources/dragons-of-atlantis.md`](../sources/dragons-of-atlantis.md), [`../sources/reign-of-atlantis.md`](../sources/reign-of-atlantis.md) | **PARTIAL** 2026-09-14 — upkeep topic (DoA `DOA-ECON-002..005` + [`../sources/upkeep-genre-survey.md`](../sources/upkeep-genre-survey.md)) **plus a second partial topic set** — shop currency/earn path, notification UX, first-dragon reveal in [`../sources/shop-and-first-dragon.md`](../sources/shop-and-first-dragon.md). Reign and remaining topics still pending. |
| **2 — Blind DragonWake playtest** | FTUE playtest, repository-isolated, with run manifest, EXPERIENCE TRACE + captures, `EVALUATOR_CLASS: SYNTHETIC_AGENT` | [`../audits/blind-playtest.md`](../audits/blind-playtest.md) | **DONE** 2026-09-14 (`2d4e422`) — synthetic; human session still required |
| **3 — Repository reconciliation** | Root-cause classification + four-dimension scores for every Gate-2 deficiency | [`../audits/dragonwake-current-product.md`](../audits/dragonwake-current-product.md), [`../matrices/feature-matrix.md`](../matrices/feature-matrix.md) | **DONE** 2026-09-14 — taxonomy 6/9 dominant; scores v1 land |
| **4 — Product synthesis** | Reconciled gap; matrices updated; slice candidates scored | [`../audits/competitor-analysis.md`](../audits/competitor-analysis.md), [`../matrices/experience-matrix.md`](../matrices/experience-matrix.md), [`../matrices/visual-benchmark-matrix.md`](../matrices/visual-benchmark-matrix.md) | **PARTIAL** 2026-09-14 — product-internal only; competitor-relative half still pending (Gate 1 only partially advanced) |
| **5 — Vertical slice selection** | ONE slice passing the before/after screenshot test; before/after evaluation plan | this file + [`../audits/competitor-analysis.md`](../audits/competitor-analysis.md) | **DONE** 2026-09-14 — **Slice A: Action Legibility** selected |
| **6 — Implementation** | The slice only, through the normal engineering gates | repo | **PARTIAL** 2026-09-14 — Slice A action-legibility fixes plus the 8-finding remediation pass implemented on `fix/audit-remediation` (off `67ab23a`); `pnpm -r typecheck`, web 27/27, server 214 pass (4 PostgreSQL skips), and the **full Playwright suite repeatably green** (20 passed / 1 skipped / 0 failed on consecutive persistent-DB runs), plus two extra defects found and fixed by the adversarial/polish passes (raw-JSON player-flow leaks; `alpha-r2` run-unique name + cross-settlement research keying) |
| **7 — Replay** | Same player workflow re-run; updated captures | [`../audits/blind-playtest.md`](../audits/blind-playtest.md) (new dated section) | **PARTIAL** 2026-09-14 — a `DEVELOPER_REVIEWER` rendered pass verified the fixes against the same workflow; a **human blind replay is still required** (no new `HUMAN_PLAYER` / `SYNTHETIC_AGENT` blind session was run) |
| **8 — Before/after verdict** | IMPROVED / NOT IMPROVED / UNVERIFIABLE with capture pairs | [`../audits/competitor-analysis.md`](../audits/competitor-analysis.md) + `delivery/evidence/` | **PENDING** 2026-09-14 — before/after captures exist locally in `/tmp/opencode/dw-fix/{before,after}`; the IMPROVED / NOT IMPROVED / UNVERIFIABLE verdict is withheld until the Gate 7 human replay, and no pair is promoted to `delivery/evidence/` yet |

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

Deviation: Gate 1 was only partially advanced (upkeep + the
shop/notification/first-dragon survey), so Gate 4 remains product-internal
and competitor-relative conclusions are deferred.

### Remediation pass (2026-09-14, `fix/audit-remediation` off `67ab23a`)

The Gate 5 slice (Action Legibility) plus the remaining Gate 3 findings were
implemented in one pass. Dispositions, all rendered-verified by a
`DEVELOPER_REVIEWER` (not a blind playtest):

| Finding | Disposition | Evidence |
| --- | --- | --- |
| F1 Shop dead on arrival | **Fixed (UX)** — earn-path copy, Daily Deeds link, affordability progress; faucet/price untouched | `ShopPanel.tsx`, `labels.ts`; [`../audits/dragonwake-current-product.md`](../audits/dragonwake-current-product.md) remediation section |
| F2 Upkeep visibility | **Fixed (visibility)**; marching-upkeep rule **decision-pending** | `Shell.tsx`, `hooks/useGame.ts`, `LandsView.tsx`, `styles/remediation-hud.css` |
| F3 Toast overlap | **Fixed** — in-flow rail, cap 3, 4 s TTL, deduped, `pointer-events:none` | `Shell.tsx`, `hooks/useGame.ts`, `styles/remediation-hud.css` |
| F4 Realm composer below map | **Fixed** — tile selection auto-scrolls detail + composer into view | `RealmView.tsx`, `styles/remediation-realm.css` |
| F5 Alliance skeletal | **Fixed** — empty state, auto-loaded banner list, member roster | `AllianceView.tsx`, `styles/remediation-social.css` |
| F6 Research/build mute | **Fixed (feedback)**; blocking build confirm deferred for E2E compatibility | `CityGrid.tsx`, `CastleView.tsx`, `styles/remediation-castle.css` |
| F7 Currency naming | **Fixed** — Dracolith vs Crownmarks explained; ware effect sentences | `labels.ts`, `ShopPanel.tsx`, `CastleView.tsx` |
| F8 Dragon is a card | **Spec-only** — reveal slice specified, not implemented | [`../../proposals/UX_REMEDIATION_PLAN.md`](../../proposals/UX_REMEDIATION_PLAN.md) §F8; [`../sources/shop-and-first-dragon.md`](../sources/shop-and-first-dragon.md) Topic C |

Beyond the eight findings, the adversarial/polish passes demonstrated and
fixed two additional defects: **raw-JSON leaks in the player flow** (Alliance
shared intel and War scout/dispatch intel now use `formatIntel()` / the
server-authored `summary`, not `JSON.stringify`), and **test-hygiene +
cross-settlement state** (`alpha-r2-awakening` now uses a run-unique display
name; `CastleView`'s research status is keyed to `city.id`). Full Playwright
suite is repeatably green (20 passed / 1 skipped / 0 failed on consecutive
runs against the persistent DB) — see
[`../audits/dragonwake-current-product.md`](../audits/dragonwake-current-product.md)
and `/tmp/opencode/dw-fix/notes/verify.md`.

Two balance decisions (marching-army upkeep, Dracolith faucet) remain open
pending owner ratification — see
[`../../proposals/AUDIT_REMEDIATION_DECISIONS.md`](../../proposals/AUDIT_REMEDIATION_DECISIONS.md).
Gate 7 human replay and the Gate 8 verdict stay open.

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

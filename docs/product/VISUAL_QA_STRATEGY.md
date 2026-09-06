# Visual / Browser QA Strategy

Status: **CURRENT AUTHORITY** — how DragonWake uses screenshots and browser
tests for product quality. Companion to
[`COMPETITIVE_PRODUCT_LAB.md`](COMPETITIVE_PRODUCT_LAB.md).

## Three different instruments — do not conflate

| Instrument | Purpose | Stability bar | Cost of getting it wrong |
| --- | --- | --- | --- |
| **A. Product reference captures** | Human/vision comparison; competitor benchmarking; before/after evidence | None — capture whatever exists, honestly | Low |
| **B. Visual regression tests** | Detect *unintended* changes once a design is intentional | Only for frozen/intentional presentation | High — pixel tests on unstable prototype screens are brittle noise |
| **C. Structural browser tests** | Verify interaction, flow, and accessibility behavior | Existing certified journeys | Medium — churns with intentional redesigns |

Current stack (verified 2026-09-05, `apps/web/playwright.config.ts`):
Playwright 1.55, `baseURL http://localhost:5173`, auto-started server+web
(`DEV_FAST_TIME=1`), `screenshot: only-on-failure`, `trace:
retain-on-failure`, `video: off`, single worker.

Existing structural browser tests (class C) live in `apps/web/e2e/`:
`closed-mockup-v1.spec.ts` (the certified player journey),
`alpha-r1.spec.ts`, `alpha-r2-awakening.spec.ts`, `campaign-r1.spec.ts`,
`r3-alliance-intel.spec.ts`, `r3-empire-depth.spec.ts`,
`r3-responsive-depth.spec.ts`.

## Class A — canonical product reference captures

Capture honest screenshots at standard viewports. **Storage split**
(authoritative policy:
[`../competitive/evidence/README.md`](../competitive/evidence/README.md)):
raw run captures go to `delivery/evidence/<RUN_ID>/` (manifest tracked,
binaries usually local); only captures a verdict depends on are promoted
to `docs/competitive/evidence/dragonwake/`, each referencing its
`RUN_ID`.

- Viewports: desktop **1440×900** (repo-standard desktop) and one
  representative mobile viewport (use the same one
  `r3-responsive-depth.spec.ts` uses).
- Surfaces: Castle, Lands, Realm, War, Alliance, Knowledge, dragon
  surfaces (Bestiary/Presence/Expedition), construction state, research,
  troop management, combat report, quest/objective state, reward state.

Name captures `YYYY-MM-DD_<surface>_<viewport>.png` so before/after pairs
sort naturally. Captures feed the Screenshot Test
([`COMPETITIVE_PRODUCT_LAB.md` §6](COMPETITIVE_PRODUCT_LAB.md)) and the
matched benchmark matrix
([`../competitive/matrices/visual-benchmark-matrix.md`](../competitive/matrices/visual-benchmark-matrix.md)).

## Class B — visual regression

Do **not** add pixel-perfect tests for unstable prototype surfaces. Add
them only when a presentation contract is frozen (precedent:
[`../design/CLOSED_MOCKUP_V1.md`](../design/CLOSED_MOCKUP_V1.md) and
[`../design/ALPHA_VISUAL_CONTRACT_V1.md`](../design/ALPHA_VISUAL_CONTRACT_V1.md)
define intentional design). When adding: `expect(page).toHaveScreenshot()`
with per-surface maxDiffPixelRatio, desktop viewport only, and a comment
linking the governing contract.

## Class C — structural browser tests

New player-facing flows should extend the existing Playwright journey
pattern (see `closed-mockup-v1.spec.ts`). For a new vertical slice, add a
journey that walks the changed flow through the real UI — this doubles as
the "replay" step of the before/after protocol. For session video on a
specific investigation, override per-test (`video: "on"` in test options)
rather than globally.

## When visuals change intentionally

1. Capture the **before** reference (Class A) first.
2. Implement.
3. Replay the flow; capture **after**.
4. Record the pair in the slice's audit file
   ([`../competitive/audits/`](../competitive/audits/)) with the
   before/after evaluation ([`COMPETITIVE_PRODUCT_LAB.md` §10](COMPETITIVE_PRODUCT_LAB.md)).
5. Only if the new look is contracted/frozen, add Class B coverage.

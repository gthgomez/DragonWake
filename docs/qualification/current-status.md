# Current status — main branch

> Scope: this file describes **current `main`** of DragonWake. It does not
> describe unmerged draft branches. In particular, PR #18
> (`feat/castle-north-star-v2`, "DRAFT: Castle North Star V2 — settlement
> scene compositor") is an **open draft**; its visual captures and scene work
> are **preview/draft only, not shipped**, and nothing on it certifies main.

## One-sentence identity

DragonWake is a multiplayer web MMORTS **prototype alpha**: an async
city-builder with map combat (settlement-first Castle, lands and research,
armies, scouting, marches and battle reports, wilderness claims, and a
dragon-driven expedition/charter progression), built on a TypeScript pnpm
monorepo (Vite + React web, Hono server, PostgreSQL persistence,
deterministic `resolveBattle` combat package).

## Status: prototype alpha (main)

- **What is implemented on main:** the full first-session player journey is
  implemented and driven end to end by the Playwright journey
  `apps/web/e2e/closed-mockup-v1.spec.ts` (onboard → build/upgrade → lands →
  research → train → scout → battle → occupy → Bestiary → expedition →
  charter → Marcher Keep → settlement switch). Source inspection at the
  recorded main head confirms the journey spec, the e2e suite
  (`apps/web/e2e/`), the combat package (`packages/combat`), content data
  including dragon expedition/bestiary content (`packages/content/data/`),
  and the server sim/API (`apps/server/src`).
- **What "alpha" means here:** the playable spine is real; depth systems
  (alliances social mechanics, haul UX, living-dragon breadth) are partial or
  pending, and no player-facing completeness is claimed. Player-facing work
  follows the
  [`docs/product/COMPETITIVE_PRODUCT_LAB.md`](../product/COMPETITIVE_PRODUCT_LAB.md)
  workflow.
- **Not beta.** No beta label is claimed: the multiplayer endgame, content
  breadth and visual polish required for a beta qualifier are not qualified.

## Evidence basis of this page

This status was written from source inspection of `main` at the head recorded
below, plus repository CI configuration — **not** from a fresh local runtime
qualification run. Run the suites yourself to confirm current behavior:

```powershell
pnpm install --frozen-lockfile
pnpm --filter @dragonwake/combat test
pnpm --filter @dragonwake/server test            # skips PG tests without a database; set REQUIRE_PG=1 with a reachable Postgres to fail hard instead
pnpm --filter @dragonwake/web build
pnpm -r typecheck
pnpm --filter @dragonwake/web exec playwright test   # requires `pnpm dev` running
```

No pass/fail totals are asserted on this page; totals go stale. CI
(`.github/workflows/ci.yml`) runs the server suite with `REQUIRE_PG=1`
against PostgreSQL 16, so persistence coverage is required there.

## Current main versus draft PR #18 — unmistakably distinct

| Surface | Current main | PR #18 (draft) |
|---|---|---|
| Settlement scene | Current Castle presentation per `docs/design/CLOSED_MOCKUP_V1.md` | Castle North Star V2 compositor — **draft, open, unmerged** |
| Visual captures | Any captures from main are current-main only | PR #18 captures are **preview/draft**; they do not certify main and are not shipped product imagery |

Main head at the time this page was last reviewed: `0ed592c26308c2307e09fc58971d9585bc3df681`
(2026-09-29). Update this pointer when the status is re-qualified.

## Open limitations (honest, current)

- Runtime UI/visual quality was not re-observed by a human in the review that
  produced this page; structural tests and source inspection only.
- The first-dragon reveal (F8) is spec-only
  ([`docs/design/DRAGON_ALPHA_PROOF_SLICE.md`](../design/DRAGON_ALPHA_PROOF_SLICE.md)
  and related design records), not implemented.
- Two balance decisions remain open pending owner ratification (marching-army
  upkeep; Dracolith faucet/first price) —
  `docs/proposals/AUDIT_REMEDIATION_DECISIONS.md`.
- A human blind replay per
  [`docs/competitive/audits/blind-playtest.md`](../competitive/audits/blind-playtest.md)
  is outstanding.

Historic certifications, branch campaigns and research provenance are kept as
dated records under [`../history/`](../history/README.md).

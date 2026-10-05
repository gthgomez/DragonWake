# 2026-08-30 — CLOSED_MOCKUP_V1 presentation closure campaign (historical record)

> **Status: historical.** Dated record of the CLOSED_MOCKUP_V1 campaign as it
> completed on 2026-08-30. Gate totals below describe that date's local runs
> and are retained as evidence only; they are not current status. See
> [`../qualification/current-status.md`](../qualification/current-status.md).

## Campaign summary

The CLOSED_MOCKUP_V1 presentation contract
([`docs/design/CLOSED_MOCKUP_V1.md`](../design/CLOSED_MOCKUP_V1.md)) was
implemented and closed as a campaign on 2026-08-30. The player journey it
describes — enter kingdom → settlement-first Castle with per-plot
build/upgrade → construction queue → Lands estate scene → research →
training → Realm drag/travel navigation → target panels → army composer →
scout → intelligence → march → battle report → wilderness claim →
Bestiary/dragon readiness → Dragon Expedition → settlement charter →
Marcher Keep founding → settlement switch → next objective — is implemented,
server-backed, and driven end to end by the Playwright journey
`apps/web/e2e/closed-mockup-v1.spec.ts`.

Highlights of that closure:

- **Castle**: world-first isometric settlement; empty plot → build cards with
  real costs/times from content; occupied plot → level/tier/effect/upgrade;
  construction scaffold + countdown on the plot; buildings visibly tier
  (stone → bronze → gold at L4/L7).
- **Authoritative building upgrade**: building on an occupied slot with the
  same type upgrades it (cost × next level, per-building cost/time in
  `buildings.json`); duplicate/mismatched/over-max attempts are rejected.
- **Building mechanics**: Barracks speed training, Scriptorium speeds
  research, Muster Yard speeds marches, Training Camp widens train queues,
  Watchtower deepens scout intelligence (exact troop counts at L3).
- **Realm**: drag-to-travel + coordinate jump (secondary), click target
  panels for camps/wilds/settlements, army composer with commander, strength,
  carry, march-time, and explicit launch confirmation.
- **Progression honesty**: objectives auto-complete only from verified server
  state; camp victories record Bestiary entries; clue grants feed distinct
  materials; the earned expedition charter authorizes Marcher Keep founding.
- **Language**: no API URLs, raw ids, UUID fragments, or server prose in the
  player flow; internal codes stay in console diagnostics.

Out of scope at closure: alliances depth (empty state + banner list + member
roster only, no new social mechanics) and haul UX.

CI runs the server suite with `REQUIRE_PG=1` against a PostgreSQL 16
service, so persistence coverage is required there, not optional. The
former Sovereign machinery was removed from live product paths (M4,
2026-08-27); only migration/history references remain.

## Gate totals as of 2026-08-30 (local runs)

| Gate | Status (local, 2026-08-30) |
|------|----------------|
| Combat + server suites | 134 passed, 3 skipped (PG persistence skipped while Postgres was down; fails hard with `REQUIRE_PG=1`) |
| Typechecks (5 packages) + web build | Green |
| Playwright baseline + CLOSED_MOCKUP_V1 journey | Green (journey ≈ 1–2 min under `DEV_FAST_TIME=1`) |

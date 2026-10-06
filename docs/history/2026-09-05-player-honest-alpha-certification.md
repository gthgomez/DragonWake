# 2026-09-05 — Player-honest alpha certification (historical record)

> **Status: historical.** This is a dated record of a certification performed
> against the head of PR #7 as merged on 2026-09-05. The numbers below were
> true at that point in time and are retained as evidence only. They are not
> the current status; see
> [`../qualification/current-status.md`](../qualification/current-status.md)
> for the current main-branch status and how to re-verify it.

The final resource domain at that point was Food, Wood, Stone, Ore, and
Crownmarks, with Dracoliths separate. Older aquatic and intermediate saves
were canonicalized at the persistence/input boundary. Relevant design
records: `docs/design/M2_FINAL_RESOURCE_CUTOVER.md` and
`docs/design/PAST_WORK_PRESERVATION_LEDGER.md`.

The certified build included a server-derived Dragon Presence lifecycle,
Castle-first presentation, an authoritative Dragon campaign objective ladder,
level-scaled wilderness benefits (production, logistics, scouting), and a
player-accessible Forest Frontier Charter route through the existing
settlement prerequisite chain — through Galeari, whose charter circularity
(Battle-ready required Galeari, which required Battle-ready) was broken at
the time and is now resolved: the top holding is reachable through earned
charters alone.

**Certified player-honest:** a fresh guest completed the full first-session
progression (onboard → build/upgrade → Lands → research → train → scout →
camp victories → dragon evidence and Knowledge progression → Dragon
Expedition → earned charter → found the Marcher Keep) through the real UI
only — no `/admin/grant`, no fixtures, no dev unlocks. Admin/dev tooling
remains for operators (admin-token gated in production, hidden dev panel).

## Verification at the merged head (2026-09-05)

- Combat: 20/20
- Server suite: 181/181 with `REQUIRE_PG=1` against live PostgreSQL
  (persistence including holding-ladder restart proven)
- Playwright: 12/12 covering the full journey plus desktop/tablet/mobile and
  the wilderness claim → abandon → re-claim cycle

Balance note recorded at the time: the level-2 camp pool no longer contained
the bowman-mirror composition that made the mandatory level-2 victory an
unrecoverable gamble for a fresh realm.

These totals describe that date's head only. Do not copy them into current
status documents; re-run the suites instead.

# 2026-09-14 — Audit remediation campaign (historical record)

> **Status: historical.** Dated record of the Competitive Product Lab
> remediation campaign that landed on branch `fix/audit-remediation`
> (2026-09-14, off `feat/imagine-alpha-city-pack` @ `67ab23a`) and has since
> been merged into main. Totals below describe that branch's runs at that
> date; they are not current status. See
> [`../qualification/current-status.md`](../qualification/current-status.md).

A Competitive Product Lab remediation pass addressed eight audit findings
without changing balance or content IDs:

- **Shop** — Steward's Wares is open and teaches that Dracoliths are earned
  (not bought) from the Daily Deeds, with a link to them and a per-item
  "You need N more Dracoliths" shortfall on blocked buys; no IAP and no
  faucet/price change.
- **Food upkeep** — soft army food upkeep exists, surfaced as a persistent
  topbar ledger (production / upkeep / net + low-food warning) on every tab,
  plus upkeep context on Lands. The marching-army upkeep rule is unchanged —
  it is one of two open owner decisions listed in
  `docs/proposals/AUDIT_REMEDIATION_DECISIONS.md` and `docs/CURRENT_STATE.md`.
- **Feedback and navigation** — toasts render in an in-flow, bounded notice
  rail (cap 3, 4 s TTL, `pointer-events: none`); selecting a Realm tile
  surfaces the detail + march composer; build/research show in-place results;
  Alliance has an empty state, auto-loaded banner list, and member roster;
  Dracolith vs Crownmarks naming is clarified.

Beyond those findings, the adversarial/polish passes removed raw-JSON leaks
from the player flow (Alliance shared intel and War scout/dispatch intel now
render the canonical formatted text / server summary) and made the `alpha-r2`
spec repeatable plus the Castle research status settlement-keyed.

Two balance decisions remained open pending owner ratification
(marching-army upkeep; Dracolith faucet/first price) — see
`docs/proposals/AUDIT_REMEDIATION_DECISIONS.md`. The first-dragon reveal (F8)
is **spec-only**, not implemented.

## Verification on the branch (2026-09-14)

- `pnpm -r typecheck` — green
- Web: 28/28
- Server: 214 tests (4 PostgreSQL skips)
- Playwright suite repeatably green (20 passed / 1 skipped / 0 failed on
  consecutive runs against the persistent DB)

A human blind replay was still required at that date (see
`docs/competitive/audits/blind-playtest.md`).

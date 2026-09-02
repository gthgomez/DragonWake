# R3 campaign progress evidence

This is an in-progress checkpoint, not a merge or final campaign verdict.

## Repository state

- Starting integration line: `codex/doa-parity-campaign`
- Starting observed head: `7feba552eb3b9d4f22c03b751476bf9ad506c530`
- Current head: unchanged; work is uncommitted and remains on the same branch.
- Preserved untracked user document: `DRAGON_WAKE_DOA_PARITY_IMPLEMENTATION_MASTER.md`.

## Implemented in this checkpoint

- Playwright starts `pnpm dev:web`, removing the redundant full dev-server tree.
- Watch Hill is scouting-only and no longer mints dragon material on occupation.
- Wilderness capacity is authoritative, Keep-scaled, and checked before troop deduction.
- Owners can abandon a wilderness holding through the authenticated API.
- Forge-Heart has a persistent upgrade action and its level scales frontier,
  operation, and march-size capacity.
- Building upgrades above the Keep-derived tier return an explicit `KEEP_GATE`.
- City DTOs and Castle UI expose Keep, wilderness, operation, and march capacity.
- City attacks generate departure-time defender warnings without troop leakage.
- Camp levels now expose canonical PvE mastery bands in scout intel and map data.
- `BATTLE_READY` now unlocks the resource-costed Dragon War Council, which
  persists a `dragon_war_plan` item and emits a player event.
- Alliance members now receive structured shared scout intelligence events.
- Added focused tests for Watch Hill, wilderness capacity, Keep gates, Muster
  capacity, and warning privacy.

## Verification

- Server TypeScript: pass.
- Web TypeScript: pass.
- `git diff --check`: pass.
- Active-code terminology audit: pass for legacy coin/kelp/drift identifiers in
  the audited server gameplay paths.
- Vitest and tsx runtime smoke attempts: blocked before test collection by
  host `spawn EPERM` during Vite/esbuild process resolution.
- Targeted Vitest retry: 3 files discovered, 0 tests collected, 3 identical
  `spawn EPERM` unhandled errors before collection.
- Full suite, PostgreSQL, browser, exact-head CI, critic review, and release
  state: not yet run in this checkpoint.

## Host guard

The guard's active state and evidence path were not directly confirmed. No
intentional Git/GPU stress or guard-triggering workload was run. The local
process restriction is recorded above and remains an open verification risk.

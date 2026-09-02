# R3 campaign progress evidence

This is an in-progress checkpoint, not a merge or final campaign verdict.

## Repository state

- Starting integration line: `codex/doa-parity-campaign`
- Starting observed head: `7feba552eb3b9d4f22c03b751476bf9ad506c530`
- Current head: `b7e87bd81607e00a6cdd0bf6d79040c7414ee56d` before the pending
  staged/unstaged R3 batches; work remains on the same branch.
- Preserved untracked user document: `DRAGON_WAKE_DOA_PARITY_IMPLEMENTATION_MASTER.md`.
- Live GitHub state is captured in `delivery/evidence/dragonwake-r2-live-state.json`;
  PR #7 remains open at the known R2 head, with successful exact-head CI but no
  independent review at that historical head. The current R3 review is captured
  in `delivery/evidence/dragonwake-r3-independent-critic.md`.

## Implemented in this checkpoint

- Playwright starts the explicit `pnpm --filter @dragonwake/web dev` command,
  removing the redundant full dev-server tree.
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
  persists a `dragon_war_plan` item and emits a player event; the plan now
  authorizes a single-use Wyrm-Scarred hunt and yields a hunt trophy.
- Alliance members now receive structured shared scout intelligence events.
- The Alliance view now retains and displays recent shared scout intelligence,
  including the structured intel payload rather than only a transient toast.
- Alliance leaders can now promote or demote members through a server-authoritative
  rank endpoint; non-leaders and non-members are rejected.
- Reinforcements now have a stationed, sender-attributed lifecycle with an
  authenticated recall action; leaving an alliance recalls affected stationed
  forces and in-flight delivery still rechecks membership at landing.
- Specialist unit rosters are now server-gated to their differentiated holding;
  researched units cannot be trained from the Capital.
- Brinehold Charter is now an ordinary research technology; later charter
  technologies reject premature research until world-earned prerequisites are
  present. Admin grants remain test/demo fixtures only.
- Added a deterministic seven-horizon pacing simulator and recovery/PvE-band
  report in `delivery/R3_PACING_SIMULATION.md`.
- Added focused tests for Watch Hill, wilderness capacity, Keep gates, Muster
  capacity, and warning privacy.
- Added a focused R3 browser journey for Keep, operations, wildlands, and PvE
  band surfaces.

## Verification

- Server TypeScript: pass.
- Web TypeScript: pass.
- `git diff --check`: pass.
- Active-code terminology audit: pass for legacy coin/kelp/drift identifiers in
  the audited server gameplay paths.
- Focused R3 suite: 8 files / 11 tests passed serially outside the sandbox.
- Holding capability regression: 1 test passed.
- Holding-chain prerequisite regression: 2 tests passed.
- Pacing simulation: 3 tests passed across seven horizons, four PvE bands, and
  six recovery mistakes.
- Dragon War Council/advanced hunt regression: 2 tests passed, including
  single-use plan consumption and idempotent landing.
- Wilderness resolution-race regression: 4 tests passed, including delayed
  claims against the authoritative capacity cap.
- Reinforcement lifecycle regression: 3 tests passed, including recall,
  non-member ownership protection, and receiver-leaves-alliance handling.
- Reinforcement API regression: 3 tests passed, including authenticated
  sender-only recall through the HTTP surface.
- Alliance rank regression: 1 test passed, covering leader authority and
  non-member rejection.
- Wilderness ownership-transfer regression: 3 tests passed in its focused
  suite.
- Current server-source suite: 20 files / 176 tests passed serially outside the
  sandbox, with 3 PostgreSQL tests skipped because localhost PostgreSQL is
  unreachable.
- Focused Alpha R2 Playwright journey: 1 test passed with 1 worker; the server
  and web processes started through separate configured commands.
- Focused R3 Playwright journey: 1 test passed with 1 worker; the new player
  surfaces were visible through exactly one configured server and one web
  process.
- Two-session Alliance Playwright journey: 1 test passed with 1 worker; a
  shared scout dispatch became visible in the receiving player's Alliance
  panel through two browser contexts.
- Initial sandboxed Vitest attempts were blocked before collection by host
  `spawn EPERM` during Vite/esbuild process resolution; elevated serial runs
  subsequently executed normally.
- The independent critic review is complete and recorded as
  `NOT_SAFE_TO_MERGE`; it identified open reinforcement lifecycle, persistence,
  browser-depth, alliance workflow, and positive holding-path gaps.
- PostgreSQL-dependent tests remain unavailable locally; the local suite
  reported three documented skips because localhost PostgreSQL was unreachable.
- Fresh exact-head CI for the current R3 head and release reconciliation remain
  outstanding.

## Known semantic gap

The current same-alliance reinforce primitive is an authoritative one-way
delivery into the target city's stack. Failed delivery returns the sender's
composition intact, and tests prove no loss or duplication on that path. It is
not yet a temporary stationed-garrison lifecycle with recall/owner records
across restart; this checkpoint does not claim full reinforcement parity.

## Host guard

The guard's active state and evidence path were not directly confirmed. No
intentional Git/GPU stress or guard-triggering workload was run. The local
process restriction is recorded above and remains an open verification risk.

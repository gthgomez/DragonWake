# Dragon Wake R3 campaign implementation report

## Current verdict

`R3_IMPLEMENTED_WITH_RELEASE_EVIDENCE_OPEN`

The R3 implementation is pushed on PR #7 at commit `1b3c1fa`. Exact-head
GitHub Actions run `33651223436` passed all CI steps, including PostgreSQL-
required server tests, typechecks, production build, and all eight serial
browser journeys. An independent re-audit confirms the previously identified
wilderness race, Dragon War Council consequence, reinforcement lifecycle, and
narrow shared-intelligence gaps are resolved.

The branch is not marked safe to merge yet. Remaining release debt is broader
than the green CI lane: holding-specific restart proof, wider responsive and
campaign-depth browser coverage, and a complete parity sign-off across the
DOA matrix.

## Evidence

- Local server suite: 176 passed, 3 PostgreSQL skips when localhost PostgreSQL
  was unavailable.
- Local focused holding suite: 3 passed, including an ordinary-player path
  using real camp victories, scouting, wilderness occupation, dragon readiness,
  expedition completion, Marcher Keep founding, Brinehold research, and
  Brinehold founding. The test uses admin grants only for disposable starting
  resources and troops, not for charter unlocks or progression counters.
- Local browser suite: 8 passed serially, including Alpha R1 desktop/tablet/
  mobile, Alpha R2, campaign R1, CLOSED_MOCKUP, R3 alliance intel, and R3
  empire-depth surfaces.
- Remote exact-head CI: run `33651223436`, success.
- Independent re-audit: `delivery/evidence/dragonwake-r3-independent-critic.md`
  plus the current re-audit result in the session evidence.

## Release debt

1. Add a holding-specific persistence/restart test against the supported
   persistence backend.
2. Expand R3 browser certification across responsive Keep, Muster, intelligence,
   wilderness replacement, holdings, social-war, and recovery journeys.
3. Reconcile the DOA parity matrix and publish a final sign-off after those
   checks pass.


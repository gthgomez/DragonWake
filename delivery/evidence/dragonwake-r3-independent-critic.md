# Dragon Wake R3 independent critic evidence

Status: `NOT_SAFE_TO_MERGE`

This is a read-only independent review of the R3 working tree. The critic
reported no proven P0, but identified unresolved P1 gaps. The review was run
by the delegated critic `Mendel` (context `01a061a5-2a0b-7730-beee-0233b72ed2b7`)
against the campaign implementation context; it did not mutate Git state.

## Findings

- `RESOLVED_LOCALLY`: wilderness ownership/capacity is now rechecked at
  resolution/landing, with an explicit blocked result and regression coverage.
- `RESOLVED_LOCALLY`: `BATTLE_READY` now has a concrete Dragon War Council
  consequence and a single-use Wyrm-Scarred hunt/trophy path, with regression
  coverage.
- `RESOLVED_LOCALLY`: reinforcement now has a sender-attributed stationed
  lifecycle, authenticated recall, alliance-leave recall, and JSON-backed
  restart representation. PostgreSQL execution still needs fresh CI proof.
- `RESOLVED_LOCALLY`: reinforcement now has a sender-attributed stationed
  lifecycle, authenticated recall, alliance-leave recall, and JSON-backed
  restart representation. PostgreSQL execution still needs fresh CI proof.
- `P1 OPEN`: persistence and fresh exact-head CI are not yet proven for the
  current R3 head; local PostgreSQL is unavailable.
- `P1 OPEN`: browser evidence covers a desktop surface journey, not the full
  requested campaign journeys.
- `RESOLVED_LOCALLY`: shared intelligence now has a player-facing Alliance
  panel retaining recent structured scout events; a multi-player browser
  journey is still not certified.
- `RESOLVED_LOCALLY`: alliance rank changes now use a leader-authorized API
  path with regression coverage.
- `P1 OPEN`: differentiated holdings have rejection/gating evidence, but not a
  complete ordinary-player positive path with persistence proof.
- `P2`: pacing is a deterministic declarative model rather than a full queue and
  combat simulation; Keep UX does not yet show exact costs/requirements; active
  operation accounting intentionally excludes returning marches; low-depth city
  intel still exposes more detail than the target privacy policy.

## Merge implication

The review supports the implemented bounded fixes, but does not support a claim
that the full R3 campaign is complete or safe to merge. A later merge decision
requires resolving or explicitly accepting the open P1 items and producing
fresh exact-head CI evidence.

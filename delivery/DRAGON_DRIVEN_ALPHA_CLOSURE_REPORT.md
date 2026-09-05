# Dragon-Driven Alpha Closure Report

## Git state

| Item | Value |
| --- | --- |
| Starting main | `1331ab961a15296c720f392f06d64810b2b9d5de` |
| PR #8 | https://github.com/gthgomez/DragonWake/pull/8 — design canon + Phase 0 amendments (`e3b00c5`). CI green. Still **draft**; independent review not posted, so not merged. |
| Implementation branch | `feat/dragon-driven-alpha-closure` stacked on PR #8 HEAD |
| Merged SHAs | none (review gate) |
| Final main SHA | unchanged `1331ab9` |

## What shipped

- Living **DragonIndividual** domain separate from Dragon Presence
- Real Scar encounter via combat resolver + report (stage 4 is no longer a complete-stage button)
- Named Vale Drake hatchling, Capital roost, Chronicle, Yard/Home Guard, Hatchling→Wyrmling, strained-vane wound
- Vane Reading + Fen silt knowledge (RUMORED→PROVEN), organic observe evidence
- Local Fen Wyrm individual, pact-only, Brinehold transform, Reedwarden/Ford Arbalest labels, Ford/Blockade, scoutable absence
- PostgreSQL persistence of individuals, knowledge, verbs
- Player-facing copy: Presence `BONDED` displays **Frontier charter earned**

## What changed from previous Alpha

The previous Alpha ended at expedition charter → Marcher Keep, with Presence `BONDED` implying a dragon. Players now survive a real Scar fight, name a hatchling, and later pact a different adult that changes Brinehold and the map.

## Signature dragon proof

Named hatchling at Capital roost; Home/Away (Yard vs Home Guard empty roost); Wounded recovery without Chronite; Chronicle without POWER headline.

## Domain dragon proof

Fen Wyrm is mature, unnamed-as-property, local per player, pacted not bonded, water-bound, one location.

## Research proof

Observation from roost/Scar/fen; codify only when supported; no timer identity.

## Brinehold / world-verb proof

Pact founds/transforms Brinehold; Ford speeds owner Capital↔Brinehold marches; Blockade delays enemy attacks while stationed; leave clears the verb.

## Multiplayer semantics

Two guests get two hatchlings and two Fen Wyrms. Stationing is owner-only. Scout intel of Brinehold can reveal absence.

## Persistence proof

`REQUIRE_PG=1` `pg-persist.test.ts` 4/4 including hatchling name `Ashwake` across World restart.

## Browser certification

closed-mockup journey updated: Face the Scar, name hatchling, Fen pact, return to Capital with hatchling still present. Full Playwright not re-run in this session after the last e2e edits (CI on the implementation PR is the remaining gate).

## Responsive certification

Roost/pact/chronicle use the existing Castle card layout (wraps on narrow). Dedicated screenshot-perfect pass is the polish campaign.

## Test counts

- Server vitest: **187 passed**, 4 skipped without Postgres; **191 passed** with `REQUIRE_PG=1` on persist file (4 persist tests green)
- Typecheck: server, web, combat green
- Combat suite: unchanged (not re-run this pass; no combat package edits except using resolver)

## Remaining bugs

| Class | Note |
| --- | --- |
| POLISH | Roost uses existing SVG language, not production art |
| POLISH | Home Guard is approaches-empty-roost, not a full escort march (cut ladder) |
| P2 | Fen silt / Vane Reading UI is functional, not a science bench |
| P2 | Playwright full suite pending CI |
| BLOCKER | none identified in unit/system tests |

## Explicitly deferred

Pale Passage, Ironspine, Old Karth, seasonal ecology, named wilds, Escort marches, Slayer branch, production sprites, audio, Lore Bible v1.

## Player-honesty verdict

`ALPHA_FUNCTIONAL_WITH_BLOCKERS`

Mandatory gameplay systems are implemented and unit/persist proven. Independent review of PR #8 is still open, implementation is not on `main`, and the extended browser journey has not been CI-certified on this head yet. Do not award `DRAGON_DRIVEN_ALPHA_CERTIFIED` until the implementation PR is green in CI and the closed-mockup journey including hatchling+pact passes.

When those land, the verdict can be upgraded.

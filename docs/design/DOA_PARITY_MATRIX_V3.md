# Dragon Wake R3 parity matrix V3

This matrix records mechanism parity, not copied fiction or assets. `PROVEN`
requires an authoritative player-accessible loop and test evidence; document
presence alone is not sufficient.

| Mechanism | Historical role | Dragon Wake equivalent | Current evidence | Status | R3 action |
|---|---|---|---|---|---|
| Castle development | Central settlement growth | Castle, buildings, Lands | Server and closed-mockup journey | PARTIAL | Add Keep capability gates |
| Population/manpower | Limits economic and military scale | Population, used and available manpower | `fixes.test.ts`, API DTO | PROVEN | Preserve while adding capacity |
| Keep progression | Gates empire scale | Forge-Heart upgrade ladder | `keep-progression.test.ts`, API DTO | PARTIAL | Certify persistence and full ladder |
| Research infrastructure | Long-horizon choices | Scriptorium and research queue | Server progression tests | PARTIAL | Couple selected gates, not all systems |
| Troop roles | Composition decisions | Content-backed unit roles | Combat/content integrity tests | PROVEN | Extend bands and capacity |
| Commanders | Limits simultaneous leadership | Command Gallery, roster, busy marches | Persistence and progression tests | PARTIAL | Separate roster and operation capacity |
| Simultaneous marches | Operational ceiling | Active marches plus Muster capacity | `muster-capacity.test.ts`, API DTO | PARTIAL | Certify restart and upgrade edges |
| Troops per march | Army scale per operation | Composition validation plus Muster capacity | `muster-capacity.test.ts`, API DTO | PARTIAL | Certify unit-population edge cases |
| March logistics | Travel planning | Muster Yard and Crossroads | Closed-mockup march timing test | PARTIAL | Keep speed separate from count/size |
| Tiered intelligence | Scouting uncertainty | Watchtower and Watch Hill depth | `intelligence-warning.test.ts`, scout report code path | PARTIAL | Add shared-intel policy and browser proof |
| PvE mastery bands | Repeatable farming with preparation | Four named bands, levels 1-10, seeded compositions | `camp-bands.test.ts`, camp resolver code | PARTIAL | Add anti-solved composition proof |
| Wilderness capacity | Strategic ownership choices | Keep-scaled claims and abandon | `wilderness-capacity.test.ts`, API route | PARTIAL | Certify restart and conflict semantics |
| Wilderness value | Economy/logistics/intel tradeoffs | Resource nodes, Crossroads, Watch Hill | Balance evidence | PARTIAL | Add conflict/report semantics |
| Dragon readiness | Multi-system preparation | Presence, evidence, expedition, lifecycle, War Council, Wyrm-Scarred hunt | `dragon-war-council.test.ts`, readiness API | PARTIAL | Certify persistence and alliance-scale follow-through |
| Differentiated holdings | Specialized expansion | Marcher Keep, Stonekeel, Cinderreach, Galeari | Citadel ladder tests, `holding-capabilities.test.ts` | PARTIAL | Complete ordinary-player positive path and persistence |
| Alliance membership | Coordination and diplomacy | Alliance membership/chat | API security tests | PARTIAL | Add ranks and shared intelligence |
| Reinforcement | Shared military defense | Same-alliance reinforce delivery | `fixes.test.ts`, `R3_REINFORCEMENT_SEMANTICS.md` | PARTIAL | Persist temporary stationed ownership/recall lifecycle |
| Persistence | Long-horizon continuity | PostgreSQL world store | PG tests/CI handoff evidence | PARTIAL | Certify every new state transition |
| Recovery/no softlock | Mistakes remain recoverable | Protection, production, starter resources | `pacing-simulation.test.ts`, `R3_PACING_SIMULATION.md` | PARTIAL | Reconcile with persistent-world restart evidence |

## R2 closure evidence

- Playwright ownership is now intended to start one server and one web app;
  `apps/web/playwright.config.ts` uses the explicit filtered web command for
  the web process.
- Watch Hill is scouting-only. Occupation does not mint dragon material;
  atmospheric dragon-sign language must not be treated as evidence.
- Active commander cost naming uses Crownmark terminology. Legacy names remain
  only in compatibility, migration, or historical documentation.

## Evidence rule

Fresh exact-head CI, focused domain tests, persistence tests, and browser
journeys are required before changing a row to `PROVEN`.

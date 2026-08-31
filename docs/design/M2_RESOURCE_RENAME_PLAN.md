# M2 Migration Plan — Resource Rename (kelp→food, driftwood→timber, basalt→stone, slagiron→iron, tidegilt→coin)

Status: **PLANNED — IMPLEMENTATION CONTRACT**
Generated: 2026-08-21
Base: `main` @ `ba25cb7`
Freeze authority: `docs/design/PHASE_2_1_CORRECTION_FREEZE.md` (FREEZE NOW: "5 resources: Food/Timber/Stone/Iron/Coin")
Mapping contract: `packages/content/data/domain_catalog.json` → `resources.target`, `resources.legacy_to_target`, `resources.columns`, `plot_types.legacy_to_target`

---

## 1. Goal

Replace the legacy aquatic resource identifiers with the frozen medieval set
across every surface — TypeScript types, sim logic, API payloads, validation,
PG schema + data, and web UI — in one coordinated cutover with a boot-time
database migration, following the precedent set by the posture fix
(`7866035`) and research-id migration (`4d6571d`).

**Target ids:** `food`, `timber`, `stone`, `iron`, `coin`
**Plot types:** `kelp_farm→farm`, `drift_dock→lumber_yard`, `basalt_cut→quarry`, `slag_pit→mine`

## 2. Non-goals (separate change windows)

- Faction value renames (`brinecant/ashcoil/skyshear/mossvault`) — M2b; same
  pattern (CHECK swap + backfill) but touches guest creation + seeds.
- Shop item display names (Blink/Jump/etc.) — deferred to monetization freeze.
- Building/unit display names — already medieval via `domain_catalog`.

## 3. Current-state inventory (verified by sweep @ `ba25cb7`)

| Surface | Hits | What lives there |
|---------|-----:|------------------|
| `apps/server/src/world.ts` | ~80 | `productionPerHour()` rate keys, tick application, plot-type switches (`world.ts:402`), plunder, training/building cost tables, admin grant resources |
| `apps/web/src/App.tsx` | ~41 | Display label adapter (`kelp→Food`), local `City.resources` typing, resource bar iteration |
| `apps/server/src/sim.test.ts` / `progression.test.ts` | 30 / 27 | Direct `resources.kelp` assertions, admin grants `{ kelp: 1500 }` |
| `apps/server/src/pg-store.ts` | 16 | INSERT/UPDATE column lists for `cities` (`pg-store.ts:553-583`) |
| `apps/server/src/validate.ts` | 5 | Explicit `kelp:` key at `validate.ts:44`; generic `resources` record at `:73` |
| `apps/server/src/app.ts` | 2+ | Plot assign/upgrade costs keyed by legacy names (`app.ts:407-408`) |
| `schema.sql` | 6 | 5 `cities` columns + comment on `field_plots.plot_type` |
| `packages/shared/src/index.ts` | 6 | `ResourceBag` type (`:22`) |
| `packages/content/src/index.ts` | 10 | `getUnitCost()` legacy fallbacks (`cost_food ?? cost_kelp`, `index.ts:257`) |
| Content prose | few | `camps.json` loot_notes, `bestiary_entries.json` lore (cosmetic copy only) |

Clean already: `formulas.json`, `units.json` (medieval `cost_food…` fields),
`research*.json`. `queue_jobs.payload` never stores resource bags (build/train
payloads are id+count) — no queue migration needed.

## 4. Strategy

**Hard cutover in memory/API + one-boot DB migration. No dual-write window.**

Rationale:
- Single app, both clients in-repo; no external API consumers (private beta).
- The catalog already declares the full mapping contract.
- Precedent: posture values migrated exactly this way and proved out under
  `REQUIRE_PG=1` against a drifted volume.

API keys change within `/api/v1` (beta contract). To avoid breaking in-flight
clients mid-session, **validation accepts legacy resource keys for one
transition window** and canonizes them server-side via a new
`canonResourceId()` (mirror of `canonTechId`). Window closes in a follow-up
commit once web + tests are swept.

## 5. Work phases (commit-sized)

### A. `feat(shared): medieval resource ids` 
- `ResourceBag` → `{ food, timber, stone, iron, coin }` (`shared/index.ts:22`).
- Export `RESOURCES` tuple + `LEGACY_RESOURCE_ALIASES` derived from catalog.
- Typecheck will flag every downstream key usage — this is the safety net;
  fix-forward through phases B–D before running suites.

### B. `feat(server): sim + validation on medieval ids`
- `canonResourceId()` in `@dragonwake/content` (reads `domain_catalog.resources.legacy_to_target`).
- `world.ts`: rates object, tick loop, plunder, cost tables, admin grant — all keys → canonical. Plot-type switches → `farm/lumber_yard/quarry/mine`.
- `app.ts` plot assign/upgrade costs → canonical keys.
- `validate.ts:44` schema → canonical keys; admin-grant/resources schemas accept legacy keys and canonize (transition window).
- `getUnitCost()`: drop `cost_kelp…` fallbacks after confirming units.json has none (it doesn't).

### C. `fix(persistence): rename resource columns + plot backfill`
- `schema.sql`: `kelp→food`, `driftwood→timber`, `basalt→stone`, `slagiron→iron`, `tidegilt→coin`; comment update on `field_plots`.
- `pg.ts migrateExistingSchema()` append idempotent step:
  ```sql
  DO $$ BEGIN
    -- RENAME COLUMN per mapping, guarded by information_schema.columns checks
    -- then: UPDATE field_plots SET plot_type = map(plot_type) WHERE plot_type IN (legacy…)
  END $$;
  ```
- `pg-store.ts` save/load column lists → canonical names.
- Inbound aliasing not needed on load: columns themselves are renamed; data preserved.

### D. `ui: drop resource label adapter`
- `App.tsx`: delete `kelp→Food` display map; labels render from canonical keys directly; local types follow shared.

### E. `test: sweep + round-trip proof` (+ content prose)
- Sweep `sim.test.ts` (30), `progression.test.ts` (27), `api.test.ts`, `acceptance.test.ts`, `pg-persist.test.ts` to canonical keys.
- New test: create city → grant `{ food: 1234 }` → flush → reload → assert persisted (guards phase C forever).
- Cosmetic: camps/bestiary prose strings.

## 6. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| String-keyed iteration assumes legacy order/names | Export `RESOURCES` tuple; replace ad-hoc `Object.keys(bag)` with it |
| Old PG volumes break on boot | Idempotent `DO` block guarded by `information_schema` checks — proven pattern |
| In-flight browser sessions post old keys | Validation canonizes legacy keys during transition window |
| Hidden dynamic references (template strings) | Phase A typecheck sweep + final `rg kelp\|driftwood\|basalt\|slagiron\|tidegilt` must return zero outside `domain_catalog.json` + docs |
| Codex/formulas display drift | `formulas.json` verified clean; re-check `/codex` manually after |

## 7. Verification gates

1. All four package typechecks clean after each commit.
2. Server suite green without PG.
3. `REQUIRE_PG=1` against the **existing drifted compose volume** (contains real legacy-named data) — proves the RENAME/backfill path end-to-end.
4. Fresh-DB `REQUIRE_PG=1` run.
5. `pnpm accept` (M1 asserts `resources.food > 0` post-rename).
6. Web build + manual smoke: Castle tab shows Food/Timber/Stone/Iron/Coin; Lands assigns Farm/Lumber Yard/Quarry/Mine.
7. Zero-hit grep for legacy ids outside catalog/docs.

## 8. Effort estimate

~1 session. Bulk is mechanical key renaming (world.ts ~80 refs, tests ~60);
the only design-bearing pieces are the `DO`-block migration and the
validation transition window.

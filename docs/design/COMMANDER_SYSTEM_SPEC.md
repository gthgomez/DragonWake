# Commander System Spec (M4 prerequisite · resolver v1 capability 1–2)

Status: **DRAFT SPEC — IMPLEMENTATION CONTRACT**
Generated: 2026-08-21
Base: `main` @ `07d480b`
Authority: `research/dragons-of-atlantis/pre-implementation/PRODUCT_FREEZE_S1.md` · V1 audit §I (Commander decision), §C3 (command_gallery UNKNOWN), §K (resolver destination v1)
Freeze context: unblocks **M4 Sovereign deletion** by taking over the army-leadership role; harness purpose already moved to dragon readiness (Slice 1A).

---

## 1. Goal

Introduce Commanders as the human-leadership layer of armies: rostered
per-player characters who lead marches, grant deterministic army-wide stat
bonuses in combat, progress through battle participation, and are gated by
the existing-but-mechanicless `command_gallery` building.

## 2. Current state (verified @ `07d480b`)

| Surface | State |
|---------|-------|
| `schema.sql` `commanders` table | Exists (id, player_id, name, stars=1, leadership/attack/defense/life=10, busy_march_id) — **never populated** |
| `marches.commander_id` | Column exists; always null (`world.ts:1527`) |
| pg-store | Commanders never loaded or saved |
| API | No routes |
| Resolver (`packages/combat`) | Pure; `SideInput = { groups, sovereign? }`; ignores research/commanders |

## 3. Non-goals (this phase)

- Defender-side commanders (city garrison leadership) — future phase.
- Dragon Slayer class, Army Officers attachments, War Beasts (audit §I later rows).
- Commander death/disband; healing items.
- Research-modifier-in-combat (resolver v1 item 2) — same boundary, separate change.
- Any change to Sovereign behavior (frozen legacy-compat until M4 lands).

## 4. Domain model

- A **Commander** is a per-player roster entity — never a stackable troop,
  never part of `BattleGroup`s.
- Leads **at most one march at a time** (`busy_march_id`, set on march create,
  cleared when the march reaches terminal status).
- Stats: `stars (1–5)`, `leadership`, `attack`, `defense`, `life`, `xp`.
- States: `available` · `busy (leading march)` · `wounded (until timestamp)`.

## 5. Combat integration contract

Additive, backward-compatible resolver change:

```ts
SideInput {
  groups: BattleGroup[];
  sovereign?: { sovereignId: string; level?: number };
  commander?: { leadership: number; attack: number }; // NEW
}
```

- Effect (INITIAL_TEST_FIXTURE): all of that side's groups get life and
  defense × `(1 + 0.02 × leadership)`; melee/ranged attack ×
  `(1 + 0.02 × attack)`. Absent field ⇒ exactly today's behavior.
- Applied inside `resolveBattle` after unit-stat lookup, before round loop —
  resolver stays pure/deterministic/seeded.
- `COMBAT_RULES_VERSION` bumped (existing compatibility marker); old battle
  reports keep their original version string and remain readable.
- Sovereign aura (if attached) composes independently; effects multiply.
  M4 will delete the sovereign term without touching this one.

## 6. March lifecycle rules

1. `POST /api/v1/marches` body gains optional `commanderId`.
2. Validation (error codes follow existing style):
   - owner mismatch → `NO_COMMANDER`
   - `busy_march_id` set → `COMMANDER_BUSY`
   - `wounded_until > now` → `COMMANDER_WOUNDED`
   - active commanded marches would exceed slot cap (§7) → `COMMANDER_SLOTS`
3. On create: set `busy_march_id`. On march reaching any terminal state
   (completed/cancelled): clear it. Scout intents may also carry a commander
   (counts toward cap).
4. XP awarding hook lives where battle reports finalize: commander-led side
   victory `+100 XP`; defeat `+25 XP` (INITIAL_TEST_FIXTURE).

## 7. Recruitment & slots (`command_gallery` gets its mechanic)

- Slot cap for concurrently-commanded marches = `command_gallery` level,
  hard cap 3 (INITIAL_TEST_FIXTURE). This resolves audit C3 UNKNOWN for
  command_gallery.
- First recruit free once `command_gallery ≥ L1`; further recruits cost
  `{ coin: 250 × ownedCount, food: 500 × ownedCount }` (INITIAL_TEST_FIXTURE),
  error `RECRUIT_COST` on shortfall (mirrors RESEARCH_COST pattern).
- Names drawn from new `packages/content/data/commanders.json` pool
  (medieval name list; M1-safe additive content file).

## 8. Progression & wounded

| Star threshold (cumulative XP) | Effect per star-up |
|-------------------------------|--------------------|
| 300 · 900 · 2100 · 4500 | +4 to leadership/attack/defense/life (INITIAL_TEST_FIXTURE) |

- Loss does not kill. If the commander's side loses, `wounded_until =
  now + WOUNDED_MS` (30 min real time, devFastTime-scaled via `durationMs`,
  INITIAL_TEST_FIXTURE). Wounded commanders cannot be assigned; recovery is
  passive. Mirrors `sovereigns.wounded_until` precedent.
- XP/star-up applied idempotently inside report finalization (same transaction
  scope as report persistence).

## 9. Persistence & migration

- `ALTER TABLE commanders ADD COLUMN IF NOT EXISTS xp BIGINT NOT NULL DEFAULT 0;
   ADD COLUMN IF NOT EXISTS wounded_until TIMESTAMPTZ;` in
  `migrateExistingSchema()` (pg.ts step 9) + schema.sql CREATE TABLE updated.
- pg-store: hydrate commanders per realm in `loadInto` (before marches, which
  reference them); upsert all commanders in `saveWorld`; keep
  `busy_march_id` consistent with saved marches.
- In-memory `World.commanders: Map<string, Commander>`; type exported from
  shared or world (style-match `DragonProgress`).

## 10. API surface (additive)

| Route | Behavior |
|-------|----------|
| `GET /api/v1/commanders` | Roster incl. stats/xp/stars/state |
| `POST /api/v1/commanders/recruit` | `{}` → next commander (cost rules §7) |
| `POST /api/v1/marches` | optional `commanderId` (validation §6) |

No delete/heal endpoints in v1.

## 11. Web UI (minimal)

Realm tab gains a "Commanders" section: roster cards (name, stars, state) +
recruit button showing cost; War tab march composer gains an optional
commander dropdown listing available (not busy/wounded) commanders. Defensive
rendering — hidden entirely if `/commanders` returns empty roster and feature
flag absent.

## 12. Tuning fixtures (all `// INITIAL_TEST_FIXTURE`)

| Constant | Value |
|----------|-------|
| Leadership/attack bonus per point | 2% |
| Slot cap max | 3 |
| Recruit cost scaling | 250 coin + 500 food × ownedCount |
| Win/loss XP | 100 / 25 |
| Star XP thresholds | 300/900/2100/4500 |
| Per-star stat gain | +4 each axis |
| Wounded duration | 30 min (devFastTime-scaled) |

## 13. Acceptance criteria

1. Combat package: determinism tests still pass; new cases — commander present
   changes outcome odds measurably but seed-reproducibly; absent commander =
   byte-identical legacy results.
2. Server: recruit → assign → win battle → XP/star-up path green;
   slot-cap enforcement (gallery L1 = 1 concurrent command);
   busy/wounded rejections; loss wounds commander.
3. PG: `REQUIRE_PG=1` restart survival includes commanders roster + busy link +
   wounded_until + xp (round-trip assertions in pg-persist.test.ts).
4. Zero regressions: full suite + accept green; old reports render unchanged.

## 14. Work breakdown (commit-sized)

1. `feat(combat)` — SideInput.commander + application + rulesVersion bump + determinism tests.
2. `feat(content)` — commanders.json pool + loader/types.
3. `feat(server)` — domain, recruitment, slots, march wiring, progression/wounded, API + validation codes, pg.ts/pg-store/schema.sql, tests (incl. pg-persist round-trip).
4. `ui` — Realm/War surfaces.
5. `docs` — this spec marked IMPLEMENTED + slice-report freshness entry.

## 15. Risks / open questions

- **Balance**: 2%/point × leadership 10 ≈ +20% at L1 already swings matchups —
  playtest before canon; consider halving if M11-style matchup tests flip.
- **Defender commanders** interact with posture redesign (garrison semantics) —
  deliberately deferred to avoid coupling.
- **XP farming**: retreating-into-wins loops — mitigated initially by awarding
  XP only on *landed* battles (already the case) and camp-level bands; revisit
  with daily caps if farmed.
- Open: should scout-intent marches really consume a slot? (Spec says yes for
  simplicity; cheap to exclude later.)

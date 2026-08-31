# Dragon Wake

Multiplayer web MMORTS MVP beta (async city builder + map combat).

## Design authority

Read these before changing fiction, content IDs, or client presentation:

1. [`docs/design/DIRECTION_FREEZE_V1.md`](docs/design/DIRECTION_FREEZE_V1.md) — **FROZEN** product + lore direction
2. [`docs/design/CANON_AUTHORITY.md`](docs/design/CANON_AUTHORITY.md) — authority stack
3. [`docs/design/CLOSED_MOCKUP_V1.md`](docs/design/CLOSED_MOCKUP_V1.md) — **ACTIVE** presentation contract for the closed vertical slice (player-facing language, surface contracts, terminology inventory)
4. [`docs/design/LORE_BIBLE_V1_BRIEF.md`](docs/design/LORE_BIBLE_V1_BRIEF.md) — scope only; full Lore Bible v1 not written yet
5. [`docs/design/MIGRATION_PLAN.md`](docs/design/MIGRATION_PLAN.md) — Phase 0–7 sequence

Current implementation is authoritative **only** where those documents do
not contradict it.

Historical Dragons of Atlantis research
(`C:\Workspace\research\dragons-of-atlantis\pre-implementation\`) is
**reference only, NON-AUTHORITATIVE.** Do not treat it as the product
direction. The MMORTS loop survives because Direction Freeze §28
explicitly preserves it.

Lore Bible v1 is not written yet. Scope only:
[`docs/design/LORE_BIBLE_V1_BRIEF.md`](docs/design/LORE_BIBLE_V1_BRIEF.md).

## CLOSED_MOCKUP_V1 — closed vertical slice

The player journey below is **implemented, server-backed, and certified** by
the Playwright journey `apps/web/e2e/closed-mockup-v1.spec.ts`:

> Enter kingdom → settlement-first Castle with per-plot build/upgrade →
> construction queue with visible progress → Lands estate scene → research →
> training → Realm drag/travel navigation → target panels → army composer →
> scout → intelligence → march → battle report → wilderness claim →
> Bestiary/dragon readiness → Dragon Expedition → settlement charter →
> **Marcher Keep founding** → settlement switch → next objective.

Highlights:

- **Castle**: world-first isometric settlement; empty plot → build cards with
  real costs/times from content; occupied plot → level/tier/effect/upgrade;
  construction scaffold + countdown on the plot; buildings visibly tier
  (stone → bronze → gold at L4/L7).
- **Authoritative building upgrade**: building on an occupied slot with the
  same type upgrades it (cost × next level, per-building cost/time in
  `buildings.json`); duplicate/mismatched/over-max attempts are rejected.
- **Building mechanics**: Barracks speed training, Scriptorium speeds
  research, Muster Yard speeds marches, Training Camp widens train queues,
  Watchtower deepens scout intelligence (exact troop counts at L3).
- **Realm**: drag-to-travel + coordinate jump (secondary), click target
  panels for camps/wilds/settlements, army composer with commander, strength,
  carry, march-time, and explicit launch confirmation.
- **Progression honesty**: objectives auto-complete only from verified server
  state; camp victories record Bestiary entries; clue grants feed distinct
  materials; the earned expedition charter authorizes Marcher Keep founding.
- **Language**: no API URLs, raw ids, UUID fragments, or server prose in the
  player flow; internal codes stay in console diagnostics.

Out of scope / prototype remains: shop UI, alliances depth, haul UX, and
Postgres runtime verification in CI. The former Sovereign machinery has been
removed from live product paths; only migration/history references remain.

Do not start content-heavy mobile UI against the current aquatic / elemental
content model.

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | pnpm workspaces + TypeScript |
| Web | Vite + React |
| Server | Hono (Node) + in-process sim |
| DB | PostgreSQL 16 (optional; schema in `schema.sql`) |
| Combat | `packages/combat` pure `resolveBattle` |

## Packages

```text
apps/web          — City / Grounds / Map / War / Alliance / Shop / Codex / Settings
apps/server       — API + sim loop (queues, marches, combat, alliances)
packages/shared   — shared types
packages/combat   — resolveBattle (deterministic)
packages/content  — JSON game data
docs/design       — Direction Freeze, canon authority, migration plan
```

## Prerequisites

- Node 20+
- pnpm 10+
- Docker (optional, for Postgres schema T7)

## Setup

```powershell
cd C:\Workspace\TideforgeEmpires
copy .env.example .env
pnpm install
```

### Database (optional)

```powershell
docker compose up -d db
# schema applies from schema.sql on first boot
# or: pnpm --filter @dragonwake/server migrate
```

With `DATABASE_URL` reachable, the server **loads/saves the full realm to PostgreSQL** (players, cities, sessions, marches, reports, alliances, …). `/health` reports `db: "postgres"` only when the store is actually attached (not merely when the env var is set). If Postgres is unreachable, it falls back to an in-memory realm and `/health` reports `db: "memory"`.

### Dev

```powershell
# API + web
pnpm dev

# API only → http://localhost:3001/health
pnpm dev:server

# Web only → http://localhost:5173
pnpm dev:web
```

Env flags (`.env`):

| Flag | Effect |
|------|--------|
| `DEV_FAST_TIME=1` | Queues/marches ~60× faster (default in `.env.example`) |
| `DEV_SKIP_TUTORIAL=1` | Skip tutorial steps |
| `DATABASE_URL` | Postgres URL for schema verify |
| `VITE_API_URL` | Web → API base (default `http://localhost:3001`) |

### Admin grant (dev)

```http
POST /api/v1/admin/grant
Authorization: Bearer <session token>
x-admin-token: <ADMIN_TOKEN>
{ "units": { "levy": 200 }, "brineholdUnlock": true, "chronite": 100, "skipProtection": true }
```

## ACCEPTANCE_MVP manual path (M1–M11)

Environment: `pnpm dev` (or `docker compose up -d db` + server/web), two browser profiles or two guest logins.

These steps still describe the **current implementation**. They are not the
target fiction. Do not copy Brinecant / Reefbow / Harbinger / Brinehold /
Harbor into new content.

| Step | Action | Pass if |
|------|--------|---------|
| M1 | Create guest A (Brinecant) | City at map coords, resources > 0 |
| M2 | Create guest B (Ashcoil) | Different city tile |
| M3 | A builds Habitation + Barracks | Queues complete under fast time |
| M4 | A researches Longmark 1, trains Reefbows | Stack increases after tick |
| M5 | A Map → Attack Camp L1 | Report in War tab |
| M6 | A occupies wilderness | Claim owned on map |
| M7 | Admin grant unlock (M4: Sovereign deleted) | `/me` returns no sovereigns; Brinehold unlock flag on capital |
| M8 | Found Brinehold | Second city kind `brinehold` |
| M9 | A creates Tideband; B joins via API or second client | Members + chat visible |
| M10 | A attacks B (B Harbor posture) | Report; resources move on harbor |
| M11 | Codex formulas page | Non-empty formulas JSON |

Scripted equivalent (no browser):

```powershell
pnpm accept   # ACCEPTANCE_MVP M1–M11 labeled path
pnpm test     # combat + full server suite (includes M1–M11)
pnpm seed:demo  # print two-player in-process seed (tokens for local tooling)
```

Alliance M9 in UI: guest A creates Tideband → share **tag** → guest B **Join by tag** (or list).

## Automated exit gates (T1–T8)

```powershell
pnpm install                                          # T1
pnpm --filter @dragonwake/combat test                  # T3–T4 (M1–M10)
pnpm --filter @dragonwake/server test                  # T5–T6 + M1–M11 + API demo
# T7 durability (honest): start Postgres, then REQUIRE_PG so missing DB fails hard:
#   docker compose up -d db
#   $env:DATABASE_URL="postgres://tideforge:tideforge@127.0.0.1:5432/tideforge"
#   $env:REQUIRE_PG="1"
#   pnpm --filter @dragonwake/server test   # pg-persist must assert, not skip
# Without REQUIRE_PG: pg-persist tests are skipped (not silent-pass) when DB is down
pnpm --filter @dragonwake/web build                    # web
pnpm --filter @dragonwake/combat typecheck
pnpm --filter @dragonwake/server typecheck
pnpm --filter @dragonwake/web typecheck                # T8
```

### Browser certification (CLOSED_MOCKUP_V1)

```powershell
pnpm --filter @dragonwake/web exec playwright install chromium   # once
pnpm dev                                                        # server + web
pnpm --filter @dragonwake/web exec playwright test               # baseline + journey
```

`e2e/closed-mockup-v1.spec.ts` drives the full player journey (build →
upgrade → lands → research → train → scout → battle → occupy → Bestiary →
expedition → charter → Marcher Keep → settlement switch). The single dev
fixture it uses (`POST /admin/grant`) bypasses only RNG-gated counters and is
gated by the existing admin rules.

| Gate | Status (local, 2026-08-30) |
|------|----------------|
| Combat + server suites | **134 passed, 3 skipped** (PG persistence skips only when Postgres is down; fails hard with `REQUIRE_PG=1`) |
| Typechecks (5 packages) + web build | Green |
| Playwright baseline + CLOSED_MOCKUP_V1 journey | Green (journey ≈ 1–2 min under `DEV_FAST_TIME=1`) |

## Implementation board

| Slice | Status |
|-------|--------|
| A0–A10 MVP scaffold through web screens | Done |
| B0 residual closeout (T7 honesty + PvP + scout/haul) | Done |
| **CLOSED_MOCKUP_V1** — presentation closure campaign | **Done (2026-08-30)** — contract: [`docs/design/CLOSED_MOCKUP_V1.md`](docs/design/CLOSED_MOCKUP_V1.md); journey: `apps/web/e2e/closed-mockup-v1.spec.ts` |
| M4 Sovereign deletion | **Done (2026-08-27)** — live product support removed; readiness + Commanders replace its roles; legacy migration compatibility retained |
| A0 Scaffold | Done |
| A1 Combat + matchups M1–M10 | Done |
| A2 Schema + guest/city | Done |
| A3 Queues + DEV_FAST_TIME | Done |
| A4 Map camps/wilderness | Done |
| A5 Marches + reports | Done |
| A6 PvP postures + Saltvault + protection | Done |
| A7 Harbinger harness + Brinehold | Done (harness removed in M4 — see board below) |
| A8 Tideband + chat | Done |
| A9 Web screens | Done |
| A10 Shop stub + tutorial + dailies + README | Done |
| Exit gate | M1–M11 automated; **B0 residual closeout done** (T7 honesty + full PvP + scout/haul) |
| B1 Commanders | Done (spec: docs/design/COMMANDER_SYSTEM_SPEC.md) |
| **M4** | **Sovereign deleted** — combat term, `/sovereigns` API, harness grant, `sovereigns` table/migration, web surfaces all removed; readiness + Commanders replace its roles | **Done** (2026-08-27) |

Historical note: earlier READMEs described an aquatic/elemental MVP (Brinecant,
Reefbow, Harbinger, Harbor posture). Those names survive only as stable
internal IDs; player-facing labels migrated per the CLOSED_MOCKUP_V1
terminology inventory. Historical acceptance tables above are retained as
records of that era and no longer describe the default player flow.

## Next campaign

This is a **domain-preserving migration**, not a rewrite and not a skin swap.
See [`docs/design/MIGRATION_PLAN.md`](docs/design/MIGRATION_PLAN.md).

| Phase | Focus | Status |
|-------|--------|--------|
| **0** | Authority freeze | **Done** (PR #1) |
| — | **CLOSED_MOCKUP_V1 presentation closure** | **Done (2026-08-30)** |
| **1** | Lore Bible v1 (one region) | Not started |
| **2** | Mechanical translation design (incl. Sovereign decision) | Blocked on 1; Sovereign deletion is complete and preserved compatibility paths are audited |
| **3** | Decouple old canon from engine (migrations) | Blocked on 2 |
| **4** | Content conversion | Blocked on 2–3 |
| **5** | Web vertical slice (castle → Codex → lesser dragon) | Partially proven by CLOSED_MOCKUP_V1 |
| **6** | Mobile client against stabilized semantics | After 5 |
| **7** | Dragon systems (expeditions, anatomy, bonding) | After 5 |
| **B0** | Residual closeout | **Done** |
| **P0** | Playable polish | **Done** |
| **S1.0–S1.1** | Freeze + **Stonekeel** citadel | **Done** |
| **Phase 2.1** | Medieval retheme slice 1A (population/manpower, research gates, dragon foundation, camp variation) | **Landed** (`docs/VERTICAL_SLICE_1A_RESULTS.md`) |
| **M4** | **Sovereign deletion** (army-leadership → Commanders; harness → dragon readiness) | **Done** (2026-08-27) |
| **S1.2–S1.3** | **Forest Citadel** (cinderreach) + **Dragon Watch** (galeari) citadels | **Done** — medieval exclusive units (forest_ranger/warhound, dragon_slayer/ballista); demo-unlock walks the prereq chain |
| **S1.4+** | Mnemolith (deferred), Arena, Tidebeast, Market… | Next |

P0 notes: `docs/P0_M1_M11_EVIDENCE.md` · events poll `GET /api/v1/events?since=` · SSE `/api/v1/events/stream` · CI `.github/workflows/ci.yml`

## Citadel development routes

Found Stonekeel: `POST /api/v1/citadels/found` `{ "kind": "stonekeel", "unlock": true }`
Found Forest Citadel / Dragon Watch: same route with `"kind": "cinderreach" | "galeari"` — the demo unlock auto-founds missing ladder rungs
Found Marcher Keep (requires expedition charter): `POST /api/v1/citadels/found` via charter path

Arena, world boss, citadels past the second-settlement system, Mnemolith/Echo,
live market, real IAP, Hardcore realms.

## OUT OF SCOPE (until a later freeze)
Native mobile **architecture** may be planned in parallel. Native mobile
**content-heavy UI** waits until Phase 6.

Old S1 labels (Tidebeast, Mnemolith, elemental factions) are historical.
Sovereign/harness references are retained only where required for legacy
migrations, compatibility tests, or historical documentation; live product
support was removed by the preserved M4 reconciliation work.

## License

License: Proprietary — source available for viewing; this project is not open source.

Copyright is retained by the project owner. This notice does not grant
permission to redistribute, modify, sublicense, sell, commercially exploit, or
create derivative works from the game or its original code and content, except
where required by applicable law. Third-party dependencies and fonts remain
under their own licenses.

# Tideforge Empires

Multiplayer web MMORTS MVP beta (async city builder + map combat).

## Design authority

Read these before changing fiction, content IDs, or client presentation:

1. [`docs/design/DIRECTION_FREEZE_V1.md`](docs/design/DIRECTION_FREEZE_V1.md) — **FROZEN** product + lore direction
2. [`docs/design/CANON_AUTHORITY.md`](docs/design/CANON_AUTHORITY.md) — authority stack
3. [`docs/design/LORE_BIBLE_V1.md`](docs/design/LORE_BIBLE_V1.md) — once approved (does not exist yet)
4. [`docs/design/MIGRATION_PLAN.md`](docs/design/MIGRATION_PLAN.md) — Phase 0–7 sequence

Current implementation is authoritative **only** where those documents do
not contradict it.

Historical Dragons of Atlantis research
(`C:\Workspace\research\dragons-of-atlantis\pre-implementation\`) is
**reference only, NON-AUTHORITATIVE.** Do not treat it as the product
direction. The MMORTS loop survives because Direction Freeze §28
explicitly preserves it.

Lore Bible v1 is not written yet. Scope only:
[`docs/design/LORE_BIBLE_V1_BRIEF.md`](docs/design/LORE_BIBLE_V1_BRIEF.md).

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
# or: pnpm --filter @tideforge/server migrate
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
Authorization: Bearer <token>
{ "units": { "reefbow": 200 }, "harness": true, "brineholdUnlock": true, "chronite": 100, "skipProtection": true }
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
| M7 | Admin grant harness | Harbinger harness complete on City |
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
pnpm --filter @tideforge/combat test                  # T3–T4 (M1–M10)
pnpm --filter @tideforge/server test                  # T5–T6 + M1–M11 + API demo
# T7 durability (honest): start Postgres, then REQUIRE_PG so missing DB fails hard:
#   docker compose up -d db
#   $env:DATABASE_URL="postgres://tideforge:tideforge@127.0.0.1:5432/tideforge"
#   $env:REQUIRE_PG="1"
#   pnpm --filter @tideforge/server test   # pg-persist must assert, not skip
# Without REQUIRE_PG: pg-persist tests are skipped (not silent-pass) when DB is down
pnpm --filter @tideforge/web build                    # web
pnpm --filter @tideforge/combat typecheck
pnpm --filter @tideforge/server typecheck
pnpm --filter @tideforge/web typecheck                # T8
```

| Gate | Status (local) |
|------|----------------|
| T1–T6, T8 | Green via `pnpm test` + typecheck/build |
| T7 PG apply + restart survival | **B0 proven** with `docker compose up -d db` + `REQUIRE_PG=1` (skip when DB down; never silent pass) |
| M1–M11 | Green via `pnpm accept` |
| Docker db smoke | **B0 proven** — compose `db` healthy; server `/health` `db:"postgres"` |

## Implementation board

| Slice | Status |
|-------|--------|
| A0 Scaffold | Done |
| A1 Combat + matchups M1–M10 | Done |
| A2 Schema + guest/city | Done |
| A3 Queues + DEV_FAST_TIME | Done |
| A4 Map camps/wilderness | Done |
| A5 Marches + reports | Done |
| A6 PvP harbor/full + Saltvault + protection | Done |
| A7 Harbinger harness + Brinehold | Done |
| A8 Tideband + chat | Done |
| A9 Web screens | Done |
| A10 Shop stub + tutorial + dailies + README | Done |
| Exit gate | M1–M11 automated; **B0 residual closeout done** (T7 honesty + full PvP + scout/haul) |

## Next campaign

This is a **domain-preserving migration**, not a rewrite and not a skin swap.
See [`docs/design/MIGRATION_PLAN.md`](docs/design/MIGRATION_PLAN.md).

| Phase | Focus | Status |
|-------|--------|--------|
| **0** | Authority freeze (this tree) | In progress |
| **1** | Lore Bible v1 (one region) | Not started |
| **2** | Mechanical translation design | Blocked on 1 |
| **3** | Decouple old canon from engine (migrations) | Blocked on 2 |
| **4** | Content conversion | Blocked on 2–3 |
| **5** | Web vertical slice (castle → Codex → lesser dragon) | Blocked on 4 |
| **6** | Mobile client against stabilized semantics | After 5 |
| **7** | Dragon systems (expeditions, anatomy, bonding) | After 5 |

P0 notes: `docs/P0_M1_M11_EVIDENCE.md` · events poll `GET /api/v1/events?since=` · SSE `/api/v1/events/stream` · CI `.github/workflows/ci.yml`

## OUT OF SCOPE (until a later freeze)

Arena, world boss, citadels past the second-settlement system, Mnemolith/Echo,
live market, real IAP, Hardcore realms.

Native mobile **architecture** may be planned in parallel. Native mobile
**content-heavy UI** waits until Phase 6.

Old S1 labels (Tidebeast, Mnemolith, elemental factions) are historical.

## License

Private / unpublished — all rights reserved unless otherwise stated.

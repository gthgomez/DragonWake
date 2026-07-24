# Tideforge Empires

Multiplayer web MMORTS MVP beta (async city builder + map combat).

**Design authority (read-only):**  
`C:\Workspace\research\dragons-of-atlantis\pre-implementation\`

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | pnpm workspaces + TypeScript |
| Web | Vite + React |
| Server | Hono (Node) |
| DB | PostgreSQL 16 |
| Combat | `packages/combat` (pure function; A1+) |

## Packages

```text
apps/web          — client
apps/server       — API + future sim loop
packages/shared   — shared types
packages/combat   — resolveBattle (scaffold)
packages/content  — JSON game data
```

## Prerequisites

- Node 20+
- pnpm 10+
- Docker (optional, for Postgres)

## Setup

```powershell
cd C:\Workspace\TideforgeEmpires
copy .env.example .env
pnpm install
```

### Database (optional for A0 health check)

```powershell
docker compose up -d db
# schema applies from schema.sql on first boot
```

### Dev

```powershell
# API only
pnpm dev:server
# → http://localhost:3001/health

# Web only
pnpm dev:web
# → http://localhost:5173
```

### Verify (A0)

```powershell
pnpm install
pnpm --filter @tideforge/web build
# start server, then:
curl http://localhost:3001/health
```

## Implementation board

Follow slices **A0 → A10** in:

`research/dragons-of-atlantis/pre-implementation/IMPLEMENTATION_BOARD.md`

| Slice | Status |
|-------|--------|
| A0 Scaffold | In progress / this repo |
| A1+ | Pending |

## License

Private / unpublished — all rights reserved unless otherwise stated.

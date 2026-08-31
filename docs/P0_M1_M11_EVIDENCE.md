# P0.1 — M1–M11 acceptance evidence

| Field | Value |
|-------|--------|
| Date | 2026-07-25 |
| Repo | TideforgeEmpires |
| Path | Scripted automated (`pnpm accept`) + UI wiring review |

## Automated path (authoritative for beta gate)

Command:

```powershell
pnpm --filter @dragonwake/server accept
# or full suite:
pnpm --filter @dragonwake/server test
```

Coverage maps to ACCEPTANCE_MVP M1–M11 in `apps/server/src/acceptance.test.ts`:

| Step | Covered |
|------|---------|
| M1–M2 | Two guests, different tiles, resources |
| M3–M4 | Build + research/train queues |
| M5–M6 | Camp attack + wilderness occupy |
| M7–M8 | Admin grant unlock (M4: Sovereign deleted) + Brinehold |
| M9 | Tideband create/join + chat |
| M10 | PvP (withdraw posture) |
| M11 | Codex formulas non-empty |

## Human two-browser residual

| Item | Status |
|------|--------|
| Full two-profile browser walkthrough | **Not run this session** (optional human polish) |
| UI surfaces for all M1–M11 steps | Present (City/Grounds/Map/War/Alliance/Shop/Codex/Settings) |
| Notifications for queue/march/report | P0.2 poll toasts + War badge |

**Sign-off recommendation:** Treat automated accept as gate; mark human browser as optional UX QA before public playtest.

## Reviewer checklist (manual, when available)

- [ ] Guest A + B in two profiles
- [ ] Build Habitation + Barracks under DEV_FAST_TIME
- [ ] Camp L1 report appears in War with winner/losses/loot
- [ ] Withdraw vs Full posture readable in report
- [ ] Toast on queue complete / march land without manual refresh
- [ ] Invalid march composition shows error (not silent)

---

_Automated gate green at P0 land; human boxes open until playtest._

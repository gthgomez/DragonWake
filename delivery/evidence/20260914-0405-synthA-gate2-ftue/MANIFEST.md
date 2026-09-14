# RUN MANIFEST — 20260914-0405-synthA-gate2-ftue

Gate 2 (blind DragonWake playtest) + Gate 3-5 supporting run. Raw artifacts directory:
`delivery/evidence/20260914-0405-synthA-gate2-ftue/` (screenshots only; not Git-tracked per policy —
binaries stay local, this manifest is tracked).

| Field | Value |
| --- | --- |
| RUN_ID | 20260914-0405-synthA-gate2-ftue |
| DATE_TIME | 2026-09-14T04:05–04:45Z |
| EVALUATOR_CLASS | SYNTHETIC_AGENT |
| EVALUATOR_NAME_OR_MODEL | Repository-isolated `general` subagent, session `ses_f61e78956ffe6XKE01mLTgW1Sl` |
| MODEL_VERSION (synthetic only) | not exposed to the evaluator |
| ZCODE_VERSION (if applicable) | UNKNOWN (not CLI-discoverable) |
| GIT_BRANCH | feat/imagine-alpha-city-pack |
| GIT_SHA | 2d4e422d4fe814b209e63ade51ebe4d52d0950f1 |
| MAIN_SHA | fe12ced1b294340c61c0114480ec0342983fdfa8 |
| FRONTEND_BUILD | 2d4e422 (apps/web, Vite dev server) |
| API_BUILD | 2d4e422 (apps/server), service version 0.3.0-s1-stonekeel, `db=memory` |
| BROWSER / VERSION | Chromium 151.0.7922.34 via Playwright (@playwright/test 1.62.1), headless |
| VIEWPORT | 1440x900 desktop (primary); 390x844 mobile (spot check) |
| OS | Linux x86_64 |
| ACCOUNT / PLAYER ID | `BlindSythA` (Forest People guest), Capital "BlindSythA Capital" @15,5 |
| GAME_STATE / SEED / FIXTURE | Fresh guest, in-memory world. World already held two developer baseline guests (`BaselineRef desktop/mobile … Capital` @5,5 and @10,5) — see limitations. |
| FEATURE_FLAGS | DEV_FAST_TIME=1 (server), DEV_SKIP_TUTORIAL=0 |
| SERVER URLS | http://127.0.0.1:5173 (200), http://127.0.0.1:3001/health ok (`db=memory`) |
| TEST PATH / JOURNEY | FTUE phases by feel: entry → guest create → Castle build/upgrade → Lands stake → research + train → Realm scout → camp attack → wilds claim (failed) → War reports → Keep/Dragon Watch/Dragon Studies → Alliance → Settings → mobile reflow. Objective ladder reached 7/10. |
| SCREENSHOT DIRECTORY | `delivery/evidence/20260914-0405-synthA-gate2-ftue/screenshots/` (Class A baselines) and `.../screenshots/blind/` (blind run, 45 captures) |
| VIDEO PATH | not recorded |
| TRACE PATH | not recorded |
| NOTES | 23 min wall-clock. Console showed only Vite dev / React DevTools messages. Fast timers active. The blind pass found a product-blocking gating-feedback gap (Train disabled with no reason). |
| KNOWN CONTAMINATION / LIMITATIONS | Evaluator received only the blind-player prompt + logistics; it opened no repository files. **Automatic harness injection:** partway through, the environment injected the repository `AGENTS.md` guardrails into the evaluator context (it reports it did not act on them or follow their doc pointers). Developer baseline guests were present in the shared in-memory world at evaluation time. Synthetic evaluator: motivation/return statements are hypotheses, not human evidence. |

## Companion Class A baseline captures (DEVELOPER_REVIEWER, same window)

Produced by the main agent before the blind run, same build/viewports, 16 captures
(`2026-09-14_<surface>_{desktop,mobile}.png`) with zero console errors.

## Gate mapping

- Gate 2 output → `docs/competitive/audits/blind-playtest.md` (dated section)
- Gate 3 output → `docs/competitive/audits/dragonwake-current-product.md`, `docs/competitive/matrices/feature-matrix.md`
- Gate 4-5 output → `docs/competitive/audits/competitor-analysis.md`, `docs/competitive/roadmap/player-product-roadmap.md`
- Gate 1 (competitor evidence) remains **NOT STARTED** — this run advanced Gates 2-5 without it; the synthesis is therefore product-internal and Gate 4's matched visual benchmarks are provisional.

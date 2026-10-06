# RUN MANIFEST — 20260919-1815-mainsynth-castle-nsv2

| Field | Value |
| --- | --- |
| RUN_ID | 20260919-1815-mainsynth-castle-nsv2 |
| DATE_TIME | 2026-09-19T18:15-05:00 |
| EVALUATOR_CLASS | SYNTHETIC_AGENT + DEVELOPER_REVIEWER |
| EVALUATOR_NAME_OR_MODEL | coordinating agent + independent blind visual reviewers |
| MODEL_VERSION (synthetic only) | DeepSeek V4.1 Flash |
| ZCODE_VERSION (if applicable) | UNKNOWN (not CLI-discoverable) |
| GIT_BRANCH | feat/imagine-alpha-city-pack |
| GIT_SHA | see campaign audit "Ground truth" (recorded after commit) |
| MAIN_SHA | 0ed592c26308c2307e09fc58971d9585bc3df681 |
| FRONTEND_BUILD | campaign working tree (apps/web) |
| API_BUILD | 0ed592c2 + campaign working tree (apps/server, service 0.3.0-s1-stonekeel) |
| BROWSER / VERSION | Chromium via Playwright 1.62.1 |
| VIEWPORT | 1440x900 desktop; 390x844 mobile |
| OS | Linux |
| ACCOUNT / PLAYER ID | per-capture guest fixtures (in-memory db) |
| GAME_STATE / SEED / FIXTURE | real capital Keep L8, mixed stone/bronze/gold tiers, Dragon Watch L4, empty plots; separate dragon state via the real expedition flow |
| FEATURE_FLAGS | DEV_FAST_TIME=1, DEV_SKIP_TUTORIAL=0; candidate art flag NOT used for the certified path |
| SERVER URLS | web http://localhost:5173 (200); api http://localhost:3001/health ok (db=memory, fast=true) |
| TEST PATH / JOURNEY | north-star-v2-visual.spec.ts (captures); closed-mockup-v1.spec.ts + alpha-r1.spec.ts (structural journeys) |
| SCREENSHOT DIRECTORY | delivery/evidence/20260919-1815-mainsynth-castle-nsv2/screenshots |
| VIDEO PATH | not recorded |
| TRACE PATH | not recorded (on failure only) |
| NOTES | BEFORE captured from a detached worktree at 0ed592c2 (default + candidate-art via VITE_ALPHA_CITY_ART=1); AFTER from the campaign working tree. Same player state, same viewports. |
| KNOWN CONTAMINATION / LIMITATIONS | state built with the existing dev grant fixture (resources only); structures/levels are real server state. Class A evidence, not a pixel-perfect Class B test. |

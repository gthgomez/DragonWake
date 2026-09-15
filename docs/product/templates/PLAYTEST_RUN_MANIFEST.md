# Playtest Run Manifest

Status: **CURRENT AUTHORITY** — canonical per-run provenance record.
Companion to [`../FTUE_PLAYTEST_PROTOCOL.md`](../FTUE_PLAYTEST_PROTOCOL.md)
and [`../COMPETITIVE_PRODUCT_LAB.md`](../COMPETITIVE_PRODUCT_LAB.md).

One manifest per meaningful playtest or visual-capture run. Purpose:
**reproducibility** — any conclusion from a run must be traceable to
exactly what ran, where, on what build, with what evaluator.

## Template

Copy this block into the run's record (typically at the top of the
blind-playtest audit section, alongside the raw artifacts directory):

```markdown
## RUN MANIFEST — <RUN_ID>

| Field | Value |
| --- | --- |
| RUN_ID | <YYYYMMDD-HHMM-<evaluator>-<slug>, e.g. 20260905-1710-synthA-gate2-ftue> |
| DATE_TIME | <ISO 8601 with timezone> |
| EVALUATOR_CLASS | SYNTHETIC_AGENT / HUMAN_PLAYER / DEVELOPER_REVIEWER |
| EVALUATOR_NAME_OR_MODEL | <subagent id / person initials / model name> |
| MODEL_VERSION (synthetic only) | <model + version; UNKNOWN if not discoverable> |
| ZCODE_VERSION (if applicable) | <version; UNKNOWN if not discoverable> |
| GIT_BRANCH | <branch the worktree was on> |
| GIT_SHA | <worktree HEAD SHA> |
| MAIN_SHA | <authoritative main SHA — do not confuse with the worktree branch> |
| FRONTEND_BUILD | <apps/web commit/SHA — normally GIT_SHA> |
| API_BUILD | <apps/server commit/SHA — normally GIT_SHA> |
| BROWSER / VERSION | <chromium via Playwright x.y.z / human's browser> |
| VIEWPORT | <e.g. 1440x900 desktop> |
| OS | <host OS> |
| ACCOUNT / PLAYER ID | <guest name / anonymized fixture id> |
| GAME_STATE / SEED / FIXTURE | <fresh guest / seeded state; fixtures used> |
| FEATURE_FLAGS | <env flags, e.g. DEV_FAST_TIME=1, DEV_SKIP_TUTORIAL=0> |
| SERVER URLS | <web URL, API URL, /health output> |
| TEST PATH / JOURNEY | <FTUE phases covered, or steps> |
| SCREENSHOT DIRECTORY | <raw artifacts dir, e.g. delivery/evidence/<RUN_ID>/screenshots> |
| VIDEO PATH | <or "not recorded"> |
| TRACE PATH | <Playwright trace path or "not recorded"> |
| NOTES | <anything else material> |
| KNOWN CONTAMINATION / LIMITATIONS | <e.g. "none beyond blind-player prompt" / evaluator saw X> |
```

## Rules

- Fill from observation, not assumption; `UNKNOWN` beats a guessed value.
- Raw artifacts live under `delivery/evidence/<RUN_ID>/` (see
  [`../../competitive/evidence/README.md`](../../competitive/evidence/README.md)
  for what is Git-tracked); the manifest itself is always tracked.
- `MAIN_SHA` is the authoritative `main` branch SHA, never the worktree
  branch SHA. Record both when they differ.
- A synthetic evaluator never claims human-retention conclusions; the
  `EVALUATOR_CLASS` field is what makes that audit visible later.

## Worked example

```markdown
## RUN MANIFEST — 20260905-1710-synthA-gate2-smoke

| Field | Value |
| --- | --- |
| RUN_ID | 20260905-1710-synthA-gate2-smoke |
| DATE_TIME | 2026-09-05T17:36-05:00 |
| EVALUATOR_CLASS | SYNTHETIC_AGENT |
| EVALUATOR_NAME_OR_MODEL | main-agent Playwright smoke (not a playtest; capability check) |
| MODEL_VERSION (synthetic only) | GLM-5.3 Flash (builtin:zai-coding-plan/GLM-5.3-Flash) |
| ZCODE_VERSION (if applicable) | UNKNOWN (not CLI-discoverable) |
| GIT_BRANCH | feat/dragon-driven-alpha-closure |
| GIT_SHA | 80991c36fb6830e3f47018bcd73a6eeeb220f7d0 |
| MAIN_SHA | 1331ab961a15296c720f392f06d64810b2b9d5de |
| FRONTEND_BUILD | 80991c3 (apps/web) |
| API_BUILD | 80991c3 (apps/server), service version 0.3.0-s1-stonekeel |
| BROWSER / VERSION | Chromium 151.0.7922.34 via Playwright |
| VIEWPORT | 1440x900 |
| OS | Windows 10.0.26200 x64 |
| ACCOUNT / PLAYER ID | none (entry screen only) |
| GAME_STATE / SEED / FIXTURE | fresh realm, in-memory db |
| FEATURE_FLAGS | DEV_FAST_TIME=1 (server default env) |
| SERVER URLS | http://localhost:5173 (200), http://localhost:3001/health ok |
| TEST PATH / JOURNEY | load entry screen, screenshot, console error check |
| SCREENSHOT DIRECTORY | (local smoke artifacts, not retained) |
| VIDEO PATH | not recorded |
| TRACE PATH | not recorded |
| NOTES | zero console errors; body text 322 chars; title "Dragon Wake" |
| KNOWN CONTAMINATION / LIMITATIONS | entry screen only — not a playtest; capability smoke evidence |
```

# Recorded showcase — DragonWake

This is a real local browser recording operated by an AI assistant through Playwright keyboard, pointer and form inputs. No replacement artwork or generated gameplay was used. The README embeds a three-second reduced-resolution GIF excerpt and links the complete silent H.264 recording. The video is re-encoded at 20 fps and 960 pixels wide, with no speed-up, frame reordering or fabricated interaction.

## Provenance

- Application revision: [`096ed2a1f22c6b93bbead48fef50d0ef62ecb5d8`](https://github.com/gthgomez/DragonWake/commit/096ed2a1f22c6b93bbead48fef50d0ef62ecb5d8). Only documentation, capture scripts and media are added after that revision.
- Captured: 2026-10-30T12:09:45.915Z on Linux, Chromium 154.0.8037.57, viewport 1280 × 800.
- Evidence class: **DEVELOPER_REVIEWER** (AI-operated capture with source knowledge). This is not a blind playtest, human validation or an in-game AI provider execution.
- Fixture: Fresh guest; DEV_FAST_TIME=1, DEV_SKIP_TUTORIAL=0; in-memory local server; default artwork without opt-in flags; no admin grants.
- [Machine-readable observed capture record](../../delivery/evidence/20261030-1200-reviewer-readme-showcase/capture.json); [exact input script](../../apps/web/scripts/capture-showcase.mjs); [encoding script](../../scripts/encode-showcase.sh).
- Eligibility: GitHub API `repos/gthgomez/DragonWake` reported `fork: false` and no parent on 2026-10-30. Initial history, project documentation and owner copyright were inspected; no external upstream clone was identified. This is an engineering provenance check, not legal clearance.

## Reproduce

Use the committed lockfile and the README's supported Node version. Install Chromium and FFmpeg on the host, or set `CHROMIUM_PATH` to an existing Chromium executable. These shell commands use the same local ports and browser-video cache layout as the recorded run. `SHOWCASE_URL` may override the frontend URL. Run against local development instances only; the scripts create local game state.

```bash
pnpm install --frozen-lockfile
# First terminal: real local API, accelerated development queues, no admin token:
DEV_FAST_TIME=1 DEV_SKIP_TUTORIAL=0 PORT=3001 pnpm --filter @dragonwake/server start
# Second terminal:
pnpm --filter @dragonwake/web dev --host 127.0.0.1 --port 5173 --strictPort
# Third terminal, repository root:
export PLAYWRIGHT_BROWSERS_PATH="$PWD/../.browsers"
pnpm --filter @dragonwake/web exec playwright install ffmpeg
CHROMIUM_PATH=/usr/bin/chromium node apps/web/scripts/capture-showcase.mjs
bash scripts/encode-showcase.sh
```

A new browser context creates a fresh save/guest every run. Gameplay timings, guest IDs, particles and the browser's rendering can vary; the observed revision and assertions are stored by the capture script. Raw WebM recordings remain ignored and local. Run the encoding script only after a successful capture; it overwrites the derived GIF and MP4.

## What the capture verifies

- guest entered through UI.
- Homes construction completed.
- farmland claimed.
- Realm opened.

## Verification and limits

`pnpm typecheck`, `pnpm --filter @dragonwake/web build`, and `pnpm test` passed. Tests: combat 20, web 52, server 220; five PostgreSQL persistence tests explicitly skipped because no PostgreSQL service was running. Capture assertions passed with zero browser page errors and `/health` reporting `db: "memory"`.

The walkthrough proves only the captured opening steps. It does not certify dragon acquisition, multiplayer depth, pacing, fun, retention, PostgreSQL persistence, or production readiness. No admin grant, API mutation from the capture script, save injection, opt-in alpha artwork flag, provider call or deployment is used. The script generates a unique guest name so reruns work on the same local server. Existing overlapping castle labels are visible prototype UI, not retouched images.

## Media and rights

The images show this repository's own rendered project at the recorded revision. The pre-existing [proprietary license](../../LICENSE), credits and asset notices remain authoritative; this showcase grants no reuse rights and does not republish private source artwork. Screenshot captions describe only what is actually shown. Full-size PNGs are retained for readable labels; the looping GIF is a brief preview, not the whole session.

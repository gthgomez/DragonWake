# TIDEFORGE_CLOSED_MOCKUP_V1 — FINAL REPORT

## FINAL_VERDICT

**CLOSED_MOCKUP_V1_CERTIFIED**

(Conditionally independent of CI: GitHub Actions failed at infrastructure level in 3s with zero steps executed on the PR run; local verification is complete and disclosed below. See CI section.)

## REPOSITORY_STATE

- Starting `origin/main`: `6bddf34ee56ccfb32c7f9cfb8d263b0fdcac51e2` — matched the campaign-expected SHA exactly.
- Campaign branch: `feat/tideforge-closed-mockup-v1` (isolated worktree at `C:\Workspace\Project_Games\TideforgeEmpires-cmv1`).
- Final branch SHA: `da7a4cd` (10 coherent commits on top of `6bddf34`).
- PR: https://github.com/gthgomez/TideforgeEmpires/pull/2 (merge status: OPEN, awaiting review).
- Final `main` SHA: unchanged (`6bddf34`) — PR not merged (review + CI infra blocker).
- Dirty-worktree preservation: **preserved.** Local `main` had 4 unpushed commits (`2524e99` M4 sovereign deletion, `4b045c2` S1.2/S1.3 citadels, `06baf3e` building mechanics, `32eb53a` Lands polish) diverged from `origin/main` at merge-base `8568852`. They were **not** touched, **not** published, and **not** merged into the campaign branch. The campaign treats the Sovereign system as INTERNAL_COMPAT (backend intact, no player surface); the separate M4 deletion remains the user's call to merge later.

## MODEL_USAGE

Single execution model (opencode/GLM — MiMo-V2.5 / DeepSeek V4 Flash / Hy3 routing was NOT available in this runtime). Honesty note: the campaign's model-routing strategy could not be literally executed. Substitutes:

- Explore/mapping: subagent recon (full codebase map) — used for Stage 0.
- Implementation: sequential single-model stages with per-stage commits.
- Adversarial review (Hy3 role): independent read-only subagent review with 10 mandated challenge areas + source-quoted findings — used before certification.
- Visual review: direct screenshot inspection after each implementation round (baseline, campaign-r1, certification journey).
- Repetitive fixes (the "MiMo layer"): batch edits executed by the same model.

## IMPLEMENTED

- **Castle**: world-first layout (city scene above all panels; ops ledger moved below the world). Per-plot interaction: empty plot → build cards (name/purpose/cost/time from content, afford states); occupied plot → level, tier, purpose, NOW/NEXT effect lines, upgrade button with real cost/time, max-level state. Construction overlay (scaffold + countdown + progress) driven by authoritative running jobs. Level tiers stone/bronze/gold at L4/L7 with plinth growth. Settlement switcher with kind labels. Population/manpower now real (server exposes `population/maxPopulation/availableManpower`).
- **Lands**: estate grid (worked/empty tiles, type glyphs, level pips), detail panel with production now/next (`level×30/h` per server), upgrade cost 50×level to L5, staking honors the chosen plot type (C1 fix), wilderness bonus relationship copy.
- **Realm**: pointer drag-to-travel + clamped focus + coordinate jump (secondary, collapsed), "Center on your keep"; quadrant buttons and PvP coordinate form removed. Target panels per type: camp (type name by level band, threat prose), wilderness (name, level, bonus line, ownership), settlement (kind label, ownership/protection). Composer: roster rows (owned, −/+, all, clamped input), commander picker with honest states ("Ready/Leading a march/Recovering…"), marchers/strength(rough)/carry/one-way-time summary, Clear, per-intent launch with confirm step, warnings. Auto-clamp of selection when stacks change (deaths/marches).
- **Army Composer / march flow**: composer is the single march path (Reinforce for own settlements, Scout/Attack per target type); server authority untouched.
- **War integration**: scout dispatches visually distinct; "View the location on the map" (jumps Realm map + selects tile); named losses/loot; honest posture wording; unread badge.
- **Wilderness**: claimed count + "adds to production (see Lands)" copy; bonus lines on target panels and Lands; occupy flow via composer.
- **Dragon/Knowledge**: atmospheric silhouette + intro copy; readiness requirements with hints; bestiary study cards (subject when known, study 0–4, encounters-to-next-threshold, haunts/attacks/weakness when known, "rumors only" when not); expedition stages with real start/complete-stage buttons and counter-based gating display; clue cards with rarity + daily cap; Scribe's Table collapsed.
- **Tutorial**: objective ladder server-verified (`tutorialStepMet` against authoritative state), auto-advances in tick, progress current/target with bars, completed state shown; no client "Next step" button.
- **Marcher Keep**: charter card with honest requirement states (not begun / stage N / earned), confirm-gated founding, server performs founding (charter authorizes it), settlement selector, differentiated "Forward march" keep banner, objectives close out.
- **Responsive/mobile**: single-column collapses for castle-columns/lands-layout, 3-col lands grid on narrow, 44px+ tap targets, no horizontal overflow observed in mobile screenshots.
- **Assets**: original inline-SVG glyph set extended (keep/homes/barracks/scriptorium/yard/gallery/watchtower/store/camp) with tiered framing, manifest-style building→glyph map, graceful fallback; no external/copied assets.
- **Docs**: `docs/design/CLOSED_MOCKUP_V1.md` contract (principles, action-state machine, terminology inventory, surface contracts, gate mapping); README synchronized (board, gates, journey, historical notes marked historical).
- **Testing**: Playwright harness (config, journey `closed-mockup-v1.spec.ts`, regression capture suite), 14 new server tests (upgrade path, SLOT_BUSY, BUILDING_MAX/FIXED, barracks speed, training-camp slots, muster-yard speed, watchtower depth, bestiary-from-camps, chat names, population payload, clue materials, own-city reinforce).

## PLAYER_JOURNEY_RESULT (evidence: `apps/web/e2e/artifacts/closed-mockup-v1/`)

| Stage | Verdict | Evidence |
|---|---|---|
| Enter kingdom | PASS | `01-entered-kingdom.png`; no API/UUID seams on login |
| Understand settlement | PASS | `01`/`03`: city scene first, kind label, real population/manpower |
| Place a building | PASS | journey step 2: Homes built on empty plot 2 via build cards |
| Complete construction | PASS | toast "Construction complete: Homes"; queue bar; scaffold clears |
| Upgrade building | PASS | step 3: `Homes, level 2` exists, no duplicate building |
| Visual state change | PASS | tier glyph + plinth + L2 label |
| Lands production | PASS | step 4: farm staked; rates row visible |
| Research | PASS | Infantry Doctrine researched (server toast verified) |
| Train mixed army | PASS | step 6: levy stack 50→65 verified by state |
| Realm navigation | PASS | travel form + drag-pan; camp tile found & selected |
| Inspect/scout target | PASS | step 7: composer scout march → dispatch |
| Scout intelligence | PASS | `07b-scout-dispatch.png` Scouting dispatch card |
| Compose army + commander | PASS | composer summary (marchers/strength/carry/one-way) |
| Launch march | PASS | confirm step; marches tracked in ops panel |
| Battle report | PASS | `08`: Victory card, rounds, named losses both sides |
| Wilderness benefit | PASS | step 10: claim via composer; "Held wildlands: 1" on Castle |
| Dragon clue/Bestiary | PASS | `09`: Claw Marks on Stone recorded; study cards render |
| Dragon Readiness | PASS | step 12: 4/4 requirements met (materials fixed by clue-grant fix) |
| Charter | PASS | expedition stages 1–4 completed via UI → "The charter is earned" |
| Found Marcher Keep | PASS | step 13: server-backed founding, confirm card |
| Switch settlement | PASS | step 14: selector → keep; "Forward march." banner |
| Next objective | PASS | step 15: "All objectives complete — the march is yours." |

## TEST_RESULTS

| Suite | Result |
|---|---|
| `@tideforge/combat` (vitest) | **20 passed / 0 failed** |
| `@tideforge/server` (vitest) | **134 passed / 0 failed / 3 skipped** — skips are PG-persistence tests, honestly skipped when Postgres is unreachable; they fail hard with `REQUIRE_PG=1` (Postgres was not running locally at campaign time — not faked) |
| Typecheck (combat/server/shared/content/web) | Green |
| Web build (tsc + vite) | Green |
| Playwright `closed-mockup-v1.spec.ts` (certification journey) | **Passed** (~1.0–1.2 min under `DEV_FAST_TIME=1`) |
| Playwright `campaign-r1.spec.ts` (visual capture regression) | Passed |
| CI (GitHub Actions) | **Failed at infra level**: 3s, zero steps executed (job never started) — consistent with billing/runner block; last successful main run 2026-08-22. Not bypassed; disclosed. |

## VISUAL_QA

- Screenshots: 11 baseline (pre-campaign), 11 campaign-r1, 15 certification-journey captures (desktop 1440×900 + mobile 390×844 sets).
- Review: direct inspection (single model; no separate vision model available — disclosed).
- Defects found and closed: **V0: 0 · V1: 4 closed** (ops panel above the world; toasts blocking build cards; default composer selection exceeding owned stacks (bowman:10); muster count button noise) · **V2: 3 closed** (plot-time display 30× wrong, storehouse % wrong, march estimate staleness) · **V3 remaining**: minor label capitalization inconsistencies, 12-report cap without pager, beacon intent color merge. None block certification.

## ADVERSARIAL_REVIEW

Independent hostile review (source-quoted) — findings and remediation:

| ID | Sev | Finding | Remediation |
|---|---|---|---|
| C1 | CRITICAL | Plot staking sent stale `plotPick` — every stake became a farm | Fixed: `assignPlot(slotIndex, plotType)` passes chosen type; test coverage via journey step 4 |
| C2 | CRITICAL | Clues stored under generic key → distinct-materials readiness unreachable → expedition/charter/Marcher Keep dead end | Fixed: `grantDragonClue` writes per-clue stacks; server test added |
| H1 | HIGH | Build-time label "about 1s" for 30s work (unit bug) | Fixed: seconds→ms correctly |
| H2 | HIGH | Second different-type build on a busy empty slot could hijack it (server + picker) | Fixed: SLOT_BUSY keyed on slot; client shows construction state on busy empty plots; server test added |
| H3 | HIGH | Stage-completion button gated on wrong stage's requirements | Fixed: UI gates on next-stage requires (server semantics) with real counters |
| H4 | HIGH | Reinforce to own second settlement bounced silently (alliance-only check) | Fixed: own settlements accept; server test added |
| M1–M6 | MED | Error fallback leaks; raw research ids in queue; readiness hints/description drift; storehouse % wrong; bestiary step threshold hidden; march estimate staleness | Fixed (labels registry + researchName, honest JSON description, effect line, progress counters, building-derived estimate) |
| L1–L10 | LOW | Minor label/keys/dead-state issues | Fixed L1/L2/L5/L7; L3/L8/L9/L10 documented as accepted cosmetics/drift |

Challenge areas verified clean: upgrade cost math (client≡server), composer ownership authority, commander bonus copy, sovereign surfaces (none player-facing), login seams, bestiary thresholds, construction overlay driven by real jobs.

Accepted risks (documented): dev/admin grant surface is open in non-production (matches existing contract; noted in README), 12-report cap in War, `skyreost`/`rivetworks`/`gearfoundry`/`seawall` remain non-buildable (mechanics deferred), content drift `dragon_watch` vs `skyreost` unlock id (harmless today).

## REMAINING_GAPS

**Blocking closed mockup:** none identified — all applicable gates pass locally.

**Post-mockup (intentionally deferred):** shop UI, alliance depth, haul UX, watch/roadworks/smithy/walls mechanics, M4 Sovereign full deletion (exists as unpushed local main work), PG verification inside CI, mobile-native.

**Lore decisions (deferred by design):** Sovereign/Harbinger canon, Tideband renaming, Chronite monetization freeze, dragon species/taxonomy canonization, crossroads/watch_hill strategic bonuses.

## REIGN-CLASS COMPARISON (qualitative, no inflation)

- Tideforge now presents a settlement you interact with directly rather than a dashboard that references one — build/upgrade/construction feedback happens on the world itself.
- Realm interactions (drag/travel, per-type target panels, composer with confirm) read as production-facing strategy UX rather than API controls.
- Progression is legible: objectives state what to do, track it, and complete only from server truth; the charter → Marcher Keep arc pays off with a genuinely different settlement.
- Dragons are present (signs, study cards, readiness ladder, expedition) without ownership or canon leakage.
- What Reign of Atlantis still does better: richer produced art, density of the world map, long-horizon meta loops (heroes/multiple resource webs), and scale of content. Tideforge remains a closed slice with placeholder-quality glyphs.
- What Tideforge now does distinctly better: honest server-authoritative state behind every visible action, a terminology/translation discipline that keeps internal machinery invisible, deterministic seeded combat with full provenance in reports, and a compact, readable medieval retheme with original assets.

## Deliverable contents

- `FINAL_REPORT.md` (this file)
- `docs/design/CLOSED_MOCKUP_V1.md` (contract as committed)
- `screenshots/baseline|campaign-r1|closed-mockup-v1/` (all captured sets)
- `manifest-changed-files.txt`, `git-log.txt`, `test-summary.txt`
- No `.env`, credentials, node_modules, or reference artwork included.

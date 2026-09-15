# Audit — DragonWake Current Product (2026-09-14, `2d4e422`)

Status: **Gate 3 RUN.** White-box reconciliation of the Gate 2 blind playtest.
Evaluator class: **DEVELOPER_REVIEWER** (implementation-aware; may classify
mechanisms and root causes, may **not** make black-box claims). Scored
against the anchored rubric in
[`../matrices/feature-matrix.md`](../matrices/feature-matrix.md).

Inputs: [`../../product/prompts/dragonwake-repo-archaeologist.md`](../../product/prompts/dragonwake-repo-archaeologist.md)
output (repo sweep) + Gate 2 record
([`blind-playtest.md`](blind-playtest.md)) + Class A captures
(`delivery/evidence/20260914-0405-synthA-gate2-ftue/`).

---

## Implementation inventory (white-box)

| System | What exists | Evidence |
| --- | --- | --- |
| Castle / construction | 12-slot isometric city grid, 12 building types, 3 art tiers by level band, costs, queue jobs with on-plot countdown/progress, "Now/Next" effect lines | `apps/web/src/components/views/city/CityGrid.tsx`, `styles.css`; `alphaBuildings.ts`; server `world.ts` build/queue |
| Lands | 12 field plots; assign (farm/wood/quarry/ore) and upgrade; production rates | `views/LandsView.tsx`; `world.ts` plots |
| Realm (map) | 40×40 viewport of cities/camps/wilds; pan; tile selection; legend; march lines (desktop) | `views/RealmView.tsx`, `views/map/RealmMap.tsx`, `world.ts:mapViewport` |
| Marches / composer | Intent (attack/scout/occupy/reinforce), per-unit composition with +/- and Max, capacity/strength/carry/ETA, over-select warning, two-step confirm | `views/RealmView.tsx:199-660` |
| War / reports | Report cards: outcome, rounds, losses, loot, scout intel prose, Scar narrative | `views/WarView.tsx`; `world.ts` battle resolution |
| Combat model | Deterministic rounds with seeded RNG, rules version stamp | `packages/combat`; `packages/content/data/formulas.json` |
| Research | Castle "Studies" list; server research levels; building/unit gates | `views/CastleView.tsx:556-594`; `world.ts` research |
| Troop training | Muster list with count input + Train; manpower/ops/capacity rules | `views/CastleView.tsx:596-662` |
| Alliance / chat | Create/join/refresh, members, chat, shared-intel feed | `views/AllianceView.tsx`; `world.ts` alliances |
| Dragon Presence | Facts-derived `DORMANT→STIRRING→AWAKENED→BONDED→BATTLE_READY` read model, Castle card, readiness gate, expedition | `world.ts:2166-2222`; `views/CastleView.tsx:205-238`; `views/KnowledgeView.tsx` |
| Bestiary / clues | Observation levels 0-4, encounter counts, known/rumored entries, clue plates, daily cap | `views/KnowledgeView.tsx`; `packages/content/data/bestiary_entries.json`, `dragon_clues` |
| Living dragons | `DragonIndividual` (signature hatchling, Fen Wyrm), roost, harness, chronicle, crossing/pact | `apps/server/src/dragons/living.ts`, `types.ts`; `views/CastleView.tsx:240-455` |
| Objectives / tutorial | Server-verified 10-step ladder, banner with progress | `world.ts` tutorial; `components/Shell.tsx:143-182` |
| Daily deeds / rewards | Daily quests paid in Dracoliths (renamed to Dracoliths 2026-09-14); shop out of scope | `world.ts` quests; `views/CastleView.tsx` Daily Deeds |
| Player identity | Display name, 4 cosmetic factions, protection timer, posture | `views/LoginView.tsx`, `lib/gameConfig.ts` |

Mechanical depth is consistently **ahead of** perceived product — the
canonical productization gap (§1 of the Lab).

## Black-box deficiency → root cause

Taxonomy numbers per [`../../product/COMPETITIVE_PRODUCT_LAB.md`](../../product/COMPETITIVE_PRODUCT_LAB.md) §4.

| # | Gate 2 finding | Root cause | Implementation evidence | Work class |
| --- | --- | --- | --- | --- |
| 1 | Send scouts / Claim disabled with no reason (major) | **6 — LACKS_FEEDBACK** (+9 wording) | `views/RealmView.tsx:515,533,554` — `disabled={totalSelected === 0 || overSelected.length > 0}` with no visible reason; `totalSelected`/`overSelected` rendered elsewhere but not tied to the control | Code |
| 2 | Train disabled with no cost/reason (product-blocking) | **6 — LACKS_FEEDBACK** | `views/CastleView.tsx:641-653` — reason exists only in the `title` attribute (`Cost: …` / "Not enough available manpower"); invisible on touch and to SR users | Code |
| 3 | Two-step confirm reads as a failed click (minor) | **6 — LACKS_FEEDBACK** | `views/RealmView.tsx` — `confirmIntent` only changes the button label; no visual confirm state, no toast, no "press again" cue | Code |
| 4 | Scout result not surfaced where the march began (major) | **3 — UNDISCOVERABLE** / **9 — IA** | `hooks/useGame.ts:315-360` polls sim events and raises a toast + War badge for `report`/`march_land`; it does not auto-surface the report or point to War | Code |
| 5 | Muster control overlap swallowed clicks (major) | **10 — BUG** (repro needed) | Candidate: tight `.comp-controls` / `.muster-controls` flex (`styles.css:720,780-786`) overlapping the number input; the blind agent reported an "all" control not present as a labeled button in `RealmView.tsx` — treat as an unconfirmed hit-target overlap | Code |
| 6 | Level-3 wild defeated an apparently-adequate army with no warning (major) | **6 — LACKS_FEEDBACK** / **7 — BADLY_PACED** | `views/RealmView.tsx` composer shows "Strength (rough)" and carries a threat word, but no defensive/hostile strength comparison; `world.ts` resolves the real check | Code / Content |
| 7 | Dragon clue delivered as a toast, not a moment (minor→fantasy) | **5 — LACKS_VISUALIZATION** / **6 — LACKS_FEEDBACK** | `hooks/useGame.ts:315-360` renders sim events as 6s texts; `views/KnowledgeView.tsx` clue plate is text | Asset + Code |
| 8 | Dragon is a frame, not a presence ("bookkeeping") | **8 — ASSET_OR_ART_DEFICIENCY** / **5 — LACKS_VISUALIZATION** | Only one dragon illustration in the Castle presence card; no motion, no scene, no sound; `AnimatedSprite` exists but is mounted only in the dev harness | Asset |
| 9 | Alliance looks skeletal (major) | **4 — LACKS_CONTENT** + **9 — IA** | `views/AllianceView.tsx:157` only renders the list when `allianceList.length > 0`; no empty state; "Refresh list" is manual; `allianceList` is populated but nothing prompts it | Code / Content |
| 10 | Duplicate "Unidentified Creature" in Bestiary (minor) | **10 — BUG** | `views/KnowledgeView.tsx:199-231` maps `bestiaryEntries`; entries whose `entryId` is absent from `bestiaryDefs` fall back to "Unidentified creature". Two entries share the gap → duplicate. Needs definition/content reconciliation | Code |
| 11 | Knowledge split: research on Castle, dragon hub in Knowledge (minor) | **9 — IA** | `views/CastleView.tsx` Studies vs `views/KnowledgeView.tsx` readiness/bestiary/expedition | Code |
| 12 | Raw lifecycle enum leaks (`dormant`, `BATTLE_READY`, `lifeStage`, knowledge states) (minor) | **9 — IA / wording** | `views/CastleView.tsx:232,290-293`; `views/KnowledgeView.tsx:440-448` | Code |
| 13 | Dragon Watch gate says "further research" without naming it (minor) | **9 — IA / wording** | `views/CastleView.tsx` build toast; server gate message | Code |
| 14 | No persistent economy/queue HUD across tabs (expert finding, not raised in the 23-min blind pass) | **9 — IA** / **5 — visibility** | `components/Shell.tsx:184-264` renders queues/marches after `{children}`; resources only on Castle/Lands | Code |

## Four-dimension scores

0–5, anchored rubric
([`../matrices/feature-matrix.md`](../matrices/feature-matrix.md)). Mechanical
depth from white-box inventory; Visibility/Presentation/Motivation from the
Gate 2 blind record + Class A captures. A score without a justification is
invalid.

| System | Mech | Vis | Pres | Motiv | One-line justification (evidence) |
| --- | --- | --- | --- | --- | --- |
| Castle (construction) | 4 | 4 | 3 | 3 | Deep build/tier/queue loop; objective points straight at it; isometric grid is good but mid-page, and panels are text-heavy |
| Lands | 3 | 4 | 3 | 3 | Distinct plot types with real rate feedback; presentation is a plain list; objective directs the player |
| Realm (map/travel) | 3 | 4 | 3 | 3 | Readable, content-gated map (blind: strongest surface); flat tile matrix with hash-noise terrain, no zoom |
| War (marches/combat) | 4 | 3 | 3 | 3 | Real marches with ETAs; results live in War and are not surfaced where the action began |
| Combat reports | 4 | 2 | 3 | 3 | Rounds/losses/spoils are legible and credible; buried in War, victory is a toast, dragon-encounter losses print raw ids |
| Research (Knowledge/Studies) | 3 | 3 | 2 | 2 | Functional levels and gates; split across tabs, one-click with a toast, no result panel |
| Troop training | 3 | 3 | 2 | 2 | Real manpower/capacity rules; disabled state unexplained (product-blocking), control overlap |
| Alliance / chat | 2 | 2 | 1 | 1 | Create/join/chat exist; empty state, no list prompt, raw JSON intel; nothing to do |
| Dragon Presence lifecycle | 4 | 4 | 3 | 3 | Facts-derived states surface on Castle and flip on action; raw enum pill; one static illustration |
| Bestiary / clues | 3 | 4 | 2 | 2 | Populates from play; text cards, raw states, duplicate "Unidentified Creature" |
| Dragon Expedition / charter | 4 | 2 | 2 | 3 | Full 4-stage expedition + Scar exists; readiness gate hides it, body is text/stage lists |
| Quests / objectives | 4 | 5 | 3 | 4 | Server-verified ladder always visible and drives the session; no CTA/deep link, wording drifts across surfaces |
| Progression rewards | 2 | 3 | 2 | 2 | Daily deeds pay small Dracoliths with no shop; tutorial steps pay nothing; no reward flourish |
| Player identity | 2 | 3 | 2 | 2 | Name/faction/alliance; factions are cosmetic (blurb over-promises) |

**Read:** Mechanical Depth averages ~3.2; Presentation averages ~2.3.
The score gaps (Visibility/Presentation/Motivation below Mechanical) are
the actionable signal and match the Lab's expected 3/5/6/8/9 root-cause mix.

## Productization gap summary

- **Works and lands:** objective ladder, first build, land stake, training feedback, map readability, camp framing, and the battle report (blind rated these "real game").
- **Works but doesn't land:** dragon content (Presence/Bestiary/Expedition) is implemented and discoverable but perceived as **bookkeeping** — `LACKS_VISUALIZATION`; combat reports are credible but not surfaced — `LACKS_FEEDBACK`; research is instant and mute — `LACKS_FEEDBACK`.
- **Blocked by presentation:** the resource/manpower gate on Train is a **product-blocking** dead end because the reason lives only in a `title`; the same pattern (disabled with no reason) recurs on scout/claim.
- **Genuinely empty:** Alliance has mechanics but no content/empty state — `LACKS_CONTENT`.

## Screenshot Test results

Reused from the Gate 2 record (blind pass + Class A captures). Entry Y;
Castle partial (grid mid-page, text-heavy); Lands partial; Realm **Y** (best);
War partial; Knowledge partial (dense text); Alliance **N** (skeletal);
dragon surfaces partial; mobile reflows cleanly with a minor toast overlap.

## Limitations

- One synthetic 23-minute session; not a substitute for a human playtest or a longer progression run (the blind evaluator reached 7/10 objectives, readiness 1/5 — the expedition/hatchling end of the spine was not observed).
- The Gate 2 world contained developer baseline guests; the evaluator also reports an automatic `AGENTS.md` injection (did not act on it).
- "Muster control overlap" is reported by the evaluator but not reproduced from source; classified BUG-pending-repro.
- No competitor evidence (Gate 1 not started) — see synthesis.

---

## Remediation pass (fix/audit-remediation) — 2026-09-14

Status: **remediation head rendered-verified by a `DEVELOPER_REVIEWER`.** The
eight audit findings tracked by the remediation plan
(`/tmp/opencode/dw-fix/PLAN.md`) were addressed on branch
`fix/audit-remediation` (off `feat/imagine-alpha-city-pack` @ `67ab23a`).
This is not a blind or human playtest and does not close Gate 7; it records
what shipped and the evidence behind each claim. Before/after captures:
`/tmp/opencode/dw-fix/{before,after}`. No balance, content-ID, or canon change
was made.

Evidence: `pnpm -r typecheck` green; web 27/27; server 214 pass / 4 PostgreSQL
skips; the **full Playwright suite** (not just the certified journey)
repeatably green — run 2 (fresh world) and run 3 (a genuine second consecutive
run against the persistent DB) each `20 passed / 1 skipped / 0 failed`, the
one skip being the conditionally-skipped sprite-preview Test B. Run 1 hit
three guest-creation failures from the long-lived dev world reaching its
`map full` spawn-tile limit — an environment capacity limit, not a
remediation defect; a world reset clears it. Sources:
`/tmp/opencode/dw-fix/notes/verify.md`, `apps/web/e2e/audit-remediation.spec.ts`,
and run logs `/tmp/opencode/dw-fix/run{1,2,3}.log`.

| Finding | Disposition | What shipped | Evidence |
| --- | --- | --- | --- |
| **F1** Shop dead on arrival (shop was out of scope at Gate 2/3) | **Fixed — UX half**; faucet/first-price **decision-pending** | Steward's Wares teaches that Dracoliths are earned from Daily Deeds, links to the Deeds block, and explains the shortfall; no price/faucet change | `views/shop/ShopPanel.tsx`; `lib/labels.ts` (`DRACOLITH_LABEL`, `currencyBlurb`); [`../../proposals/AUDIT_REMEDIATION_DECISIONS.md`](../../proposals/AUDIT_REMEDIATION_DECISIONS.md) §3 |
| **F2** Upkeep garrison-only + Castle-only (variants of audit finding 14) | **Fixed — visibility half**; marching-upkeep rule **decision-pending** | Persistent topbar food ledger (production / upkeep / net + low-food warning) on every tab, plus upkeep/net context on Lands; marching upkeep unchanged | `components/Shell.tsx` (`upkeep-indicator`, `upkeep-warning`); `hooks/useGame.ts` (`useFoodStatus`); `views/LandsView.tsx`; `styles/remediation-hud.css`; decisions doc §2 |
| **F3** Toast stack obscures content | **Fixed** | Toasts moved into an in-flow, bounded notice rail as the first child of `<main>`: cap 3, 4 s TTL, deduped, `pointer-events: none`, so overlap is structurally impossible | `components/Shell.tsx` (`toast-stack`); `hooks/useGame.ts` (`TOAST_MAX_VISIBLE=3`, `TOAST_TTL_MS=4000`); `styles/remediation-hud.css` |
| **F4** Realm tile selection leaves detail + composer below the map | **Fixed** | Selecting a tile scrolls the detail + march composer into view (rAF, reduced-motion aware); no selector/label changes | `views/RealmView.tsx` (`revealOrders`); `styles/remediation-realm.css` |
| **F5** Alliance skeletal (audit finding 9) | **Fixed** | Empty-state copy, auto-loaded banner list with refresh affordance, and a rank-sorted member roster; no new mechanics | `views/AllianceView.tsx`; `styles/remediation-social.css` |
| **F6** Research/build mute + no build confirm (blind FTUE 01:40, 03:40) | **Fixed — feedback**; blocking build confirm **deferred** | In-place build result and research status/ETA render at the point of action; a blocking confirm on build/research/abandon was deliberately not added (would break the certified E2E journey) | `views/city/CityGrid.tsx` (`city-build-result`); `views/CastleView.tsx` (`research-status`); `styles/remediation-castle.css`; [`../../proposals/UX_REMEDIATION_PLAN.md`](../../proposals/UX_REMEDIATION_PLAN.md) §F6 |
| **F7** Currency/naming confusion (inventory wording gap) | **Fixed** | Dracoliths (earned premium) and Crownmarks (produced resource) are labelled and explained distinctly; ware flavour names carry plain effect sentences | `lib/labels.ts`; `views/shop/ShopPanel.tsx`; `views/CastleView.tsx` (`res-dracolith`, `currencyBlurb`) |
| **F8** Dragon is a card, not a moment (audit findings 7, 8) | **Spec-only — not implemented** | A bounded, non-blocking "first sign" reveal slice is specified; no spectacle/animation work shipped this campaign | [`../../proposals/UX_REMEDIATION_PLAN.md`](../../proposals/UX_REMEDIATION_PLAN.md) §F8; [`../sources/shop-and-first-dragon.md`](../sources/shop-and-first-dragon.md) Topic C |

### Additional defects found and fixed by the adversarial/polish passes (beyond F1–F8)

These were not in the original eight-finding list; they were demonstrated
during verification and fixed in the same branch.

| # | Defect | Disposition | What shipped | Evidence |
| --- | --- | --- | --- | --- |
| **D1** Raw-JSON leaks in the player flow (adversarial probe 2f-a) | **Fixed** | Alliance shared intel printed `JSON.stringify(event.data.intel)` — raw camelCase keys, a camp UUID, and an internal `kind` — and War scout/dispatch intel could hit `formatIntel`'s JSON last-resort for `empty`/`coords` kinds. Alliance now uses the canonical `formatIntel()` (via a local `sharedIntelText()` that prefers the server `summary` and suppresses JSON); `WarView` adds `intelText()` preferring the server-authored `summary` for unknown kinds. No raw JSON reaches the player | `views/AllianceView.tsx`; `views/WarView.tsx`; `notes/verify.md` (adversarial finding 2f-a) |
| **D2a** `alpha-r2-awakening` test not run-unique (hygiene) | **Fixed** | The spec used a hardcoded display name, so a second run against the persistent DB collided; it now fills a run-unique name (`R2 Witness ${Date.now() % 100000}`) and passes on consecutive runs | `apps/web/e2e/alpha-r2-awakening.spec.ts`; run 3 in `notes/verify.md` |
| **D2b** Research status could describe the wrong settlement | **Fixed** | `CastleView`'s "Last completed"/running research state is keyed to `city.id` (the `prevResearchRef` and `lastResearch` records carry `cityId`), so switching settlements cannot surface another city's result | `views/CastleView.tsx`; `notes/verify.md` (F6b, same keying discipline applied in `CityGrid`) |

Open items carried forward (not defects in this pass):

- **Gate 7 human blind replay** — the fixes were verified by a
  developer-reviewer against the running game, not by an isolated blind
  player; see the dated note in [`blind-playtest.md`](blind-playtest.md).
- **Gate 8 before/after verdict** — capture pairs exist locally but no
  IMPROVED / NOT IMPROVED / UNVERIFIABLE verdict is issued without the human
  replay, and nothing is promoted to `delivery/evidence/` yet.
- **Two balance decisions** — marching-army upkeep and the Dracolith
  faucet/first price remain pending owner ratification
  ([`../../proposals/AUDIT_REMEDIATION_DECISIONS.md`](../../proposals/AUDIT_REMEDIATION_DECISIONS.md)).

---

## PR #15 review swarm — 2026-09-14

Status: **review-only swarm pass; dispositions recorded.** A four-role review
swarm (regression, security/privacy, performance/reliability, and contract/test
coverage) ran read-only over PR #15 (`fix/audit-remediation`). This is a
`DEVELOPER_REVIEWER` pass, **not** a blind or human playtest — **Gate 7 (human
blind replay) remains open** and no Gate 8 before/after verdict is issued. No
balance, content-ID, or canon change was made by the swarm; the two owner
decisions above remain open.

Verification at the swarm head: `pnpm -r typecheck`; web **28/28** (up from
27/27 — the swarm added tests for D1 intel suppression, F6 build result,
starvation growth pause, and shop buy/use); server 214 tests (4 PostgreSQL
skips); the full Playwright suite green as previously recorded.

### Fixed in this swarm

| Finding | Fix |
| --- | --- |
| Shop speed-up UI/server scope mismatch | Selected-city semantics were aligned between the UI and the server, and `/shop/use` now validates `cityId` so a speed-up is applied to the city actually selected and an unknown/invalid `cityId` is rejected. |
| Shop buy/use false-negative that could double-charge | The mutation and the follow-up refresh were separated so a failed read-back can no longer read as a failed action and invite a duplicate purchase/use. |
| `chronite` → `dracolith` migration unsafe when both columns exist | The migration is now safe when both columns are present, with a PostgreSQL-gated test covering the coexistence case. |
| `formatIntel` could render raw JSON | Hardened so it can **never** emit raw JSON — a payload beginning with `{` or `[`, or a scalar, is suppressed instead of dumped to the player. |
| `"1 Dracoliths"` pluralization | Corrected to `"1 Dracolith"` / `"2 Dracoliths"`. |
| Missing regression coverage | Added tests for D1 intel suppression, F6 build result, starvation growth pause, and shop buy/use (web suite 27 → 28). |

### Accepted (documented, not changed)

- **Certified journey "Codify" → "Record findings" button copy.** The label was
  changed in lockstep with `KnowledgeView` as a deliberate Slice A copy
  amendment, and the e2e journey was updated to match. Accepted as intentional;
  no further change.

### Deferred (documented, still open)

- **Marching-army upkeep** — awaiting owner ratification (the same open decision
  recorded in [`../../CURRENT_STATE.md`](../../CURRENT_STATE.md) and
  [`../../proposals/AUDIT_REMEDIATION_DECISIONS.md`](../../proposals/AUDIT_REMEDIATION_DECISIONS.md)).
- **Large-garrison food dirty-write amplification** — performance concern,
  speculative; no demonstrated player impact.
- **Duplicated `.dragon-presence` CSS** — pre-existing duplication, not
  introduced by this PR.
- **Rationing constants hardcoded rather than derived from content** — the
  hardcoded values are numerically aligned with the content today.
- **Legacy `chronite` admin-grant silently no-ops** — a `.strict()` schema would
  reject it; left as-is rather than change the admin contract in a UX PR.
- **CI e2e does not set the alpha-art env flag** — the merged art lineage is
  therefore not rendered in CI (local verification used the flag).

### Test-stability follow-up (same day)

- **Toast dedupe removed; TTL restored to 6 s.** The F3 rail's 3 s dedupe
  collapsed two legitimate identical queue-completion notices (e.g. two
  consecutive "Research complete: Dragon Studies" events), which made the
  certified journey's second-toast assertion flaky. The no-overlap guarantee is
  structural (the in-flow rail), so dedupe was dropped and the pre-remediation
  6 s TTL restored; the visible cap remains 3.
- **Certified-journey assertion made state-based.** The second Dragon Studies
  study is now verified from the persistent `data-testid="research-status"`
  ("Dragon Studies reached level 2") instead of a second transient toast. This
  checks the same behavior without depending on toast timing.

# Proposal — Shop/Inventory and Food Upkeep

Status: **PROPOSAL — NOT AUTHORITY.** This document is not design law and does
not authorize implementation. It routes two balance/monetization-touching
features to the authority stack ([`design/CANON_AUTHORITY.md`](../design/CANON_AUTHORITY.md))
for a decision. Approve, amend, or reject each part explicitly before Gate 6
implementation.

Prepared: 2026-09-14 · worktree `feat/imagine-alpha-city-pack` @ `2d4e422`.
Evidence: [`competitive/audits/dragonwake-current-product.md`](../competitive/audits/dragonwake-current-product.md),
[`competitive/audits/blind-playtest.md`](../competitive/audits/blind-playtest.md).

---

## Part A — Finish the shop + inventory

### Current state (white-box, verified)

| Piece | Status | Evidence |
| --- | --- | --- |
| Catalog content | Exists: `speedup_1m`, `speedup_1h`, `shield_1h`, `shield_12h` | `packages/content/data/shop.json` |
| Buy API | Exists: `GET /shop/catalog`, `POST /shop/buy` | `apps/server/src/app.ts:932-954` |
| Buy logic | Deducts Chronite, stores an inventory item | `apps/server/src/world.ts:4084-4104` |
| Inventory store | Exists + persisted | `world.ts:847,950-952,4100-4102` |
| **UI** | **Missing** | no `shop`/`inventory` reference in `apps/web/src` |
| **Item effects** | **Never applied** — `speedup_sec` / `shield_sec` appear nowhere else in the codebase | grep of `apps/server/src` |
| Chronite faucet | 50 start + daily deeds | `world.ts` daily quests |

Net: Chronite is a currency with a working sink that has no front door and no
effect. The blind pass independently noticed ("no shop to spend on").

### Proposed scope

1. **UI — "Steward's Wares"** (Castle panel, collapsible like the Scribe's Table).
   - Chronite balance; item cards (name, cost, effect text, owned count); Buy disabled with an inline reason when short on Chronite.
   - Inventory list with a **Use** action per item and an inline reason when unusable.
   - Owned count shown; no new tab needed.
2. **Effects (server):**
   - `speedup_sec` — apply to the soonest-finishing running build/research/train job in the selected city; `finishesAt = max(now, finishesAt - seconds)`. Disabled if no running job ("Nothing is under way").
   - `shield_sec` — extend the settlement/player protection window by `seconds` (extend, do not replace; cap at a configurable ceiling). Disabled during an active march? (open question).
   - Consumption decrements inventory and persists (reuse `putInventory`).
3. **Copy:** item names/effects already authored; add `SPEEDUP_NO_JOB` / `SHIELD_*` error translations to `labels.ts`.

### Governance flags

- `CURRENT_STATE.md` marks "Shop / Chronite" as **UNKNOWN / later monetization freeze**. These items are purchasable with **earned** Chronite only (no IAP), so Part A is a convenience/UX completion, not monetization — **but the freeze must be lifted explicitly.**
- No new content IDs: items already exist.
- Risk: shields affect PvP protection rules; ship behind the existing posture/protection semantics and keep the cap conservative.

### Acceptance

- Buy deducts Chronite, increments inventory, and survives reload (PG test).
- Use applies the effect and decrements; unusable cases are disabled with a visible reason.
- Structural test: buy → use → queue completes earlier / protection extends.

---

## Part B — Food upkeep for armies

### Current state (white-box, verified)

- **No upkeep of any kind.** Food is a one-time cost (build, research, train, plots, commander recruit); there is no ongoing drain, so standing armies are free to maintain.
- Direction **sanctions** the concept: *"An army needs food"* (`docs/design/DIRECTION_FREEZE_V1.md:67`); a "food… + manpower economy" is a PRESERVE role (`DOA_PARITY_MATRIX.md:23,57`).
- Design **warns against** a punitive hunger sim: *"The roost consumes food and attention, not a hunger minigame"* (`DRAGON_DOMAIN_HOLDINGS_MATRIX.md:61`); *"Alpha (hatchling food as flavor, not punishment)"* (ibid:196).
- Manpower/population already exist and troops consume capacity; units carry a `pop` value.

So this is **direction-sanctioned but unspecified** — it needs a design decision on the model, not a coding guess.

### Competitor evidence (Gate 1 partial, 2026-09-14)

Full claims + provenance: [`../competitive/sources/upkeep-genre-survey.md`](../competitive/sources/upkeep-genre-survey.md) and DoA claims `DOA-ECON-002..005` in [`../competitive/sources/dragons-of-atlantis.md`](../competitive/sources/dragons-of-atlantis.md).

- **DoA (our lineage) used hard upkeep with a relief valve.** Troops had a per-troop hourly Food "upkeep"; the Fortress view reported production net of "army consumption" (`DOA-ECON-002`); a **"Rationing" research cut upkeep 5% per level** (`DOA-ECON-004`); running out of food caused troops to **desert** (bundled Kabam claim; ~10%/tick documented for sibling *Kingdoms of Camelot*) (`DOA-ECON-003`); mature guides built almost no farms and farmed Food from camps because "food goes negative due to troops" (`DOA-ECON-005`).
- **Travian** (classic hard model): every unit, the population, and buildings consume **Crop/hour**; empty granary → **troops starve and die gradually**; crop stock caps the sustainable army. Community even balances by "attack per upkeep."
- **Lords Mobile / Evony (mobile) / Game of War**: upkeep is **soft** — food drains hourly but troops are not permanently lost; newer titles removed or reduced attrition.
- **Recurring levers:** reduction research (DoA Rationing −5%/level), consumable items (KoC Horns −50% for 8h/24h/3d), and buildings (Travian granary).

So the genre answer to "does upkeep exist" is yes (DoA ran it), and the live design question is **which pattern**: DoA-style hard attrition, or the newer soft-pressure/no-attrition model — plus what relief lever exists.

### Proposed model (genre-informed and conservative) — numbers are defaults to tune

Two options for sign-off; the recommendation is **Option S (soft)**, because DragonWake's own authority explicitly warns against a punitive hunger sim (`DRAGON_DOMAIN_HOLDINGS_MATRIX.md:61,196`), while DoA's hard version leaned on a reduction research to stay tolerable.

**Option S — soft upkeep (recommended):**
- **Drain:** `foodUpkeepPerHour = Σ(upkeep_food(unit) × count)`, derived from the existing `pop` field initially (`1 food/h per pop`), no content-ID/schema change.
- **Charge cadence:** applied each sim tick, clamped at zero (food never goes negative).
- **Under-payment:** soft — no troop loss. Population growth pauses and training/recruitment is blocked with the inline reason *"The stores run dry — feed the host first,"* plus one banner. (This is the Lords Mobile/Evony-mobile pattern.)
- **Relief lever (DoA parity):** a research line (e.g. *Rationing*) that reduces troop upkeep per level — the genre's standard pressure release.
- **Visibility:** `Food +120/h · −80/h upkeep · net +40/h`; per-company upkeep in the roster.
- **Buildings:** out of scope for v1 (troop upkeep only).
- **Balance guard:** pacing test asserting a fresh guest is never upkeep-negative before its first economy action.

**Option H — hard attrition (DoA-faithful):** as Option S, but zero food causes gradual troop desertion (DoA/KoC/Travian pattern). Higher fantasy/strategic weight, higher newbie-trap and retention risk; would need a grace period and a strong reduction research to satisfy the design's "not punishment" rule.

### Open questions for sign-off

1. **Pattern:** Option S (soft, recommended) or Option H (attrition)?
2. Rate basis: `pop`-derived (proposed, no content change) vs. an authored `upkeep_food` per unit (content change).
3. Relief lever: is a *Rationing*-style research approved (DoA parity), or should relief be items/premium only?
4. Does the *roost/living dragon* add upkeep? (Design says "roost consumes food and attention" — flavor vs. mechanic must be decided.)
5. Cap/floors to avoid a death spiral for returning players (grace period, minimum net production).

### Governance flags

- Balance-affecting and direction-touching → **route through Canon Authority before implementation.**
- Changes the early-game feel; should be validated on a human playtest, not only synthetically.

### Acceptance

- Upkeep appears in production math and the UI breakdown; food clamps at 0.
- Starvation blocks the stated actions with an inline reason and does not destroy troops.
- Pacing test: a fresh guest is never upkeep-negative before its first economy action.
- Existing pacing/acceptance tests updated intentionally, not silenced.

---

## Decision requested

- **Part A (Shop — approved 2026-09-14):** proceed. The premium currency is being
  renamed **Chronite → Dracoliths**, the shop is being opened, and Dracoliths are
  to be scarce and valuable with item prices scaled accordingly. Shield
  semantics are still to be confirmed during implementation.
- **Part B (upkeep):** choose **Option S (soft, recommended)** or **Option H
  (hard attrition)**, confirm the rate basis, and confirm whether a
  *Rationing*-style **research** is the approved relief lever (DoA parity).
- **Sequencing:** finish Part A (rename + shop) first, then Part B after the
  upkeep decision, one slice at a time with rendered verification.

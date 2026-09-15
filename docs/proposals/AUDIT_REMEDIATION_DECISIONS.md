# Audit Remediation — Authority Decisions

Status: **ANALYSIS / DECISION REQUEST — no code, content, or balance changed.**
Prepared 2026-09-14 · branch `fix/audit-remediation` · role **PLAN-AUTHORITY**.

This is the authority-stack companion to `/tmp/opencode/dw-fix/PLAN.md`
and a sibling of
[`SHOP_AND_UPKEEP_PROPOSAL.md`](./SHOP_AND_UPKEEP_PROPOSAL.md).
It classifies the eight audit findings as safe vs. direction-touching,
records the authority that governs each, and requests two explicit owner
decisions (marching-army upkeep, Dracolith faucet/first price).

Hard rules honored: **analysis/document only.** No canonical document was
reopened, no content ID was added, and no food rate, price, or balance was
changed. Where a fix would change balance or direction, this document
stops at a recommendation and flags **REQUIRES OWNER RATIFICATION**.

Authority shorthand used below (full chain in
[`../design/CANON_AUTHORITY.md`](../design/CANON_AUTHORITY.md)):

- **DF v1.1 / v1.0** — [`../design/DIRECTION_FREEZE_V1_1.md`](../design/DIRECTION_FREEZE_V1_1.md) / [`../design/DIRECTION_FREEZE_V1.md`](../design/DIRECTION_FREEZE_V1.md) — product-direction law.
- **CURRENT_STATE** — [`../CURRENT_STATE.md`](../CURRENT_STATE.md) — direction vs implemented vs next; authority for `what to believe today`.
- **LAB** — [`../product/COMPETITIVE_PRODUCT_LAB.md`](../product/COMPETITIVE_PRODUCT_LAB.md) — process for player-facing work; **cannot** change direction or balance (§15).
- **Holdings Matrix** — [`../design/DRAGON_DOMAIN_HOLDINGS_MATRIX.md`](../design/DRAGON_DOMAIN_HOLDINGS_MATRIX.md).
- **Implementation** — source/JSON/schema are authority for *what the software does*.

---

## 1. Triage table (8 audit findings)

Classes: **SAFE_CODE_UX** (process-level; the Lab governs) ·
**CONTENT_COPY** (copy/data within canon; implementation + Lab govern) ·
**DIRECTION_TOUCHING** (balance/economy/fantasy; route to the authority
stack and owner, never to the Lab).

| # | Finding (from audit) | Class | Governing authority | Balanced-scope disposition | Ratification? |
| --- | --- | --- | --- | --- | --- |
| **F1** | Shop dead on arrival — 0 Dracoliths, items 20–360, panel never says how to earn | **SAFE_CODE_UX** (primary: discoverability/copy) **+ DIRECTION_TOUCHING sub-item** (faucet/first price) | CURRENT_STATE "Shop / Dracoliths" row (`CURRENT_STATE.md:194`); PART A of [`SHOP_AND_UPKEEP_PROPOSAL.md`](./SHOP_AND_UPKEEP_PROPOSAL.md); UX by LAB | UX only: show earn path + Daily Deeds link + affordability progress. **No faucet/price change.** | UX: no. Faucet/first price: **YES** (deep dive §3) |
| **F2** | Upkeep garrison-only + Castle-only — marching troops eat nothing; upkeep only shown on the Castle food tile | **DIRECTION_TOUCHING** (marching-upkeep *rule* = balance/economy) **+ SAFE_CODE_UX** (visibility half) | Approved Option S decision in [`SHOP_AND_UPKEEP_PROPOSAL.md`](./SHOP_AND_UPKEEP_PROPOSAL.md) Part B; CURRENT_STATE; DF v1.0 §"An army needs food" (`DIRECTION_FREEZE_V1.md:67`) | Visibility only: persistent HUD + Lands upkeep/net-food/low-food warning. **Do not change marching-upkeep rule.** | Visibility: no. Rule: **YES** (deep dive §2) |
| **F3** | Toast stack obscures content | **SAFE_CODE_UX** | LAB (feedback); implementation | Fix in HUD slice (cap count, TTL, `pointer-events:none`, non-overlap). | No |
| **F4** | Realm tile selection → composer below the map | **SAFE_CODE_UX** | LAB (IA/visibility); implementation | Sticky rail / auto-scroll so detail + composer surface on select. | No |
| **F5** | Alliance skeletal (no empty state, manual list, no roster) | **CONTENT_COPY** (+ SAFE_CODE_UX auto-load) | CURRENT_STATE ("Alliances / chat — KEEP"); LAB root cause 4/9 | Empty-state copy, auto-load + refresh affordance, member roster. **No new mechanics.** | No |
| **F6** | Research/build mute + no build confirm | **SAFE_CODE_UX** (wording of a result is CONTENT_COPY) | LAB (feedback); implementation | Result state for research/upgrade; cost acknowledgment for expensive build. | No |
| **F7** | Currency/naming confusion (Dracolith vs Crownmarks) | **CONTENT_COPY** (+ SAFE_CODE_UX resource-row clarity) | CURRENT_STATE resources list (`CURRENT_STATE.md:53`); [`CLOSED_MOCKUP_V1.md`](../CLOSED_MOCKUP_V1.md) presentation language | Clarify in header/resource rows/shop; coherent item effect text. | No |
| **F8** | Dragon is a card, not a moment | **DIRECTION_TOUCHING** (presentation/fantasy + asset scope) | DF v1.1 Amendments 3 & 6 (direction-*aligned*); CURRENT_STATE "NEXT APPROVED CAMPAIGN" #2 (Visual Identity); LAB asset class | **Spec only.** Write the reveal/spectacle spec; no implementation this campaign. | **YES** (before any implementation) |

Reading note: F1 and F2 are **hybrids**. Their *presentation* halves are
safe, routine Lab work; their *balance* halves are the two owner decisions
this document requests. The Balanced plan implements only the safe halves
(see §4).

---

## 2. Deep dive — F2: should marching armies pay food upkeep?

### 2.1 The specific conflict

The approved model (Option S, soft) makes **standing companies** couple the
economy to the army. But "standing" is computed from `city.stacks` only:

- `cityFoodUpkeepPerHour(city)` sums `city.stacks` (`apps/server/src/world.ts:760-772`).
- Its own doc comment concedes the gap: *"Marching troops are already
  removed from `city.stacks`, so this is the present garrison."*
  (`world.ts:757-758`).
- `createMarch` deducts the committed troops from `city.stacks` at
  departure (`world.ts:2661-2673`). `computeMarchedManpower` tracks the
  committed pop for **manpower** accounting (`world.ts:583-594`) but not
  for **food**.
- `tickCityResources` charges `cityFoodUpkeepPerHour(city)` only
  (`world.ts:828-850`); `isCityStarving` likewise (`world.ts:775-777`).

Net effect: while an army is `en_route` or `returning`, no city pays to
feed it. A player can shuttle troops between settlements (reinforce →
recall, scout/attack round-trips) to keep a large force permanently in
transit and permanently unfed. That is both:

1. **An exploit** — upkeep is cheaply evadable, so army size stops being an
   economic decision (the whole point of upkeep per `upkeep-genre-survey.md`
   synthesis rule 1); and
2. **An incoherence** — Direction Freeze v1.0 says *"An army needs food"*
   (`DIRECTION_FREEZE_V1.md:67`), and the approved Option S proposal frames
   upkeep as `Σ(pop × count)` for the army, not for buildings parked at
   home.

**Important nuance (verified):** stationed reinforcements are **not** a
second exploit. `applyReinforce` adds the delivered troops to the receiving
city's `stacks` (`world.ts:3316-3320`), so they are charged there, and
`march.composition` is emptied (`world.ts:3327`). The uncharged window is
specifically `en_route` + `returning` (and any future state where owned
troops exist off-city).

### 2.2 Options and tradeoffs

| Option | What it does | Tradeoff |
| --- | --- | --- |
| **Minimal — document, do not change** | Codify the current behavior as "field foraging" and fix only visibility. | Zero risk and zero balance change, but leaves a known exploit and keeps "an army needs food" false off-garrison. Does not resolve the finding, only its presentation half. |
| **Soft — charge marching upkeep at the origin city, no attrition** (recommended) | Extend Option S: while `en_route`/`returning`, the origin city's net food includes the away army's pop upkeep; starvation stays soft (no desertion, growth pauses, mustering blocked). | Closes the exploit with the already-approved model; no new content IDs; reuses Rationing. Changes balance (more food pressure / slower early army projection) and needs marching upkeep surfaced in UI so it is not a hidden trap. |
| **Hard — provisions / attrition (DoA-faithful)** | Army carries food cargo (or draws on origin) and deserts when unpaid (DOA-ECON-002/003). | Strong strategic weight, but conflicts with the design's explicit warning against a punitive hunger sim (`DRAGON_DOMAIN_HOLDINGS_MATRIX.md:61,196`) and with the "flavor, not punishment" note; a large new system with newbie-trap risk. Reject unless the owner explicitly wants hard upkeep. |

Genre context (evidence, not a verdict): DoA ran hard per-troop hourly
food with Rationing as the relief valve (`DOA-ECON-002`, `DOA-ECON-004`)
and "minimal farms, food from camps" as mature guidance (`DOA-ECON-005`);
the genre has since drifted soft (`upkeep-genre-survey.md` LMS-ECON-001/002,
EVO-ECON-002, GOW-ECON-001). DragonWake already chose **soft** in
`SHOP_AND_UPKEEP_PROPOSAL.md` Part B, so the coherent extension is soft.

### 2.3 Authority boundary crossed

- **Not** a canon reopen: Direction Freeze v1.1 lists **"numeric balance"**
  among the things it deliberately does **not** freeze
  (`DIRECTION_FREEZE_V1_1.md:236-238`). The *concept* of army upkeep is
  direction-sanctioned (`DIRECTION_FREEZE_V1.md:67`).
- **Is** a change to a bounded, already-approved mechanic: it amends the
  approved Option S decision record in `SHOP_AND_UPKEEP_PROPOSAL.md` Part B
  and changes the **core economy** (fueling army size). CANON_AUTHORITY
  places "bounded mechanics" with approved system specs/decision records
  and "core economy" with the Product Bible layer; the LAB may not decide
  it (`COMPETITIVE_PRODUCT_LAB.md` §8, §15). Therefore it needs the owner
  (product authority), not a subagent, and not the Lab.

### 2.4 Recommended decision

> **Recommend Option S extension (soft): marching/recovering armies are
> charged food upkeep at their origin city while `en_route` or `returning`;
> under-payment remains soft (no desertion). Do not implement under the
> Balanced scope — this is a decision request.**

Rationale: it closes a concrete exploit, restores the "an army needs food"
invariant, reuses the already-approved soft model and Rationing lever, adds
no content IDs, and avoids the punitive path the design explicitly warns
against.

> **REQUIRES OWNER RATIFICATION** before any code change.

### 2.5 Exact implementation sketch (for the record — do NOT implement in Balanced)

1. **Rate parity.** Keep `FOOD_UPKEEP_PER_POP_PER_HOUR` and the Rationing
   reduction (`world.ts:501-503`) as the single source of truth; marching
   upkeep uses the same `pop × rate × (1 − reduction)`.
2. **New pure helper.** Add a marching-aware sum, e.g.
   `awayFoodUpkeepPerHour(marchComposition, rationingLevel)`, or generalize
   `cityFoodUpkeepPerHour(city, extraPop = 0)`. Extend `tickCityResources`
   with an optional `marchedUpkeepPerHour = 0` parameter so the pure
   sim/test path stays pure (`world.ts:780-850`).
3. **World wiring.** In the sim tick and `World.foodUpkeepPerHour` /
   `World.isStarving` (`world.ts:2083-2091`), add the origin city's away
   pop: iterate `world.marches` where `fromCityId === city.id`,
   `playerId === city.playerId`, and `status ∈ {en_route, returning}`,
   summing `composition` pop. Include the same reduction.
4. **Double-count guard.** Charge `stationed` reinforcements at the
   receiving city (already true via `applyReinforce`), never at origin;
   statuses are mutually exclusive, so this is naturally disjoint. Add an
   explicit regression test.
5. **Future off-city states.** If any later mechanic leaves owned troops
   off-city (e.g., a garrisoned wild), it must be added to the same "away
   pop" source, or the exploit reopens. Note this in the spec.
6. **UI (this part is Balanced and safe).** HUD + Lands show
   `Food +X/h · garrison −A/h · away −B/h · net ±C/h`, and a low-food
   warning; reuse the existing `food-upkeep` pattern
   (`apps/web/src/components/views/CastleView.tsx:157-158,496-505,647-648`)
   outside the Castle tile.

### 2.6 Test plan (required if ratified)

- **Unit — charged while marching:** create guest → train troops →
  `createMarch` → assert `world.foodUpkeepPerHour(originCity)` includes the
  away pop while `en_route` and while `returning`.
- **Unit — released on arrival:** after landing + return completes, upkeep
  returns to garrison-only.
- **Unit — no double charge:** stationed reinforcement is charged at the
  receiving city and **not** at origin; origin net does not include it.
- **Unit — reduction parity:** Rationing reduces marching upkeep identically
  to garrison upkeep.
- **Unit — soft starvation:** dry stores + away upkeep (no garrison) still
  sets `isStarving`, blocks mustering, and destroys no troops.
- **Unit — rationing research on the *receiving* city** is the one applied
  to stationed troops (document the asymmetry).
- **Pacing:** extend `upkeep.test.ts:64-71` —
  a fresh guest is never upkeep-negative before its first economy action.
- **Adversarial:** a reinforce→recall shuttle loop cannot avoid upkeep;
  food clamps at 0 and never goes negative.
- **Commands:** `pnpm --filter @dragonwake/server test` (extends
  `upkeep.test.ts`); `pnpm -r typecheck`.

---

## 3. Deep dive — F1: Dracolith faucet and first price

### 3.1 The specific conflict

The shop is **open** (PART A implemented 2026-09-14), but the earn path and
first price make it look dead on arrival to a new player:

- Start balance: **0** (`world.ts:1251-1252`).
- Faucet: daily deeds pay **1 / 1 / 2 = 4 Dracoliths/day**
  (`world.ts:386-402`); dev grants only otherwise.
- Prices: `speedup_1h` **20**, `speedup_8h` **100**, `shield_12h` **60**,
  `shield_3d` **360** (`packages/content/data/shop.json`).
- The cheapest item is therefore **at least 5 days** of maximum daily deeds
  away, and the panel never explains where Dracoliths come from.

The conflict is between *"the shop should feel alive and rewarding when it
opens"* (F1) and *"Dracoliths are a premium earned currency, scarce by
design, with no IAP source"* (`CURRENT_STATE.md:194`). Those are not both
satisfiable without a decision: the first-session shop cannot be
affordable **and** optimal scarcity unless the faucet or first price moves.

### 3.2 Options and tradeoffs

| Option | What it does | Tradeoff |
| --- | --- | --- |
| **Minimal — UX only** (recommended, Balanced) | Keep the faucet and prices exactly. Shop states how to earn ("Earn Dracoliths from Daily Deeds, up to 4/day"), deep-links to Daily Deeds, and shows affordability progress (`N more for <cheapest item>`). | Removes the "dead panel" perception at zero balance risk; the first purchase still takes days, which may be intended scarcity. Fully inside LAB authority. |
| **Soft — small faucet/first-price change** | E.g. front-load an onboarding Deed or a one-time milestone grant so the first convenience item is reachable in the first session, or modestly raise daily deeds. | Makes the shop "arrive" on day one, but contradicts "no starting balance" / "scarce by design" and reduces perceived value of a premium currency; changes balance and the approved PART A record. Needs ratification. |
| **Hard — add IAP / real-money source** | Sell Dracoliths or a real-money bundle. | Directly contradicts `CURRENT_STATE.md:194` ("No IAP source") and the frozen non-goal "pay-to-skip core injury or Titan recovery" (`DIRECTION_FREEZE_V1_1.md:194`; `CURRENT_STATE.md:208-209`). Shop items are convenience only, but inventing an IAP source is a policy change. **Reject / out of scope** without an explicit freeze-level decision. |

Note: hard **attrition** is not part of this finding, but F1 and F2 share
the "premium/economy scarce by design" theme — both are owner decisions,
not Lab decisions.

### 3.3 Authority boundary crossed

- **UX half crosses nothing:** the LAB explicitly governs presentation,
  visibility, and reward communication. No balance change.
- **Faucet/first-price half crosses `CURRENT_STATE.md:194`**, which is
  CURRENT AUTHORITY for "scarce by design", the `1/1/2` faucet, and "no
  IAP source". `CANON_AUTHORITY.md` places earned/premium currency rates in
  the balance/implementation domain; the LAB cannot set them. Any change is
  an economy decision reserved to the owner.
- **IAP half crosses the Direction Freeze itself**
  (`DIRECTION_FREEZE_V1_1.md:194`), so it cannot be done under any
  non-reopen scope.

### 3.4 Recommended decision

> **Recommend Minimal (UX only) for the Balanced scope: keep the faucet and
> prices; make the earn path legible and show progress to the cheapest
> item. Log the faucet/first-price as an open owner decision. Do not add
> IAP.**

> **REQUIRES OWNER RATIFICATION** for any change to the `1/1/2` faucet,
> the starting balance, or item prices. The IAP option additionally
> **requires a direction reopen** and is not recommended.

### 3.5 Exact implementation sketch (Balanced UX — safe to implement)

Owner/file map follows PLAN.md Wave 2 (`IMPL-CASTLE` owns
`ShopPanel.tsx`, `labels.ts`).

1. `apps/web/src/components/views/shop/ShopPanel.tsx`:
   - Always render a "How to earn Dracoliths" block: *"Earn Dracoliths from
     Daily Deeds — up to 4 a day — or as steward's grants."* with a control
     that navigates to the Castle **Daily Deeds** surface.
   - Show `balance` and `shortfall = max(0, cheapestPrice − balance)`; when
     short, copy reads *"You need N more for <cheapest item name>."*
     Buy stays disabled with that visible reason (not only a `title`).
2. `apps/web/src/lib/labels.ts`: add the earn-path/shortfall copy keys;
   keep `dracolith → "Dracoliths"` (`labels.ts:68`) and
   `crownmark → "crownmarks"` (`labels.ts:67`) distinct; no raw ids/enums.
3. **No** server change; **no** `shop.json` change; **no** new content IDs.

### 3.6 Test plan (Balanced UX)

- **Rendered:** shop shows the earn-path copy and the Daily Deeds
  affordance; Buy is disabled with a visible (not title-only) reason when
  short; after a dev grant to ≥ price, Buy succeeds.
- **Playwright** at 1440×900 and 390×844: copy present, no horizontal
  overflow, no new console errors; existing `closed-mockup-v1.spec.ts`
  stays green.
- **Guard:** assert no change to `dracolith: 0` start, the `1/1/2` deed
  rewards, or `shop.json` prices (snapshot/inspection), so the UX change
  cannot silently alter balance.

---

## 4. What the Balanced scope will do instead

Balanced fixes all code/UX/IA/docs **without changing balance**; direction
items become decision records only.

- **F1 — visibility/UX only.** Ship the §3.5 ShopPanel earn-path copy,
  Daily Deeds link, and affordability progress. The faucet, starting
  balance, and item prices are frozen pending the §3.4 owner decision.
- **F2 — visibility/UX only.** Ship the persistent HUD + Lands upkeep /
  net-food / low-food warning so upkeep is not Castle-tile-only (`PLAN.md`
  F2 AC; owner `IMPL-HUD` / `IMPL-SOCIAL`). The marching-upkeep rule is
  **not** touched; §2 is the decision request.
- **F8 — spec only.** Write the first-dragon reveal/spectacle spec
  (research + design); **no** spectacle/animation implementation this
  campaign. It belongs to the deferred Visual Identity campaign
  (`CURRENT_STATE.md:114-117`) under the LAB's asset classification.

Everything else (F3 toast overlay, F4 Realm action-panel discoverability,
F5 Alliance empty state/roster, F6 research/build result feedback, F7
currency clarity) is ordinary Lab-governed code/UX/copy work and proceeds
under `PLAN.md`.

### Ratification checklist (owner action required)

| # | Decision requested | Default if not ratified | Consequence of no-decision |
| --- | --- | --- | --- |
| 1 | Marching armies pay food upkeep at origin (soft, no attrition)? §2.4 | No — current exploit stands; Balanced only adds visibility | Food economy remains incoherent with "an army needs food"; army size stays upkeep-evadable |
| 2 | Keep Dracolith faucet `1/1/2` + prices `20/100/60/360`, no IAP? §3.4 | Yes — keep as-is; Balanced adds UX only | Shop still takes ≥5 days to first purchase; may read as dead on arrival in human playtest |
| 3 | Fund the first-dragon reveal spectacle? (F8) | No — spec only | Dragon may remain "a card, not a moment" until the Visual Identity campaign |

**Blockers:** none for the Balanced scope — the safe halves of F1/F2/F8 are
unblocked. The two balance decisions (§2, §3) and the F8 implementation
gate are the only items that require owner action.

---

## Related

- `/tmp/opencode/dw-fix/PLAN.md` — remediation coordination plan (scope: Balanced).
- [`SHOP_AND_UPKEEP_PROPOSAL.md`](./SHOP_AND_UPKEEP_PROPOSAL.md) — PART A implemented; PART B Option S approved.
- [`../competitive/sources/upkeep-genre-survey.md`](../competitive/sources/upkeep-genre-survey.md) — upkeep pattern evidence.
- [`../competitive/sources/dragons-of-atlantis.md`](../competitive/sources/dragons-of-atlantis.md) — DOA-ECON-002..005.
- [`../competitive/audits/dragonwake-current-product.md`](../competitive/audits/dragonwake-current-product.md) — source findings.
- [`../design/CANON_AUTHORITY.md`](../design/CANON_AUTHORITY.md) — authority stack.

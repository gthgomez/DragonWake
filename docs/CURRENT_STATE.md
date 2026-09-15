# CURRENT STATE — DragonWake

Status: **CURRENT AUTHORITY** for "what should I believe today?"

Audited against `main` at `1331ab961a15296c720f392f06d64810b2b9d5de`
(2026-09-05) and reconciled 2026-09-05 against the Alpha Closure branch
(`feat/dragon-driven-alpha-closure` @ `80991c3`). Reconciled again
2026-09-14 against `feat/imagine-alpha-city-pack` @ **`67ab23a`** (Dracolith
shop + Option S soft food upkeep) and the remediation branch
`fix/audit-remediation` off that commit (Competitive Product Lab audit
remediation). Update the SHA when this file is next reconciled.

This file exists so future agents do not reconstruct product intent
from ten campaigns, parity matrices, or chat.

---

## CURRENT PRODUCT DIRECTION

DragonWake is a persistent medieval strategy / MMORTS where dragons
are one of the forces that determine what an empire becomes — not
decorations, not a gacha roster, not a single pet RPG, not a DoA
clone.

Law: [`design/DIRECTION_FREEZE_V1_1.md`](design/DIRECTION_FREEZE_V1_1.md)
(amends v1.0; v1.0 text remains in
[`design/DIRECTION_FREEZE_V1.md`](design/DIRECTION_FREEZE_V1.md)).

Primary design:
[`design/DRAGON_DRIVEN_EMPIRE_CANON.md`](design/DRAGON_DRIVEN_EMPIRE_CANON.md).

Product vision + Alpha Closure design law:
[`design/DRAGON_VISION_COUNCIL_V1.md`](design/DRAGON_VISION_COUNCIL_V1.md).

Authority stack: [`design/CANON_AUTHORITY.md`](design/CANON_AUTHORITY.md).

---

## IMPLEMENTED AND PROVEN (Dragon Alpha Closure)

- Signature hatchling: named, roost, Chronicle, Home/Away/Wounded, Yard vs Home Guard, Hatchling→Wyrmling
- Real Scar encounter (not a stage button)
- Vane Reading + Fen silt knowledge states
- Local Fen Wyrm individual (not a global unique), pact, Brinehold transform
- Ford/Blockade world verb, scoutable absence
- PostgreSQL persistence of living dragons
- Player-honest journey extended through hatchling + pact

## CURRENT IMPLEMENTED STATE (MMORTS spine)

Player-honest Alpha on `main` (README, PR #7 era):

- MMORTS loop: Castle, Lands, Realm, research, training, scout, camps,
  wilderness, marches, reports, PvP postures, alliances/chat,
  persistence (PostgreSQL in CI).
- Final resources: Food, Wood, Stone, Ore, Crownmarks. Dracoliths remain
  separate as the premium earned currency.
- Dragon Presence read model: `DORMANT → STIRRING → AWAKENED → BONDED
  → BATTLE_READY` derived from facts (`docs/design/DRAGON_PRESENCE_ARCHITECTURE.md`,
  `ALPHA_R2_AWAKENING.md`).
- Clues, Bestiary, Dragon Watch, readiness gate, Dragon Scar
  Expedition, charter → **Marcher Keep**.
- Further holdings in content: Brinehold, Stonekeel, Cinderreach,
  Galeari, Mnemolith (content row; not the live spine).
- Commanders live. Sovereign/Harbinger harness removed from live
  paths (M4).
- Certified journey: onboard → build → Lands → research → train →
  scout → camps → dragon evidence → expedition → charter → Marcher
  Keep.

### Audit remediation (`fix/audit-remediation`, 2026-09-14)

A Competitive Product Lab remediation pass landed off
`feat/imagine-alpha-city-pack` @ `67ab23a`, addressing eight audit findings
(F1–F8) without changing balance or content IDs:

- **Shop / Dracoliths (F1, F7)** — Steward's Wares is open and now teaches
  the earn path (Daily Deeds pay 1/1/2 = 4 a day; no IAP) with a link to the
  Deeds and a per-item "You need N more Dracoliths" shortfall on blocked buys.
  Dracoliths (earned premium) and Crownmarks (produced resource) are labelled
  and explained distinctly.
- **Food upkeep visibility (F2)** — soft garrison upkeep (Option S, with
  Rationing relief) exists; a persistent topbar ledger (production / upkeep
  / net / low-food warning) now surfaces it on every tab, and Lands shows
  upkeep + net-food context. The marching-army upkeep *rule* is unchanged —
  see the open decisions below.
- **Feedback and navigation (F3–F6)** — toasts render in an in-flow, bounded
  notice rail (cap 3, 4 s TTL, deduped, `pointer-events: none`); Realm tile
  selection surfaces the detail + march composer; build and research show
  in-place results; Alliance has an empty state, an auto-loaded banner list,
  and a member roster. A blocking build confirm was deliberately not added
  (E2E compatibility); cost acknowledgment is shown instead.
- **First-dragon reveal (F8)** — research/spec only, **not implemented**;
  see [`proposals/UX_REMEDIATION_PLAN.md`](proposals/UX_REMEDIATION_PLAN.md).

Beyond F1–F8, the adversarial/polish passes fixed two more player-visible
defects: raw-JSON leaks in the player flow (Alliance shared intel and War
scout/dispatch intel now use canonical formatting / the server summary) and
test/state hygiene (`alpha-r2` run-unique display name; Castle research
status keyed to `city.id`).

Verification reported at this branch: `pnpm -r typecheck`; web 28/28; server
214 tests (4 PostgreSQL skips); full Playwright suite repeatably green
(20 passed / 1 skipped / 0 failed on consecutive runs against the persistent
DB). This is a developer-reviewer rendered pass, not a human playtest.
Dispositions and evidence:
[`competitive/audits/dragonwake-current-product.md`](competitive/audits/dragonwake-current-product.md);
balance analysis:
[`proposals/AUDIT_REMEDIATION_DECISIONS.md`](proposals/AUDIT_REMEDIATION_DECISIONS.md).

Living dragons now exist as **DragonIndividual** records, separate from
Dragon Presence. Presence `BONDED` still means the expedition charter
is earned; player-facing copy says **Frontier charter earned**. The
named hatchling and local Fen Wyrm pact are the living-dragon proofs.

---

## DESIGNED BUT NOT IMPLEMENTED

The dragon-driven empire direction in `docs/design/`:

| Doc | Role |
| --- | --- |
| `DIRECTION_FREEZE_V1_1.md` | Amended design law |
| `DRAGON_DRIVEN_EMPIRE_CANON.md` | Primary product design |
| `DRAGON_IDENTITY_CONTRACT.md` | Gate for major dragons |
| `DRAGON_ROSTER_ARCHITECTURE.md` | Hatchling, Mirecrown, Pale Passage, Ironspine, Old Karth |
| `DRAGON_DOMAIN_HOLDINGS_MATRIX.md` | Holding identities + empire network |
| `DRAGON_RESEARCH_SYSTEM.md` | Observe → hypothesize → test → codify |
| `DRAGON_DISCOVERY_AND_GROWTH.md` | Pattern library, growth, wounds |
| `DRAGON_HARNESS_PHILOSOPHY.md` | Role-changing equipment |
| `DRAGON_ENGAGEMENT_MODEL.md` | Daily / weekly / seasonal / named wilds |
| `DRAGON_ALPHA_PROOF_SLICE.md` | Alpha implementation spec (now implemented) |
| `DRAGON_ALPHA_CLOSURE_AMENDMENTS.md` | Phase 0 corrections |
| `DRAGON_WORLD_VERB_CONTRACT.md` | Ford/Blockade contract |

Still designed / not implemented: Ironspine, Pale Passage, Old Karth,
seasonal ecology, mature harnesses, advanced dragon war, named-wild
system, Lore Bible v1.

Lore Bible v1 is still **not written** (brief only). It must follow
this direction, not reopen it.

---

## NEXT APPROVED CAMPAIGN

**1. Dragon Alpha Closure — Truthful Loop (current campaign).** Land the
Vision Council Round 4 binding deltas — authored Scar encounter,
distinct evidence records, Guard Harness gating, Fen Crossing +
spawning-bank yield, crossing-bound Ford/Blockade — then certify per
[`design/DRAGON_VISION_COUNCIL_V1.md`](design/DRAGON_VISION_COUNCIL_V1.md)
Round 10.D including the human
[`design/ALPHA_GAME_FEEL_GATE.md`](design/ALPHA_GAME_FEEL_GATE.md)
co-gate. Nothing else enters this campaign.

**2. DragonWake Visual Identity + Sprite/UI Polish** — production
sprites, settlement/terrain art, animation, polished UX, mobile/tablet
presentation, and audio. No new foundational dragon mechanics.

**3. First Watch — Alpha Playtest & Game-Feel.** Human pacing,
comprehension, balance, and retention observation (Council Round 10.I).

Alpha Closure implements the Proof Slice (Phase 0 amendments in
[`design/DRAGON_ALPHA_CLOSURE_AMENDMENTS.md`](design/DRAGON_ALPHA_CLOSURE_AMENDMENTS.md))
as amended by the Vision Council.

---

## OPEN DECISIONS — pending owner ratification (2026-09-14)

Two balance/economy decisions surfaced by the remediation audit are
explicitly **not** decided by `fix/audit-remediation`. Until the owner rules,
the code keeps its current behavior. The analysis, options, and
implementation sketches are in
[`proposals/AUDIT_REMEDIATION_DECISIONS.md`](proposals/AUDIT_REMEDIATION_DECISIONS.md).

| # | Decision requested | Default if not ratified | Why the owner must decide |
| --- | --- | --- | --- |
| 1 | Should marching/recovering armies pay food upkeep at their origin city (soft, no attrition)? | **No** — upkeep stays garrison-only, so the known "keep troops in transit to avoid food" gap remains; the remediation only added visibility | It amends the approved Option S soft-upkeep record and the core economy (army size vs food); the Lab and subagents cannot set it |
| 2 | Keep the Dracolith faucet (`1/1/2` = 4/day) and prices (`20/100/60/360`) with **no** IAP, or adjust? | **Yes — keep as-is**; the remediation only added earn-path UX | `CURRENT_STATE` fixes "scarce by design" and "no IAP source"; changing it is an economy decision reserved to the owner |

The first-dragon reveal (F8) is a spec-only future slice, not an open
decision in this pass.

---

## AUTHORITY MAP (documents)

Authority chain for product vision:

```text
CURRENT_STATE.md → DIRECTION_FREEZE_V1_1.md → DRAGON_VISION_COUNCIL_V1.md → subsystem specs
```

Direction Freeze decides what DragonWake must **never** become; the
Vision Council decides what it is **trying to become** and what Alpha
must **prove**; subsystem specs decide how particular mechanics satisfy
the vision.

| Document | Class |
| --- | --- |
| `DIRECTION_FREEZE_V1_1.md` | **CURRENT AUTHORITY** — product-direction law |
| `DRAGON_VISION_COUNCIL_V1.md` | **CURRENT AUTHORITY** — product vision + Alpha Closure design law; interprets the Freeze, never replaces it; Rounds 4 and 10 bind Alpha Closure |
| `ALPHA_GAME_FEEL_GATE.md` | **CURRENT AUTHORITY** — human game-feel certification protocol (co-gate for `DRAGON_DRIVEN_ALPHA_CERTIFIED`) |
| `DRAGON_DRIVEN_EMPIRE_CANON.md` + sibling design specs | **CURRENT AUTHORITY** — product design |
| `CANON_AUTHORITY.md` | **CURRENT AUTHORITY** — how to resolve conflicts |
| `../product/COMPETITIVE_PRODUCT_LAB.md` + `../competitive/` | **CURRENT AUTHORITY** — player-experience evaluation workflow (black-box/white-box tests, root-cause classes, four-dimension model, vertical-slice gate, before/after evidence; competitor evidence corpus). Process only: cannot change direction or canon |
| This file | **CURRENT AUTHORITY** — direction vs implemented vs next |
| `CLOSED_MOCKUP_V1.md` | **CURRENT AUTHORITY** for closed-slice presentation language until a later presentation freeze |
| Current implementation / content JSON / schema | **CURRENT AUTHORITY** for what the software does |
| `DIRECTION_FREEZE_V1.md` | **CURRENT AUTHORITY** where v1.1 is silent; **HISTORICAL** where v1.1 amends |
| `DOA_REFERENCE_MODEL.md` | **HISTORICAL EVIDENCE** — what DoA did |
| `DOA_PARITY_MATRIX.md`, `DOA_PARITY_MATRIX_V3.md`, `DOA_EXPERIENCE_PARITY_MATRIX.md` | **HISTORICAL EVIDENCE** / translation workspace — not product intent |
| `PROGRESSION_GRAPH_V1.md` | **HISTORICAL EVIDENCE** + still-useful dependency topology; does not override v1.1 |
| `delivery/*` reports, R3 reports, critic files, `FINAL_REPORT.md` | **HISTORICAL EVIDENCE** of campaigns |
| `PAST_WORK_PRESERVATION_LEDGER.md` | **HISTORICAL EVIDENCE** + KEEP/PARTIAL map of recovered intent |
| `LORE_BIBLE_V1_BRIEF.md` | **AMBIGUOUS** — scope only, not canon |
| `MIGRATION_PLAN.md` Phase 1 "write Lore Bible next" | **AMBIGUOUS** — still required work, but **next implementation** is the Proof Slice |
| Bestiary "water or cold-based attacks" on Ash Drake | **SUPERSEDED** elemental leftover |
| Presence copy that a charter is a dragon bond | **SUPERSEDED** as product meaning; implementation may lag |
| Mnemolith as next citadel | **SUPERSEDED** for the dragon-driven spine |
| Aquatic fiction (Brinecant-as-element, gillplate-as-ocean, Harbor) | **SUPERSEDED**; IDs may remain |

Older reports must not override v1.1 simply because they are more
detailed.

---

## IMPLEMENTED SYSTEMS — KEEP / ADAPT / REPLACE / DEPRECATE

| System | Disposition | Note |
| --- | --- | --- |
| Castle / Lands / Realm | **KEEP** | Capital later grows a roost |
| Dragon Presence read model | **ADAPT** | honest states; charter ≠ bond |
| Readiness gate | **ADAPT** | Scar expedition gate, not universal bond template |
| Dragon clues | **ADAPT** | observation evidence |
| Dragon Scar Expedition | **ADAPT** | stage 4 must become a real encounter |
| Bestiary | **KEEP** (expand) | knowledge surface |
| Dragon Watch (`skyreost` ID) | **KEEP** | human watch facility |
| `dragon_studies` | **REPLACE** (experience) | unlock IDs may remain |
| Kingdom percentage research | **KEEP** | not dragon research |
| Marcher Keep | **KEEP** | human frontier, not dragon-domain |
| Brinehold | **ADAPT** | Mirecrown river pact |
| Stonekeel | **ADAPT** | Ironspine later |
| Cinderreach | **ADAPT** | wild ecology / hunt, not a required bond |
| Galeari | **ADAPT** | flyway watch + slayer tension |
| Mnemolith | **DEPRECATE** (spine) | content row may remain until a migration |
| Camps / wilderness | **KEEP** | higher bands → Layer C |
| Commanders | **KEEP** | add pairing tags later |
| Marches / one army | **KEEP** | one major dragon per march when dragons exist |
| PvP / postures / protection | **KEEP** | absence windows later |
| Alliances / chat | **KEEP** | intel about dragon absence later |
| Sovereign / Harbinger harness | **DEPRECATE** (already removed live) | do not resurrect as relics |
| Shop / Dracoliths | **KEEP** — shop opened 2026-09-14 | Dracoliths are the premium earned currency, scarce by design. Items are convenience only (queue speed-ups, protection shields). No IAP source: Dracoliths come from daily deeds (1/1/2) and dev grants only; must not skip injury or Titan recovery. |

Prefer migration over rewrite. The existing Alpha is valuable.

---

## Explicit non-goals (until a freeze reopens them)

- six-dragon implementation
- gacha / collectible rarity ladder
- chromatic elemental taxonomy
- Dragons of Atlantis clone or Reign of Atlantis rename
- single-companion RPG
- percentage-only dragon research as the identity
- finite campaign with no post-spine play
- pay-to-skip core injury or Titan recovery
- unique UI per dragon
- Mnemolith echo fantasy as the next city

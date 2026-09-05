# CURRENT STATE — DragonWake

Status: **CURRENT AUTHORITY** for "what should I believe today?"

Audited against `main` at **`1331ab961a15296c720f392f06d64810b2b9d5de`**
(2026-09-05). Update the SHA when this file is next reconciled.

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
- Final resources: Food, Wood, Stone, Ore, Crownmarks. Chronite
  separate.
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

**DragonWake Visual Identity + Sprite/UI Polish** — production sprites,
settlement/terrain art, animation, polished UX, mobile/tablet
presentation, and audio. Do not reopen living-dragon systems unless
Alpha certification is incomplete.

Alpha Closure implements the Proof Slice (Phase 0 amendments in
[`design/DRAGON_ALPHA_CLOSURE_AMENDMENTS.md`](design/DRAGON_ALPHA_CLOSURE_AMENDMENTS.md)).

---

## AUTHORITY MAP (documents)

| Document | Class |
| --- | --- |
| `DIRECTION_FREEZE_V1_1.md` | **CURRENT AUTHORITY** — product-direction law |
| `DRAGON_DRIVEN_EMPIRE_CANON.md` + sibling design specs | **CURRENT AUTHORITY** — product design |
| `CANON_AUTHORITY.md` | **CURRENT AUTHORITY** — how to resolve conflicts |
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
| Shop / Chronite | **UNKNOWN** / later monetization freeze | must not skip injury or Titan recovery |

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

# Dragon-Driven Empire Design Campaign Report

Campaign: design canonization (not gameplay implementation).
Branch: `design/dragon-driven-empire-canon`.
No destructive code changes.

---

## Repository basis

| Item | Value |
| --- | --- |
| Audited SHA | `1331ab961a15296c720f392f06d64810b2b9d5de` |
| Branch at audit | `main` = `origin/main` |
| Remote | `https://github.com/gthgomez/DragonWake` |
| Worktree | clean at start |

Reviewed (non-exhaustive but sufficient):

- `README.md`
- `docs/design/DIRECTION_FREEZE_V1.md`
- `docs/design/CANON_AUTHORITY.md`
- `docs/design/DRAGON_PRESENCE_ARCHITECTURE.md`
- `docs/design/DIFFERENTIATED_HOLDINGS_ARCHITECTURE.md`
- `docs/design/ALPHA_R2_AWAKENING.md`
- `docs/design/PROGRESSION_GRAPH_V1.md`
- `docs/design/LORE_BIBLE_V1_BRIEF.md`
- `docs/design/PAST_WORK_PRESERVATION_LEDGER.md`
- `docs/design/DOA_PARITY_MATRIX.md` / experience matrix (authority class)
- `packages/content/data/{citadels,research,research_unlocks,dragon_clues,dragon_readiness,expeditions,bestiary_entries,domain_catalog,units}.json`
- `delivery/FINAL_REPORT.md`, `delivery/R3_FINAL_REPORT.md`

Authority map: [`docs/CURRENT_STATE.md`](../docs/CURRENT_STATE.md).

---

## Product verdict

DragonWake is becoming:

> A persistent medieval strategy/MMORTS where discovering, understanding, raising, bonding with, negotiating with, hunting, equipping, and deploying dragons determines how the player's civilization expands, researches, fights, and survives.

It is **not** a single-companion RPG, a DoA clone, a Reign rename, a
collectible roster, a gacha, a percentage tech tree, or a finite
six-act campaign.

Defensible identity sentence:

> **Dragons don't decorate your empire in DragonWake. They are one of the forces that determine what your empire becomes.**

---

## Decisions frozen

- Three-layer hierarchy: signature (exactly one) / domain (≈4–7 horizon) / wild ecology.
- First dragon is a hatchling, named, grown, earned after mystery — not tutorial-minute 5.
- Domain dragons may be adult, pacted, pursued, rescued, or feared; they do not share the hatchling template.
- Every major dragon needs a world verb, weakness, research questions, and a civilization relationship.
- One major dragon per march; home / away / wounded; scoutable absence.
- Settlements are civilizations, not unit-pair reskins. Newer cities must not replace older ones.
- Marcher Keep stays a *human* frontier city so not every holding is a dragon key.
- Brinehold adapts to Mirecrown (river pact). Cinderreach is wild-ecology/hunt, not a required bond. Mnemolith is off the spine.
- Dragon research is OBSERVE → HYPOTHESIZE → TEST → CODIFY. Failure can teach. No cheap farm of PROVEN.
- Harnesses change role, not rarity. No relic treadmill.
- Titan uses exhaustion / recovery / provisioning, not Sunday nukes, not click-to-delete cities.
- No pay-to-skip core injury or Titan recovery.
- Named wild individuals are the post-spine living world.
- Next implementation is the Alpha Proof Slice only.

---

## Decisions intentionally left open

- Exact domain-dragon count (4–7 is a horizon).
- Final lore names (Wake-clutch, Mirecrown, Pale Passage, Ironspine, Old Karth are working names).
- Starting-region geography, cultures, religions (Lore Bible v1).
- Numeric balance, exact recovery hours, river-tile implementation.
- Hatchling permadeath vs critical-wound-only.
- Whether Pale Passage is the same individual as a named wild migrant.
- How many open roster slots get filled, and with what (Rescue-pattern adult is a candidate, not designed).
- Monetization freeze beyond: no skip of injury/Titan recovery; no gacha.
- Whether Brinehold's content ID is eventually renamed.

Do not invent false certainty on these.

---

## Direction Freeze changes (v1.0 → v1.1)

v1.0 is **not rewritten**. v1.1 is a scoped amendment.

**Preserved:** tone, medieval grounding, dragon-not-a-troop, no gacha,
no chromatic taxonomy, agency, earned first bond, armies necessary,
anatomy/hunting/bestiary, rarity, PvP philosophy, rejected genres.

**Added / amended:**

| Topic | v1.0 | v1.1 |
| --- | --- | --- |
| Product identity | medieval civ shaped by dragons | plus: dragons determine what the empire *becomes* |
| Loop | discover dragons, eventually relationships, then more settlements | discovering/establishing dragon relationships may **unlock or transform** settlements and map verbs |
| Dragon count | implied rare / one-great-bond energy | signature one + few domain relationships + wild fauna |
| Dragon identity | not a troop; anatomy; agency | plus world verb; no `+X%` as entire identity |
| Presence of many dragons | not specified | explicitly not a collectible ladder |
| Research | Codex/Bestiary as signature | plus Observe→Codify as dragon-knowledge law |
| Equipment | anti-dragon weapons frozen; old harness deleted in M4 | harness returns as role-changing craft, not relics |
| After the spine | persistent world, alliances | named wilds, ecology, knowledge arms race as evergreen |
| Next work | Lore Bible v1 then migration | Lore Bible still required; **next implementation** is Alpha Proof Slice |

---

## Dragon architecture

**Layer A — Signature.** One hatchling Vale Drake, player-named, grows,
Chronicle, remains the emotional protagonist.

**Layer B — Domain.** Few, individually important, different
acquisition and ownership models. Not all found cities. Not all start
young.

**Layer C — Wild.** Most never become assets. Feed Bestiary, PvE,
alliance conflict, seasons, stories.

---

## Initial roster (working names)

| Dragon | Verb | Acquisition | Weakness |
| --- | --- | --- | --- |
| Wake-clutch Vale Drake | Patrol / Home Guard | Raising + Disaster | never the best specialist; fragile developing wings |
| Mirecrown | Ford / Blockade | Negotiation + Rivalry | water-bound; dry silt-pack fails |
| Pale Passage | Intercept / extreme recon | Pursuit + Tracking | glass body; no payload; refuses plate |
| Ironspine | Entrench / fortify wild | Tracking + mine | slow; joints; scoutable absence |
| Old Karth | Breach | Realm crisis + Negotiation | rarely deployable; armies still win the fight |

Open slots exist. Chromatic fillers are forbidden.

---

## Holdings

| Holding | Dragon relationship | Why it is not a reskin |
| --- | --- | --- |
| Capital | signature roost (later) | seat, Chronicle, general economy |
| Marcher Keep | none owned; scar frontier | human city caused by danger, not a key |
| Brinehold | Mirecrown pact | river civilization + Ford verb |
| Stonekeel | Ironspine | mine / counter-siege / entrench |
| Cinderreach | wild ecology, no required bond | hunt, timber, Layer C factory |
| Galeari | Pale Passage later + slayer tension | flyway watch, not a cave stall |
| Vault of Karth | compact | not a production city |
| Mnemolith | — | **deprecated** from spine |

Cross-settlement: rope+metal harness, resin+plate composite,
signals+logistics recon. Old cities stay necessary.

---

## Research

Kingdom percentage trees **kept** as supporting play.

Dragon knowledge: RUMORED → OBSERVED → SUPPORTED → PROVEN.
Disciplines: Anatomy, Behavior, Ecology, Harnesscraft, War Doctrine,
plus Husbandry and Provisioning.

Example: wet-plate deflection → angled lamination. Defeat of a plated
fast dragon → Predictive Volley.

`dragon_studies` as a timer identity is replaced.

---

## Discovery / growth

Pattern library assigned so no two major dragons share a template.
Hatchling stages are not an XP bar. Domain dragons progress on pact /
flyway / vein / compact axes. Wounds are choices and scars, not only
timers.

---

## Engagement

- **Tomorrow:** roost, rumor, treatment.
- **Next week:** one deployment, hunt, Chronicle line.
- **Next month:** migration, named wild, absence war.
- **After spine:** Layer C + PvP knowledge arms race + Veteran
  signature stories.
- **After three months:** a new named wild or seasonal ecology — not
  a recolored dragon.

No hunger punishment. No gacha season.

---

## Retention adversarial test

| # | Attack | Answer (design modified where weak) |
| --- | --- | --- |
| 1 | Why play after all authored settlements? | Named wilds, migrations, absence PvP, research arms race, Chronicle. Cinderreach is built as the Layer C factory so the spine does not eat the endgame. |
| 2 | Why doesn't every dragon become a key? | Marcher Keep and Cinderreach exist without a required bond. Holdings must pass the human-reason test. |
| 3 | Why not reskinned cities? | Ten-identity matrix + cross-settlement needs. Unit pairs alone fail the gate. |
| 4 | Why not a prerequisite tree? | Dragon research is per-question knowledge states from play. Kingdom percentages stay in their lane. |
| 5 | Why not ignore weaker dragons after Titan? | Karth is rarely deployable, scoutable, cannot replace armies, does not do rivers/recon/household. Signature stays for home and Chronicle. |
| 6 | Why doesn't the first dragon lose importance? | It lives in the Capital; others do not. It has Chronicle density. It is never the best specialist, so it is not discarded for a stat reason — it is kept for home and history. Alpha Proof Slice acceptance includes "hatchling still matters after Mirecrown." |
| 7 | Why isn't the fast dragon a Wind Dragon? | Hollow-bone migratory biology, thermal roads, grounded helplessness, refuses plate. Speed is anatomy, not an element. |
| 8 | Why isn't the crystal dragon an Earth Dragon? | Diet-grown plating, joint gaps, mine coexistence, absence window. Not a magic school. |
| 9 | Why isn't the Titan pay-to-win? | Provisioning + exhaustion with story consequences; no Chronite skip; Breach does not delete cities; realm-visible so others react. |
| 10 | Why aren't harnesses relics? | Crafted, species-specific slots, role flips, no rarity ladder. M4 harness stays dead. |
| 11 | What creates PvP? | Scoutable absence, river politics, later intercept, knowledge counters, Titan wakes. |
| 12 | Low-population realm? | Wild ecology, hatchling, Mirecrown geography, PvE hunts still work. |
| 13 | Without an alliance? | Personal raising and pact do not require one. Karth waits. |
| 14 | Stories players tell? | Naming day, first refusal, *Ironspine has left Stonekeel*, Karth leaving the vault, a named wild that killed a neighbor. |
| 15 | Return after three months? | Named wild / season ecology / Veteran Chronicle — explicitly not a banner dragon. |

Weak answers that changed the design during this campaign:

- Risk that every city is a dragon key → Marcher Keep and Cinderreach
  explicitly ungated by a bond.
- Risk that `BONDED` in Alpha already means a pet → reinterpreted as
  charter; hatchling comes later.
- Risk that Titan is a Sunday button → exhaustion/provisioning table
  and realm-visible departure required.
- Risk that Ash Drake reintroduces chromatic fire → weakness text
  marked superseded; Cinderreach fire is behavioral territory.

---

## Production-cost test

| System | Class | Burden |
| --- | --- | --- |
| Docs / freeze / contract | ALPHA REQUIRED | LOW (this campaign) |
| Hatchling + roost + Chronicle + home/away/wounded | ALPHA REQUIRED | HIGH |
| Mirecrown pact + Ford verb + Brinehold transform | ALPHA REQUIRED | HIGH |
| Real Scar encounter | ALPHA REQUIRED | HIGH |
| Yard vs Escort harness | ALPHA REQUIRED | MEDIUM |
| Scoutable absence | ALPHA REQUIRED | MEDIUM |
| One Observe→Codify chain each | ALPHA REQUIRED | MEDIUM |
| Mirecrown slayer-delay branch | ALPHA REQUIRED (cuttable) | MEDIUM |
| Full discipline tree | BETA REQUIRED | HIGH |
| Named wild v1 | BETA REQUIRED | MEDIUM |
| Ironspine / Pale Passage | BETA / later | HIGH |
| Old Karth | LATER | EXTREME |
| Unique UI per dragon | REJECT | EXTREME |
| Personality sim | REJECT | EXTREME |
| Procedural ecosystem | REJECT | EXTREME |
| Full branching per dragon | REJECT as default | EXTREME |
| Gacha / relic armor | REJECT | — |

Prefer reusable dragon surface + species modules.

---

## Risks

| Risk | Mitigation in canon |
| --- | --- |
| Finite-campaign | Layer C, named wilds, engagement model |
| Content multiplication | one UI, one authored alternative in Alpha, open slots unfilled |
| Elemental-reskin | biology-first roster; Ash Drake leftover flagged |
| Dragon-key | ungated Marcher Keep + Cinderreach; human-reason test |
| Attachment dilution | signature stays at Capital; others are not pets |
| Production scope | Proof Slice cuts listed; six-dragon build forbidden |
| PvP balance | armies required; one dragon per march; absence is the lever |
| Titan dominance | Breach-only, exhaustion, no city delete, no pay skip |

---

## Recommended implementation order

1. **Dragon Alpha Proof Slice** (next, approved).
2. Cross-settlement rope/metal + Brinehold economy honesty.
3. Cinderreach as Layer C / one named wild.
4. Ironspine / Stonekeel.
5. Pale Passage / Galeari.
6. Old Karth Vault.
7. Lore Bible v1 may run in parallel with 1–3; must not reopen freeze.

---

## Explicit non-goals

- Implementing six dragons in the next campaign
- New backend architecture
- Live-ops polish / gacha / chest tracks
- Generic UI campaign
- Rewriting the certified Alpha
- Deleting useful historical DoA evidence
- Filling open roster slots with chromatic dragons
- Reviving Sovereign/Harbinger relics
- Treating Mnemolith as the next city
- Writing the full Lore Bible as this campaign's deliverable

---

## Artifacts produced

- `docs/design/DIRECTION_FREEZE_V1_1.md`
- `docs/design/DRAGON_DRIVEN_EMPIRE_CANON.md`
- `docs/design/DRAGON_IDENTITY_CONTRACT.md`
- `docs/design/DRAGON_ROSTER_ARCHITECTURE.md`
- `docs/design/DRAGON_DOMAIN_HOLDINGS_MATRIX.md`
- `docs/design/DRAGON_RESEARCH_SYSTEM.md`
- `docs/design/DRAGON_DISCOVERY_AND_GROWTH.md`
- `docs/design/DRAGON_HARNESS_PHILOSOPHY.md`
- `docs/design/DRAGON_ENGAGEMENT_MODEL.md`
- `docs/design/DRAGON_ALPHA_PROOF_SLICE.md`
- `docs/CURRENT_STATE.md`
- Updates: `docs/design/CANON_AUTHORITY.md`, `docs/design/DIRECTION_FREEZE_V1.md` banner, `README.md`

---

## Success condition

A future implementation agent can enter the repo, read
`docs/CURRENT_STATE.md` and the freeze/canon pair, and understand the
hatchling, the adult domain dragons, world verbs, holdings-as-civilizations,
role-changing harnesses, observation research, the signature remaining
central, the Titan not being a weekly nuke, wild ecology after the spine,
and that DragonWake is building its own world — without this prompt.

# Dragon Alpha Proof Slice

Status: **CANON — FROZEN** as the next approved implementation campaign.
This file is the design of that campaign, not the implementation.

Do not build six dragons. Do not build Pale Passage, Ironspine, or
Old Karth in this slice. Do not expand live-ops. Do not polish generic
UI as the campaign.

Law: [`DIRECTION_FREEZE_V1_1.md`](./DIRECTION_FREEZE_V1_1.md).
Product: [`DRAGON_DRIVEN_EMPIRE_CANON.md`](./DRAGON_DRIVEN_EMPIRE_CANON.md).

---

## Thesis to prove

> Dragons are not rewards attached to settlements. Dragons are one of
> the primary reasons new settlements and new forms of civilization
> become possible.

And:

> The first dragon is a baby the player grows attached to. Another
> dragon can be a mature negotiated territorial being. Those are not
> the same game.

If the slice ships two reskins of "press Bond," it has failed.

---

## In scope

### 1. Signature dragon — Wake-clutch Vale Drake

- found as a hatchling after mystery, danger, and Marcher Keep
- player names it
- visible at Capital roost
- first meaningful development (Hatchling → Wyrmling or early Juvenile)
- states: **home / away / wounded**
- Chronicle v1 (name, origin, named date, home, life stage, battles,
  wounds, current harness role, temperament tag)
- first meaningful research: **Vane Reading** (OBSERVE → CODIFY)
- one limited march role: **Escort** (or Home Guard if escort is too
  much for the first slice)
- Yard vs Escort harness role, crafted, no rarity

Not in scope: Broadwing flight, Patrol radius, Veteran, permadeath,
full temperament sim.

### 2. One adult domain dragon — Mirecrown

Chosen because it is the strongest difference from the starter:

- already adult
- negotiation + rivalry, not raising
- transforms **Brinehold** (existing ID) rather than adding a new city
- new economy/culture: reed, flood, pact-stone
- distinct troop *doctrine* on existing `shieldman` / `crossbowman`
  (player-facing Reedwarden / Ford-arbalest)
- map verb **Ford / Blockade** on river tiles that existed before the
  pact
- own research: wet silt-pack or ford signaling
- own progression axis: pact depth, not XP
- limitation: cannot leave water; absence returns fords to ordinary
- one authored alternative: **pact vs slayer-delay**

### 3. One harness path

Signature Yard vs Escort. Visible. Crafted. Role-changing.

### 4. One scoutable absence

At least: Mirecrown coiled at a ford (Away) vs at the spawning ground
(Home). Enemy or scout with sufficient intel can see it.

Signature Away-on-escort should also be visible at Capital (roost
empty).

### 5. One actual dragon encounter

Replace expedition stage 4 "Accomplish this stage" / generic young
drake placeholder with a real encounter: survival of dragon territory
on the Scar, with a report that produces observation, not only a
charter flag.

The encounter is **not** the hatchling bond. The hatchling is found
after Marcher Keep, in a follow-on search.

---

## Out of scope (explicit)

- Pale Passage, Ironspine, Old Karth
- Mnemolith
- new citadel kinds
- gacha, relics, shop eggs
- percentage-only dragon tree
- unique UI per dragon (one dragon surface + species modules)
- extensive animation
- procedural wild ecosystems
- Titan exhaustion numbers
- Lore Bible v1 (can proceed in parallel; not this campaign's
  deliverable)
- native mobile
- destroying the certified Alpha loop

---

## Migration of existing Alpha (do not rewrite)

Keep:

- Castle / Lands / Realm
- camps, wilderness, marches, commanders, PvP, alliances
- Marcher Keep as first *human* frontier city from expedition charter
- clues and readiness as the Scar-expedition gate
- Bestiary as evidence surface
- Dragon Presence read model

Adapt:

- Presence state `BONDED` must stop meaning "you own a dragon."
  Recommended: keep the projection for compatibility, add later
  states (`HATCHLING_FOUND`, `NAMED`, `PACTED`) or rename in a
  follow-on content pass. Player-facing copy must be honest in this
  slice.
- Expedition stage 4 becomes a real encounter.
- Brinehold founding becomes the Mirecrown domain chapter, not a
  leftover aquatic city. Founding without the pact (slayer-delay)
  still possible, weaker.

Replace:

- `dragon_studies` as the player's *experience* of dragon knowledge,
  for the two in-scope chains only.

Do not delete:

- content IDs, PG schema, certified Playwright journeys until the
  slice has its own honest journey.

---

## Suggested player journey (proof)

1. Current honest Alpha through Scar expedition + Marcher Keep
   (mystery, danger, incomplete knowledge — **no hatchling yet**).
2. Real encounter on the Scar (observation enters Bestiary).
3. Follow-on search finds the Wake-clutch hatchling. Player names it.
   Capital roost appears. Chronicle opens.
4. Roost play: Vane Reading, Yard harness, first wound-or-refusal
   possible.
5. Limited Escort: home/away/wounded. Capital roost empty is
   scoutable.
6. River rivalry: flood / denied ford. Choice: pact or slayer-delay.
7. On pact: Brinehold transforms; Ford verb works on an old river
   tile; Reedwarden doctrine; Mirecrown absence is scoutable.
8. Cross-check: the named hatchling is still in the Chronicle and
   still at Capital. Mirecrown did not replace it.

Fail if step 8 is false.

---

## Acceptance tests (design-level)

A future implementation campaign is done when:

1. A fresh player cannot receive the hatchling in the first five
   tutorial minutes.
2. The hatchling is named, visible at Capital, and has home/away/
   wounded.
3. Chronicle shows history, not POWER as the headline.
4. Mirecrown is not hatched and not named-as-owned.
5. A river tile that existed before the pact can be opened or closed.
6. A scout can detect at least one major-dragon absence.
7. Expedition stage 4 is an encounter with a report, not a placeholder
   complete button.
8. Existing Marcher Keep charter path still functions.
9. No new gacha, relic ladder, or elemental taxonomy.
10. Server remains authoritative (Dragon Presence style: no
    client-owned dragon bond).

---

## Production class

Entire slice: **ALPHA REQUIRED**, burden **HIGH** but bounded.

If scope threatens to slip, cut in this order (keep the thesis):

1. Cut Escort march; keep Home Guard only.
2. Cut slayer-delay branch; keep pact-only, document the alternative.
3. Do not cut: hatchling naming, Mirecrown adult difference, one map
   verb, scoutable absence, real encounter.

---

## After this slice

Next implementation candidates, in order:

1. Harden Brinehold economy + cross-settlement rope for harness.
2. Cinderreach as wild-ecology/hunt (Layer C), one named wild.
3. Ironspine / Stonekeel (second domain, different again).
4. Pale Passage / Galeari intercept.
5. Old Karth Vault — only when absence, armies, and provisioning are
   already real.

Lore Bible v1 may run beside 1–2. It must not reopen this slice.

# Dragon Harness Philosophy

Status: **CANON — FROZEN** principles.
**CANON — PROVISIONAL** slot examples.

Dragon armor is part of the DragonWake fantasy and is retained in a
modern form. It is not DoA relic duplication and not a mobile loot
treadmill.

Historical note: the old Harbinger harness / Sovereign system was
removed from live product paths (M4). Do not resurrect it as a
percentage stick. This document is the replacement philosophy.

---

## Preserve

- visible equipment on the dragon
- milestone feeling (the yard looks different when the hatchling first
  wears a training strap)
- crafted preparation (empire network: rope from Brinehold, metal from
  Stonekeel)
- dragon specialization
- recognizable war-readiness (a Broadwing in escort harness is
  obviously not a sleeping hatchling)

## Reject

- giant loot rarity ladders
- relic duplication
- random legendary armor treadmills
- shop-sold egg/armor progression
- endless `+Power` stacking
- identical slot matrices on every species
- Chronite-purchased Titan plate that deletes recovery

---

## Equipment changes role

The primary question of a harness is:

> What job is this dragon doing *now*?

Not:

> How much POWER does this rarity add?

Example role flips:

| Dragon | Harness A | Harness B | Forbidden C |
| --- | --- | --- | --- |
| Signature Vale Drake | **Yard** — home, growth, no march | **Escort** — limited away, more risk to wings | legendary +40% everything |
| Mirecrown | **Channel markers / pact ropes** — request a ford | **War coils** — blockade, slower to return to spawn | riding saddle |
| Pale Passage | **Message tube** — recon | **Bare** — intercept, even less payload | torso plate |
| Ironspine | **Vein-guard** — home fortress | **Joint braces** — short field-entrench, worse endurance | crystal rarity set
| Old Karth | **None** as personal armor | **Civilization-scale siege rigging** for a planned Breach | weekly raid costume |

---

## Slots are species-specific

A possible vocabulary where appropriate:

- head / control
- body / protection
- talon / offense
- tail / wing / mobility

**Do not force this 4-slot grid onto every species.**

| Species | Slots that make sense | Slots that do not |
| --- | --- | --- |
| Vale Drake | light body strap, optional wing-guard at Broadwing | Titan-scale siege frame |
| Fen Wyrm (Mirecrown) | signaling gear, channel markers | saddle, torso plate, talon engines |
| Leanwing (Pale Passage) | ultralight chest strap / message tube | any plate, any payload frame |
| Ironback (Ironspine) | joint reinforcement, eye-guard | torso armor (the body *is* armor) |
| Vaultwyrm (Karth) | none, or settlement-scale rigging at the vault | conventional "dragon armor" |

---

## Craft, not drop

Harness pieces are **made** from the empire network, then fitted.

Alpha path (signature only):

1. Roost exists.
2. Player chooses Yard vs Escort as a *role*, not a loot roll.
3. Escort strap costs ordinary resources plus, when Brinehold exists,
   reed-rope. Until Brinehold exists, a poorer Capital-only strap
   exists so Alpha is playable.
4. The dragon can refuse Escort if wings are cracked or temperament
   is Wary.

Visible: Castle roost silhouette changes. Realm march panel shows
harness role. Chronicle records first fitting.

No random rarity. No duplicate relics. No shop eggs.

---

## Readiness vs harness

Current `dragon_readiness.json` is a **human expedition gate**.
Harness is a **dragon role**. Do not merge them into one progress bar.

Battle-readiness of a dragon is:

- life stage allows the role
- injury does not forbid it
- harness role is fitted
- the dragon is Home enough to leave, or already Away
- one major dragon per march is respected

---

## War-readiness should be readable at a glance

A scout with enough Watchtower/intel should be able to tell:

- whether a major dragon is Home
- whether it looks fitted for war or for yard/sleep
- not the exact rarity score (there isn't one)

`Ironspine has left Stonekeel` plus `joint-braced` is useful
intelligence. `POWER 8,423,572` is not.

---

## Production cost

| Piece | Class | Burden |
| --- | --- | --- |
| Philosophy + species slot table | **ALPHA REQUIRED** (docs) | LOW |
| Signature Yard vs Escort role | **ALPHA REQUIRED** | MEDIUM |
| Visible roost/march difference | **ALPHA REQUIRED** | MEDIUM |
| Cross-settlement craft (rope + metal) | **BETA REQUIRED** | MEDIUM |
| Ironspine joint braces | **BETA REQUIRED** | MEDIUM |
| Pale Passage ultralight only | **BETA REQUIRED** | LOW (mostly refusals) |
| Full per-dragon 4-slot matrix | **REJECT** | HIGH |
| Relic / gacha armor | **REJECT** | — |
| Karth personal armor | **REJECT** | — |
| Civilization-scale Breach rigging | **LATER** | HIGH |

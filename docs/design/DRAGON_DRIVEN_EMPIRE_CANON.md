# Dragon-Driven Empire Canon

Status: **CANON — FROZEN** for product structure.
Working names are **CANON — PROVISIONAL**.

This is the primary product-design document for DragonWake after Direction
Freeze v1.1. Future implementation agents should be able to start here and
know what the game is becoming without reconstructing intent from audits,
parity matrices, or chat.

Law: [`DIRECTION_FREEZE_V1_1.md`](./DIRECTION_FREEZE_V1_1.md).
Entry index: [`../CURRENT_STATE.md`](../CURRENT_STATE.md).
Next implementation: [`DRAGON_ALPHA_PROOF_SLICE.md`](./DRAGON_ALPHA_PROOF_SLICE.md).

---

## 1. What DragonWake is

A persistent medieval strategy / MMORTS in which dragons are one of the
primary reasons a civilization expands, researches, fights, and survives.

The player fantasy is not "collect dragons" and not "raise one pet while
the city builder continues underneath." It is:

> I built a kingdom in a world that already contained dragons. The ones I
> found, raised, bargained with, or failed against changed what my kingdom
> could become.

The MMORTS loop from Direction Freeze v1.0 remains: settlements, resources,
armies, marches, wilderness, PvP, alliances. Dragons sit *inside* that loop
as strategic beings, not on top of it as a cosmetic layer.

---

## 2. Three-layer hierarchy

### Layer A — Signature Dragon

Count: **exactly one** primary protagonist dragon per account at a time.

Player fantasy: *this is my dragon.*

Requirements:

- found as a hatchling, never as a purchased adult
- named by the player
- visible growth stages
- temperament shaped by player decisions and injuries
- a Chronicle
- remains central after domain dragons exist

The signature dragon is the strongest emotional relationship in the game.
It is not the strongest specialist. Later dragons outclass it in their
niches. That is the point: the first dragon stays because of history, not
because it wins the stat race.

Working species: Vale Drake (already present in `bestiary_entries.json`
as `valley_drake`). Working individual concept: the Wake-clutch hatchling.
The player names the individual.

See [`DRAGON_ROSTER_ARCHITECTURE.md`](./DRAGON_ROSTER_ARCHITECTURE.md).

### Layer B — Domain Dragons

Horizon: approximately **4–7** additional major dragons on a mature
account. Not an alpha quota. Exact count remains adjustable.

Player fantasy: *these dragons helped shape my empire.*

Each domain dragon is a chapter of civilization, not a roster slot.
Acquisition, life stage, ownership model, UI, harness, and whether a
holding is founded **must differ** across the set.

Initial architecture (provisional names):

| Working name | Role | Acquisition | Holding relationship |
| --- | --- | --- | --- |
| **Mirecrown** | River/wetland territorial adult | Negotiation + rivalry | Transforms **Brinehold** |
| **Pale Passage** | Fast migratory hunter | Pursuit + tracking | Transforms **Galeari** (flyway watch) |
| **Ironspine** | Crystal/mineral defender | Tracking + mine relationship | Transforms **Stonekeel** |
| **Old Karth** | Colossal Vaultwyrm | Realm crisis + negotiation | Vault relationship, **not** a sixth production city |

Room remains for 1–3 later domain dragons. Do not invent them to fill a
count.

### Layer C — Wild Dragon Ecology

Player fantasy: *the world contains dragons that do not belong to me.*

Reuse and reframe existing bestiary subjects rather than deleting them:

- Valley Drake — wild population; the signature hatchling is one individual
- Ridgeback Wyvern — ridgeline ambush fauna
- Mountain Wyrm — cave ecology
- Ironback Wyrm — mineral-plated wild relatives of Ironspine
- Ash Drake — **reframe**: territorial scorched-ground nester near
  Cinderreach, not a chromatic fire dragon

Named wild individuals (Layer C, not collectibles) keep the realm alive
after authored holdings are complete. See
[`DRAGON_ENGAGEMENT_MODEL.md`](./DRAGON_ENGAGEMENT_MODEL.md).

---

## 3. Canonical product loop

```text
BUILD
  ↓
EXPLORE
  ↓
OBSERVE DRAGON ACTIVITY
  ↓
RESEARCH
  ↓
PREPARE
  ↓
ENCOUNTER
  ↓
RAISE / NEGOTIATE / SURVIVE / BOND
  ↓
DOMAIN OPENS OR CHANGES
  ↓
SETTLEMENT SPECIALIZES
  ↓
NEW TROOPS + RESEARCH + ECONOMY
  ↓
CRAFT HARNESS / HUMAN COUNTERS
  ↓
DRAGON ENABLES NEW WORLD VERB
  ↓
OLD MAP BECOMES RELEVANT IN NEW WAYS
  ↓
NEW FRONTIER
  ↓
NEW DRAGON PROBLEM
```

Always-on overlays, not a later mode switch:

- PvP
- Alliance
- Named wild dragons
- Seasonal ecology
- Research discovery
- Dragon Chronicle

The loop is allowed to skip or reorder steps per dragon. The forbidden
shape is a universal template:

> collect three clues → fight boss → press Bond → get city.

---

## 4. How this maps onto the existing Alpha

Do not destroy the certified player-honest Alpha. Migrate meaning.

| Existing Alpha fact | Canon disposition |
| --- | --- |
| Capital + Castle/Lands/Realm split | **KEEP** — Capital becomes the signature roost later |
| Dragon Presence `DORMANT → STIRRING → AWAKENED → BONDED → BATTLE_READY` | **ADAPT** — `BONDED` today means expedition charter, not a living dragon. Reinterpret. True bond is a later state |
| Clues + readiness + Dragon Watch | **ADAPT** — keep as observation/readiness, not a three-clue gacha |
| Dragon Scar Expedition | **ADAPT** — keep as the first *human* survival of dragon territory; stage 4 must become a real encounter |
| Marcher Keep founded from charter | **KEEP** as the first frontier holding; it is **not** a dragon-domain city |
| Brinehold / Stonekeel / Cinderreach / Galeari | **ADAPT** identities onto the holdings matrix |
| Mnemolith | **DEPRECATE** from the dragon-driven spine (high-fantasy echo units) |
| Bestiary | **KEEP and expand** as the research evidence surface |
| `dragon_studies` timer research | **REPLACE** as the dragon-knowledge model; keep the ID only if migration needs it |
| Production/combat percentage research | **KEEP** as supporting kingdom research; it is not dragon research |
| Commanders, marches, PvP, alliances, wilderness, camps | **KEEP**; commanders gain lightweight pairing history |

Full map: [`../CURRENT_STATE.md`](../CURRENT_STATE.md).

---

## 5. Settlement rule

> Settlements must feel like civilizations shaped by the dragons, terrain,
> resources, and problems surrounding them.

Each holding in the spine must answer ten identities (see
[`DRAGON_DOMAIN_HOLDINGS_MATRIX.md`](./DRAGON_DOMAIN_HOLDINGS_MATRIX.md)):

1. Dragon relationship
2. Ecology
3. Economy
4. Architecture
5. Research questions
6. Human troop culture
7. Military doctrine
8. Map interaction
9. Strategic role
10. Cross-settlement dependencies

Forbidden: City A gets units A/B, City B gets units C/D, call it
differentiation.

Newer holdings must not replace older ones. The player eventually operates
an **empire network**.

Intended early network (examples, not a crafting MMO):

- Stonekeel metallurgy + Brinehold rope/textile → reinforced harness
- Cinderreach resin + Stonekeel plating → light composite armor
- Galeari signal craft + Marcher logistics → reconnaissance network

---

## 6. Dragon identity law

No major dragon enters implementation until it satisfies
[`DRAGON_IDENTITY_CONTRACT.md`](./DRAGON_IDENTITY_CONTRACT.md).

Hard rejects:

- identity summarizable as `+X% stat`
- identical acquisition template as the previous dragon
- no world verb
- no meaningful weakness
- no settlement/civilization relationship (for domain dragons)
- no research questions that come from observation
- Titan that click-to-deletes cities or is a Sunday pay-to-win nuke
- first dragon that is obsolete after Dragon 2

---

## 7. War, wounds, chronicle

**War.** One major dragon per march. Home / away / wounded. Scoutable
absence. Example intended event: *Ironspine has left Stonekeel.* That is
a raid window, not flavor text.

**Wounds.** Not `Unavailable: 04:17:09`. Injury types, treatment choices,
possible scars, strategic consequences. No pay-to-skip core injury.

**Chronicle.** Account-visible, sometimes scout-visible prestige/history.
Screenshot-worthy. Raw POWER is not the dominant signal.

**Commanders.** Lightweight pairing history (rapport tags, named battles).
Not a second RPG.

Details live in the discovery, harness, and engagement docs. Alpha only
needs the slice specified in
[`DRAGON_ALPHA_PROOF_SLICE.md`](./DRAGON_ALPHA_PROOF_SLICE.md).

---

## 8. Research law

Dragon knowledge:

> OBSERVE → HYPOTHESIZE → TEST → CODIFY

States: RUMORED → OBSERVED → SUPPORTED → PROVEN.

Prefer new verbs, formations, counters, scouting, logistics, construction
techniques, treatments, and equipment patterns over numeric modifiers.

Disciplines: Anatomy, Behavior, Ecology, Harnesscraft, War Doctrine.
Husbandry is allowed for the signature hatchling. Provisioning is allowed
for the Titan.

See [`DRAGON_RESEARCH_SYSTEM.md`](./DRAGON_RESEARCH_SYSTEM.md).

---

## 9. Player choice and dragon agency

Fake choices are forbidden:

> BOND → unlock everything · KILL → lose progression

Hierarchy:

1. **Major canonical relationship** — for some domain dragons, one outcome
   remains the primary progression route (needed so production cost stays
   honest).
2. **Meaningful alternative outcomes** — persistent consequences that do
   not always require a second holding: delayed domain access, slayer
   doctrine, reputation, different research, the dragon remaining wild,
   another player later forming the pact, a recurring rival.

Branching is worth its cost only where the alternative creates a different
*verb* or *political fact*, not a reskinned city.

For the Alpha Proof Slice, only **Mirecrown** needs one authored
alternative (pact vs slayer-doctrine delay). Other dragons may declare
alternatives without implementing them.

---

## 10. Long-term game

Authored dragon/settlement progression is the spine.

After the last authored domain:

- named wild individuals continue to move, nest, die, return
- migrations and ecology change seasonal play
- research arms races continue from PvP observation
- alliance-scale creatures can appear
- the signature dragon's Chronicle and Veteran stage continue
- cross-settlement industry still has uses

The game does not "complete."

---

## 11. Inspiration rule

Use other dragon fiction, including the *principles* visible in works like
*How to Train Your Dragon*, only as principles:

- radically different silhouettes
- species defined by anatomy and behavior
- enormous scale differences
- personality
- ecological niches
- strengths paired with weaknesses
- recognizable movement
- creatures that feel alive

Do not copy character designs, names, abilities, stories, visual identity,
or copyrighted lore.

DragonWake develops its own biology, culture, history, terminology,
silhouettes, and world logic. Historical Dragons of Atlantis is evidence
for *what a dragon-centered MMORTS loop felt like*, not a permission to
rebuild aquatic/elemental fiction or a Great-Dragon-as-troop.

---

## 12. Production honesty

Classify every system ALPHA REQUIRED / BETA REQUIRED / LATER /
EXPERIMENTAL / REJECT, with LOW / MEDIUM / HIGH / EXTREME burden.

Especially adversarial:

| Temptation | Verdict |
| --- | --- |
| Fully branching outcomes for every dragon | **REJECT** as default. One authored alternative in Alpha (Mirecrown) |
| Eight unique dragon UIs | **REJECT**. One dragon surface, species modules |
| Extensive animation | **LATER** |
| Giant procedural ecosystems | **REJECT** for this horizon |
| Per-dragon full equipment matrices | **LATER**; Alpha is one hatchling harness path |
| Complex personality simulation | **REJECT**. Temperament tags + refusals |
| Six dragons this year | **REJECT**. Proof slice is hatchling + one adult domain |

Prefer strong identity, reusable systems, authored differences where they
matter.

---

## 13. The sentence that must remain defensible

> **Dragons don't decorate your empire in DragonWake. They are one of the forces that determine what your empire becomes.**

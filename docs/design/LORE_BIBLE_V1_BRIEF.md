# Lore Bible v1 — brief (scope only)

Status: **BRIEF** — not canon. Do not treat names or examples in this file as
frozen. This document only defines what Lore Bible v1 must contain.

Write `LORE_BIBLE_V1.md` next. Do not invent a planet, a creation myth, or a
full species list.

## One-sentence direction (already frozen)

> TideForge is a persistent medieval strategy world where historically grounded kingdoms have spent centuries adapting their armies, castles, cultures and beliefs to the reality of rare, terrifying and sometimes intelligent dragons.

## Product test (already frozen)

> Does this feature make TideForge feel more like a believable medieval civilization shaped by dragons?

## Global rules already frozen — do not reopen here

Copy these into the Bible as given. Do not expand them into a cosmology.

- What dragons broadly are (rare, dangerous, never a troop type)
- Intelligence spectrum; humans argue whether they are animals, monsters, gods, or people
- Humans may control beasts; True Dragons choose alliances
- Magic is rare, mysterious, dangerous, poorly understood
- Late-medieval military foundation; gunpowder is not dominant
- Dragon rarity (an army may have one dragon, never thousands)
- Origins remain **UNKNOWN**
- Dragons predate all currently surviving human kingdoms
- Name "TideForge" does not require an ocean world

## Required sections

### 1. First playable region

One region. Not a continent. Enough geography to support:

castle → village → forest → river → hills → mountains → ruins → dragon territory.

Decide climate and terrain from first principles. Do not default to ocean
because the old repo is aquatic.

Leave exact map coordinates, tile counts, and biome IDs **unfrozen**.

### 2. Three to four cultures

Not four elemental gameplay factions.

Differentiate by:

- history
- culture
- politics
- military doctrine
- relationship with dragons
- civilization adaptations (see §5)

Old names (Brinecant, Ashcoil, Skyshear, Mossvault) may be reused as
places, houses, or provinces **only if** they can be justified without
elemental identity. Retiring them is allowed.

Do not distinguish cultures primarily by percentage bonuses.

### 3. Dragon ecology (mandatory, more important than species names)

For each creature in §4, answer:

- What does it eat?
- How large a territory does it need?
- How often does it hunt?
- Where does it nest?
- How does it reproduce?
- Does it migrate?
- What other creatures avoid it?
- What happens to settlements around it?
- Why haven't humans exterminated it?
- Why hasn't it exterminated humans?

If those answers are missing, the species name is decoration.

### 4. Four to six dragon-related creatures in this region

Do not create 43 dragons.

| Slot | Kind | Role in v1 |
| --- | --- | --- |
| 1 | Common drake | Lesser beast. Mid-game encounter. Animal-like. |
| 2 | Dangerous wyvern | More numerous than True Dragons. Predator. |
| 3–4 | Two wyrm / dragon species | Tied to distinct habitats. |
| 5 | One known True Dragon | Rumor / late named presence. Not a starter pet. |
| 6 | One historical Great Dragon | Individual in world history. Not an enemy tier. |

For each: body plan, habitat, one ecological ability (not a color element),
known or suspected anatomy weakness, intelligence band, whether humans
debate its status.

Taxonomy buckets already frozen as **concept**, not a species list:
True Dragons, Wyrms, Wyverns, Drakes, Sea Dragons, Great Dragons.

### 5. Civilization's adaptations to dragons (mandatory for every culture)

Not only "they believe dragons are sacred." For each culture, specify:

**Architecture.** Do roofs burn? Are streets unusually wide? Do castles have
covered courtyards? Are towers equipped with great crossbows?

**Agriculture.** Are cattle kept inside fortified enclosures?

**Communication.** Dragon-warning bells? Beacon towers?

**Warfare.** What formation does an army take when a dragon appears?

**Law.** Who owns a dead dragon's corpse? Can peasants kill a drake? Is
possessing a dragon egg punishable by death?

**Religion.** Is killing a dragon heroic, sinful, or context-dependent?

**Economy.** Are scales valuable? Is dragon bone legal to trade?

This is how the world becomes civilization shaped by dragons, not medieval
civilization plus dragon enemies.

### 6. One Slayer institution

Visible in the starting region.

- How they record a kill (bestiary method)
- Three anti-dragon tools that look like medieval engineering
- Political relationship with the local crown
- Knowledge is the weapon, not a +9,000 attack stat

### 7. Warfare for this region

Design the medieval roster from first principles, then see which old
mechanical niches can be reused. Do **not** start from "we have Speed units,
therefore Light Cavalry."

Minimum concepts to define (not necessarily all implemented in v1):

- Levy / spear / pike
- Shield / man-at-arms / halberd
- Shortbow / longbow / crossbow
- Scout / light horse / knight
- Sapper / engineer / slayer
- Ram / tower / trebuchet / great arbalest

For each troop type, write what it is *for* (reach, shock, penetration,
bracing, logistics), not a power number.

### 8. One major historical conflict + one contemporary political crisis

Enough history to generate grudges. Not 9,000 years.

Dragon policy should be one of the great ideological conflicts
(extermination / preservation / domination / bonding / worship / study).

### 9. Early-game narrative

This replaces the current 10-step Harbinger-harness tutorial.

1. The player holds a small castle.
2. They raise levies and walls because the last generation remembers fire.
3. They hear rumors, find a scale, see a burned hamlet.
4. They fight men and lesser beasts first.
5. The Codex starts incomplete or wrong.
6. A True Dragon is a late, named event — not a starter pet.

### 10. Codex structure (content model, not UI)

Three related bodies of knowledge:

| Book | Holds |
| --- | --- |
| **Bestiary** | Dragons and other creatures |
| **Arms & Warfare** | Troops, weapons, formations, defenses |
| **Chronicle** | Kingdoms, historical events, famous dragons, wars, Slayer Orders |

Not every entry has to be objectively correct. A medieval scholar may write
that iron repels valley wyrms; later evidence can prove the belief false.
That creates lore → investigation → gameplay knowledge.

### 11. Monetization philosophy (product, parked beside lore)

Not gacha. The current shop is deterministic speedups and protection.

But Chronite / Blink / Jump imply everyday time magic, which conflicts with
rare, mysterious magic.

The Bible should record a **provisional** stance:

- Convenience items must be mundane wartime stores, not everyday spellcasting.
- A separate product freeze is still required for what TideForge monetization
  is allowed to become. That freeze can happen in parallel with the Bible; it
  must happen before Phase 4 content conversion.

## Explicitly out of scope for v1

- World map of the whole planet
- Full kingdom list beyond the starting region
- Religions as a finished pantheon
- Historical chronology beyond one conflict + living memory
- Complete dragon species catalog
- Creation myth (remains UNKNOWN)
- First great war as a finished epic
- Combat formula rewrite
- Mobile UI
- Schema migrations

## After the Bible is approved

Proceed to Phase 2 in [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md):
mechanical translation design. Do not remap content IDs until that table
exists.

# Dragon Domain Holdings Matrix

Status: **CANON — PROVISIONAL** names and local color.
**CANON — FROZEN** rule: every spine holding answers ten identities, and
newer holdings must not replace older ones.

Existing content IDs in `packages/content/data/citadels.json` are
**KEEP** as persistence keys unless a later migration explicitly
renames them. Player-facing meaning is what this matrix changes.

Companion: [`DIFFERENTIATED_HOLDINGS_ARCHITECTURE.md`](./DIFFERENTIATED_HOLDINGS_ARCHITECTURE.md)
describes the current *implemented* founding path. This file describes
the *intended* civilization identities.

---

## Audit of the current sequence

| Content ID | Current player name | Current exclusive units | Canon disposition |
| --- | --- | --- | --- |
| (capital city) | Capital / Keep | standard medieval roster | **KEEP**, later signature roost |
| `marcher_keep` | Marcher Keep | light_cavalry, mounted_scout | **KEEP** as human frontier, not a dragon-domain city |
| `brinehold` | Brinehold | shieldman, crossbowman | **ADAPT** into river-pact holding (Mirecrown) |
| `stonekeel` | Stonekeel | sapper, halberdier | **ADAPT** into mineral/entrench holding (Ironspine) |
| `cinderreach` | Cinderreach / Forest Citadel | forest_ranger, warhound | **ADAPT** into wild-ecology / hunt holding (no required bonded dragon) |
| `galeari` | Galeari / Dragon Watch | dragon_slayer, ballista | **ADAPT** into flyway watch (Pale Passage) + slayer tension |
| `mnemolith` | Mnemolith | soulwright, echo_stalker, titan_echo | **DEPRECATE** from the dragon-driven spine |

`gillplate`, `mandrake_slag`, aquatic craft names, and Brinehold's
ocean fiction are historical IDs. Replace *meaning* first; rename when
a content migration is approved.

Mnemolith's echo/soul roster fights Direction Freeze (high fantasy,
not medieval-dragon). Do not design a domain dragon to justify it.

---

## Ten identities (required)

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

Forbidden summary: "new resource + two new troops."

---

## Capital

| Dimension | Identity |
| --- | --- |
| Dragon | Home of the **signature Vale Drake** after the Wake-clutch is found. Before that: rumors, Dragon Watch, no living household dragon. |
| Ecology | Settled valley / arable hinterland. The roost later changes night noise, livestock practice, and local superstition. |
| Economy | General kingdom economy (food, wood, stone, ore, crownmarks). Not a specialist. The roost consumes food and attention, not a hunger minigame. |
| Architecture | Medieval keep. After hatchling: roost, feeding court, later Chronicle hall. Buildings still upgrade by level; the roost is a visible addition, not a reskin of Barracks. |
| Research | Husbandry and vane-reading; ordinary kingdom research remains here. |
| Troops | Standard medieval roster (`levy`, bow, pike, etc.). Optional late **Roost Guard** as doctrine on existing shield/pike, not a new species. |
| Doctrine | Balanced kingdom warfare. The dragon is a household war-partner later, never the army. |
| Map | Patrol / Home Guard on approaches that existed since founding. |
| Role | Seat of account identity, Chronicle, commander hall, default home of the signature dragon. |
| Dependencies | Always needs specialists from later holdings. Cannot make Ironspine's joint-braces or Mirecrown's reed rope. |

Marcher Keep is founded *from here*, before the true bond. The Capital
must remain useful after five other holdings exist.

---

## Marcher Keep (`marcher_keep`)

| Dimension | Identity |
| --- | --- |
| Dragon | **None owned.** Sits on or beside the Dragon Scar. Sightings, tracks, and the later clutch search originate from this frontier. Not a dragon key. |
| Ecology | Border hills / waste edge. Human road into dragon-used land. |
| Economy | Logistics: remounts, waystations, light cavalry forage. Craft mat currently empty — keep it honest; do not invent a magic drop. |
| Architecture | Forward keep, palisade, stables, scout post. Less civic than Capital. |
| Research | Scouting, cavalry, march capacity. Not dragon anatomy. |
| Troops | `light_cavalry`, `mounted_scout` — exist because the frontier is too wide for foot garrisons. |
| Doctrine | Ride, screen, carry news. Poor in siege, poor in flooded ground. |
| Map | Extends march reach. Does not change rivers or mountains by itself. |
| Role | First expansion; proves the player can hold a second settlement **without** a dragon unlocking it. Protects the "dragons are reasons, not keys" rule from applying to *every* city. |
| Dependencies | Needs Capital manpower and food. Later: Galeari signals make its screens smarter; Brinehold rope improves tack. |

If every holding is dragon-gated, dragons become keys. Marcher Keep is
the control: a human city caused by dragon *danger*, not dragon
*ownership*.

---

## Brinehold (`brinehold`) — river pact

| Dimension | Identity |
| --- | --- |
| Dragon | **Mirecrown**, Fen Wyrm, pacted adult. Home is the river, not a stall. Alternative: slayer-delay town without the Ford verb. |
| Ecology | Slow river, reeds, seasonal flood, spawning ground that must stay unworked. |
| Economy | Reed fiber, pitch, barge traffic, fish weirs *outside* the spawn. Historical `gillplate` becomes reed-laminate / wet hide — rename when migrating. |
| Architecture | Pile dwellings, rope walks, pact-stone, open water toward the coils. Not an ocean harbor fantasy. |
| Research | Wet silt-pack, snorkel-ridge, ford signaling, flood timing. |
| Troops | `shieldman` → Reedwarden; `crossbowman` → Ford-arbalest. Created to live beside a wyrm before any pact. |
| Doctrine | Hold flooded ground, deny crossings. Weak on steep dry stone. |
| Map | **Ford / Blockade** on pre-existing river tiles. |
| Role | First *dragon-domain* holding. Proves adult negotiation ≠ hatchling raising. |
| Dependencies | Reed/textile + Stonekeel metal → harness straps. Needs Marcher cavalry to move goods once off the water. Cannot feed a dry-land war alone. |

---

## Stonekeel (`stonekeel`) — mineral entrenchment

| Dimension | Identity |
| --- | --- |
| Dragon | **Ironspine**, vein-plated Ironback. Coexistence with the mine. Scoutable absence is a raid window. |
| Ecology | Mountain, adits, mineral veins, unstable workings. |
| Economy | Ore, stone, crystal-shed plates, engineering. Historical `mandrake_slag` becomes flux / crystal-slag. |
| Architecture | Buttressed inner keep, joint-forges, underground shelters, no open roost terrace. |
| Research | Plate angle, joint gaps, underground survival, counter-siege. |
| Troops | `sapper`, `halberdier` → Underminners and Plate-pikes. Created because the mountain fights back and the wyrm's joints are the only gap humans can reach. |
| Doctrine | Defend, undermine, endure siege. Cannot chase. |
| Map | **Entrench / Fortify wilderness** while Ironspine is present. |
| Role | Defensive specialist of the empire network. |
| Dependencies | Needs Brinehold rope for harness/joint wraps; Cinderreach resin for light composite; Capital food. Its plating does not make Reedwardens obsolete. |

---

## Cinderreach (`cinderreach`) — wild ecology / hunt

| Dimension | Identity |
| --- | --- |
| Dragon | **No required bonded dragon.** Relationship is with wild fauna: Valley Drakes on the margins, Ridgebacks on ridges, a reframed Ash Drake as a territorial scorched-ground nester, and **named wild individuals**. This holding proves not every city is a dragon key. |
| Ecology | Forest, burn scars, game trails, seasonal nests. |
| Economy | Timber, resin, hides, hunt-licenses. Historical `ancient_heartwood` can remain as a rare forest craft if it is logged, not looted from a boss. |
| Architecture | Timber citadel, kennels, ranger walks, watch-fires at burn lines. |
| Research | Migration, nest timing, tracking, hound-work, how wild drakes use fire *behaviorally* (territory), not as an elemental school. |
| Troops | `forest_ranger`, `warhound` — exist to hunt and to keep wild dragons *out* of timber cuts. |
| Doctrine | Ambush, track, screen woods. Poor on open steppe, poor in tunnels. |
| Map | Reveals concealed forest routes over time (human scouting + hounds). Does not grant a dragon verb by default. A later named wild might temporarily close a wood road. |
| Role | Evergreen PvE/hunt and bestiary factory of the empire. Food for Layer C. |
| Dependencies | Resin + Stonekeel plating → light composite. Rangers need Marcher logistics to reach distant scars. Does not replace Galeari's sky watch. |

Ash Drake bestiary text that treats "water or cold-based attacks" as the
weakness is **elemental leftover**. Reframe: wet weather ruins a
scorched-ground nest; the creature is not an RPG fire elemental.

---

## Galeari (`galeari`) — flyway watch

| Dimension | Identity |
| --- | --- |
| Dragon | **Pale Passage** (later). Until then: Dragon Watch facility, slayer tradition, sky-threat. The slayer/ballista roster and a future Leanwing pact are supposed to *tension*, not homogenize. |
| Ecology | High ground, thermals, open sky, poor forage. |
| Economy | Signal craft, observers, light timber, message fees. Historical `dragon_scale` craft should become shed-material study, not a gacha drop. |
| Architecture | Signal masts, open roost terraces, ballista rings, thermal charts. Not a cave-stall. |
| Research | Thermal roads, intercept timing, hollow-bone limits, anti-air engines. |
| Troops | `dragon_slayer`, `ballista` — humans who had to shoot at the sky before anyone pacted a Leanwing. |
| Doctrine | See far, shoot high, cannot hold a river or a mine. |
| Map | Extreme recon once Pale Passage is in relation; until then, Watchtower/Watch Hill style intelligence, human-only. |
| Role | Eyes of the empire; later the intercept arm. |
| Dependencies | Galeari signals + Marcher logistics → reconnaissance network. Needs Capital and Stonekeel to exist as things worth warning. |

---

## Vault of Karth (not a citadel.json row yet)

Not a sixth production city. If implemented, it is a limited
relationship site: provisioning yards, political visibility, almost no
economy. Do not add `mnemolith` as this site.

| Dimension | Identity |
| --- | --- |
| Dragon | Old Karth, rarely awake. |
| Ecology | Caldera-hollow, ash when woken. |
| Economy | Provisioning sink, not a producer. |
| Architecture | Vault mouth, evacuation roads. |
| Research | How to wake, how not to, Breach aftermath. |
| Troops | None exclusive. Evacuation doctrine. |
| Doctrine | Do not stand under the wings. |
| Map | Realm-visible departure. **Breach** on a chosen defensive layer. |
| Role | Late-game strategic compact. |
| Dependencies | The whole empire feeds a wake. Without Brinehold/Stonekeel/Galeari, a player cannot provision a Breach honestly. |

---

## Cross-settlement economy (keep early complexity low)

| Combination | Result | When |
| --- | --- | --- |
| Stonekeel metal + Brinehold reed/rope | Reinforced hatchling harness straps | Alpha/Beta |
| Cinderreach resin + Stonekeel plating | Light composite (Pale Passage-safe, hatchling escort) | Beta |
| Galeari signal + Marcher logistics | Recon network (faster honest intel, not teleport) | Beta |
| Capital food + any roost/vault | Feeding / provisioning | Alpha (hatchling food as flavor, not punishment) |
| Cinderreach hunt evidence + Scriptorium | Bestiary research inputs | Alpha |

The player should feel *I need the old cities* after founding a new one.

Do not build a full trade-route MMO in Alpha.

---

## Holding vs dragon-key test

Ask of every future holding:

> If the player never bonds another dragon, does this place still have
> a human reason to exist?

- Marcher Keep: yes (frontier logistics)
- Cinderreach: yes (timber, hunt, wild threat)
- Brinehold: yes as a poorer river town in the slayer-delay branch;
  the *verb* is what the pact adds
- Stonekeel: yes as a mine; Ironspine adds entrenchment
- Galeari: yes as a watch/slayer site; Pale Passage adds intercept

If the answer is no, the holding is a dragon key. Reject it or split
the human reason out.

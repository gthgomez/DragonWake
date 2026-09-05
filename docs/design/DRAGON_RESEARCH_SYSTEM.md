# Dragon Research System

Status: **CANON — FROZEN** loop and knowledge states.
**CANON — PROVISIONAL** example discoveries.

This document redesigns *dragon* knowledge. It does not delete the
existing kingdom research tree in `packages/content/data/research.json`.

---

## Split the current tree

Audit of `research.json` + `research_unlocks.json` (HEAD `1331ab9`):

| Kind | Examples | Disposition |
| --- | --- | --- |
| Kingdom production percentages | agriculture, forestry, masonry, metallurgy `per_level` 0.08 | **KEEP** as supporting economy. Not dragon research. |
| Kingdom combat percentages | infantry_doctrine, archery, fortification, cavalry | **KEEP** as supporting military. Prefer unlocks over more percentages when touching these later. |
| Genuine unlocks | infantry_doctrine → pikeman/man_at_arms; archery → bow lines; dragon_studies → dragon_slayer/ballista/skyreost | **KEEP** the unlock pattern. |
| Expansion plumbing | brinehold_unlock, stonekeel_unlock, charters | **KEEP** as charter research; **ADAPT** fiction so charters are not "buy city." Marcher Keep charter stays expedition-earned. |
| Generic dragon timer | `dragon_studies` max 5, `per_level` 0, crownmark cost | **REPLACE** as the dragon-knowledge model. The ID may survive migration. The *meaning* must become observation-backed disciplines. |
| Utility plumbing | logistics_res, scouting, rationing | **KEEP**; scouting is an evidence source for dragon research. |

Current `dragon_studies` is prerequisite plumbing plus unit unlocks.
That is allowed as a *gate*, not as the player's experience of
understanding a dragon.

---

## Canonical dragon-knowledge loop

```text
OBSERVE → HYPOTHESIZE → TEST → CODIFY
```

Player-facing knowledge states, per *question*, not per dragon blob:

```text
RUMORED → OBSERVED → SUPPORTED → PROVEN
```

| State | What the player has | What the UI may say |
| --- | --- | --- |
| RUMORED | farmer talk, a clue, an allied whisper | incomplete, possibly wrong |
| OBSERVED | at least one first-hand fact (scout, fight, roost watch, disaster) | recorded, not understood |
| SUPPORTED | a second independent source or a deliberate test | working hypothesis |
| PROVEN | codified; unlocks a verb, formation, treatment, construction, or equipment pattern | taught to the relevant holding |

The Bestiary (`bestiary_entries.json` + camp-recorded entries) is the
evidence surface. It is not a stamp album and not a complete-the-set
checklist.

---

## Example that must remain possible

**Observe:** arrows frequently deflect from a dragon's shoulder plates
(Mirecrown wet silt-pack, or Ironspine crystal).

**Hypothesize:** plate *angle* matters more than thickness.

**Test:** fight/observe a related wild Ironback, or build a sloped
mantlet and watch a lesser drake strike it.

**Codify:** `Angled Lamination` — a construction or armor pattern, or
a targeting technique (aim joints, not faces).

Result is a new option, not `+12% defense`.

---

## Disciplines

| Discipline | Studies | Typical codify |
| --- | --- | --- |
| **Anatomy** | weak points, healing, armor, flight structure, physiology | targeting, treatment, harness limits |
| **Behavior** | aggression, migration, trust, refusal, social behavior | temperament tells, intercept prediction, pact terms |
| **Ecology** | nests, prey, seasons, terrain, flyways | where a verb can be used; seasonal closures |
| **Harnesscraft** | saddles, restraints, signals, flight equipment, joint braces | role-changing equipment patterns |
| **War Doctrine** | dragon/army coordination, counters, formations, interception, siege, defense | formations, counters, one-dragon-per-march tactics |
| **Husbandry** | signature hatchling growth, roost practice | stage-safe training; vane reading |
| **Provisioning** | Titan-scale feeding, wake cost, recovery | Breach planning; not a skip ticket |

Husbandry and Provisioning are extra disciplines because the signature
and Titan loops are not the same game as "study a wild wyvern."

Kingdom percentage research stays out of these tables.

---

## Evidence sources (failure can teach)

| Source | What it can add | Anti-farm rule |
| --- | --- | --- |
| Roost observation | hatchling behavior, vanes, diet | time-gated; no click-spam; honors refusals |
| Scout of wild / domain tiles | location, absence, coarse anatomy | march capacity + intel quality; Watchtower depth already exists — use it |
| PvE fight (camps, hunts, disasters) | attacks, weaknesses, deflection | losses matter; repeating the same camp does not complete a PROVEN state |
| PvE *defeat* | especially rich ("heavy plate ruined its turn") | costly; first-time bonus, then diminishing |
| PvP fight / defeat | enemy dragon tells | opponent-dependent; cannot be farmed in a vacuum |
| Allied reports | rumored or observed facts | incomplete; not a copy of the ally's PROVEN codex |
| Captured records | fragments from a scouted or raided scriptorium | raid cost; fragments can be wrong |
| Controlled test | mantlets, bait livestock, dry-out of a captured plate | requires materials and a holding; not a menu button |

**First-time observation** of a species or of a named individual is
worth more than the hundredth Valley Drake camp.

Repeating the cheapest camp to grind `dragon_studies` to 5 is the
failure mode this system exists to kill.

---

## How defeat becomes knowledge

Example (campaign-required):

An enemy fast dragon attacks.

Report:

> NEW OBSERVATION: The dragon loses substantial maneuverability while
> wearing heavy plate.

This contributes toward `Predictive Volley` (War Doctrine + Anatomy).
Eventually the player unlocks a counter formation or a volley timing,
useful against Pale Passage *and* against enemy Leanwings.

The player who never fought that attack can still hear a rumor
(RUMORED) from an ally, but cannot PROVE it without their own test or
fight.

This is the knowledge arms race. It reduces "I lost to an unknown
dragon and learned nothing" without turning losses into a farm.

---

## Interaction with existing readiness / clues / expedition

| Existing | New meaning |
| --- | --- |
| Dragon clues (`shed_scale`, `burned_livestock`, `claw_marks`, `dragon_bone`) | RUMORED or OBSERVED evidence items, not a collect-3-to-bond currency |
| Readiness requirements | **ADAPT** into "you have enough *kinds* of evidence to attempt the Scar expedition" — still a gate, still not a gacha |
| Expedition stages | the Test phase of the first human-vs-dragon-territory question; stage 4 must be a real encounter |
| Bestiary `observation_level` 0–n | map onto RUMORED/OBSERVED/SUPPORTED; PROVEN lives in a discipline entry, not only a bestiary integer |
| `dragon_studies` levels | may remain as a coarse Husbandry/Anatomy gate for unit unlocks during migration; new discoveries must not require dumping 10 percentage levels |

---

## Prefer verbs over percentages

Allowed dragon-research outputs:

- new map or combat *options* (ford signaling, vane reading, predictive
  volley, joint targeting, entrench marker)
- formations and counters
- scouting capabilities
- logistics (how to move beside a wyrm)
- construction techniques
- dragon treatments
- equipment patterns (role, not rarity)

Numeric modifiers are allowed as a *small* part of a proven technique
(a sloped mantlet might also reduce incoming splash). They cannot be
the identity of the discovery.

---

## Production cost

| Piece | Class | Burden |
| --- | --- | --- |
| Knowledge states on bestiary cards | **ALPHA REQUIRED** | MEDIUM — extend existing observation_level |
| At least one OBSERVE→CODIFY chain on the hatchling (Vane Reading) | **ALPHA REQUIRED** | MEDIUM |
| At least one chain on Mirecrown (wet pack / ford signal) | **ALPHA REQUIRED** | MEDIUM |
| Defeat-as-evidence hook on reports | **ALPHA REQUIRED** | MEDIUM |
| Full five-discipline tree | **BETA REQUIRED** | HIGH |
| Allied incomplete knowledge sharing | **BETA REQUIRED** | HIGH |
| Provisioning discipline | **LATER** (with Titan) | HIGH |
| Procedural unique science per fight | **REJECT** | EXTREME |
| Percentage-only dragon tree | **REJECT** | — |

---

## Player-facing test

If a player can describe dragon research as

> I waited on a timer and my numbers went up

the implementation has failed this document, even if `dragon_studies`
still exists as a migration ID.

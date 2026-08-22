# TideForge DoA Reference Model — v0.1

Status: **RESEARCH BASELINE — AUTHORITATIVE HISTORICAL REFERENCE, NOT TIDEFORGE CANON**

Purpose: reconstruct the original browser *Dragons of Atlantis* (DoA) at the
mechanism level so TideForge can preserve proven progression topology without
copying obsolete fiction, later power creep, or accidental wiki contamination.

This document answers **what DoA did and why the mechanism mattered**. It does
not override [`DIRECTION_FREEZE_V1.md`](./DIRECTION_FREEZE_V1.md).

## 1. Authority boundary

The DoA reference model is authoritative only for supported historical claims.
It cannot by itself make a TideForge feature canonical.

Use this chain:

`historical evidence -> reconstructed mechanism -> player value / failure mode -> TideForge disposition -> approved system spec`

The translation step lives in [`DOA_PARITY_MATRIX.md`](./DOA_PARITY_MATRIX.md).
The dependency graph lives in [`PROGRESSION_GRAPH_V1.md`](./PROGRESSION_GRAPH_V1.md)
and [`progression-graph.v1.yaml`](./progression-graph.v1.yaml).

## 2. Evidence labels

| Label | Meaning |
| --- | --- |
| **CONTEMPORARY** | Source written while the original browser game was live. |
| **DEVELOPER** | Kabam/developer/producer statement. |
| **COMMUNITY-DOCUMENTED** | Mature player documentation or community research. |
| **CURRENT-MOBILE** | Surviving mobile-game evidence; secondary only for original browser behavior. |
| **INFERRED** | Design interpretation from multiple observed mechanics. |
| **HYPOTHESIS** | TideForge proposal requiring testing. |

Every historical claim should also carry:

- **era**: `EARLY_BROWSER`, `MATURE_BROWSER`, `LATE_BROWSER`, `MOBILE`, or `MIXED_UNKNOWN`;
- **confidence**: `HIGH`, `MEDIUM`, or `LOW`;
- **contamination risk**: `LOW`, `MEDIUM`, or `HIGH`.

A current wiki page can preserve valid legacy behavior while also containing
systems added years later. Current page state is therefore not proof of launch-
era behavior.

## 3. Reconstructed product skeleton

### 3.1 Three-view world model

**Claim DOA-WORLD-001**

- Evidence: CONTEMPORARY
- Era: EARLY_BROWSER
- Confidence: HIGH
- Contamination risk: LOW
- Sources: S01

DoA used three primary views: **City**, **Field**, and **World Map**. The city
held population, troop training, science and the fortress; the field held
resource production; the world map held wildernesses, enemy cities and
expansion targets.

**Mechanism purpose:** make domestic development, economic production, and
persistent-world action separate but interdependent layers.

### 3.2 Resource and population coupling

**Claim DOA-ECON-001**

- Evidence: COMMUNITY-DOCUMENTED
- Era: MATURE_BROWSER / MIXED_UNKNOWN
- Confidence: HIGH for mechanism, MEDIUM for exact formulas across eras
- Contamination risk: MEDIUM
- Sources: S09, S14, S15

Fortress level controlled field availability and wilderness capacity. Homes
created population capacity. Population depended on happiness; laborers and
trainees reduced idle population available for further recruitment. Taxation
created gold while reducing happiness/population.

This produced a real strategic coupling:

`housing -> population -> labor / idle manpower -> production + troop training`

and

`tax rate -> gold vs happiness -> active population -> recruitment capacity`.

The mature meta partially degenerated into setting taxes to zero when troop
production mattered and minimizing labor-heavy fields in advanced builds.
That optimization is evidence that the coupling mattered, not evidence that
the exploit should be copied.

### 3.3 Military infrastructure and concurrency

**Claim DOA-MIL-001**

- Evidence: COMMUNITY-DOCUMENTED
- Era: MATURE_BROWSER / MIXED_UNKNOWN
- Confidence: HIGH
- Contamination risk: MEDIUM
- Sources: S10, S11, S12, S13

Core military roles were separated across buildings:

- **Garrison**: troop availability, queueing, training speed;
- **Science Center**: economic and military research;
- **Muster Point**: march count and troops per march;
- **Officer's Quarters**: General slots; attacks normally required Generals.

The important historical mechanism is not the exact level table. It is that
**army size, number of simultaneous operations, troop technology and commander
availability were separate progression axes**.

### 3.4 Research -> troop capability

**Claim DOA-TECH-001**

- Evidence: COMMUNITY-DOCUMENTED
- Era: MATURE_BROWSER / MIXED_UNKNOWN
- Confidence: HIGH for dependency examples
- Contamination risk: MEDIUM
- Sources: S05, S16, S17, S18

Research and buildings jointly unlocked meaningful unit capability.
Documented examples include:

- Longbowman: Weapons Calibration + Garrison progression;
- Swift Strike Dragon: Dragonry + Rapid Deployment + Garrison + Rookery;
- Battle Dragon: higher Dragonry/Rapid Deployment plus Garrison, Metalsmith,
  and Rookery progression.

These dependencies made research a route to new operational options rather
than only a percentage-stat ladder.

### 3.5 Combat was positional enough to create composition rules

**Claim DOA-COMBAT-001**

- Evidence: COMMUNITY-DOCUMENTED
- Era: MATURE_BROWSER
- Confidence: MEDIUM-HIGH
- Contamination risk: MEDIUM
- Sources: S16, S24, S25

Player research describes combat using troop groups with melee attack, ranged
attack, defense, life, speed and range. Ranged troops could damage melee units
before contact; battlefield length and unit speed could make mixed ranged /
fast-melee compositions perform worse than their raw stats suggested.

Exact resolver reconstruction remains incomplete, but this is enough to reject
a pure Power Score interpretation of original combat.

### 3.6 Anthropus Camps were a repeatable progression economy

**Claim DOA-PVE-001**

- Evidence: COMMUNITY-DOCUMENTED
- Era: MATURE_BROWSER / LATE_BROWSER mixed
- Confidence: HIGH for role, MEDIUM for exact respawn/drop tables by era
- Contamination risk: HIGH
- Sources: S04, S07

Camps were leveled repeatable PvE targets used for:

- resources;
- composition/research checks;
- farming;
- rare items;
- Great Dragon armor at level 5+ in the documented legacy progression.

Later camp tables contain expansion-era drops. TideForge should inherit the
**repeatable PvE progression role**, not the accumulated loot catalog.

### 3.7 Wildernesses were held economic objectives and progression sites

**Claim DOA-WILD-001**

- Evidence: COMMUNITY-DOCUMENTED
- Era: MATURE_BROWSER / LATE_BROWSER mixed
- Confidence: HIGH for ownership/production relationship
- Contamination risk: HIGH for later item tables
- Sources: S08

Forests, hills, mountains, lakes, savannas and plains were world-map targets.
Conquering wildernesses increased city production; higher-level wildernesses
gave larger bonuses. Wildernesses also became item/egg/armor locations.

This made the map economically useful even without PvP.

### 3.8 Great Dragon readiness was a multi-system progression gate

**Claim DOA-DRAGON-001**

- Evidence: CONTEMPORARY + COMMUNITY-DOCUMENTED
- Era: EARLY_BROWSER through MATURE_BROWSER
- Confidence: HIGH for the structural gate
- Contamination risk: MEDIUM
- Sources: S01, S04, S05, S06

The Great Dragon was visible in the Dragon Keep early. Community beginner
material describes the first one or two weeks as substantially focused on
making it operational through:

- Dragon Keep progression;
- Dragonry;
- Great Dragon armor from level 5+ camps;
- Aerial Combat.

Aerial Combat itself depended on Dragonry and the Great Dragon readiness
conditions in documented legacy behavior.

The contemporary 2010 review is especially important because it records a
failure mode: the dragon was visually compelling but too peripheral for too
long. TideForge should preserve the multi-system preparation topology while
making dragon presence meaningful earlier.

### 3.9 Great Dragon readiness -> first outpost

**Claim DOA-OUTPOST-001**

- Evidence: COMMUNITY-DOCUMENTED
- Era: MATURE_BROWSER
- Confidence: HIGH for progression topology; MEDIUM for exact historical
  requirement that the Great Dragon be present in every egg-hunting attack
- Contamination risk: MEDIUM-HIGH
- Sources: S04, S19, S20

Legacy guides connect Great Dragon readiness directly to the Water Dragon Egg
hunt and the first outpost. The documented Water Outpost chain is:

`Great Dragon readiness -> attack qualifying lakes -> Water Dragon Egg -> Water Outpost -> Water Dragon -> Fangtooth access + special material economy`.

Later documentation notes that egg drops no longer required a Great/Elemental
Dragon in the march. Therefore the **structural dependency is authoritative;
the exact per-attack dragon requirement is not**.

### 3.10 Original outpost chain created differentiated expansion

**Claim DOA-OUTPOST-002**

- Evidence: COMMUNITY-DOCUMENTED
- Era: MATURE_BROWSER
- Confidence: HIGH for Water -> Stone -> Fire -> Wind sequence
- Contamination risk: MEDIUM
- Sources: S20, S21, S22, S23

The original four outposts formed a chained expansion path:

1. Water Egg / Water Outpost;
2. Stone Egg / Stone Outpost;
3. Fire Egg / Fire Outpost;
4. Wind Egg / Wind Outpost.

The corresponding eggs were associated with different wilderness types, and
each outpost added its own dragon plus elite troop/material economy. Later
browser DoA added many more outposts and progression layers; those are not
part of the foundational chain unless separately evidenced and approved.

**Mechanism purpose:** expansion was not merely City #2. Each settlement was a
new progression package attached to world activity.

### 3.11 Alliances were a core retention/progression layer

**Claim DOA-SOCIAL-001**

- Evidence: DEVELOPER
- Era: MOBILE interview describing continuity from web
- Confidence: HIGH for product intent
- Contamination risk: LOW-MEDIUM
- Sources: S02

Kabam producer Eddie Hsu described a good alliance as being at the crux of
engaging players and emphasized recruitment, mentoring, chat and the seven-day
new-player protection runway. He also said most web combat/build strategies
remained viable in mobile.

This supports treating alliance progression as a destination of the individual
progression graph, not decoration.

## 4. Foundational dependency chain

The evidence supports this mechanism-level chain:

`City/Field economy`

`-> population + buildings`

`-> research + troop unlocks`

`-> march capacity + commander concurrency`

`-> repeatable camp/wilderness success`

`-> Great Dragon armor + Dragonry + Aerial Combat + Dragon Keep readiness`

`-> dragon operational use / egg hunt`

`-> Water Outpost`

`-> differentiated dragon/troop/material economy`

`-> Stone -> Fire -> Wind outpost chain`

`-> larger economic/military footprint`

`-> deeper PvP/alliance warfare`.

This topology is more important to TideForge than any original noun.

## 5. Known failure modes to preserve as warnings

1. **Dragon peripherality** — contemporary criticism; make dragon presence and
   anticipation meaningful earlier without giving every player an instant True
   Dragon.
2. **Population/tax degenerate optimization** — preserve the economic/recruitment
   tradeoff, not repetitive tax toggling or irreversible newbie traps.
3. **General farming exploit** — trivial low-risk wins could level Generals;
   meaningful command progression should scale with responsibility/difficulty.
4. **Solved PvE farming** — predictable camps encouraged one solved composition;
   retain readability but add controlled variation over time.
5. **Queue/premium friction** — do not assume one construction slot and paid
   acceleration are sacred simply because they were familiar.
6. **Expansion power creep** — later browser/mobile layers are not automatically
   foundational DoA mechanisms.

## 6. Unresolved research before a full Product Bible freeze

The following remain research tasks, not facts to improvise:

- complete launch/early building prerequisite graph;
- complete early research prerequisite graph;
- baseline troop roster separated from later additions;
- exact early battle-round / targeting / wall semantics;
- exact era-by-era Great Dragon armor and egg-drop rule changes;
- exact Water/Stone/Fire/Wind outpost player-level/plain requirements by era;
- original PvP plunder/hide/defense semantics;
- original reinforcement/resource-transfer constraints;
- original quest ordering versus mature player meta.

## 7. Source registry

Accessed 2026-08-19 unless noted. Current community pages are evidence about
legacy mechanics, not proof that every detail existed at launch.

| ID | Class | Source | Era / contamination note |
| --- | --- | --- | --- |
| S01 | CONTEMPORARY | Gamezebo, *Dragons of Atlantis Review*, 2010-10-13 — https://www.gamezebo.com/reviews/dragons-of-atlantis-review/ | EARLY_BROWSER; LOW |
| S02 | DEVELOPER | GameSided Q&A with producer Eddie Hsu, 2013-08-08 — https://gamesided.com/2013/08/08/gamesided-qa-eddie-hsu-producer-dragons-of-atlantis-heirs-of-the-dragon/ | MOBILE interview; LOW-MEDIUM |
| S03 | CONTEMPORARY | Gamezebo, *Heirs of the Dragon Review* — https://www.gamezebo.com/reviews/dragons-of-atlantis-heirs-of-the-dragon-review/ | MOBILE; LOW for mobile observations |
| S04 | COMMUNITY-DOCUMENTED | Beginners: Getting Your Dragons — https://dragonsofatlantis.fandom.com/wiki/Beginners:_Getting_Your_Dragons | Legacy guide; MEDIUM |
| S05 | COMMUNITY-DOCUMENTED | Dragonry — https://dragonsofatlantis.fandom.com/wiki/Dragonry | MIXED_UNKNOWN; MEDIUM |
| S06 | COMMUNITY-DOCUMENTED | Aerial Combat — https://dragonsofatlantis.fandom.com/wiki/Aerial_Combat | MIXED_UNKNOWN; MEDIUM |
| S07 | COMMUNITY-DOCUMENTED | Anthropus Camps — https://dragonsofatlantis.fandom.com/wiki/Anthropus_Camps | Legacy + later drops; HIGH |
| S08 | COMMUNITY-DOCUMENTED | Wildernesses — https://dragonsofatlantis.fandom.com/wiki/Wildernesses | Legacy + later drops; HIGH |
| S09 | COMMUNITY-DOCUMENTED | Fortress — https://dragonsofatlantis.fandom.com/wiki/Fortress | MIXED_UNKNOWN; MEDIUM |
| S10 | COMMUNITY-DOCUMENTED | Garrison — https://dragonsofatlantis.fandom.com/wiki/Garrison | MIXED_UNKNOWN; MEDIUM |
| S11 | COMMUNITY-DOCUMENTED | Science Center — https://dragonsofatlantis.fandom.com/wiki/Science_Center | MIXED_UNKNOWN; MEDIUM |
| S12 | COMMUNITY-DOCUMENTED | Muster Point — https://dragonsofatlantis.fandom.com/wiki/Muster_Point | Contains later levels; HIGH for exact tables |
| S13 | COMMUNITY-DOCUMENTED | Officer's Quarters — https://dragonsofatlantis.fandom.com/wiki/Officer%27s_Quarters | Legacy exploit documented; MEDIUM |
| S14 | COMMUNITY-DOCUMENTED | Population — https://dragonsofatlantis.fandom.com/wiki/Population | MIXED_UNKNOWN; MEDIUM |
| S15 | COMMUNITY-DOCUMENTED | Tax — https://dragonsofatlantis.fandom.com/wiki/Tax | Mature meta; MEDIUM |
| S16 | COMMUNITY-DOCUMENTED | Longbowman — https://dragonsofatlantis.fandom.com/wiki/Troops:_Longbowman | MIXED_UNKNOWN; MEDIUM |
| S17 | COMMUNITY-DOCUMENTED | Swift Strike Dragon — https://dragonsofatlantis.fandom.com/wiki/Troops:_Swift_Strike_Dragon | MIXED_UNKNOWN; MEDIUM |
| S18 | COMMUNITY-DOCUMENTED | Battle Dragon — https://dragonsofatlantis.fandom.com/wiki/Troops:_Battle_Dragon | MIXED_UNKNOWN; MEDIUM |
| S19 | COMMUNITY-DOCUMENTED | Water Outpost — https://dragonsofatlantis.fandom.com/wiki/Water_Outpost | MATURE_BROWSER; MEDIUM |
| S20 | COMMUNITY-DOCUMENTED | Eggs and Armor — https://dragonsofatlantis.fandom.com/wiki/Eggs_and_Armor | Explicit later rule changes; HIGH |
| S21 | COMMUNITY-DOCUMENTED | Stone Dragon / Stone Outpost — https://dragonsofatlantis.fandom.com/wiki/Stone_Dragon | MATURE_BROWSER + later additions; MEDIUM-HIGH |
| S22 | COMMUNITY-DOCUMENTED | Fire Outpost — https://dragonsofatlantis.fandom.com/wiki/Fire_Outpost | MATURE_BROWSER + later additions; MEDIUM-HIGH |
| S23 | COMMUNITY-DOCUMENTED | Wind Outpost — https://dragonsofatlantis.fandom.com/wiki/Wind_Outpost | MATURE_BROWSER + later additions; MEDIUM-HIGH |
| S24 | COMMUNITY-DOCUMENTED | Battle Mechanics — https://dragonsofatlantis.fandom.com/wiki/Battle_Mechanics | Community reverse engineering; MEDIUM |
| S25 | COMMUNITY-DOCUMENTED | DoA Wiki by Lord Punisher, Battle mechanics — https://doawiki.wordpress.com/battle-mechanics/ | Contemporary/mature community research; MEDIUM |

## 8. Research verdict

The strongest inherited DoA mechanism is a **progression dependency network**,
not a feature list. TideForge should preserve that topology while changing
fiction, removing degenerate optimizations, keeping True Dragons rare, and
making each dependency legible enough that new players are not punished for
not reading veteran guides.

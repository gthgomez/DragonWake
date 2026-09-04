# DRAGON WAKE — DOA PARITY IMPLEMENTATION MASTER CONTRACT

**Repository:** `gthgomez/DragonWake`  
**Primary mission:** Bring Dragon Wake to strong gameplay/progression parity with the original *Dragons of Atlantis* (DoA) while keeping Dragon Wake legally and creatively original.  
**Artifact role:** This file is an implementation authority and working reference for the coding agent. Read it before changing code, keep it available throughout implementation, and update the repo's canonical design/status documents as the work lands.

---

## 0. EXECUTIVE DIRECTIVE

You are not starting Dragon Wake over.

You are inheriting an already substantial TypeScript MMORTS implementation whose core architecture is good enough to continue. Your job is to **preserve the existing working foundation, reconcile the current open Alpha R1 work, then complete the missing dependency loops that made Dragons of Atlantis compelling**.

The target is not a loose "dragon city-builder inspired by DoA."

The target is:

> **A modern, original, polished successor that makes a former Dragons of Atlantis player immediately understand the progression rhythm, strategic dependencies, world activity, expansion motivation, and social-war loop — without copying DoA's copyrighted assets, text, names, fiction, or exact numerical tables.**

When choosing between:
- making Dragon Wake generically "better" in a way that moves it away from DoA's core gameplay structure, or
- preserving the reason DoA's systems depended on each other,

**preserve the DoA-derived gameplay topology unless an existing higher-authority Dragon Wake design document explicitly rejects it.**

Do not replace proven working systems just because a different architecture is aesthetically preferable.

Do not perform a large rewrite.

Do not silently change the frozen art/lore direction.

Do not confuse parity with literal copying.

Do not optimize only for passing tests. The game must become materially closer to the target player experience.

---

# 1. LIVE BASELINE — VERIFY BEFORE IMPLEMENTING

At the time this contract was authored:

- Repository: `gthgomez/DragonWake`
- Default branch: `main`
- Observed `main` SHA: `25c68b633ee5874d244da704de5bcbb8d1f0bb0b`
- Open PR: **#6 — `Alpha R1: The Living Kingdom`**
- PR branch: `feat/alpha-r1-living-kingdom`
- Observed PR head: `411cf008d624962fbd85eaaea0f9ef65f2275c1b`
- PR #6 was observed open, non-draft, mergeable, with its own green exact-head CI evidence.
- `main` had not yet absorbed PR #6 when this file was created.

**This information can become stale. Do not blindly act on the SHAs above.**

### Required first action

Before editing:

1. fetch/inspect current `origin/main`;
2. inspect all open PRs;
3. inspect PR #6 specifically;
4. inspect current checks for its exact head;
5. inspect local worktrees/dirty state;
6. determine whether PR #6:
   - is still open,
   - has changed,
   - is merged,
   - is superseded,
   - or conflicts with newer work;
7. preserve all unique valuable work;
8. never create a competing Alpha R1 implementation from an older `main`.

If PR #6 remains the valid integration candidate, treat its work as part of the baseline you are extending.

Do not force-push or destroy another agent's work.

---

# 2. DESIGN AUTHORITY

Read these before implementing and treat them as product authority, with later/frozen documents overriding older exploratory documents where they conflict:

1. `docs/design/DIRECTION_FREEZE_V1.md`
2. `docs/design/CANON_AUTHORITY.md`
3. `docs/design/CLOSED_MOCKUP_V1.md`
4. `docs/design/LORE_BIBLE_V1_BRIEF.md`
5. `docs/design/MIGRATION_PLAN.md`
6. `docs/design/DOA_REFERENCE_MODEL.md`
7. `docs/design/DOA_PARITY_MATRIX.md`
8. `docs/design/PROGRESSION_GRAPH_V1.md`
9. `docs/design/ALPHA_VISUAL_CONTRACT_V1.md` if present through Alpha R1
10. current delivery/status documents under `delivery/`

### Critical interpretation rule

The **nouns are less important than the dependency graph**.

Dragon Wake may use:
- Keep instead of Fortress;
- Scriptorium instead of Science Center;
- Commanders' Hall instead of Officer's Quarters;
- original settlement types instead of Water/Stone/Fire/Wind Outposts;
- Crownmarks instead of generic Gold.

But the systems should preserve the reasons the DoA equivalents mattered.

---

# 3. PRODUCT DIRECTION — WHAT DRAGON WAKE MUST FEEL LIKE

Dragon Wake is a persistent medieval fantasy kingdom/MMORTS centered on dragons.

The visual and fictional direction is:

- grounded late-medieval fantasy;
- approximately 12th–15th-century material culture as the baseline;
- weathered stone, timber/wood, ironwork, cloth, parchment, mud, roads, fields, practical fortifications;
- low-to-medium fantasy rather than neon/high-fantasy spectacle;
- dragons are rare, biologically extraordinary, consequential creatures;
- normal armies, logistics, commanders, walls, siege equipment and economic production remain relevant even after dragons enter the game;
- UI may be modern and readable, but it should sit over a medieval world rather than feel like a detached SaaS dashboard;
- world/city visuals should be primary;
- avoid generic glossy mobile-city-builder art;
- avoid anime/Warcraft-like proportions unless later authority explicitly changes direction;
- avoid elemental-color faction design as the main identity system;
- True Dragons must never become ordinary stack troops such as `Dragon x 28,492`.

### Dragon design principle

The player should feel the **presence of dragons before possessing or allying with one**.

Early dragon progression should include:
- rumors;
- tracks;
- livestock kills;
- scorched locations;
- distant silhouettes;
- witnesses/refugees;
- Bestiary observations;
- Dragon Watch sightings;
- lesser drakes/wyverns where appropriate;
- expeditions and preparation.

A True Dragon should feel earned and consequential.

---

# 4. THE DOA PARITY TARGET

Do not interpret "match DoA" as copying interface pixels or exact numerical balance.

Match the **mechanism topology, motivation structure, and player rhythm**.

A DoA veteran should recognize this underlying loop:

```text
Build settlement
 -> create resource economy
 -> grow population/manpower
 -> improve defenses
 -> research technologies
 -> train differentiated troops
 -> increase march/command capacity
 -> scout and attack PvE targets
 -> capture useful wilderness
 -> discover dragon-related evidence/material
 -> prepare dragon capability
 -> perform targeted world activity
 -> earn expansion prerequisite
 -> establish differentiated secondary settlement
 -> unlock new economic/military capability
 -> repeat regional expansion
 -> join alliance
 -> scout/attack/reinforce/coordinate
 -> fight larger wars
 -> pursue higher dragon capability
 -> become a regional power
```

This is the skeleton.

The existing `PROGRESSION_GRAPH_V1.md` already captures this well. Preserve its `PG-INV-*` invariants unless a human explicitly authorizes a replacement.

---

# 5. HISTORICAL DOA MECHANISMS TO PRESERVE OR MODERNIZE

The original DoA research establishes several important structural facts.

## 5.1 City / Field / World separation

DoA separated:
- city development;
- field resource production;
- world-map activity.

Dragon Wake should preserve clear mental separation between:
- **Castle/settlement development**
- **Lands/resource production**
- **Realm/world operations**

Do not collapse the game into one generic dashboard.

## 5.2 Core economy

Classic DoA used the familiar economic roles:
- Food
- Wood/Lumber
- Stone
- Metal/Ore
- Gold

Those resources fed buildings, research and armies rather than existing as decorative counters.

Dragon Wake will preserve that mental model with original naming where appropriate.

## 5.3 Homes / population / manpower

DoA connected:
- Homes -> population capacity;
- production fields -> laborers;
- troop queues -> trainees;
- remaining population -> idle population available for recruitment.

Dragon Wake already has population/manpower.

Preserve the **civilian capacity vs military growth tradeoff**, but do not reproduce DoA's abusive tax toggling or permanent beginner traps.

## 5.4 Central fortress/keep progression

DoA's Fortress was not cosmetic. Its progression constrained other parts of the city/empire.

Dragon Wake's Keep must become a visible, central progression spine without becoming the only meaningful progression axis.

## 5.5 Research

The Science Center gave long-horizon economic and military progression.

Dragon Wake's research must unlock:
- new units;
- doctrines;
- scouting capabilities;
- logistics;
- siege/anti-dragon options;
- settlement capabilities;

not merely increase percentages.

## 5.6 Muster Point

DoA's Muster Point strongly tied building level to:
- number of concurrent marches;
- troops per march.

This is a high-priority parity mechanism.

Dragon Wake's Muster Yard must matter operationally.

## 5.7 Generals / command capacity

DoA required Generals for meaningful army operations and allowed leader progression.

Dragon Wake's Commanders are already distinct non-stackable characters.

Keep:
- commander availability;
- commander specialization;
- wounds/recovery;
- meaningful experience;
- command tradeoffs.

Reject meaningless XP farming against trivial targets.

## 5.8 Intelligence

Scouting and Sentinel-like progression should progressively reduce uncertainty.

Intelligence should have depth:
- presence;
- direction/origin;
- ETA;
- broad troop type;
- approximate strength;
- exact composition;
- commander information;
- siege presence;
- probable intent;
- counterintelligence later.

## 5.9 Anthropus-style PvE

DoA's Anthropus Camps were:
- repeatable PvE;
- farming targets;
- readiness checks;
- sources of resources/dragon progression materials.

Dragon Wake already has camp infrastructure.

Deepen it; do not replace it.

## 5.10 Wildernesses

DoA wildernesses:
- had types;
- had levels;
- gave persistent production bonuses;
- could be involved in rare/dragon item acquisition.

Dragon Wake should preserve and expand this.

## 5.11 Dragon readiness

DoA's dragon capability depended on multiple systems such as Dragon Keep progression, armor/material collection and research such as Dragonry/Aerial Combat.

Dragon Wake should preserve **multi-system readiness**, not the exact DoA item names/equations.

## 5.12 Outposts

DoA's outposts expanded the empire and introduced new resource/troop/dragon opportunities.

Historically the well-known chain included:
- Water Outpost
- Stone Outpost
- Fire Outpost
- Wind Outpost

Dragon Wake must preserve the **chained differentiated expansion motivation**, but must NOT copy that elemental fiction.

## 5.13 Alliances

DoA alliances supported:
- ranks;
- chat;
- friendly/neutral/enemy relationships;
- reinforcement;
- social coordination;
- war.

Dragon Wake's late progression must merge individual progression with alliance progression.

---

# 6. FINAL RESOURCE NAMING CONTRACT

The current repository still uses the intermediate canonical model:

```text
food
timber
stone
iron
coin
```

This contract supersedes that naming.

## 6.1 Final canonical base resources

Use these canonical IDs and player-facing names:

| Canonical ID | Player-facing name | Meaning |
|---|---|---|
| `food` | Food | crops, livestock, rations, ordinary food supply |
| `wood` | Wood | harvested structural wood/lumber |
| `stone` | Stone | quarried construction stone |
| `ore` | Ore | raw metallic ore used by smithing/metallurgy |
| `crownmark` | Crownmarks | Dragon Wake's ordinary minted gold currency |

### Important

**Crownmarks are physical gold coins and the normal kingdom currency.**

They are NOT merely a UI alias for an abstract "coin" meter.

Player-facing copy should naturally say things such as:

- `120 Crownmarks`
- `Requires 400 Wood`
- `Produces 25 Ore/hour`

Crownmark iconography should depict a grounded minted gold coin, ideally with an original crown/realm mark.

Do not use:
- generic `Coin` as the final display label;
- `Gold` as the canonical ID;
- a copied DoA currency symbol or coin design.

## 6.2 Why Wood

Use **Wood**, not Timber, as the player-facing baseline resource.

"Lumber Yard" can remain the building name.

The resource itself is Wood.

## 6.3 Why Ore

Use **Ore**, not Iron.

Ore creates useful future design space:

```text
Mine -> Ore -> Smithy/Metallurgy -> weapons/armor/siege production
```

Later systems may distinguish:
- common ore;
- high-grade ore;
- rare alloy inputs;
- dragon-altered mineral material;

without forcing the baseline economy to pretend raw mine output is already refined iron.

## 6.4 Migration generations that must be supported

The repository has had at least three naming generations.

### Legacy aquatic IDs

```text
kelp
driftwood
basalt
slagiron
tidegilt
```

### Intermediate medieval IDs

```text
food
timber
stone
iron
coin
```

### Final IDs

```text
food
wood
stone
ore
crownmark
```

The migration must preserve valid stored value through both transitions.

Do not assume every existing development database already completed the first migration.

---

# 7. RESOURCE RENAME — IMPLEMENTATION REQUIREMENTS

Treat this as a domain migration, not a search-and-replace.

## 7.1 Shared types

Update the canonical shared `ResourceBag` to:

```ts
{
  food: number;
  wood: number;
  stone: number;
  ore: number;
  crownmark: number;
}
```

Prefer a single canonical exported resource tuple, e.g.:

```ts
export const RESOURCE_IDS = [
  "food",
  "wood",
  "stone",
  "ore",
  "crownmark",
] as const;
```

Use literal unions and exhaustive handling where practical.

Do not scatter manually duplicated resource arrays across packages.

## 7.2 Canonicalization

Create/update a canonicalization layer capable of understanding transitional IDs.

For one controlled compatibility window:

```text
kelp      -> food
driftwood -> wood
timber    -> wood
basalt    -> stone
slagiron  -> ore
iron      -> ore
tidegilt  -> crownmark
coin      -> crownmark
```

Internally, convert immediately to final IDs.

Do not dual-write old/new resource bags indefinitely.

## 7.3 Content

Sweep:
- building costs;
- unit costs;
- research costs;
- camp rewards;
- wilderness bonuses;
- quest rewards;
- dragon expedition costs;
- settlement prerequisites;
- formulas;
- starter resources;
- tooltips;
- UI copy;
- tests.

The final content API should not require callers to know legacy aliases.

## 7.4 PostgreSQL schema

Fresh schema final columns:

```text
food
wood
stone
ore
crownmark
```

Existing databases may contain either:
- aquatic columns;
- intermediate columns;
- a partial mixture after interrupted development migrations.

Migration must be:
- idempotent;
- data preserving;
- restart safe;
- explicit about unexpected mixed states.

PostgreSQL `ALTER TABLE` operations can take strong table locks. Keep the migration narrow and predictable. Do not introduce expensive table rewrites unnecessarily.

## 7.5 Hidden JSON migration

This is a HIGH-RISK area.

Current persistence includes fractional resource carry in:

```text
cities.res_fraction JSONB
```

Existing JSON may contain:

```json
{
  "food": ...,
  "timber": ...,
  "stone": ...,
  "iron": ...,
  "coin": ...
}
```

or older legacy keys.

Migrate/canonicalize those keys so fractional production is not silently lost after the rename.

Expected final JSON keys:

```json
{
  "food": 0,
  "wood": 0,
  "stone": 0,
  "ore": 0,
  "crownmark": 0
}
```

## 7.6 March cargo

Current persistence embeds cargo in the `marches.composition` JSON object under `__cargo`.

That is another hidden resource-bag boundary.

Audit and canonicalize persisted cargo keys.

A returning haul/reinforcement march created before migration must not:
- lose Wood/Ore/Crownmarks;
- duplicate them;
- return resources under dead keys.

## 7.7 Other JSON/state surfaces

Search all persisted JSON for possible resource-shaped data, including:
- `battle_reports.result`;
- queue payloads;
- quest JSON;
- cached API fixtures;
- dev/demo seeds;
- screenshots only if text assertions depend on names.

Do not assume a prior document saying "queue payload does not contain resources" remains true; re-audit the current code.

## 7.8 API validation

Inbound API validation should:
- reject malformed bags;
- prevent negative or `NaN` values;
- accept transitional legacy keys only where explicitly intended;
- canonicalize before world mutation;
- never leak ambiguous bags into the sim.

Hono JSON validation tests must send `Content-Type: application/json`, otherwise body validation can receive `{}`.

## 7.9 UI

The resource HUD should display exactly:

```text
Food | Wood | Stone | Ore | Crownmarks
```

Remove obsolete label adapters once compatibility no longer requires them.

The visual design should make Crownmarks visibly gold currency.

## 7.10 Required migration tests

Prove all of these:

1. fresh DB starts with final columns;
2. aquatic legacy DB migrates correctly;
3. intermediate `food/timber/stone/iron/coin` DB migrates correctly;
4. mixed/partially migrated state is either safely reconciled or fails loudly with a useful error;
5. `res_fraction` values survive;
6. march `__cargo` values survive;
7. save -> process restart -> load preserves exact resources;
8. second boot is a no-op/idempotent migration;
9. production tick after migration updates the correct new fields;
10. API legacy compatibility does not result in dual-key bags.

### Final grep gate

Outside intentional migration history/docs, obsolete canonical usage should be gone.

Search for at least:

```text
kelp
driftwood
basalt
slagiron
tidegilt
timber
iron
coin
```

Do not blindly demand zero occurrences where historical migration compatibility intentionally documents them. Classify every remaining hit.

---

# 8. PARITY STATUS MATRIX V2

Before broad feature work, update `docs/design/DOA_PARITY_MATRIX.md`.

Add implementation status independently from design disposition.

Use:

- `PROVEN`
- `PARTIAL`
- `ABSENT`
- `DELIBERATE_DIVERGENCE`
- `REJECTED`

For each row include:
- DoA role;
- Dragon Wake equivalent;
- current implementation evidence;
- missing behavior;
- tests proving it;
- next work if partial.

Do not mark a feature `PROVEN` merely because:
- a type exists;
- a table exists;
- the UI shows a button;
- a method exists;
- a unit test directly calls an internal function.

`PROVEN` means the player-relevant causal loop works through the real authoritative path.

---

# 9. PHASE 1 — MAKE THE KEEP A REAL PROGRESSION SPINE

The central Keep should become one of the strongest remaining DoA-parity improvements.

## Goal

Keep level must visibly gate kingdom scale.

Do not turn it into a cosmetic level counter.

## Candidate gating dimensions

Design and implement a coherent level table that can govern some combination of:

- city building level cap;
- available city building plots;
- available Lands plots;
- wilderness holding capacity;
- simultaneous march ceiling;
- maximum Muster Yard progression;
- Commander capacity ceiling;
- Walls tier;
- advanced research eligibility;
- settlement/outpost eligibility;
- special construction prerequisites.

Do not attach every number to Keep level. Preserve multiple progression axes.

### Required UI behavior

When an action is locked:

the UI must explain:
- what is locked;
- why;
- exact missing requirement;
- where to act next.

Avoid mysterious disabled buttons.

### Required tests

Prove:
- low Keep blocks higher-level development;
- upgrading Keep unlocks the exact intended capability;
- restart persistence retains it;
- bypassing through raw API/internal method is impossible.

---

# 10. PHASE 2 — DEEPEN BUILDING DEPENDENCIES

The current building roster is useful. Make the buildings matter more.

## 10.1 Homes

Homes:
- increase population capacity;
- feed the manpower economy;
- should make civilian/military capacity legible.

Avoid recreating DoA's zero-tax exploit.

## 10.2 Barracks / training

Higher training infrastructure should affect some combination of:
- available unit classes;
- queue throughput;
- queue capacity/concurrency;
- training time;
- doctrine prerequisites.

Do not let unit unlocks exist only in research if the building should also matter.

## 10.3 Scriptorium

Should govern:
- research availability;
- research tier;
- possibly research concurrency/speed later;
- Bestiary/dragon scholarly progression where appropriate.

## 10.4 Muster Yard

High-priority.

It should visibly influence operational capacity.

At minimum preserve two separate concepts:
- simultaneous operations;
- troops per march.

Do not collapse both into one global "Power" number.

## 10.5 Commanders' Hall

Should influence:
- commander slots;
- recruitment/availability;
- recovery or progression support;
- advanced command capabilities.

## 10.6 Watchtower

Implement tiered intelligence revelation.

Avoid giving perfect information from the first scouting level.

## 10.7 Dragon Watch

Make it a meaningful bridge between:
- city investment;
- world dragon sightings;
- Bestiary knowledge;
- readiness.

It should not be a decorative quest building.

---

# 11. PHASE 3 — RESEARCH MUST CHANGE STRATEGY

Current research already includes meaningful unit unlocks. Preserve and deepen that strength.

Audit every research line and classify it:

- economy;
- infantry;
- ranged;
- cavalry;
- siege;
- logistics;
- scouting/intelligence;
- fortification;
- medical/recovery;
- dragon studies.

For each line ask:

> Does reaching a milestone enable a new decision, or only inflate a number?

Milestone levels should unlock meaningful options.

Examples already consistent with the project:
- Infantry Doctrine -> new infantry roles;
- Archery -> stronger/different ranged roles;
- Cavalry -> mounted capabilities;
- Logistics -> supply wagon/logistics;
- Scouting -> specialized scouts;
- Dragon Studies -> Dragon Watch / Dragon Slayer / Ballista.

Preserve this dependency style.

---

# 12. PHASE 4 — COMPLETE THE PVE MASTERY LADDER

Do not treat camps as interchangeable stat blocks.

Target progression:

## L1–3 — Bandit Camps
Purpose:
- onboarding;
- basic scouting;
- army composition fundamentals;
- early resources;
- first dragon evidence.

## L4–5 — Raider Forts
Purpose:
- organized resistance;
- stronger defenses;
- composition adjustment;
- more valuable loot.

## L6–7 — Beast Dens
Purpose:
- lesser dragon/drake ecology;
- anti-beast considerations;
- rare materials;
- stronger scouting need.

## L8–10 — Wyrm-Scarred Ruins
Purpose:
- advanced PvE;
- dragon-damaged sites;
- anti-dragon preparation;
- high-value clues/material;
- expansion/dragon readiness inputs.

### Anti-solved-farm requirement

One army should not efficiently farm every tier forever.

Use controlled variation:
- troop composition bands;
- terrain/context;
- defenses;
- bounded modifiers;
- scouting uncertainty.

Do not make targets random nonsense.

Mastery should help.

### Determinism

Combat should remain reproducible from server-authoritative inputs.

Randomness, if used around target generation/loot, should be seeded/testable.

---

# 13. PHASE 5 — MAKE WILDERNESS OWNERSHIP MATTER

The existing wilderness system is already valuable. Deepen it.

## Core resource wildernesses

Suggested original Dragon Wake types:

- Forest -> Wood
- Fertile Land -> Food
- Quarry -> Stone
- Ore Deposit -> Ore

Use levels.

A DoA-like readable progression such as roughly increasing bonuses by tier is appropriate, but do not copy exact DoA tables blindly.

The important property is:

> A higher-level wilderness is visibly more valuable and creates a reason to scout, capture, defend, and eventually fight over it.

## Strategic wildernesses

Keep/expand:
- Crossroads -> logistics/march benefit
- Watch Hill -> scouting/intelligence benefit

These are a good modernization because wilderness ownership can alter strategy, not only resource production.

## Capacity

Tie wilderness capacity to meaningful kingdom progression, likely Keep and/or related infrastructure.

## Conflict

Later PvP should make valuable wildernesses:
- contestable;
- scoutable;
- reinforceable;
- report-generating.

---

# 14. PHASE 6 — COMPLETE THE DIFFERENTIATED SETTLEMENT CHAIN

This is one of the largest remaining parity gaps.

Dragon Wake already has a path toward a Marcher Keep.

Do not stop at "second city unlocked."

Create a motivational chain comparable in STRUCTURE to DoA's outpost progression while remaining entirely original in fiction.

## Required invariant

Each major secondary settlement must unlock at least one capability that changes optimal play.

Never create:
- Capital #2;
- Capital #3;
- Capital #4

with only different scenery.

## Recommended chain concept

Use existing canon/names where already frozen. Where names remain tentative, reconcile with authority docs before changing them.

### 1. Capital
Balanced kingdom core.

### 2. Marcher Keep
Role:
- frontier expansion;
- logistics;
- range;
- scouting;
- reinforcement.

Candidate exclusive benefits:
- improved march logistics;
- frontier troop access;
- supply infrastructure;
- increased operational range.

### 3. Forest Citadel
Role:
- reconnaissance;
- tracking;
- ambush;
- woodland operations.

Candidate capabilities:
- Forest Rangers;
- Warhounds;
- tracking;
- wilderness intelligence;
- camouflage/counter-scouting.

### 4. Mountain Hold
Role:
- Ore;
- metallurgy;
- heavy infantry;
- siege;
- fortification.

Candidate capabilities:
- improved Ore economy;
- advanced smithing;
- heavy troops;
- siege production;
- better defensive structures.

### 5. Advanced Dragon/Frontier Stronghold
Only if consistent with frozen canon.

Role:
- dragon study;
- anti-dragon warfare;
- high-tier expeditions;
- alliance-scale preparation.

Candidate capabilities:
- Dragon Slayers;
- Ballistae;
- advanced Bestiary facilities;
- regional dragon expeditions.

## Progression gate

Each settlement should require:
- prior kingdom readiness;
- a world-earned prerequisite;
- meaningful PvE/exploration;
- not merely Keep level + Crownmarks.

## Feedback

Immediately after founding a new settlement, the player must understand:

> "I can now do X that I could not do before."

---

# 15. PHASE 7 — DRAGON PRESENCE FROM MINUTE ONE

DoA placed dragon aspiration close to the center of its fantasy.

Dragon Wake deliberately does not hand out a True Dragon immediately, but it must not make dragons feel like a late hidden menu.

Implement systemic presence.

## Early evidence

Use:
- tracks;
- scales;
- burned livestock;
- claw marks;
- witness reports;
- ruined structures;
- silhouette events;
- damaged wilderness;
- atmospheric world events.

## Bestiary

The Bestiary should answer:
- what have we observed?
- how reliable is it?
- what species/behavior is suspected?
- what preparation does this imply?
- what remains unknown?

## Dragon Watch

Dragon Watch investment should improve:
- observation;
- warning;
- evidence interpretation;
- event detection;
- readiness.

## Lesser creatures

Lesser drakes/wyverns may appear as world threats where lore supports them.

Do not dilute True Dragons by turning every army into dragon stacks.

## True Dragon progression

Keep it:
- multi-stage;
- world-driven;
- research-driven;
- preparation-driven;
- narratively visible.

A single progress bar must never replace the dependency topology.

---

# 16. PHASE 8 — SOCIAL AND PVP PARITY

Current server foundations already include useful primitives such as alliances, chat, marches and reinforcement.

Turn them into an actual social-war loop.

Target:

```text
Scout player
 -> receive uncertain intelligence
 -> decide attack
 -> defender receives warning based on intelligence infrastructure
 -> alliance can see/share threat
 -> allies send reinforcements
 -> timing matters
 -> battle resolves
 -> reports are shareable/useful
 -> retaliation or territorial response follows
```

## Alliance capabilities

Implement/deepen:
- ranks;
- permissions;
- leader/officer/member responsibility;
- alliance chat;
- shared coordinates/intelligence;
- reinforcement workflow;
- resource/haul support where appropriate;
- friendly / neutral / enemy diplomacy;
- alliance announcements;
- activity visibility;
- territorial/shared objectives;
- rankings only where they do not become a single dominant Power Score.

## Shared objective

Add at least one alliance-scale objective once the underlying loops are stable.

Strong candidate:
- regional dragon hunt;
- fortified regional objective;
- timed territorial campaign.

Do not bolt a world boss on top of shallow alliance mechanics first.

---

# 17. PHASE 9 — PROGRESSION PACING

The current development environment proves loops quickly.

That is not the same as proving a persistent MMORTS economy.

Build a deterministic long-horizon progression simulation.

## Time horizons

Evaluate at least:

- first 15 minutes;
- first hour;
- first day;
- day 3;
- day 7;
- day 14;
- day 30.

## Questions

At each horizon answer:

1. What can the player actively do?
2. What is currently blocking them?
3. Are at least two alternative productive actions available?
4. Are resources accumulating too slowly or too quickly?
5. Is population/manpower legible?
6. Are queue times creating planning or merely dead time?
7. Can a player accidentally enter a hard dead-end?
8. Is one resource permanently dominant?
9. Is one unit composition always optimal?
10. Are camps still worth doing?
11. Are wildernesses still worth owning?
12. Does dragon progression remain visible?
13. Is the next settlement clearly anticipated?
14. Does joining an alliance become increasingly valuable?

## Major retention rule

Avoid this state:

> "Everything available to me is maxed, and the only thing I can do is wait for enough currency to unlock the next tier."

There should usually be multiple advancement axes:

- Keep
- buildings
- Lands
- resource optimization
- research
- troops
- commanders
- scouting
- camps
- wilderness
- Bestiary
- dragon readiness
- settlement expansion
- alliance
- territory

## Accelerated test mode

Development acceleration may remain available for automated tests, but:

- production rules must not depend on it;
- long-horizon balance must also be simulated from real canonical values;
- do not tune the game around `DEV_FAST_TIME`.

---

# 18. PHASE 10 — VISUAL PARITY / PRODUCTION ART

Current mechanics are ahead of production artwork.

Do not block mechanical correctness on unavailable image generation, but retain the visual contract and asset hooks.

## Minimum production environment set

Eventually provide original art for:

- Keep progression tiers;
- Homes;
- Barracks;
- Scriptorium;
- Muster Yard;
- Commanders' Hall;
- Watchtower;
- Dragon Watch;
- Storehouse;
- Walls;
- Training Camp;
- Smithy;
- Farm;
- Lumber Yard;
- Quarry;
- Mine;
- roads;
- forests;
- fertile wilderness;
- rocky wilderness;
- Ore Deposit;
- camps;
- raider forts;
- beast dens;
- wyrm-scarred ruins;
- settlement specializations;
- army icons;
- commander portraits;
- dragon clues/evidence;
- lesser drakes;
- dragon silhouettes.

## Art constraints

- original compositions;
- no copied DoA screenshots/assets;
- readable at gameplay scale;
- three-quarter/isometric consistency where frozen;
- stable footprints;
- avoid AI-detail soup;
- no neon elemental palette as faction shorthand;
- practical medieval construction;
- dragons should feel biologically grounded within the setting.

If AGES remains blocked externally:
- do not fabricate a claim that production art was generated;
- retain asset ledgers/hooks;
- continue non-art implementation;
- report exact blocker.

---

# 19. COMMON FAILURE POINTS — READ BEFORE CODING

This section is mandatory. These are the most likely ways an agent can produce "green" work that actually damages the project.

---

## FP-01 — BUILDING FROM STALE MAIN WHILE PR #6 HOLDS UNIQUE WORK

### Failure

Agent checks out `main`, sees missing Alpha R1 features, and implements parallel replacements.

### Prevention

- inspect PR #6 first;
- compare branch/base;
- preserve unique work;
- rebase/merge/cherry-pick deliberately;
- never assume open PR work is disposable.

### Gate

No parity work begins until the agent can explain how Alpha R1 is being preserved.

---

## FP-02 — RESOURCE RENAME ONLY CHANGES UI

### Failure

UI says Wood/Ore/Crownmarks while:
- API still sends timber/iron/coin;
- DB still writes old columns;
- fractional carry still stores old keys;
- cargo uses old keys;
- tests use aliases and hide the mismatch.

### Prevention

Perform a full domain sweep:
- shared types;
- sim;
- content;
- API;
- validation;
- DB;
- persistence;
- JSON;
- tests;
- UI;
- docs.

### Gate

Fresh DB + two legacy DB generations + restart round-trip.

---

## FP-03 — DATA LOSS IN `res_fraction`

### Failure

Resource columns migrate correctly but fractional production carry is ignored.

Players lose fractional state or production begins behaving differently after restart.

### Prevention

Explicit JSON key migration/canonicalization.

Add exact tests with non-zero fractional values for every resource.

---

## FP-04 — DATA LOSS IN MARCH CARGO

### Failure

A march created before migration returns with old-key cargo that no longer credits the city.

### Prevention

Canonicalize cargo during load and/or migrate persisted JSON.

Test:
- create haul;
- persist while en route;
- migrate;
- restart;
- land march;
- assert exact final resources once.

---

## FP-05 — POSTGRES MIGRATION LOCKS / PARTIAL STATE

PostgreSQL `ALTER TABLE` commonly requires strong locks, and many forms acquire `ACCESS EXCLUSIVE`.

### Failure

A boot migration:
- blocks active app traffic;
- partially migrates;
- fails on a mixed schema;
- gets re-run and corrupts/duplicates state.

### Prevention

- keep rename migration small;
- make every step idempotent;
- explicitly detect old/intermediate/final columns;
- avoid table rewrites;
- use a controlled maintenance/bootstrap context;
- test second boot;
- fail loudly on ambiguous state instead of guessing destructively.

Do not use drop-and-recreate for resource columns.

---

## FP-06 — MEMORY MODE WORKS, POSTGRES MODE BREAKS

The server uses an in-process `World` with optional Postgres persistence.

### Failure

Feature is implemented in `World` and unit tests pass, but:
- field is not saved;
- field is not loaded;
- restart resets it;
- API behavior differs after persistence.

### Prevention

Every persistent gameplay feature gets:
1. in-memory behavior test;
2. save;
3. restart/reload;
4. behavior continuation test.

Run `REQUIRE_PG=1`/equivalent against:
- fresh DB;
- migrated existing DB.

---

## FP-07 — SERVER/UI GATE SPLIT-BRAIN

### Failure A

UI disables an action, but direct API can bypass it.

### Failure B

Server correctly blocks it, but UI does not explain why.

### Prevention

- authoritative gate in server/domain;
- UI reads/explains authoritative requirement;
- direct API negative test;
- E2E visible-blocker test.

---

## FP-08 — NON-DETERMINISTIC GAMEPLAY TESTS

### Failure

Tests depend on:
- wall-clock timing;
- random camp generation;
- RNG loot;
- real waiting.

### Prevention

Use:
- injectable/frozen world clock;
- deterministic seeds;
- explicit simulated advancement;
- exact server state assertions.

Never "fix" flaky game logic by adding arbitrary sleeps.

---

## FP-09 — PLAYWRIGHT FLAKINESS

Current repo already uses long E2E journeys and screenshots.

Playwright's own guidance emphasizes:
- user-visible behavior;
- isolated tests;
- resilient role/label locators;
- auto-waiting;
- web-first assertions.

### Failure patterns

- `waitForTimeout()` used as synchronization;
- CSS selectors tied to implementation;
- manually checking `isVisible()` instead of retrying assertions;
- serial interdependent tests where a prior failure poisons later tests;
- tests sharing player state;
- fixed timing assumptions.

### Prevention

Prefer:
- `getByRole`;
- `getByLabel`;
- `getByText` where stable;
- `await expect(locator).toBeVisible()`;
- `toContainText`, `toHaveText`, etc.;
- fresh player/session per test;
- deterministic server conditions.

`waitForTimeout()` may be used only for intentional visual settling/screenshot staging, not correctness synchronization.

### Certification journey

A single long no-admin E2E journey is valuable as a product certification test.

Do not split it into implementation-detail tests merely to make it shorter.

But keep lower-level focused tests isolated so failures are diagnosable.

---

## FP-10 — HIDDEN Hono BODY VALIDATION FAILURE

Hono JSON validation depends on correct content type.

### Failure

An API test posts JSON without:

```http
Content-Type: application/json
```

Validator receives an empty object and the test gives misleading results.

### Prevention

Use the real request path with proper headers.

Add negative validation tests for malformed resource bags and progression commands.

---

## FP-11 — TYPE SYSTEM FAILS TO CATCH NEW RESOURCE/SETTLEMENT CASES

### Failure

A new resource/settlement type is added but a switch silently falls through.

### Prevention

Use literal unions and exhaustive `never` checks for central domain discriminants where practical.

This is especially valuable for:
- resource IDs;
- plot types;
- settlement kinds;
- march intents;
- target types;
- progression-state variants.

---

## FP-12 — TEST-ONLY FEATURE

### Failure

Agent makes acceptance tests green with:
- admin grants;
- dev-only bypasses;
- direct world mutation;
- hidden fixtures unavailable to players.

### Prevention

Use internal unit tests for narrow logic, but certify major progression through real player/API/UI paths.

Alpha R1's no-fixture player journey is the model.

---

## FP-13 — KEEP BECOMES A SINGLE UNIVERSAL LEVEL

### Failure

Every unlock is `Keep >= N`, making research/buildings/world activity irrelevant.

### Prevention

Use Keep as a progression spine, not the whole skeleton.

Major unlocks should combine dependencies.

Example:

```text
Keep 5
+ Dragon Studies 2
+ Dragon Watch 3
+ world-earned charter
-> Marcher Keep eligibility
```

---

## FP-14 — RESEARCH BECOMES PERCENTAGE SOUP

### Failure

Dozens of research levels only say:
- +2% attack;
- +3% production;
- +2% health.

### Prevention

Use milestone unlocks:
- unit;
- formation;
- march ability;
- scouting precision;
- siege capability;
- anti-dragon tactic;
- logistics option.

Percent modifiers may support the tree but must not be its entire purpose.

---

## FP-15 — ONE SOLVED PVE ARMY

### Failure

Player discovers one high-range or high-power army and uses it for every camp forever.

### Prevention

Target composition and context should create counters/tradeoffs.

Build simulation tests comparing multiple equal-ish power armies against different target bands.

---

## FP-16 — WILDERNESS BONUS IS TOO SMALL TO CARE ABOUT OR TOO LARGE TO IGNORE

### Failure A

Owning wilderness is cosmetic.

### Failure B

One wilderness determines the whole economy.

### Prevention

Run long-horizon economic simulation.

Wilderness ownership should be desirable and contestable without becoming mandatory to remain viable.

---

## FP-17 — SECOND SETTLEMENT IS JUST MORE BUILD SLOTS

### Failure

Player spends days earning a new settlement and discovers the same buildings and same strategy.

### Prevention

Every major settlement must immediately unlock a unique strategic package.

Add acceptance tests for capability before/after founding.

---

## FP-18 — DRAGON PROGRESSION BECOMES RNG FRUSTRATION

### Failure

A critical expansion path depends on an unbounded rare drop.

### Prevention

Use:
- pity/guaranteed onboarding evidence;
- bounded RNG;
- deterministic milestone components;
- multi-part expeditions.

PR #6's guaranteed first clue progression is directionally correct.

---

## FP-19 — DRAGONS ERASE ARMY GAMEPLAY

### Failure

Once dragon progression starts, troop composition and siege/defense no longer matter.

### Prevention

Preserve `PG-INV-010`.

Dragons may:
- modify battles;
- enable abilities;
- affect morale/terrain;
- create strategic windows;

but normal military systems remain consequential.

---

## FP-20 — ALLIANCE EXISTS ONLY AS CHAT

### Failure

Alliance implementation stops at:
- name;
- members;
- chat.

### Prevention

Alliance must affect gameplay:
- reinforcement;
- shared intelligence;
- diplomacy;
- objectives;
- coordination;
- territorial conflict.

---

## FP-21 — POWER SCORE BECOMES THE COMBAT ANSWER

### Failure

Players can infer exact battle outcome from a single additive number.

### Prevention

Power may be a rough shorthand.

Actual outcome should still depend on:
- composition;
- range;
- speed;
- defenses;
- commanders;
- scouting uncertainty;
- context.

---

## FP-22 — TIMER/ECONOMY SOFTLOCKS

### Failure

Player spends all of a key resource and cannot:
- train;
- build;
- march;
- recover.

### Prevention

Simulate worst-case novice sequences.

Ensure there is always a recoverable path:
- production;
- low-level PvE;
- quest reward;
- reclaim/respec;
- sufficiently cheap baseline action.

---

## FP-23 — FREE RESOURCE/UNIT DUPLICATION FROM RETRIES

Persistent games are vulnerable to repeated command/landing execution.

### Audit

Especially inspect:
- march landing;
- return cargo;
- battle rewards;
- clue grants;
- settlement charter;
- daily rewards;
- queue completion.

### Requirement

A command or landing retried after a process failure must not duplicate value.

Where the code has an idempotency marker such as land count/status, prove it.

---

## FP-24 — PROCESS RESTART CHANGES GAME RESULT

### Failure

Restart:
- resets cooldown;
- forgets commander wound;
- resets clue cap;
- completes queue twice;
- changes camp outcome;
- loses march cargo.

### Prevention

Add restart-boundary tests for each persistent state machine.

---

## FP-25 — VISUAL POLISH HIDES MISSING MECHANICS

### Failure

Agent spends large effort on cards, shadows and animations while:
- Keep does not gate anything;
- settlements are undifferentiated;
- alliance gameplay is shallow.

### Prevention

Mechanics parity comes first.

UI polish should explain and reveal systems, not substitute for them.

---

# 20. TESTING STRATEGY

Use a layered certification model.

## Layer A — Pure domain tests

Test:
- formulas;
- resource costs;
- unlock predicates;
- combat resolution;
- wilderness bonuses;
- readiness calculations;
- canonicalization.

Fast and deterministic.

## Layer B — World/in-memory integration

Test real `World` flows:
- create player;
- build;
- research;
- train;
- march;
- land;
- reward;
- claim;
- expand.

No UI.

## Layer C — Hono API

Use real `app.request`/equivalent.

Test:
- auth;
- validation;
- status/error codes;
- cannot bypass gates;
- response schema;
- transitional resource compatibility.

## Layer D — Postgres persistence

Test:
- fresh DB;
- migration DB;
- save/load;
- restart;
- due jobs/marches;
- resource JSON;
- progression.

## Layer E — Browser E2E

Certify user-visible loops.

High-value journeys:

### Journey 1 — first kingdom
```text
enter realm
-> build Homes
-> improve Lands
-> research
-> train
-> scout camp
-> attack camp
-> receive report
```

### Journey 2 — wilderness
```text
scout
-> attack/occupy
-> capture wilderness
-> verify persistent bonus
```

### Journey 3 — dragon readiness
```text
collect evidence
-> use Dragon Watch/Knowledge
-> satisfy readiness
-> expedition
```

### Journey 4 — expansion
```text
earn prerequisite
-> found Marcher Keep
-> switch settlement
-> use newly unlocked capability
```

### Journey 5 — alliance/PvP
When multiplayer harness supports it:
```text
player A scouts/attacks player B
-> B receives intelligence
-> ally reinforces B
-> battle
-> reports/shared state
```

## Device coverage

Continue meaningful responsive coverage:
- desktop;
- tablet;
- mobile.

Do not treat screenshots alone as functional tests.

---

# 21. PERFORMANCE / STATE INVARIANTS

Preserve these:

## Resources
- never negative unless explicitly modeled debt is introduced;
- finite numbers only;
- no `NaN`/Infinity;
- fractional carry conserved.

## Population
- `usedManpower <= maxPopulation` under valid state;
- marched manpower reconciles on return/loss;
- restart does not duplicate available manpower.

## Troops
- counts non-negative;
- deployed troops cannot simultaneously remain available in city;
- returning survivors reconcile exactly once.

## Marches
- one lifecycle;
- no double landing;
- valid commander occupancy;
- valid arrival/return ordering.

## Rewards
- one event -> one reward issuance;
- daily caps persist across restart.

## Expansion
- no duplicate settlement charter consumption;
- settlement coordinates unique;
- settlement prerequisite server-authoritative.

## Combat
- same authoritative inputs -> same result.

---

# 22. IMPLEMENTATION ORDER

Unless current repo state makes a step obsolete, use this order.

## Stage 0 — Reconciliation
- audit repo;
- ingest PR #6;
- preserve unique work;
- establish clean integration branch/worktree;
- capture baseline evidence.

## Stage 1 — Resource finalization
- Food / Wood / Stone / Ore / Crownmarks;
- full migration;
- persistence proof;
- UI/content sweep.

## Stage 2 — Parity matrix V2
- current evidence;
- status;
- gaps;
- acceptance criteria.

## Stage 3 — Keep progression
- central gating;
- UI blocker explanations;
- tests.

## Stage 4 — building/research operational depth
- Muster;
- Commander;
- Watchtower;
- training;
- research milestone unlocks.

## Stage 5 — PvE mastery
- target bands;
- composition variation;
- higher-tier rewards;
- anti-solved-farm simulations.

## Stage 6 — wilderness depth
- levels;
- bonuses;
- capacity;
- strategic wilderness types.

## Stage 7 — expansion chain
- Marcher Keep;
- next differentiated settlements;
- world-earned prerequisites;
- unique capabilities.

## Stage 8 — dragon presence/readiness
- evidence;
- Bestiary;
- Dragon Watch;
- advanced expedition;
- dragon ecology.

## Stage 9 — social war
- alliance ranks/permissions;
- diplomacy;
- shared intelligence;
- reinforcement UX;
- objectives.

## Stage 10 — pacing simulation
- hour/day/week/month;
- economy;
- queues;
- dead-end prevention.

## Stage 11 — visual/content completion
- production art when generation pipeline available;
- art ledgers;
- asset binding/certification.

---

# 23. COMMIT / PR STRATEGY

Prefer coherent, reviewable commits.

Example:

```text
chore(parity): capture Dragon Wake baseline and matrix v2
refactor(resources): canonicalize food/wood/stone/ore/crownmark
fix(persistence): migrate resource columns and JSON state
test(resources): prove legacy and restart round trips
feat(keep): make keep progression gate kingdom capacity
feat(muster): separate march count and troop capacity progression
feat(intel): tier watchtower information
feat(pve): tier camps into mastery bands
feat(wilderness): add level-scaled territorial bonuses
feat(expansion): deepen differentiated settlement chain
feat(alliance): add diplomacy and shared reinforcement workflow
test(pacing): add deterministic long-horizon progression simulation
```

Do not make a single unreviewable "parity" mega-commit if avoidable.

However, do not leave the repository broken between commits pushed for review. Use local staging commits if required until the branch is coherent.

---

# 24. CI / MERGE GATES

Before declaring a phase complete, run the repo's canonical checks.

At minimum inspect/use current equivalents of:

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm accept
```

Also run:
- focused combat suite;
- server progression suite;
- relevant E2E;
- PostgreSQL-required suite;
- migration tests;
- exact-head GitHub Actions.

Do not merge based solely on local green.

Do not merge if:
- exact-head CI is stale;
- migration test is skipped without explicit blocker;
- E2E uses admin-only shortcuts for a player-facing certification;
- unexplained snapshot changes exist.

---

# 25. RESEARCH / EVIDENCE ANCHORS

These are research anchors, not assets to copy.

## Dragons of Atlantis historical mechanics

Use the repo's `DOA_REFERENCE_MODEL.md` first.

External references may be used to verify historical behavior:

- DoA Resources:
  `https://dragonsofatlantis.fandom.com/wiki/Resources`
- DoA Population:
  `https://dragonsofatlantis.fandom.com/wiki/Population`
- DoA Tax:
  `https://dragonsofatlantis.fandom.com/wiki/Tax`
- DoA Muster Point:
  `https://dragonsofatlantis.fandom.com/wiki/Muster_Point`
- DoA Wilderness levels:
  `https://dragonsofatlantis.fandom.com/wiki/Wildernesses_levels`
- DoA Outposts:
  `https://dragonsofatlantis.fandom.com/wiki/Category:Outposts`
- DoA Eggs and Armor:
  `https://dragonsofatlantis.fandom.com/wiki/Eggs_and_Armor`
- DoA Aerial Combat:
  `https://dragonsofatlantis.fandom.com/wiki/Aerial_Combat`
- DoA Alliances:
  `https://dragonsofatlantis.fandom.com/wiki/Category:Alliances`

Treat community-wiki numeric data as historical reference, not unquestionable product truth.

## Engineering references

### Playwright
- Best practices:
  `https://playwright.dev/docs/best-practices`
- Locators:
  `https://playwright.dev/docs/locators`
- Assertions:
  `https://playwright.dev/docs/test-assertions`
- Isolation:
  `https://playwright.dev/docs/browser-contexts`

### Hono
- Validation:
  `https://hono.dev/docs/guides/validation`
- Testing:
  `https://hono.dev/docs/guides/testing`

### PostgreSQL
- Explicit locking:
  `https://www.postgresql.org/docs/current/explicit-locking.html`
- ALTER TABLE / schema modification:
  `https://www.postgresql.org/docs/current/ddl-alter.html`

### TypeScript
- narrowing/exhaustiveness:
  `https://www.typescriptlang.org/docs/handbook/2/narrowing.html`

---

# 26. ORIGINALITY / IP BOUNDARY

Matching DoA means matching:
- progression topology;
- system dependencies;
- pacing philosophy;
- city/field/world relationship;
- PvE/wilderness motivation;
- dragon-readiness motivation;
- chained expansion;
- alliance war.

Do NOT copy:
- DoA art;
- UI screenshots;
- text;
- lore;
- dragon names;
- faction names;
- troop names;
- building descriptions;
- quests;
- exact numerical tables;
- exact proprietary code;
- exact elemental outpost fiction.

Dragon Wake should make a veteran say:

> "This feels like the game loop I remember, but it is clearly its own game."

---

# 27. THINGS YOU MUST NOT DO

Do not:

- restart the repo;
- delete valid work to simplify your branch;
- rewrite the combat engine without a proven need;
- change the server-authoritative model to client authority;
- replace deterministic combat with opaque randomness;
- hand new players a True Dragon;
- make True Dragons stack troops;
- copy Water/Stone/Fire/Wind outposts;
- use exotic renamed resources merely to appear original;
- retain `Timber`, `Iron`, or generic `Coin` as final base resource names;
- turn Crownmarks into a premium gem;
- create endless resource aliases instead of finishing the migration;
- create an alliance feature that is only a member list/chat room;
- make Power Score determine combat;
- use Playwright sleeps to hide race conditions;
- skip PostgreSQL validation because memory tests are green;
- claim production art completion while the art provider is blocked;
- add monetization/IAP as part of parity unless explicitly authorized;
- optimize for CI at the expense of gameplay correctness.

---

# 28. DEFINITION OF "DOA PARITY COMPLETE ENOUGH FOR ALPHA/BETA"

Do not use an arbitrary percentage.

The project reaches strong functional parity when all of these are proven:

## Kingdom
- city/castle development matters;
- Lands economy matters;
- Keep gates scale;
- population/manpower constrains growth;
- research changes options;
- buildings have differentiated roles.

## Military
- multiple troop roles;
- composition matters;
- march capacity matters;
- simultaneous operations matter;
- Commanders matter;
- scouting matters.

## World
- repeatable PvE;
- tiered mastery;
- wilderness capture;
- meaningful persistent territorial bonuses;
- reports;
- travel/time matters.

## Dragon
- visible/legible from early game;
- multi-system readiness;
- world-earned evidence/materials;
- expedition/hunt;
- dragon progress changes future strategy;
- dragons do not erase armies.

## Expansion
- first secondary settlement earned through world play;
- at least 3 meaningful settlement stages/tier packages exist or are fully specified and the first two+ are implemented;
- each settlement unlocks new strategic capability.

## Social
- alliance membership matters;
- reinforcement works through real flow;
- diplomacy/intelligence/coordination exist;
- shared objective exists or is implementation-ready after core PvP proof.

## Persistence
- restart safe;
- migration safe;
- no resource/troop/reward duplication;
- PostgreSQL proof green.

## UX
- player can tell what blocks next progression;
- no major loop requires admin/dev shortcut;
- desktop/tablet/mobile main journey is usable.

---

# 29. REQUIRED FINAL REPORT

At the end of your campaign, report in this exact structure.

## FINAL_VERDICT

Choose one:

- `DOA_PARITY_FOUNDATION_COMPLETE`
- `DOA_PARITY_MAJOR_PROGRESS`
- `DOA_PARITY_BLOCKED`
- `DOA_PARITY_NOT_SAFE_TO_MERGE`

Do not invent success.

## REPOSITORY_STATE

Report:
- starting main SHA;
- final main SHA if changed;
- branch;
- head SHA;
- PR number;
- dirty worktree status;
- any preserved/superseded PRs.

## ALPHA_R1_RECONCILIATION

Explain exactly what happened to PR #6 and how its unique work was preserved.

## RESOURCE_MIGRATION

Report:
- final resource IDs;
- DB migration path;
- JSON migration path;
- old-volume results;
- restart results;
- remaining legacy references.

## PARITY_MATRIX

List every major DoA mechanism as:
- PROVEN
- PARTIAL
- ABSENT
- DELIBERATE_DIVERGENCE
- REJECTED

## IMPLEMENTED_SYSTEMS

Describe actual player-visible causal loops, not file names.

## FAILURE-PREVENTION RESULTS

For FP-01 through the relevant FP items:
- which were tested;
- what evidence exists;
- any unresolved risk.

## TEST_RESULTS

Give exact counts where available:
- unit;
- server;
- combat;
- API;
- PostgreSQL;
- Playwright desktop/tablet/mobile;
- build/typecheck/lint;
- GitHub Actions exact-head run.

## PERSISTENCE_EVIDENCE

Explicitly state results for:
- resource round-trip;
- fractional carry;
- march cargo;
- commander/cooldown;
- clues/dailies;
- expansion prerequisite.

## DOA_PARITY_ASSESSMENT

Explain:
- what now feels DoA-like;
- what is still missing;
- which deliberate divergences improve the design.

## VISUAL_STATE

State:
- production assets present;
- placeholders;
- AGES status;
- visual debt.

## REMAINING_WORK

Prioritized P0/P1/P2.

## MERGE_DECISION

One of:
- safe to merge;
- merge after named fixes;
- not safe to merge.

---

# 30. CAMPAIGN COMPLETION PRINCIPLE

The goal is not to maximize lines changed.

The goal is to maximize the number of **real DoA-style dependency loops that a player can experience through the production path**.

Prefer:

> one fully causal, persistent, UI-visible progression loop

over:

> five shallow systems with buttons and tests.

When uncertain, ask:

1. What did this mechanism make a DoA player care about?
2. What dependency did it create?
3. Does Dragon Wake preserve that dependency?
4. Is our fiction/content original?
5. Can the real player path prove it?
6. Does it survive restart?
7. Does it remain strategically meaningful later?

If the answer to #3 or #5 is no, parity is not complete.

---

# 31. START NOW

Begin by performing the repository reconciliation/audit.

Do not start implementing from assumptions in this document.

Validate the live repo, update the baseline if it changed, preserve existing work, then execute the stages above in order of dependency and risk.

**North-star outcome:**

> Dragon Wake should become the modern Dragons-of-Atlantis successor that a veteran intuitively recognizes — grounded medieval kingdom building, familiar core resources, layered military preparation, rewarding world farming and wilderness control, dragon anticipation and readiness, chained specialized expansion, and alliance war — implemented with original names, original visuals, original lore, stronger engineering, and fewer exploitative/frustrating failure modes.

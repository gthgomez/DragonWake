# DragonWake Vision Council V1 — Proceedings and Converged Vision

Status: **CANON — Vision Council outcome.** Product vision plus Alpha
Closure design law. Amends [`DRAGON_ALPHA_PROOF_SLICE.md`](./DRAGON_ALPHA_PROOF_SLICE.md)
and [`DRAGON_ALPHA_CLOSURE_AMENDMENTS.md`](./DRAGON_ALPHA_CLOSURE_AMENDMENTS.md)
where stated. Does **not** reopen
[`DIRECTION_FREEZE_V1_1.md`](./DIRECTION_FREEZE_V1_1.md) — it
**interprets** it: the Freeze is the law of what DragonWake must never
become; this council states what it is trying to become and what Alpha
must prove.

Council date: 2026-09-05.

---

## 0. How this council ran

Two senior agents, one product. No code was written during the council.
No new feature campaign was opened. Neither participant tried to win by
out-producing the other in prose.

**AGENT A — Product Architect.** Protects the emotional fantasy,
identity, simplicity, player comprehension, Alpha scope, and the road to
Visual Alpha. Guiding question: *what is the smallest implementation
that makes the player genuinely experience the fantasy?*

**AGENT B — Adversarial Systems / Player-Experience Critic.** Attacks
fake choices, fake consequences, state-machine dragons, reskinned camp
fights, disguised quest checklists, generic cities, meaningless
research, fake multiplayer consequences, and acceptance tests that prove
implementation rather than experience. Guiding question: *did the player
actually change the world, or did we increment another field?*

### Evidence admitted (implementation reality at council time)

Both agents examined the same facts on
`feat/dragon-driven-alpha-closure` (`80991c3`) and agreed to argue about
what is real:

| # | Fact | Where |
| --- | --- | --- |
| E1 | The Scar "dragon encounter" resolves a standard `resolveBattle` against 16 levies + 4 scouts, with a text note claiming it is not a camp fight. | `apps/server/src/dragons/living.ts:299` |
| E2 | Knowledge progression is a counter: `rumored → observed` at 1 evidence, `→ supported` at 2 — so watching your own roost twice "proves" Vane Reading. | `living.ts:78` |
| E3 | Selecting Home Guard on a **hatchling** wounds it (strained vane). A normal click is punished as if it were risky play. | `living.ts:201` |
| E4 | The Fen pact requires one observation + non-rumored silt knowledge + a Marcher Keep, then instantly pacts and founds Brinehold. No world cost, no map feature, no surrender. | `living.ts:445` |
| E5 | Ford/Blockade exists: station verb, owner marches ×0.7, enemy attacks ×1.8, scoutable absence, server-authoritative single location — but the ford tile is *chosen at pact time* from any adjacent open tile, so it did not exist before the dragon. | `living.ts:457`, `living.ts:519` |
| E6 | Brinehold's combat identity is one defender rule: speed-role units fight at half strength against Brinehold (flooded approaches). | `living.ts:613` |

PR #8 (design canon + Phase 0 amendments, `e3b00c5`) and PR #9 (the
living-dragon implementation) are the two artifacts this council must
reconcile. The disagreements are real and the council did not paper over
them.

---

# ROUND 1 — DEFINE THE GAME

## AGENT A — Product Architect

### 1. What is DragonWake?

A persistent medieval strategy game where your civilization's shape is
decided by the dragons it discovers, survives, raises, and negotiates
with — and by the dragons it never owns. You command the kingdom, but
the dragons decide what kind of kingdom it can become.

### 2. Unique fantasy

> Players should choose DragonWake instead of another medieval strategy
> game because **its dragons are territorial powers with their own
> terms, so every empire grows a different shape around the dragons it
> meets — the map, the settlements, the research, and the wars all bend
> around beings the player did not design and cannot fully control.**

### 3. What role do dragons play?

They are none of the five refused roles because each refusal protects a
real property:

- Not **hero units** — they refuse orders, hold territories, and leave.
- Not **mounts** — no rider fantasy; the dragon is a party, never a tool.
- Not **collectibles** — there is no roster completion, no rarity ladder.
- Not **bosses** — the Scar adult is not a loot piñata with a health bar;
  surviving it is a threshold, not a kill.
- Not **city unlock keys** — a holding must have a human reason to exist
  before any dragon justifies it.

What they are instead: **neighbors with leverage.** A dragon is a
territorial being whose presence rewrites what the local map permits —
where a crossing may be used, where a town may stand, what may be
fished, what may be learned. The relationship is the feature.

### 4. What is the emotional hierarchy?

- **Signature — "This is my dragon."** A household member. Named,
  raised, wounded, forgiven. It is the only dragon that lives in your
  keep. Its importance later is emotional, never statistical.
- **Domain — "These dragons shaped my empire."** Few, adult, contracted.
  You remember what you *gave up* for each one. They are chapters of
  empire, not entries in a collection.
- **Wild — "This world is full of things greater than me."** The ceiling.
  Mostly unowned. They generate mystery, politics, and stories the
  designers did not write.

Each tier trades intimacy for scale. The hierarchy fails if any tier is
the previous tier with bigger numbers.

### 5. What is the empire fantasy?

Dragon relationships re-route civilization rather than accelerate it:

- **Settlements:** Brinehold exists because a wyrm permitted a crossing
  on terms; the Capital grows a roost, not a barracks annex.
- **Human culture:** Reedwardens, ford signaling, pact-stones, watch
  fires — ordinary people adapting to extraordinary neighbors.
- **Economy:** real surrenders (the spawning bank stays unworked) and
  real gains (barge traffic on a usable ford).
- **Troops:** doctrine shaped by local ecology — flooded-ground holders,
  sky watchers — not +1 stat skins.
- **Research:** natural philosophy. Players learn the world because the
  world is knowable, not because a tech tree is fillable.
- **Territory and diplomacy:** pacts and sanctuaries are visible map
  states, not relationship numbers.
- **Warfare:** intelligence. Where the dragon *is* becomes where you are
  strong, and where the dragon *is not* becomes where you can be hurt.

## AGENT B — Adversarial Systems / Player-Experience Critic

### 1. What is DragonWake?

A persistent medieval strategy/MMORTS where dragons are territorial
powers with memory and location — so empire-building becomes
negotiation, and war becomes reading where the dragons are **not**.

### 2. Unique fantasy

> Players should choose DragonWake instead of another medieval strategy
> game because **every other game hands them dragons as units to spend;
> DragonWake is the only one where a dragon can deny you a river until
> your civilization changes what it wants.**

### 3. What role do dragons play?

Parties to relationships with world consequence. My working test: any
system where `relationship = PACTED` completes the feature is a state
machine wearing a scale costume. A dragon in DragonWake must be:

- **Locatable** — it is somewhere specific, server-authoritative.
- **Absence-detectable** — its being gone is a fact another player can
  learn and act on.
- **Behaviorally consistent** — what it did in the wild is what it does
  in the roost; recognition is gameplay, not flavor.

If a "dragon" cannot pass those three, it is a stat card with a name.

### 4. What is the emotional hierarchy?

I accept A's hierarchy and add its only meaningful test: the tiers are
real only if their **mechanics differ in kind, not magnitude.**

- Signature: growth, temperament, naming, household presence — an
  identity system.
- Domain: negotiation, world cost, territorial verbs — a diplomacy
  system.
- Wild: observation, ecology, politics — a mystery system.

If the Fen Wyrm is the hatchling with larger numbers, the hierarchy is
fake and the product is a monotonized progression wearing dragon art.

### 5. What is the empire fantasy?

As A describes — with the adversarial edge that makes it a strategy
game rather than a diorama: **every dragon benefit is also a broadcast.**
A stationed wyrm blockades a crossing and simultaneously announces a
raid window at home. Dragon relationships create the tactical weather
for *both* sides of every war. That reciprocity is what makes dragon
location matter to another player, and it is the single most defensible
claim this product has.

---

# ROUND 2 — PLAYER LIFE CYCLE

Both agents, per moment. What the player should **feel** — no API calls.

## First 10 minutes

**A:** The player knows dragons as *absence and evidence* — a burned
camp, clawed stone, a farmer's report, a Bestiary rumor. The emotion is
"something enormous is out there, and the map knows it before I do."
No dragon is owned, and none is promised.

**B:** And no surface may teach "dragon = progress bar" yet. If the
first screen domesticates the dragon into a menu tab, everything after
is tamed. Both of us require: dragons enter as **world facts** (reports,
terrain, rumors), never as menu items.

## End of first meaningful session (Scar → hatchling → naming → roost)

**A:** The dominant emotion is **custody**, not triumph. "I survived it,
and now something small depends on me." Quiet. The player chose a name
slowly, and that slowness is the point.

**B:** My test: the world must read differently. The roost is occupied;
the Chronicle has a first page; the capital has a new fact about itself.
If naming is a text field over an unchanged settlement, it is a form.

## Day 2–3

**A:** The hatchling creates an **appointment, not a chore** — the
player returns to see who it is becoming (temperament shifting from
wary toward curious), not to refill a hunger meter.

**B:** Agreed, with a tripwire: the return-hook must never be a timer
with a reward. The hook is *identity forming*. If removing the timer
removes the reason to return, we built a dailies trap, not a dragon.

## First growth milestone (Wyrmling)

**A:** Wyrmling matters because growth was **earned on two axes** —
time in the roost, and knowledge (Vane Reading at least observed,
keepers who watched it). The player can name why it grew.

**B:** If growth is a countdown with a cutscene, it is a login reward.
The proof is the *why*: observation, care, and codified knowledge gate
it, and the new body unlocks a new *possibility* (it can now be fitted
for the Guard Harness). Growth must change what the player can choose,
not just what number they see.

## First adult Domain Dragon (the Fen Wyrm)

**A:** Meeting the Fen Wyrm must feel like **diplomacy with a power that
does not know your name and does not need you.** No naming, no stall,
no affection meter. You adapt to *it*: its water, its spawn, its ford.

**B:** My tripwire: if the pact interface rhymes with the naming
interface, we have failed. Raising a hatchling is custody; treating
with an adult is statecraft. They must not share a verb shape.

## First dragon-driven settlement (Brinehold)

**A:** It must read as **"the town the river allowed"** — pile
dwellings, a pact-stone, reed walks, weirs kept outside the spawn. Not
City #2 with a wet paint job.

**B:** And the player must have **paid**. The spawning-bank surrender
must still be visible at hour thirty: no weirs there, a sanctuary
marked on the map, a barge route that exists *because* terms were kept.
A foundation without a standing cost is a cutscene.

## First PvP dragon-intelligence moment

**A:** The sentence: **"The Fen Wyrm is not in the home waters."**
What makes it meaningful: while stationed at the ford the wyrm delays
enemy assaults on the crossing *and* its absence from Brinehold is a
discoverable fact. The raid window is real, and the defender's recall
is a genuine dilemma — lift the blockade, or save the town.

**B:** This is the most multiplayer-honest system in the Alpha and the
product's signature: absence you can *learn* and act on. Coarse intel
says "a great presence is missing"; deep Watchtower intel says where it
went. Do not ever reduce this to a buff icon or a passive stat.

## One month

**A:** The player is chasing the **world, not a content list**: rumors
of named wilds, the Scar adult still out there somewhere, ford windows
opening and closing in alliance wars, a Chronicle worth rereading.

**B:** Caution for the record: after the authored chapters, the dragon
*facts* must keep changing — territory, absence, migration, politics.
If nothing in the world state can still move, "persistent" is a lie we
told in the store description.

## Three months

**A:** The player has not finished because the authored dragons were
never the game — they were the tutorial for a world that keeps producing
dragon situations: wild individuals, other players' pacts, intelligence
wars.

**B:** And the honest statement of the risk: if post-campaign play has
no moving dragon facts, DragonWake is a ten-hour campaign wearing an
MMORTS. The council freezes architecture for the forever game in
Round 8 precisely so this sentence can never become true quietly.

---

# ROUND 3 — CROSS-EXAMINATION

Each agent read the other's Rounds 1–2.

## AGENT A reads AGENT B

### Five statements I strongly agree with

1. E2 is damning: watching your own roost twice proving Vane Reading is
   fake science, and it is in the shipped code.
2. E3 is a fake consequence: wounding a hatchling *because the player
   clicked the normal role* teaches nothing and punishes comprehension.
3. E1 must not survive Alpha Closure: a note claiming "this is not a
   camp fight" while the resolver fights levies is exactly the
   "technically green, emotionally fake" failure the council exists to
   prevent.
4. E4 means Brinehold is currently City #2 with wet flavor text; a pact
   that costs the player nothing in the world is a button.
5. Scoutable absence (E5) is the best system in the implementation and
   the design language of the whole product should lean on it.

### Five statements I challenge

1. **"The Ford verb requires pre-existing river infrastructure."**
   - Failure mode I predict in B's version: a terrain/river system
     becomes an Alpha gate and the closure never ships.
   - What the player would actually do: use one crossing, once.
   - Evidence my objection is wrong: if a single authored crossing
     cannot satisfy every field of the World Verb Contract, a general
     layer is proven necessary.
   - Cheaper solution: **one authored map feature** (the Fen Crossing)
     with two states. One tile. Not a system.
   - Classification: the crossing is ALPHA-critical; the general river
     layer is LATER.

2. **"Defeat should produce useful knowledge."**
   - Failure mode: intentional-loss farming; players lose on purpose
     for notes, which poisons both combat and research.
   - What the player would do: march weak armies into the Scar to farm
     "the adult's vanes flare before the rush."
   - Evidence my objection is wrong: a playtest where nobody farms
     losses because reports carry no progressive reward for doing so.
   - Cheaper solution: none honest in Alpha — loss-report evidence
     needs reward-free honest telemetry to be safe.
   - Classification: LATER (the extension point is already reserved in
     Phase 0 amendment 0.6).

3. **"No counters may be visible; visible progress turns research into
     a checklist."**
   - Failure mode of B's position: players never learn that CODIFY is
     available; research stalls and feels like RNG.
   - What the player would do: open field notes, see *which kinds* of
     observations exist, and recognize the moment of insight.
   - Evidence my objection is wrong: a playtest where players with
     word-state UI feel surveilled rather than informed.
   - Cheaper solution: show **states as words and observations as field
     notes** — never fractions, never "collect 2 more."
   - Classification: ALPHA (this is wording, not machinery).

4. **"Per-player local Fen Wyrms are instanced fakery."**
   - Failure mode of a globally unique wyrm in Alpha: one player pacts
     first and permanently closes that content for every other player —
     a lottery, not a world.
   - What the player would do: race a shared spawn, then log off angry.
   - Evidence my objection is wrong: concurrent playtests where
     contention over a shared wyrm reads as drama rather than denial.
   - Cheaper solution: local individuals (already shipped, Phase 0.3).
   - Classification: local individuals are the honest ALPHA scale; the
     shared-world dragon is a BETA-scale question that must be recorded
     so nobody later claims betrayal.

5. **"The Scar adult must persist as a moving wild individual."**
   - Failure mode of full persistence now: a movement/ecology sim is a
     campaign of its own, and closure dies carrying it.
   - What the player needs: the world *remembers* the adult — Bestiary,
     rumor, the knowledge that it is still out there — not that it
     patrols a polygon this month.
   - Evidence my objection is wrong: players who see a static "it is
     still out there" line and report feeling cheated by it.
   - Cheaper solution: the adult survives victory as an authored world
     fact ("flew east over the Marches; sightings pooled at the
     Scriptorium"). Never "deleted by victory."
   - Classification: the memory is ALPHA; the simulation is LATER.

## AGENT B reads AGENT A

### Five statements I strongly agree with

1. Custody, not triumph, is the correct emotion after the Scar — A is
   right that quiet beats sell the signature fantasy.
2. One authored encounter with three behaviors, never a generalized
   dragon-combat engine. A just prevented a six-month detour.
3. PACT as the only canonical Alpha route (Phase 0.2). A fake slayer
   branch would be a fake choice by construction.
4. No punitive care loops. If the hatchling becomes a feeding meter, the
   product becomes the thing it was invented to replace.
5. Presence ≠ individual (Phase 0.5) — A held the line that stopped the
   read-model enum from absorbing the living dragons.

### Five statements I challenge

1. **"Roost presentation is a Visual Alpha problem."**
   - Failure mode I predict: certification passes on cards that render
     a dragon like furniture, and "this is my dragon" dies in layout.
   - What the player would actually do: read the roost state wrong —
     wounded vs. absent vs. growing is indistinguishable in a card.
   - Evidence my objection is wrong: a playtest where every player
     correctly names the dragon's state from the current card.
   - Cheaper solution: Alpha Closure must make roost state
     **unambiguous in text + state icon** (occupied / empty / wounded /
     recovering). Production art remains Visual Alpha's job.
   - Classification: state legibility is ALPHA; art is BETA.

2. **"Growth gates are fine as implemented."**
   - Failure mode: `observeCount >= 1` plus a timer means the correct
     play is to click Watch twice and wait — implementation proving
     itself, not experience.
   - What the player would do: perform observation as a chore because
     the system asked for a click, not because they noticed anything.
   - Evidence my objection is wrong: players who watched the hatchling
     *once, unprompted,* before growth unlocked.
   - Cheaper solution: tie growth trust to the codified Vane Reading
     (already partially true) and have the field note reference an
     *actual observed tell*.
   - Classification: ALPHA — small changes, same systems.

3. **"The Brinehold flooded-approaches rule is sufficient combat
     identity."**
   - It is sufficient — that is not my challenge. My challenge is to
     its future: unguarded, this one function becomes precedent for a
     per-city combat-rule engine.
   - Failure mode: six settlements, six bespoke resolver forks.
   - What the player would do: never notice, until balance dies.
   - Evidence my objection is wrong: nobody ever proposes a second
     bespoke settlement combat function.
   - Cheaper solution: freeze it now as **defender terrain doctrine**
     (data-driven modifier, one line of law).
   - Classification: the rule is ALPHA; the freeze is ALPHA.

4. **"The Guard Harness can craft from generic realm resources."**
   - Failure mode: the harness reads as a purchase with extra steps —
     the care fantasy without a care object.
   - What the player would do: click craft, never think of it again.
   - Evidence my objection is wrong: playtesters who describe the
     harness as "the thing I made for it" without prompting.
   - Cheaper solution: Alpha keeps two generic resources honestly; the
     *act* of crafting + it visibly appearing on the dragon is the
     fantasy. The reed-rope/Stonekeel-metal dependency story is the
     BETA enrichment (holdings matrix already sketches it).
   - Classification: the craft is ALPHA; the supply-chain story is LATER.

5. **"A green Playwright journey can certify Alpha."**
   - Failure mode: `DRAGON_DRIVEN_ALPHA_CERTIFIED` awarded for a
     journey a human finds flat. Acceptance tests prove implementation,
     not experience — the exact trap this council was called to close.
   - What the player would do: complete the journey, feel nothing, quit.
   - Evidence my objection is wrong: a human playtest that reproduces
     the journey's beats spontaneously and wants more.
   - Cheaper solution: none — human attention is the only instrument
     that measures felt fantasy.
   - Classification: the journey is the ALPHA gate for *function*; a
     human game-feel pass is the co-gate for the *experience claim* and
     must precede any certification that uses the word "player-honest."

---

# ROUND 4 — RESOLVE THE FIVE ALPHA QUESTIONS

Decisions below are joint. Where a genuine reservation remains, it is
recorded as a **dissent note** rather than hidden in prose. Each
decision names the **binding implementation deltas** for the Alpha
Closure campaign (to be executed later — this council wrote no code).

## QUESTION A — THE DRAGON SCAR

**DECISION: adopt `resolveDragonTerritoryEncounter` as one authored
encounter. The current resolver-vs-levies implementation does not
survive Alpha Closure (E1).**

- The dragon is **not a unitId**. It is not in either BattleGroup.
- One authored encounter. The player witnesses **three authored
  behaviors**, observed rather than input-driven:
  - **Wing Rush** — punishes dense melee columns that did not anchor.
  - **Vane Dive** — punishes loose crossbow lines without pike cover.
  - **Breaking Pressure** — the adult tests the line; anchored shields
    and braced formations suffer far less.
- Preparation/composition is legible: the dragon-specific report names
  which behavior punished which choice. The report is the teacher.
- Outcomes exactly three: **SURVIVED** (the adult yields the clutch
  ground — the clutch is found), **DRIVEN_BACK** (retreat in order;
  the expedition stage is retained; the report tells the player what
  to change), **ROUTED** (heavy losses; return much later, wiser).
- The player never kills the adult. No camp mastery, no loot table, no
  Bestiary "defeated" checkmark.
- **Even simpler?** A two-outcome version was considered and rejected:
  DRIVEN_BACK is the authored "learn" beat that makes preparation
  matter without a second encounter.
- **Must NOT be generalized yet:** no reusable dragon-combat engine, no
  boss HP bars, no repeatable adult hunts, no arena, no elemental
  phases, no second scar. One encounter, three beats, three outcomes.
- **Wild fact survives:** on SURVIVED, the adult **fled and is still
  out there** — Bestiary note, rumor line at the Scriptorium. The
  current "the territorial adult is gone" copy is superseded. Victory
  never deletes a dragon from the world's memory.
- Dissent note (B): the behaviors must appear in the world *before* the
  fight too — the field note earned at the Scar observation is one of
  these tells (see Question B), so the fight confirms knowledge the
  player already glimpsed. Adopted into the decision.

**Binding deltas:** replace `resolveBattle` vs `SCAR_DEFENDERS`
(`living.ts:299`) with the authored encounter resolver; report carries
behavior lines; outcomes map to the three named states; survival copy
changes to "fled east / still out there"; the pre-fight observation
evidence references a Scar tell.

## QUESTION B — DRAGON RESEARCH

**DECISION: replace the evidence counter (E2) with distinct evidence
records. Repeated observation of the same source can never advance
SUPPORTED.**

- A knowledge question accumulates **evidence records**: `{kind, source,
  at, summary}`. Kinds: encounter observation, roost behavior, scouting
  report, battle/report line, exploration find, controlled test.
- **SUPPORTED requires at least two records of different kinds, at
  least one of them world-sourced** (not the player's own roost).
  Same-kind repeats are recorded but never advance state — the field
  notes literally accumulate "we have seen this before," which is
  honest, and stop advancing, which prevents farming.
- The player **codifies** explicitly (existing verb). Codified results
  must name something the player can now **do** — a tell they can read,
  a technique, a signal, a formation, a treatment, an equipment
  pattern. **A codified result that is only a percentage fails canon.**
- Alpha keeps exactly two questions, both already sketched:
  - **Vane Reading** — Scar tell (encounter) + roost tell (roost
    behavior) → SUPPORTED → codify → keepers read temperament tells;
    wyrmling growth trusts a codifying keeper.
  - **Wet silt-pack (Fen knowledge)** — flood/encounter evidence + fen
    scouting → SUPPORTED → codify → **ford signaling** — the reason a
    wyrm will treat with humans at the crossing at all, and later the
    root of flooded-ground doctrine.
- **How we prevent "collect Evidence A + Evidence B" with scientific
  vocabulary:** the surface is field notes, never a task list. States
  display as words (Rumored / Observed / Supported / Proven). No
  fractions, no "observe 2 more times," no per-question checkbox UI.
  The Scriptorium keeper phrases open questions in-world. Evidence
  accrues from what players already do — scout, fight, watch, explore.
- Dissent note (A): if playtesters stall not knowing codify exists, we
  add one in-world line from the keeper — wording, not machinery.
  Adopted.

**Binding deltas:** replace `bumpKnowledge` counters (`living.ts:78`)
with evidence records + distinct-kind gates in `codifyKnowledge`;
research UI becomes field notes; Vane Reading growth gate switches from
`observeCount` to codified-or-supported state referencing an actual
recorded tell.

## QUESTION C — HATCHLING → HARNESS → HOME GUARD

**DECISION: wounds are never caused by clicking a normal role (E3).
The intended flow is Yard → grow → craft Guard Harness → Home Guard.**

- **Hatchling: Yard only.** `setHarness(home_guard)` on a hatchling is
  refused with an in-world reason ("it cannot leave the yard yet"), no
  wound, no penalty.
- **Wyrmling:** the **Guard Harness** becomes craftable — a short,
  visible craft from honest realm resources; the harness appears on the
  dragon. Crafting it is the act of preparation and care.
- **Home Guard unlocks only on a harnessed wyrmling.**
- **Home Guard effect (the smallest non-stat verb): the dragon leaves
  the roost to the approaches, and enemy scouting of the Capital is
  degraded** — a scouted enemy reads "the roost is watched" instead of
  confident detail, because the dragon is actually there. Counter-scout
  presence, not a defense percentage.
- **Wounds** remain supported by the architecture but in Alpha arise
  only from explicitly risky authored play. The strained-vane story
  stays as the Scar-era recovery tutorial, not as a role tax.
- **Is this enough responsibility?** Yes: the player armed a young
  dragon and posted it; the visible cost is the empty roost and the
  changed intel an enemy receives. The cost is *informational and
  positional*, which is this product's currency — not hit points.
- Dissent note (B): degrade must mean *less precise*, never *false*.
  Adopted as law: **counter-scouting hides detail; it never lies.**

**Binding deltas:** remove the hatchling wound-on-click branch
(`living.ts:201`); add Guard Harness craft + equipped flag gating Home
Guard; `scoutDragonIntel` capital branch (`living.ts:538`) returns
degraded-confidence wording while Home Guard is active.

## QUESTION D — THE FEN WYRM PACT

**DECISION: adopt the Fen Crossing. The pact must cost something in the
world before it exists (E4).**

- A real map feature, the **Fen Crossing**, exists in the river domain
  **before** the player can pact — state **CONTESTED**. It is placed at
  realm generation / frontier founding, not at pact time.
- The player discovers the wyrm, researches its territorial behavior
  (Wet silt-pack SUPPORTED), and then chooses **Yield the Spawning
  Bank**:
  - the crossing becomes **SANCTUARY**;
  - exploitation of that specific bank is **permanently surrendered**
    (no weirs on the spawn; the sanctuary is marked on the map;
    Brinehold's economy permanently foregoes that yield);
  - the choice is **irreversible** for that domain.
- Only then may the Fen Wyrm accept a pact. Then Brinehold becomes
  viable / is transformed as the river holding living under those terms.
- **Is this enough consequence?** Yes: a map feature changed state, an
  economy took a permanent measurable loss, and the map shows both. The
  player *changed the world*; the database recording `PACTED` is now
  the least interesting fact about it.
- **Is it too much infrastructure for one mechanic?** No — one feature,
  two states, one irreversible choice. A refused economy row and a map
  state, not a river simulation.
- **Minimum map object required:** exactly that. No river system, no
  seasonal flood cycle, no contested-region AI.
- Dissent note (B): the yielded bank must remain *visible* — a marked
  sanctuary where reeds grow uncut. If the surrender renders nowhere,
  it did not happen. Adopted.

**Binding deltas:** add `fen_crossing` feature (pre-existing, CONTESTED)
in the river domain; yield action → SANCTUARY + bank-yield surrender;
`pactFenWyrm` (`living.ts:445`) requires SANCTUARY + supported silt
knowledge; Brinehold founding/transform happens under pact terms
(`skipUnlockCheck` path replaced by the terms path).

## QUESTION E — FORD / BLOCKADE / INTELLIGENCE

**DECISION: keep the conservative Alpha semantics already specified in
the World Verb Contract — binding the verb tile to the Fen Crossing so
Questions D and E share one world object.**

- **What Ford does:** while the wyrm is stationed at the crossing, the
  owner's Capital↔Brinehold marches complete at ×0.7. The old terrain
  (a river that always slowed you) becomes newly meaningful.
- **What Blockade does:** enemy attack/occupy marches targeting the
  crossing or Brinehold from outside the domain take ×1.8 while the
  wyrm is stationed.
- **Location is server-authoritative and singular** — the wyrm cannot
  be home and at the ford; stationing relocates it; a stationed verb
  reloads as Away (already contracted).
- **Owner verb:** Station / Recall. Leaving home waters is a real
  decision with a real cost.
- **Enemy counterplay, sufficient for Alpha:**
  - coarse intel on Brinehold reads "**a great presence is missing**";
  - Watchtower-depth intel reads "at the ford" vs "in the home waters";
  - the raid window while the wyrm is Away is the attack plan;
  - routing around the crossing; or waiting out the stationing.
- **The sentence that raises an enemy's heart rate:** *"The Fen Wyrm is
  not in the home waters."*
- Dissent note (A): do not add Ford speed to allied marches in Alpha —
  alliance inheritance is a Beta diplomacy question, and the contract
  already excludes it. Adopted (it was already law; restated here so it
  survives implementation pressure).

**Binding deltas:** ford tile = the Fen Crossing tile (replacing
`adjacentOpen` at pact time, `living.ts:457`); no semantic changes
beyond D's integration; persistence of stationed-verb state re-asserted
in CI.

---

# ROUND 5 — SETTLEMENT IDENTITY

The council tested whether the holdings are civilizations or unlock
screens. Verdict up front: **the architecture is coherent.** Every
spine holding passes the dragon-key test ("if the player never bonds
another dragon, does this place still have a human reason to exist?").
Condensed findings per holding (full identities remain in
[`DRAGON_DOMAIN_HOLDINGS_MATRIX.md`](./DRAGON_DOMAIN_HOLDINGS_MATRIX.md),
which stays authoritative for detail):

## Capital

1. **Exists** as seat of account identity, the Chronicle, and command.
2. **Human problem:** administering a frontier kingdom.
3. **Economy:** balanced kingdom economy — deliberately no specialty.
4. **Military culture:** balanced doctrine; household war-partner later,
   never the army.
5. **Research:** husbandry and vane-reading; ordinary kingdom research.
6. **Map behavior:** patrols its approaches; Home Guard empties its
   roost in a way enemies can detect.
7. **Depends on:** every specialist holding for what it cannot make.
8. **Never obsolete:** it is where the *player* lives; the Chronicle is
   here; the signature dragon comes home here.

## Marcher Keep

1. **Exists** as the human frontier on dragon-used land.
2. **Human problem:** the frontier is too wide for foot garrisons and
   news travels too slowly.
3. **Economy:** logistics — remounts, waystations, forage.
4. **Military culture:** ride, screen, carry news; poor in siege and on
   flooded ground.
5. **Research:** scouting, cavalry, march capacity — not dragon anatomy.
6. **Map behavior:** extends march reach; does not alter rivers.
7. **Depends on:** Capital manpower and food.
8. **Never obsolete:** it is the **control case** — a city caused by
   dragon *danger*, not dragon *ownership*. If every holding is
   dragon-gated, dragons become keys and the product dies of its own
   premise.

## Brinehold

1. **Exists** because a wyrm permitted a crossing on terms.
2. **Human problem:** the river blocks the frontier; the wyrm blocks
   the river.
3. **Economy:** reed fiber, pitch, barge traffic, weirs kept outside
   the sanctuary spawn — a permanent surrender the town lives inside.
4. **Military culture:** hold flooded ground, deny crossings
   (Reedwarden, Ford Arbalest; the flooded-approaches doctrine).
5. **Research:** wet silt-pack, ford signaling, flood timing.
6. **Map behavior:** the Fen Crossing — Ford/Blockade; the sanctuary is
   marked; the wyrm's presence/absence is scoutable.
7. **Depends on:** Capital food; Marcher cavalry once goods leave the
   water; (later) Stonekeel metal for straps.
8. **Never obsolete:** it is the only ford on its river, and the terms
   of its existence are a story the map still tells.

## Stonekeel

1. **Exists** as the empire's mine and engineer.
2. **Human problem:** the mountain fights back — unstable workings,
   siege, cold.
3. **Economy:** ore, stone, engineering; later shed crystal-plate study.
4. **Military culture:** defend, undermine, endure; cannot chase.
5. **Research:** plate angle, joint gaps, counter-siege (future
   Ironspine questions originate here).
6. **Map behavior:** future **Entrench** verb (Ironspine); today,
   engineering depth.
7. **Depends on:** Capital food; Brinehold rope for harness/joint wraps.
8. **Never obsolete:** metal is the empire's constraint, and its
   doctrine is the only one that endures siege.

## Cinderreach

1. **Exists** as the wild ecology and hunt holding — **deliberately no
   required bonded dragon.**
2. **Human problem:** timber cuts attract wild drakes; the forest must
   be hunted, not cleared.
3. **Economy:** timber, resin, hides, hunt licenses.
4. **Military culture:** ambush, track, screen woods (rangers,
   warhounds).
5. **Research:** migration, nest timing, how wild drakes use fire
   *behaviorally* (territory), never as an elemental school.
6. **Map behavior:** reveals concealed forest routes over time — human
   scouting and hounds, no dragon verb by default.
7. **Depends on:** Marcher logistics to reach distant scars; Stonekeel
   plating + its resin for light composite (later).
8. **Never obsolete:** it is the Bestiary factory and the proof that
   not every holding needs a dragon to matter.

## Galeari

1. **Exists** as the eyes of the empire — flyway watch and the slayer
   tradition in tension with a future pact.
2. **Human problem:** things come over the sky, and nobody has been
   looking up.
3. **Economy:** signal craft, observers, message fees.
4. **Military culture:** see far, shoot high (slayers, ballista);
   cannot hold a river or a mine.
5. **Research:** thermal roads, intercept timing, anti-air engines;
   future Pale Passage questions.
6. **Map behavior:** extreme human reconnaissance today; intercept arm
   only when a future dragon relationship earns it.
7. **Depends on:** Capital and Stonekeel existing as things worth
   warning; Marcher logistics to move the warnings.
8. **Never obsolete:** the watch does not care who owns the sky; slayer
   doctrine and future pact doctrine must **tension, not homogenize** —
   a pacted fast dragon never deletes the ballista rings.

**Council ruling (settles a recurring drift):** a holding is founded or
transformed by dragon relationships only where a human reason exists
independently; the dragon relationship changes what that place *does*,
not whether it *counts*. No future holding may fail the dragon-key
test.

---

# ROUND 6 — FUTURE DRAGON IDENTITY

Not designs — a stress test of the architecture against four radically
different archetypes.

## 1. Signature Vale Drake (baby → adult, adaptable)

Supported natively. Implemented as the identity system (naming,
temperament, growth, Chronicle, harness roles). No gaps.

## 2. Fast migratory dragon (adult, extreme speed, interception)

Passes the Identity Contract on paper (verb: interception/extreme-range
reconnaissance; acquisition by migration *prediction*, not combat;
fragile, light equipment). **Architectural requirement discovered:**
`DragonIndividual` location is currently static (`locationKind` + tile).
Migration prediction needs a **movement model** — scheduled/predictable
position with public clues. This is an extension of the individual
model, not a special case: every dragon already has a location; this
one's location changes legibly. Classification: LATER. No Alpha work.

## 3. Crystal/mineral defensive dragon (ancient, living fortress)

Supported. Verb class "Entrench/Fortify wilderness" is a stationing
semantics sibling of Ford/Blockade (same contract, different effect).
Settlement effect lands on Stonekeel, which already has the human
reason. No gaps beyond the future dragon's own Identity Contract.

## 4. Colossal ancient dragon (Old Karth — civilization-scale pact)

Passes as design (exhaustion/recovery/provisioning, Breach verb, armies
remain necessary). **Architectural requirement discovered:** current
`DragonIndividual` carries `ownerPlayerId` — conventional ownership.
Old Karth is a *relationship without ownership* (a realm-scale compact).
The fix is not special-casing: the `relationship` field already
expresses the bond spectrum; the ownership field must become able to
express **realm-shared or non-owned** individuals. Classification:
LATER; record as the one schema-level extension the architecture owes
its future.

## Verdict

> **The Signature / Domain / Wild architecture supports all four
> archetypes without special-casing the game, conditional on two named
> extension points:** (1) a legible movement model for individuals whose
> position changes publicly; (2) ownership decoupled from relationship
> for realm-scale and named-wild individuals. Both are recordable now
> and buildable later. Neither reopens Alpha.

None of the four is implemented during Alpha Closure.

---

# ROUND 7 — RESEARCH AS A GAME IDENTITY

The ladder is **RUMORED → OBSERVED → SUPPORTED → PROVEN**, the loop is
**OBSERVE → HYPOTHESIZE → TEST → CODIFY**. Council answers:

1. **Visible to the player:** the state *words*, the question phrased
   in-world, the field notes (what was seen, where, when), and codified
   results as capabilities. Knowledge is a notebook, not a progress bar.
2. **Behind the scenes:** source-kind classification machinery, record
   dedup, rumor seeding, exact thresholds. The player sees *that* the
   wyrm turns its vanes before rushing; they never see
   `evidence >= 2`.
3. **Knowledge creates a verb, not +5%:** every codified result names a
   new capability — read a tell, signal a ford, brace a formation,
   treat a wound, build a harness pattern. If the honest summary is a
   percentage, it is not research, it is a tech tree wearing feathers.
4. **Losing as knowledge:** someday, honest defeat reports may carry
   observation evidence (the enemy wyrm's tells). Cut from Alpha
   (Phase 0.6) because reward-free honest loss telemetry is a design
   problem of its own and intentional-loss farming is a real risk. The
   extension point stays reserved.
5. **Alliance sharing without trivializing discovery:** share *evidence
   records* with provenance (an alliance bestiary), never wholesale
   PROVEN states; the receiving player must still codify themselves.
   Discovery credit and the Chronicle stay personal. BETA.
6. **Rumors create mystery:** RUMORED entries are seeded from world
   facts (scout lines, refugee talk, the Scriptorium's open questions)
   and are deliberately incomplete — a rumor names a *behavior*, never
   a stat block.
7. **Research and the Bestiary:** the Bestiary is species-level public
   knowledge (what everyone can eventually know); research is
   behavioral/individual knowledge (what *you* proved). Bestiary pages
   deepen when your codified knowledge touches them, and later when
   alliance knowledge is contributed.
8. **Not a second quest log:** research never issues objectives. It
   *answers* questions the world already posed. If a research surface
   ever says "do X, Y, Z," it has become a checklist and must be
   rewritten as prose.

### Three canonical examples (only the first two exist in Alpha)

- **Signature behavior research (ALPHA): Vane Reading.** Observe the
  tell at the Scar under danger; recognize the same tell in the roost;
  codify → keepers read temperament tells; a wyrmling trusts a keeper
  who demonstrably reads it. Two distinct sources; the roost alone can
  never prove it.
- **Domain ecology research (ALPHA): Wet silt-pack.** Flood-line
  evidence plus fen scouting proves why arrows fail on wet silt →
  codify **ford signaling** — the capability that lets humans treat
  with a wyrm at a crossing at all, and later the root of
  flooded-ground doctrine.
- **Enemy dragon counter-research (LATER): reading a rival's pacted
  wyrm.** From scouting and battle reports: "it strikes at flood tide;
  spears braced against the rush hold" → codify a **formation**, not a
  resistance percentage. Exists to prove the same system supports
  hostile scholarship without new machinery.

---

# ROUND 8 — RETENTION: "WHAT HAPPENS AFTER THE CAMPAIGN?"

The council attacked the linear trap directly — Dragon 1 → City 1 →
Dragon 2 → City 2 → credits — and froze the architecture that makes it
impossible by construction rather than by content volume.

The trap's mechanism: authored dragons are *chapters*, and chapters
end. If nothing else in the world can move, the product is a campaign.
The counters are three permanently-different kinds of system:

## Frozen principle — Authored dragons

**Purpose: major empire progression.** Few, deep, Identity-Contract
gated, each a chapter with a world cost (yielded banks, posted guard,
pacted rivers). They end. That is a feature: chapters are *finished*,
and finishing them is what progression means.

## Frozen principle — Wild dragons

**Purpose: evergreen world state.** Mostly unowned. Named individuals,
migration, ecology, territory that shifts. They kill, deny, nest,
move on, return. Killing one is a political fact, not a loot roll. The
Alpha already carries the seed: **the Scar adult survives victory and
is still out there.** If a future agent is tempted to make wild dragons
static, this principle is the law they are breaking.

## Frozen principle — Player conflict

**Purpose: stories authored by humans, not by us.** Dragon relationships
create *asymmetric, legible, temporary* facts — absence windows, ford
blockades, intelligence about who has posted their dragon where. Players
weaponize those facts against each other, and the stories that result
are unrepeatable. The MMORTS spine (postures, alliances, marches) is
the delivery mechanism for dragon-shaped drama.

**The one-sentence freeze:** *Authored dragons end; wild dragons and
other players do not.* No live-ops systems are built now. The claim
this council makes is narrower and stronger: **the architecture leaves
room for the forever game** — wild individuals are already a modeled
concept (the roster's Layer C), location is already authoritative and
absence already meaningful, and the Chronicle already remembers.

### Language discipline — what Alpha Closure may claim

Persistent wild-dragon ecology is a **product destination and an
architectural obligation**, not an Alpha claim. After Alpha Closure the
truthful external claim is:

> DragonWake has a persistent shared-world MMORTS foundation with
> dragon-driven progression.

Not yet claimable — until First Watch demonstrates the loops produce
the desire to return, and moving named wilds, seasonal ecology, and
realm-scale individuals exist:

> "the world continuously generates living dragon stories."

The architecture supports that destination; it has not demonstrated the
destination. First Watch is permitted — expected, even — to return the
finding *"the authored dragon experience is great, but the game still
dies after it."* That finding would not invalidate Alpha; it would
direct Beta.

---

# ROUND 9 — ALPHA VS BETA VS LATER

Every contested system classified. **Be ruthless** was the instruction;
the ruthless act is mostly refusal.

| System | Verdict | Rationale |
| --- | --- | --- |
| Unique Brinehold combat rule (flooded approaches) | **ALPHA — KEEP, FROZEN** | One data-driven defender-terrain doctrine already shipped (E6). Frozen as law: no per-settlement combat-rule engine, ever. New settlement combat identity must be a data modifier, not resolver code. |
| Multiple wound types | **LATER** | One wound (strained vane) tells the recovery story. More types is content, not proof. |
| Commander/dragon rapport | **LATER** | Real charm, real depth, zero Alpha thesis proof. Commanders stay as they are. |
| Escort (marches) | **LATER** | Cut ladder item (Phase 0.1). Needs its own Identity Contract pass; do not let it leak back. |
| Slayer path | **LATER — GATED** | PACT is the canonical Alpha route (Phase 0.2). Slayer returns only with a genuinely competitive strategic identity (a Brinehold branch that is *worse* is a fake choice). |
| Extra dragon species | **REJECTED for Alpha** | Do not build six dragons. Each future species passes the Identity Contract or does not exist. |
| Seasonal ecology | **LATER** | Lovely; orthogonal to the thesis; a systems campaign of its own. |
| Named-wild procedural generation | **LATER / EXPERIMENTAL** | Named wild individuals are canon architecture (Round 8). *Procedural* generation of them is an experiment until it can produce an individual that passes the Identity Contract. |
| Full harness inventory | **REJECTED for Alpha** | One role-changing harness (Guard Harness). A slot-and-rarity ecosystem is the gacha in harness clothing until the Harness Philosophy document governs it. |
| Dragon death | **LATER — DESIGN FIRST** | Wild individuals may someday die as world facts (politics, not loot). Signature-dragon death is its own campaign: permanence, grief, and Chronicle ending are not an Alpha line item. Alpha has wounds and recovery only. |
| Player-managed dragon breeding (collection/progression) | **REJECTED** | Dragons are individuals, not stock; a breeding pipeline turns "this is my dragon" into inventory management and a rarity faucet. |
| Wild reproduction as ecology / narrative (nests, eggs, young, lineage, breeding seasons) | **LATER — explicitly permitted** | Fits the world and was never the target of the ban: territorial behavior around young, egg-protection stories, and migration seasons are welcome. The only law is that reproduction must never become a livestock or rarity pipeline. The Fen Wyrm's spawning bank already points this direction. |
| Titan gameplay (Old Karth) | **LATER** | Architecture must permit it (Round 6 extension point 2). Nothing is built. The Vault relationship design remains the reference. |
| Defeat-as-evidence | **LATER** (Phase 0.6 cut reaffirmed) | See Round 7.4. |
| Alliance research sharing | **BETA** | See Round 7.5 — evidence with provenance, codify it yourself. |
| Shared-world unique dragons | **BETA QUESTION — RECORDED** | Local individuals are the honest Alpha scale (Round 3, A-challenge 4). Before public testing scales, decide deliberately; do not drift. |

---

# ROUND 10 — CONVERGENCE

One position. Remaining disagreements are stated, not buried.

## A. NORTH STAR

> DragonWake is a persistent medieval strategy world where dragons are
> territorial powers with location, memory, and terms. You survive one,
> raise one, and negotiate with others — and each relationship changes
> what your civilization may do: where it can cross, what it must
> surrender, what it can learn, and where it is vulnerable. Dragons do
> not decorate the empire. They decide what it becomes.

*(62 words.)*

## B. FIVE PRODUCT PILLARS

1. **Dragons are beings, not stat cards.** Locatable, absence-detectable,
   behaviorally consistent; they refuse, hold territory, and survive
   defeat.
2. **Dragon relationships reshape civilization.** Every major
   relationship changes behavior in the world — a yielded bank, a
   posted guard, a crossing with terms — never merely a statistic.
3. **Knowledge comes from the world.** Observe, hypothesize, test,
   codify; evidence is distinct and earned; codified knowledge is a
   capability, never a percentage.
4. **Location creates strategic consequence.** A dragon is in one place,
   server-authoritatively; its absence is a discoverable fact that
   both sides can act on.
5. **Persistent realms keep producing dragon stories.** Authored
   chapters end; wild dragons, moving world facts, and player conflict
   do not.

## C. TEN NON-NEGOTIABLE DESIGN RULES

1. **No gacha.** No collectible rarity ladder, no dragon summons, no
   duplicate-shard anything.
2. **No dragon stack.** One major dragon per march; few domain dragons
   per empire; never a roster of interchangeable power.
3. **No stat-only dragon identity.** `+X%` fails the Identity Contract;
   a dragon that cannot refuse is not a True Dragon.
4. **No fake dragon encounters.** An encounter has dragon-authored
   behaviors and a dragon-specific report; a reskinned camp is a
   shipping blocker, not a shortcut.
5. **No duplicate observation farming.** Knowledge advances on distinct
   evidence kinds, at least one world-sourced; same-source repeats are
   recorded but never advance state.
6. **No city unlock disguised as a relationship.** If a holding has no
   human reason to exist without the dragon, it is a key; reject it or
   split the human reason out.
7. **The signature dragon remains emotionally central.** Named, housed,
   Chronicle-hearted; never power-superior to domain dragons; never
   obsolete, only outgrown in scope.
8. **Domain dragons remain few, wild dragons remain mostly unowned.**
   Each domain dragon is a contracted chapter; the wild stays the
   world's ceiling.
9. **Every major dragon has a meaningful weakness that affects
   deployment.** Hidden resist tables do not count; no Dragon N
   supersedes Dragon N−1.
10. **Location is singular, server-authoritative, and consequential.**
    A dragon cannot be in two places; counter-scouting may hide detail
    but never lie; absence is always real.

## D. ALPHA EXPERIENCE CONTRACT

What a player must **genuinely experience** before
`DRAGON_DRIVEN_ALPHA_CERTIFIED`. This contract outranks implementation
checklists; a green test suite that misses beats below is not
certification.

1. **Mystery before ownership.** Before owning any dragon, the player
   reads the world's dragon evidence — tracks, burned camps, rumors,
   Bestiary entries — and the UI has not yet taught "dragon = progress."
2. **A truthful adult encounter.** The player prepares, witnesses
   authored dragon behaviors (Wing Rush, Vane Dive, Breaking
   Pressure), and reaches SURVIVED / DRIVEN_BACK / ROUTED, with a
   report that names what punished what. The adult survives the fight
   in the world's memory.
3. **Custody.** The player names the hatchling; the roost visibly
   changes state; the Chronicle begins; the emotion designed is
   responsibility, and the settlement reads differently.
4. **Growth earned and legible.** Hatchling → wyrmling requires time,
   real observation, and Vane Reading at least SUPPORTED — and the
   player can say *why* it grew. No wound was ever caused by clicking
   a normal role.
5. **Preparation as care.** The player crafts the Guard Harness; the
   harness is visible on the dragon; Home Guard becomes possible
   because of it, not because of a level.
6. **A world cost before a pact.** The Fen Crossing exists CONTESTED;
   the player yields the spawning bank; the crossing becomes SANCTUARY;
   the surrender is marked and permanent; only then is the pact
   offered.
7. **A dragon reshapes a holding.** Brinehold exists as the river
   holding under pact terms — Reedwarden/Ford Arbalest doctrine,
   flooded approaches matter, the sanctuary bounds the economy.
8. **Location as strategy.** The player stations the wyrm at the
   crossing: own marches quicken, enemy assaults delay, home waters
   empty — and an enemy scout can learn the absence and raid it. The
   defender's recall is a real dilemma.
9. **Knowledge as capability.** At least two codified results the
   player can *do* things with (read temperament tells; signal the
   ford), shown as field notes — never as fractions or task text.
10. **Persistence.** Name, wounds, harness, pact, sanctuary, verbs, and
    the survived adult all survive a full world restart.

**Certification rule:** the extended journey proves *function*; one
human game-feel pass over the full contract is the co-gate for the
*experience claim*, conducted per the
[`ALPHA_GAME_FEEL_GATE.md`](./ALPHA_GAME_FEEL_GATE.md) protocol (ten
debrief questions, explicit PASS/FAIL gates, identity-beat blocking).
Both must pass. The human pass is not a rubber stamp — its findings
can block certification.

## E. WHAT IS NOT REQUIRED FOR ALPHA (explicit cut list)

Escort marches · Slayer branch or second Brinehold · extra dragon
species · multiple wound types · commander/dragon rapport · full
harness inventory · dragon death · player-managed dragon breeding
(wild reproduction as ecology remains permitted) · Titan/Old Karth
gameplay · seasonal ecology · named-wild procedural generation ·
defeat-as-evidence · alliance research sharing · shared-world unique
dragons · river/flyway terrain systems (one authored crossing is the
whole Alpha) · production art, audio, responsive pixel-perfection
(Visual Alpha's charter) · Lore Bible v1 completion (parallel, must not
reopen this).

## F. FUTURE DRAGON IDENTITY CONTRACT

Every future dragon must answer, before any implementation:

- **Origin** — local history allowed; ultimate origin stays UNKNOWN.
- **Anatomy** — silhouette a concept artist could draw; unique features,
  not "has wings and fire."
- **Personality** — wants, fears, refusals; a dragon that cannot refuse
  is not a True Dragon.
- **Acquisition** — mechanically different from every previous dragon's
  pattern; the pattern library forbids repetition-as-loop.
- **World verb** — on terrain that existed before the dragon; visible on
  the Realm map; passes the World Verb Contract's twelve fields.
- **Weakness** — affects deployment, not a hidden resist table.
- **Settlement effect** — founds, transforms, or explicitly leaves alone
  a holding that has a human reason to exist regardless.
- **Military effect** — human troop culture shaped by local ecology;
  the dragon is not a troop.
- **Research questions** — at least one codified result that is a
  verb/formation/counter/treatment/technique, never a percentage.
- **Equipment relationship** — role-changing or none; which slots the
  species lacks; never rarity.
- **Chronicle potential** — stories it can accumulate; if it would read
  as a loot log, it fails.

Plus the two architectural truths this council adds: the dragon's
**location model** must be stated (static, stationing, or migrating),
and its **ownership model** must be stated (owned individual, local
relationship, realm-shared, or unowned wild).

## G. SETTLEMENT IDENTITY CONTRACT

Every holding must answer:

- **Ecology** — what the land is and does.
- **Economy** — what it produces and what it permanently foregoes.
- **Human culture** — what ordinary people adapted to.
- **Military doctrine** — what its troops are for and what they cannot do.
- **Research role** — which questions originate here.
- **Map role** — what map behavior it cares about or changes.
- **Dependencies** — which holdings it cannot replace.
- **Why it remains relevant** — the human reason that survives every
  future dragon.

And the standing test: *if the player never bonds another dragon, does
this place still have a human reason to exist?* A "no" is a rejection,
not a design note.

## H. RESEARCH PHILOSOPHY

DragonWake research is natural philosophy, not a technology tree.

Knowledge states (RUMORED → OBSERVED → SUPPORTED → PROVEN) describe
what the player has *demonstrated about the world*, and the loop
(OBSERVE → HYPOTHESIZE → TEST → CODIFY) is performed by the player on
evidence the world generated — not consumed from a queue. Therefore:

- Evidence is **distinct records** of things seen, fought, scouted, or
  tested; the same sight twice is a note, not progress.
- States are words, evidence is field notes, and nothing in the surface
  ever issues an objective. Research answers questions; it never
  assigns tasks.
- **Codified knowledge is always a capability** — a tell that can be
  read, a signal that can be given, a formation that can be adopted, a
  treatment, a construction pattern, an equipment cut. A research
  result whose honest summary is a percentage is not canon and must be
  reworked into a capability or cut.
- Defeat may someday teach, but only through honest loss reports that
  carry no progressive reward — until that is designed, defeat teaches
  nothing on purpose.
- The Bestiary is what everyone can eventually know; research is what
  *this player* proved. The two deepen each other and are never the
  same surface.
- Alliances may share evidence with provenance; they may never transfer
  understanding — every player still codifies their own.

Any future change that makes this paragraph describable as
"Research Level 7 → +6% Attack" is a canon violation, regardless of
what vocabulary it wears.

## I. THE NEXT THREE CAMPAIGNS

The proposed names were discussed; two stand, one is renamed.

1. **Dragon Alpha Closure — Truthful Loop.** Implement Round 4's
   binding deltas (authored Scar encounter; distinct evidence records;
   Guard Harness gating; Fen Crossing + yield; crossing-bound
   Ford/Blockade), land PR #8/#9 review chain, pass CI with the
   extended journey, run the human game-feel co-gate per
   [`ALPHA_GAME_FEEL_GATE.md`](./ALPHA_GAME_FEEL_GATE.md), then award
   `DRAGON_DRIVEN_ALPHA_CERTIFIED`. Nothing else enters this campaign.
2. **DragonWake Visual Alpha.** AGES/Antigravity presentation, production
   sprites, settlement/terrain art, animation, roost and dragon state
   legibility as *art*, UI/world presentation, mobile/tablet surfaces.
   May not reopen living-dragon mechanics; may not reopen this vision.
3. **First Watch — Alpha Playtest & Game-Feel.** (Renamed from "Alpha
   Playtest / Game-Feel Campaign": the watch is the product's own
   metaphor, and the campaign's job is to *see* real players.) Human
   pacing, comprehension, retention observation, balance evidence, and
   the first real test of Round 8's forever-game architecture.

Sequencing note: the human game-feel co-gate in campaign 1 is a *pass*,
not the full campaign 3; campaign 3 is where its findings are pursued.

## J. DEFERRED BACKLOG

| Item | Belongs in | Boundary |
| --- | --- | --- |
| Ironspine (mineral dragon + Stonekeel entrench) | BETA | After Visual Alpha; Identity Contract pass first |
| Fast dragon (Pale Passage + migration prediction) | BETA | Requires movement-model extension (Round 6.1) |
| Colossal dragon (Old Karth / Vault) | LATER | Requires ownership-decoupling extension (Round 6.2); realm-scale pact design first |
| Mature harness ecosystem | LATER | Governed by the Harness Philosophy; never slot-rarity |
| Slayer path | LATER — GATED | Only with genuinely competitive strategic identity |
| Seasonal ecology | LATER | Systems campaign of its own |
| Named-wild systems | LATER (individuals) / EXPERIMENTAL (procedural generation) | Must pass Identity Contract per individual |

None of these leaks into Alpha Closure. A reviewer rejecting a PR for
smuggling any of them into the closure campaign is enforcing this
document.

---

# FINAL ADVERSARIAL CHECK

## AGENT A: the strongest argument that our final vision is still wrong

> "We have spent a council polishing three authored beats — a fight, a
> naming, a pact — and are calling the result a persistent world. If a
> player finishes the authored chapters in ten hours and the wild layer
> is a Bestiary line and a rumor, then 'persistent realms keep producing
> dragon stories' is marketing, and no amount of visual polish in the
> next campaign will save it."

## AGENT B responds

> The claim we freeze is deliberately narrower than marketing: Alpha
> proves the *loops* — location, absence, distinct evidence, world cost,
> intelligence — not content volume. The Scar adult surviving victory,
> the sanctuary marked on the map, and scoutable absence are the first
> three evergreen facts already in the world, and Round 8 makes the
> wild layer an architecture obligation rather than a hope. Your
> argument is the correct reason campaign 3 exists: First Watch exists
> precisely to measure whether the loops generate wanting. If they do
> not, the honest failure is discovered there — with function certified
> and fantasy measured — instead of being hidden under sprites.
>
> And A concedes the real edge: the vision doc therefore records the
> shared-world dragon question (Round 9, last row) as a BETA decision
> that must be made deliberately, so "it was always per-player
> individuals" can never be sprung on players later.

## AGENT B: the strongest argument that our final vision is still wrong

> "The fantasy we are about to certify is a single-player campaign with
> multiplayer bolted on. Two guests get two hatchlings and two Fen
> Wyrms and two crossings — the 'world full of things greater than you'
> is instanced per player, and the dragon-intelligence moment happens
> between two players who were handed identical dragons. We may be
> certifying a beautiful tutorial for an MMORTS that does not exist
> yet."

## AGENT A responds

> True as scope, false as betrayal — and now written down so it can
> never become a betrayal. Local individuals are the Phase 0.3 honesty
> decision: a global unique in a small realm is a queue that one player
> closes forever. What the Alpha proves between two real realms is the
> *mechanic that makes shared dragons matter later*: server-authoritative
> location, discoverable absence, a raid window a human exploited. When
> realm-scale uniques arrive — across the ownership-decoupling extension
> this council recorded — the intelligence gameplay is already proven;
> only the population is new. That is the correct order. Building the
> population first would have given us a crowded world where nothing
> about a dragon's position mattered.

**Council finding:** both challenges expose scope risks, not product
flaws; both responses are folded into the record above (Round 9 last
row; Round 6 verdict; Round 8 freeze). No further change to the
converged vision was required. The vision is frozen as written.

---

# FINAL SUCCESS CONDITION

Both agents independently answered the ten questions; the answers below
are materially compatible by inspection.

> **What is DragonWake?**
> A persistent medieval strategy world where territorial dragons with
> location and terms decide what empires may become.

> **Why do dragons matter?**
> Because each one changes behavior — where you cross, what you
> surrender, what you can learn, where you are weak — never merely a
> number.

> **Why is the starter dragon emotionally different from Domain Dragons?**
> It is the household: named, raised, forgiven — custody rather than
> statecraft.

> **Why is a Fen Wyrm not simply Dragon #2?**
> Different in kind: adult, unnamed-by-you, adapted-to by you, pacted on
> terms that cost real world assets, and strategically locatable in a
> way that changes war for both sides.

> **How does a dragon change civilization?**
> Settlements transform under terms (Brinehold), doctrine grows from
> ecology (Reedwardens), economies accept permanent surrenders (the
> sanctuary bank), and research learns the world (silt, vanes).

> **How does research feel different from a technology tree?**
> It answers questions the world posed, using distinct evidence you
> gathered, and pays out in capabilities — never in percentages or
> task text.

> **Why does dragon location matter to another player?**
> Because the dragon's absence is a discoverable fact that opens a real
> raid window — and its presence at a crossing is a wall you must
> route around, wait out, or break.

> **Why do settlements remain useful?**
> Each has a human reason to exist that no dragon grants and no later
> holding replaces; dragons change what they do, not whether they count.

> **What keeps players playing after authored progression?**
> Wild dragons that still move, other players who weaponize absence,
> and a Chronicle that remembers — authored chapters end; the world
> does not.

> **What exactly must be true before Alpha Closure?**
> Every beat of the Alpha Experience Contract (Round 10.D) is
> experienced by a real player, with the extended journey green and the
> human game-feel co-gate passed — then, and only then,
> `DRAGON_DRIVEN_ALPHA_CERTIFIED`.

---

# ADOPTION

## Authority chain

```text
CURRENT_STATE.md
    ↓
DIRECTION_FREEZE_V1_1.md
    ↓
DRAGON_VISION_COUNCIL_V1.md
    ↓
Alpha / system-specific specifications
```

Responsibilities:

- **Direction Freeze** — what DragonWake must never become.
- **Vision Council (this file)** — what DragonWake is trying to become,
  and what Alpha must prove.
- **Subsystem specs** — how particular mechanics satisfy that vision.

This council **interprets** the Direction Freeze; it does not replace
it. [`ALPHA_GAME_FEEL_GATE.md`](./ALPHA_GAME_FEEL_GATE.md) is the
certification protocol Round 10.D relies on.

## Rulings

- This document binds Alpha Closure design. The Round 4 binding deltas
  are the campaign's scope; anything else requires a canon amendment.
- `docs/CURRENT_STATE.md` lists this file as **CURRENT AUTHORITY** for
  product vision and Alpha Closure design law (reconciled 2026-09-05).
- PR #8's canon documents remain authoritative where this file is
  silent; where they conflict with Round 4, this file wins (it is the
  later, specific ruling).
- The council changed no code. Implementation of the binding deltas
  belongs to the Alpha Closure campaign.

## Ideation freeze

This council is the **last major high-level design debate before Alpha
Closure**. Vision-level argument is closed until the game is playable
by humans: the next useful criticism should come from a player — *"I
didn't understand why the Fen Wyrm cared about the bank"*; *"the Scar
still felt like a normal battle"* — not from another agent proposing
Dragon #6. Agents should actively resist reopening identity questions
until First Watch produces player evidence. DragonWake now transitions
from **designing its identity** to **proving its identity**.

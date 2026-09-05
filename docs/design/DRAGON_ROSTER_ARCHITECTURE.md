# Dragon Roster Architecture

Status: **CANON — PROVISIONAL** names and local histories.
**CANON — FROZEN** structure (five archetypes + room for later slots).

These are design architectures to test the Identity Contract, not final
lore. Do not treat placeholder names as frozen. Do not implement all five
in the next campaign.

Contract: [`DRAGON_IDENTITY_CONTRACT.md`](./DRAGON_IDENTITY_CONTRACT.md).
Alpha in-scope: Wake-clutch hatchling + local Fen Wyrm (Mirecrown as
campaign title only). See
[`DRAGON_ALPHA_PROOF_SLICE.md`](./DRAGON_ALPHA_PROOF_SLICE.md).

---

## Roster map

| Slot | Working name | Layer | Life stage at meeting | Alpha |
| --- | --- | --- | --- | --- |
| Signature | Wake-clutch Vale Drake (player-named) | A | Hatchling | **YES** |
| Domain 1 | Mirecrown | B | Adult | **YES** |
| Domain 2 | Pale Passage | B | Adult migrant | later |
| Domain 3 | Ironspine | B | Adult | later |
| Domain 4 | Old Karth | B / Great | Ancient adult | later |
| Open | 1–3 future domain slots | B | — | not designed |
| Wild | Valley Drake population, Ridgeback Wyvern, Mountain Wyrm, Ironback Wyrm, Ash Drake (reframed), named individuals | C | mixed | ecology only |

Do not add a chromatic set (fire/ice/earth/wind) to fill open slots.

---

## 1. Signature — Wake-clutch Vale Drake

### Identity

- **Placeholder name:** the player names it. Working species: Vale Drake
  (`valley_drake` in current bestiary). Working clutch epithet: Wake-clutch.
- **Classification:** Drake tending toward True Dragon intelligence as it
  matures. Not a Great Dragon.
- **Age at meeting:** hatchling. Eyes open, cannot fly, roughly the size
  of a large hound.
- **Mature scale:** horse-plus to small keep-tower; never colossal.
- **Silhouette:** four-legged, moderately long neck, sail of cartilaginous
  vanes along the spine rather than a classic triangular sail; wings
  develop late and look too large for the body until Broadwing.
- **Unique anatomy:** spine vanes flush with heat and fear; a keeper can
  read the animal before it can speak in any useful sense. Underjaw is
  unarmored. Wing thumbs have a gripping spur used to climb palisades
  before true flight.

Not a Night Fury analogue. Not a fire-color. Breath, if any, is a hot
sour gas used to panic livestock — dangerous to thatch, not a battlefield
flamethrower.

### Origin

Vale Drakes already live in lowland valleys near water (existing bestiary).
Farmers know them as livestock raiders that rarely attack settlements.

The Wake-clutch is not a unique species. It is one clutch left after a
wild adult raid on a frontier camp. Myths that "the first dragon is a
chosen gift" are wrong. The player finds a surviving hatchling because
the world is dangerous, not because destiny arrived.

Ultimate dragon origin remains UNKNOWN.

### Acquisition — Raising + Disaster

- First learned: burned camps, shed scales, clawed stone, incomplete
  farmer reports (current clue content, reinterpreted as observation).
- Foreshadow: Dragon Scar Expedition. The expedition is survival of
  dragon territory, **not** the bond.
- Encounter: after Marcher Keep exists, a follow-on search of the scar
  finds the abandoned clutch. One hatchling lives.
- Why different from later dragons: this is the only raising loop. Later
  dragons are adults with other patterns.
- Bond: possible, earned over growth, not a button at the nest.
- Already adult: no.

Do not grant this dragon in the first five tutorial minutes.

### Personality / agency

- **Wants:** warmth, familiar keepers, later a territory overlapping the
  Capital roost.
- **Fears:** isolation, sudden loud siege engines, being left in a stall
  while the player deploys without it once it can march.
- **Dislikes:** heavy plate as a hatchling/wyrmling; being used as a pack
  animal.
- **Refuses:** (temperament-dependent) some long away-marches, attacking
  fleeing levy, carrying loads that hurt developing wings.
- **Relationships:** the naming keeper, the commander most often paired,
  later rivalry or curiosity toward domain dragons.

Temperament tags (not a sim): Wary / Curious / Loyal / Irritable /
Scarred, shifted by injuries, refusals honored, and whether the player
treats it as partner or tool.

### Strategic identity

- **Why choose it:** it is *yours*. It is the only dragon that will be
  home at the Capital when domain dragons are elsewhere. Adaptable: can
  learn guard, short-range escort, or later limited skirmish.
- **Unique:** Chronicle density; player-named; growth; emotional
  visibility in Castle. No other dragon lives in the player's keep as a
  member of the household.
- **Cannot:** outrun Pale Passage, out-entrench Ironspine, breach like
  Old Karth, or command a river like Mirecrown.

### World verb — Patrol (Capital approaches)

At Broadwing, the signature dragon can **Patrol** a short radius around
its home holding: reveal hidden scouts, intercept small raids on the
approaches, and make the Capital's near-map different from before it
could fly.

This verb works on tiles that existed since founding. It is not "+15%
defense."

Alpha may ship a reduced verb: **Home Guard** (home / away / wounded
only, with a limited escort-adjacent march). Full Patrol can wait for
Broadwing.

### Settlement

Capital grows a roost, a slaughter-yard that becomes a feeding court
(not a hunger minigame), and later a Chronicle hall. Ordinary humans
adapt: keepers, a small roost watch, superstition about the vanes.
Institution: the Roost, not a Slayer order.

### Troops

No exclusive Capital super-unit from the hatchling. The existing medieval
roster remains the army. What changes is doctrine: some levies learn to
give the roost a wide berth; later a small **Roost Guard** (adaptation of
existing shield/pike, not a new fantasy species) exists to defend the
dragon at home when it is wounded.

### Research

Questions: what does a Vale Drake eat as it grows; when do vanes predict
a fear-strike; can wing-thumb gripping be trained without ruining flight;
how does a bonded drake react to its keeper's commander.

Example codify: `Vane Reading` — Castle and reports show temperament
tells. Not +attack.

### Equipment

Light training harness first. Role change: **Yard** (home, growth, no
march) vs **Escort** (limited away). Heavy war harness is a late Mature
question and may be refused.

No identical 4-slot relic matrix.

### Weakness

Never the best specialist. Developing wings are fragile. Emotional
leverage: players who treat it as a nuke will get refusals and scars.
If it dies, that is an account-visible wound in the Chronicle — do not
cheap-resurrect it. (Exact death rules: later freeze; Alpha may use
critical wound rather than permadeath.)

### Chronicle potential

Naming day, first flight, first refusal, first scar, first commander
pairing, first time it defended the Capital, first time it met Mirecrown.

### Growth (not Level 1–90)

| Stage | Player-visible | Opens |
| --- | --- | --- |
| Hatchling | carried, named, roost | observation research |
| Wyrmling | walks the yard, vanes readable | first temperament fork |
| Juvenile | climbs palisades, still no true flight | Home / Wounded states matter |
| Broadwing | first flight | Patrol verb, limited march |
| Mature | household war-partner | escort/skirmish role via harness |
| Veteran | scars, refusals, history dominate | prestige, not power creep |

Growth spends **experiences** (journeys, injuries, honored refusals,
research, bond milestones) plus time. Time alone cannot skip stages.
No punitive daily feeding.

---

## 2. Domain 1 — Mirecrown

### Identity

- **Placeholder:** Mirecrown (individual). Species: Fen Wyrm.
- **Classification:** Wyrm (wingless, serpentine), territorial adult.
- **Age:** already mature. Do not hatch it.
- **Scale:** longer than a river barge; coils can block a ford.
- **Silhouette:** low, reed-colored, body wider than it is tall, eyes
  at waterline, no wings, frill of wet keratin that looks like reeds
  until it moves.
- **Anatomy:** breathes with a reed-snorkel ridge; belly is pale and
  soft; dorsal hide is silt-packed and arrow-resistant when wet; must
  stay wet or the silt-pack cracks.

Not a Water Dragon. Not a Brinecant leftover. The aquatic *name*
Brinehold is a historical ID to migrate; the ecology is river/wetland.

### Origin

Fen Wyrms hold spawning grounds in slow rivers and reed seas. Human
myths call them drowned gods or river-devils. Wrong: they are animals
with long memory who treat fords as nest edges. Mirecrown is the
individual currently holding the river that the player's expansion
needs.

### Acquisition — Negotiation + Rivalry

- First learned: flooded fields, missing fords, livestock taken at
  night, Brinehold charter rumors that "the river does not want a city."
- Foreshadow: scouts cannot cross a tile that used to be a ford;
  reports of a barge crushed in silt.
- Encounter: the wyrm *arrives* at a holding or march as a disaster,
  not as a boss HP bar the player selected. The player survives or
  loses a march, then maps its coils over multiple observations.
- Why different from the hatchling: no raising, no naming-as-owner,
  no nest button. The player bargains: leave the spawning ground
  unworked, receive ford rights; or try to slay and accept delayed
  domain access plus a slayer doctrine.
- Bond: **pact**, not ownership. Home is the river.
- Already adult: yes.

### Personality

- Wants undisturbed spawning water and tribute of space, not gold.
- Fears drought, fire along the reeds, channel-cutting that drains
  the nest.
- Dislikes horses in the shallows, piled stone that narrows the channel.
- Refuses mountain, steppe, and long dry marches. Will not enter a
  stall in the Capital.
- Relationships: pact-keepers at Brinehold; hostility toward players
  who drain wetlands; possible later tolerance of the signature dragon
  if the hatchling is not brought to the reeds as a challenger.

### Strategic identity

- Unique: **Ford / Blockade** on existing rivers. The player can open
  a crossing for their own marches or deny one to enemies.
- Cannot: fly, siege a hill keep, chase cavalry on dry roads, or live
  at Stonekeel.

### World verb — Ford / Blockade

On river tiles that existed before the pact, the player may spend
Mirecrown's presence to make a crossing passable or to close it.
Enemy scouts can see that the wyrm is coiled at a ford (away from
Brinehold).

### Settlement

Brinehold becomes a river-pact holding: pile dwellings, rope walks,
reed harvest, a pact-stone rather than a dragon stall. Economy: reed
fiber, pitch, barge traffic, fish weirs that must not enter the
spawning ground. Institution: Ford-Wardens.

### Troops

Reuse current exclusive IDs where possible:

- `shieldman` → **Reedwarden** doctrine: fight in flooded ground,
  poor on steep stone.
- `crossbowman` → **Ford-arbalest**: shots across water, weak in
  forest.

They exist because humans had to live beside a wyrm before any pact.
Counters: dry-ground cavalry, fire along reeds, siege from high banks.

### Research

Questions: why arrows fail on wet silt-pack; whether the snorkel ridge
is a weak point; how to signal a ford opening without calling the wyrm
into a fight it will refuse.

Example: `Angled Lamination` from observing deflection on wet plates —
a construction/armor technique, not +% defense as the whole identity.

### Equipment

No conventional saddle. Possible: signaling buoys, channel markers,
a pact-harness of ropes used to *request* a blockade, not to ride.
Heavy plate is nonsense on a wet wyrm.

### Weakness

Must remain near water. Silt-pack cracks when dry. Soft belly. Slow on
land. If lured onto a road, ordinary pikes matter. Absence from the
river is a window: Brinehold's fords become ordinary again.

### Chronicle

First flood survived, pact date, a refused request, a blockade that
saved an army, a drought year, a commander who learned not to bring
horses into the shallows.

### Meaningful alternative (later — not Alpha)

- **Pact (canonical, Alpha-implemented):** Brinehold transforms; Ford
  verb; Reedwarden doctrine. Each player pacts a **local Fen Wyrm
  individual**, not a globally unique Mirecrown.
- **Slayer delay:** later design. Do not ship as "worse Brinehold after
  a wait." It needs a competitive identity before implementation.

---

## 3. Domain 2 — Pale Passage

### Identity

- **Placeholder:** Pale Passage (individual). Species: Passage Drake
  / Leanwing.
- **Classification:** True Dragon, migratory.
- **Age:** adult. Never a hatchling for the player.
- **Scale:** body light as a deer, wings absurdly long.
- **Silhouette:** almost nothing in the torso; a cross of wings; pale
  leading edges that catch light like a sail, not like lightning.
- **Anatomy:** hollow bone, continuous-flight metabolism, cannot hover,
  cannot take off from a confined courtyard, almost helpless grounded.
  No heavy jaw. Kills by stoop and shear.

Not a Wind Dragon. Speed is biology, not an element.

### Origin

Leanwings follow old **thermal roads** between mountain and sea.
Humans recorded them as weather omens and "sky-cuts." Wrong: they are
migratory hunters on a map that does not care about kingdoms. Pale
Passage is a known individual because of a pale leading-edge scar
visible at distance.

### Acquisition — Pursuit + Tracking

The player cannot catch it with a normal march. They must predict a
flyway (observation + ecology research), wait, and offer a relationship
that does not include a stall: roost-rights at Galeari's high watch,
unhindered thermal lanes, no heavy harness.

### Personality

Wants open lanes and unburdened flight. Fears nets, confined stone,
grounded nights in wet weather. Refuses heavy harness, riders in plate,
payload, hovering over a siege. Relationships: Galeari signal-keepers;
hostility toward ballista crews who have shot at Leanwings.

### Strategic identity / world verb — Intercept / Extreme recon

Can intercept a *moving* army on the existing map, or return a scout
report from a distance ordinary cavalry cannot complete before the
target moves. Cannot hold a hill, cannot carry siege, cannot tank.

### Settlement

Galeari becomes a flyway watch: signal masts, thermal charts, open
roost terraces rather than a cave-stall. Economy: message craft,
light timber, observers. Current `dragon_slayer` + `ballista` remain
as the human answer to things that outrun cavalry — doctrine tension
with the pact is intended.

### Weakness

Fragility, no payload, grounded vulnerability, refuses plate, cannot
fight in courtyards or forests. Scoutable when away on a long intercept:
Galeari's sky is empty.

### Equipment

Ultralight only: wing-edge signals, maybe a chest strap for a message
tube. No torso armor. No talon engines.

### Research

Thermal roads, hollow-bone limits, `Predictive Volley` (from watching
it lose maneuver in any added weight — including enemy Leanwings).

Chronicle: first predicted landfall, a failed net, an intercept that
saved an ally, a grounded storm night.

---

## 4. Domain 3 — Ironspine

### Identity

- **Placeholder:** Ironspine (individual, already used as the example
  absence line in the campaign). Species: Ironback Wyrm with decades of
  accumulated mineral plating.
- **Classification:** Wyrm, mineral ecology.
- **Age:** adult.
- **Scale:** can fill a mine adit; shorter than Mirecrown, vastly
  heavier.
- **Silhouette:** a moving vault door; joints glow faintly where crystal
  has not grown; no useful wings.
- **Anatomy:** diet of mineral-rich stone; crystalline plating accumulated
  over decades; joints are the gap; slow heat; underground senses.

Not an Earth Dragon. The crystals are diet and time, not a magic school.

### Origin

Ironback Wyrms (existing bestiary) live on exposed rock and in tunnels.
Ironspine is an individual that nested in the workings humans later
called Stonekeel. Myths that the mountain *is* the dragon are wrong.
The mountain was mined around a creature that refused to leave its vein.

### Acquisition — Tracking + mine relationship

Follow collapsed adits, mineral-shed plates, and vibration reports.
The player does not hatch it. Relationship: coexistence with the mine,
joint reinforcement rather than "taming," possibly rescue from a
collapse the player's own sappers caused.

### Personality

Wants to remain in contact with its vein. Fears being lured onto open
sky-lit ground. Dislikes fire in tunnels, flooding of workings.
Refuses long flights (cannot), open-field chases, and being treated as
a walking wall far from stone. Will defend Stonekeel. Will not raid a
distant coast.

### Strategic identity / world verb — Entrench / Fortify wilderness

Can turn a claimed wild or a field camp into a temporary stronghold, or
reinforce a keep's wall-layer while present. This uses existing
wilderness/keep tiles. Not "+20% defense" as the whole identity: the
map gains an entrenched marker that other players can see and must
siege differently.

### Settlement

Stonekeel: mining, engineering, counter-siege, underground survival.
Architecture: buttresses, inner keeps, dragon-joint forges. Current
`sapper` + `halberdier` become Underminners and Plate-pikes.

### Weakness

Slow. Cannot fly. Joints are the targeting problem. If it leaves
Stonekeel, the holding's entrenchment drops — *Ironspine has left
Stonekeel* is a raid window. Lured into the open, cavalry and engines
matter.

### Equipment

Not torso armor (it *is* armor). Joint reinforcement, eye-guards, maybe
a siege-brace. Role change: **Vein-guard** vs **Field-entrench** (shorter
endurance).

### Research

Plate angle vs thickness (`Angled Lamination` may start here or at
Mirecrown's wet pack). Joint-gap targeting. How to live underground
when the wyrm moves.

---

## 5. Domain 4 — Old Karth, the Vaultwyrm

### Identity

- **Placeholder:** Old Karth. Classification: Great Dragon / Vaultwyrm.
- **Age:** ancient adult. Discovered fully grown. **Do not level from 1.**
- **Scale:** keep-dwarfing. A marching column is a line at its feet.
- **Silhouette:** too large to perch on a tower; when it rises, the
  horizon changes. Horned vault-skull, wings like barn roofs, body
  that does not fit in any stall.
- **Anatomy:** old injuries already present at discovery; one horn
  broken in pre-kingdom history; heat under the vault of the chest,
  not a chromatic breath-color.

Not a weekly raid boss skin. Not a player pet.

### Origin

Predates current kingdoms (Direction Freeze). Local legend: a vault in
the mountain is a tomb. Wrong: it is a living body that has slept in a
caldera-hollow. Waking it is a political crime in some cultures and a
sacrilege in others.

### Acquisition — Realm crisis + Negotiation

Karth is not found by a personal fetch quest. A regional event (quake,
ash, or a rival attempting a wake) forces the question. The player
does not "unlock Titan." They survive the wake, then negotiate a
rarely-honored compact: Karth will **Breach** in defense of a domain
under terms, then return.

No stall. No naming-as-owner. No hatchling skin.

### Personality

Wants to sleep. Fears being used as a hound. Dislikes crowds of engines
at its vault. Refuses trivial raids, resource-tile farming, and
repeated deployment. Relationships: whoever kept the compact; hatred
for whoever last woke it without cause.

### Strategic identity / world verb — Breach

Destroys or disables a **defensive layer** (walls, a gate, a field
entrenchment). The player's army must still win the battle. Karth does
not delete cities. Karth does not replace stacks.

### Exhaustion / recovery / provisioning (not Sunday)

| Deployment | Recovery (order of magnitude, not balance) |
| --- | --- |
| Nearby limited Breach (adjacent holding) | short — hours to a day, plus feeding the vault |
| Fortress Breach | several days; vault hungry; local ecology disturbed |
| Long-distance campaign | longer; realm-visible travel both ways |
| Severe injury | a week or more; possible permanent scar; political fallout |

Recovery has story consequences (ash, frightened holdings, alliance
mail). Not trivially monetizable. Armies remain necessary during
recovery. Provisioning costs real resources and attention, not a
Chronite skip.

Deployment is realm-visible: *the colossal dragon has left its domain.*
Alliances should react.

### Settlement

Not a sixth production city. A **Vault** relationship: a limited
holding type or a transformed ruin with almost no economy, high
political visibility, and provisioning yards. Ordinary humans do not
"live with" Karth the way they live with the hatchling.

### Troops

No Karth-stack. Human doctrine around the Vault is evacuation,
provisioning, and *not standing under the wings*. Existing siege and
slayer tools remain relevant for *other people's* Great Dragons.

### Weakness

Rarely deployable. Scoutable absence of apocalyptic size. Slow to rise.
After Breach, gone. A player who spends Karth on a vanity attack loses
the war the following week. Pay-to-win skip of recovery is forbidden.

### Chronicle

The wake date, first Breach, a refusal, a scar already older than the
player's kingdom, commanders who were present, alliance wars that
moved when Karth moved.

---

## 6. Open slots

Do not pre-fill with:

- ice dragon
- lightning dragon
- forest-color dragon
- sea clone of Mirecrown
- a second Titan

A future domain dragon must still pass the Identity Contract and use a
**new** acquisition combination. Candidate spaces (not designed): a
rescued captive adult; a political ally belonging to another culture;
a temporary cooperative during a migration.

Cinderreach's primary dragon relationship in this architecture is
**wild ecology and hunt**, not a required sixth bonded dragon. That is
intentional: not every holding is a dragon key.

---

## 7. Contract review (design-time)

| Dragon | World verb | Acquisition | Alpha | Contract |
| --- | --- | --- | --- | --- |
| Wake-clutch Vale Drake | Patrol / Home Guard | Raising + Disaster | yes | PASS |
| Mirecrown | Ford / Blockade | Negotiation + Rivalry | yes | PASS |
| Pale Passage | Intercept / Extreme recon | Pursuit + Tracking | no | PASS as architecture |
| Ironspine | Entrench / Fortify wild | Tracking + mine | no | PASS as architecture |
| Old Karth | Breach | Realm crisis + Negotiation | no | PASS as architecture |

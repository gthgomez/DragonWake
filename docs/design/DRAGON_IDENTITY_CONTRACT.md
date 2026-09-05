# Dragon Identity Contract

Status: **CANON — FROZEN** as a gate.
No major dragon (Layer A or Layer B) enters implementation until every
section below has a non-generic answer.

Working names may stay provisional. Blank sections, `+X%` identities, and
copied acquisition templates fail the gate.

Use this file as the template. Copy the checklist into the dragon's roster
entry. The initial roster already filled it once:
[`DRAGON_ROSTER_ARCHITECTURE.md`](./DRAGON_ROSTER_ARCHITECTURE.md).

Layer C wild fauna and unnamed ecology creatures may use a shorter
bestiary card. **Named wild individuals** that can alter a region still
need Identity, Origin, Personality, Strategic identity, Weakness, and
Chronicle potential.

---

## Gate questions every answer must survive

- What does the PLAYER do?
- What changes in the WORLD?
- What does the DRAGON do?
- What changes in the SETTLEMENT?
- What changes in the ARMY?
- What does RESEARCH discover?
- What tradeoff exists?
- Why would the player remember this?

Fail if the honest summary is:

- `+X%` stat
- new resource + two troops
- wait timer → percentage
- collect arbitrary clues → click Bond

---

## Required dimensions

### 1. Identity

- Name / placeholder name
- Species or classification (True Dragon / Wyrm / Wyvern / Drake / Sea /
  Great — from Direction Freeze v1.0 §6, not an elemental color)
- Age / life stage at first encounter
- Scale relative to a horse, a keep wall, a marching column
- Visual silhouette (one sentence a concept artist could draw)
- Unique anatomical features (not "has wings and fire")

### 2. Origin

- Where did this dragon come from?
- Why does it exist in this region?
- What history surrounds it?
- What myths about it are wrong?

Dragon ultimate origin remains UNKNOWN. Local history is allowed.

### 3. Acquisition

- How does the player first learn it exists?
- What clues foreshadow it?
- How does the player encounter it?
- Why is acquisition mechanically different from previous dragons?
- Can it be bonded, or must it be negotiated with, pursued, rescued,
  tolerated, or left wild?
- Is it already adult?

Pick from the
[`DRAGON_DISCOVERY_AND_GROWTH.md`](./DRAGON_DISCOVERY_AND_GROWTH.md)
pattern library. Do not reuse the previous dragon's combination as the
whole loop.

### 4. Personality / agency

- What does it want?
- What does it fear?
- What does it dislike?
- What will it refuse to do?
- What relationships can change its behavior?

A True Dragon that cannot refuse is not a True Dragon.

### 5. Strategic identity

- What makes the player choose this dragon?
- What can this dragon do that no other dragon can?
- What can it NOT do?

If the answer is "it is a faster / tankier version of the last one," fail.

### 6. World verb

Every major dragon unlocks or alters at least one **map verb**: a way to
interact with territory that existed *before* acquiring the dragon.

Examples of the principle (not a mandatory list):

- cross or blockade rivers
- intercept moving armies
- fortify wilderness
- breach a fortified layer
- uncover concealed routes
- conduct extreme-range reconnaissance

The verb must be visible on the Realm map, not only inside a combat
resolver as a damage multiplier.

### 7. Settlement / civilization relationship

- Which settlement or domain changes because this dragon exists?
- How does local architecture change?
- How does the economy change?
- How do ordinary humans adapt?
- What institutions arise around it?

Not every domain dragon founds a new city. Transforming an existing
holding is valid. A Vault relationship with no full economic city is
valid for the Titan.

### 8. Troop relationship

Dragon-associated settlements have human troops shaped by ecology and
culture. The dragon is not a troop.

Explain:

- why these units exist
- what local problem created them
- how their doctrine differs from other cities
- what counters them

### 9. Research

- What new scientific questions does the dragon create?
- What observations can be made?
- What hypotheses can be tested?
- What mechanical knowledge can be codified?

At least one research result must be a verb, formation, counter,
treatment, construction technique, or equipment pattern — not a
percentage.

### 10. Equipment / harness

- Does this dragon use armor at all?
- What visible equipment can it use, and why?
- Does equipment change role rather than rarity score?
- Which slots does this species *not* have?

See [`DRAGON_HARNESS_PHILOSOPHY.md`](./DRAGON_HARNESS_PHILOSOPHY.md).

### 11. Weakness

Every dragon requires meaningful limitations.

No Dragon N simply supersedes Dragon N-1.

Weakness must affect deployment, not only a hidden resist table.

### 12. Chronicle potential

What stories can this individual accumulate?

- battles
- scars
- refusals
- commanders
- settlements defended
- notable hunts
- alliance wars
- bond or pact milestones

If the Chronicle would read as a loot log, fail.

---

## Layer-specific extras

### Signature dragon only

- Player names it
- Visible life stages (not Level 1 → 90 as the identity)
- Growth depends on more than time (experiences, bond, journeys,
  injuries, training, decisions)
- No punitive daily feeding
- Remains relevant after domain dragons exist — state *how*

### Domain dragon only

- Why this is a chapter of empire, not a pet
- Ownership model: bonded / pacted / allied / tolerated / cooperative
- Whether a holding is founded, transformed, or not created
- How absence from its domain creates a window for enemies

### Titan / Great Dragon only

- Must be discovered adult
- Must not level from "Level 1"
- Deployment uses exhaustion / recovery / provisioning, **not**
  "once every Sunday"
- Must not click-to-delete cities
- Armies remain necessary after its verb resolves
- Deployment is realm-visible intelligence
- Recovery is not trivially monetizable

### Named wild individual only

- Cannot be added to the player's major-dragon roster by default
- May move, survive, be killed, disappear, return
- Generates research, conflict, or regional change
- Killing it is a political fact, not a loot roll

---

## Review sign-off

A future implementation campaign lists:

```text
Dragon: <working name>
Contract: PASS | FAIL
Failed sections: <ids>
World verb: <one line>
Acquisition pattern: <patterns>
Alpha in-scope: yes | no
```

Do not implement a FAIL.

# Dragon World Verb Contract

Status: **CANON — FROZEN** as a gate for any map verb.
Alpha implements **Ford / Blockade** only.

No world verb ships without answers to every field below.

---

## Required fields

| Field | Question |
| --- | --- |
| Invoker | Who may invoke it? |
| Eligible target | Which tiles/entities? |
| Ownership | Whose dragon, whose land? |
| Affected | Who feels the effect? |
| Alliance | What do allies get? |
| Enemy | What do enemies get? |
| Scout visibility | What intel reveals it? |
| Counterplay | How is it answered? |
| Concurrency | Two verbs, same tile? |
| Duration / commitment | How long, and is the dragon occupied? |
| On leave | What happens when the dragon leaves? |
| Server authority | What is the source of truth? |

---

## Alpha: Ford / Blockade (Fen Wyrm)

### Invoker

The player who holds a **pact** with a local Fen Wyrm individual.
Not spectators. Not the signature hatchling.

### Eligible target

Exactly one **ford tile** assigned when the pact is formed.

The tile must be adjacent to that player's Brinehold (or the
pre-pact river tile reserved for that domain). It is territory that
existed before the pact.

Rejected: any other river, wilderness, or enemy capital.

### Ownership

The ford is associated with the pacter's Brinehold domain. The Fen
Wyrm is a local individual, not a global unique.

### Affected

- **Ford (friendly):** owner marches between Capital and Brinehold
  complete faster while the wyrm is stationed at the ford.
- **Blockade (hostile):** enemy attack/occupy marches whose target is
  the ford tile, or Brinehold itself from outside the domain, are
  delayed while the wyrm is stationed at the ford.

### Alliance

Allies do **not** inherit the Ford speed. They may see the blockade
through intel. They cannot station the wyrm.

### Enemy

Enemies cannot invoke the verb. They can scout absence and attack
Brinehold while the wyrm is Away at the ford (raid window).

### Scout visibility

With Watchtower/intel at city-intel depth (existing Lookout L3 rule
or equivalent), a scout of Brinehold or the ford tile learns whether
the Fen Wyrm is **home waters** or **at the ford**.

Coarse intel may only show "a great presence is missing."

### Counterplay

- Attack Brinehold while the wyrm is Away (home undefended by the wyrm).
- Wait out the stationing (dragon cannot be in two places).
- Do not march into the blockaded crossing.

### Concurrency

One Fen Wyrm, one location. A second station request relocates it
(Home ↔ Ford). Two players' local wyrms do not share a tile effect;
each ford is domain-scoped.

If two verbs target the same tile (should not happen in Alpha): last
authoritative write wins; the previous wyrm returns home.

### Duration / commitment

While stationed at the ford the wyrm is **Away**. It cannot also
guard Brinehold. Returning home clears Ford/Blockade.

No Chronite skip.

### On leave

Ford speed bonus ends. Blockade ends. Brinehold's "wyrm present at
home waters" state returns.

Restart: a stationed verb must reload as Away at the ford, not as a
duplicate Home+Ford.

### Server authority

World verb rows are server state. Clients display. Marches consult
the verb at create and at land. No client-owned location.

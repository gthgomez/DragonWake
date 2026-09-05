# Dragon Alpha Closure — Phase 0 amendments

Status: **CANON — FROZEN** for Alpha implementation.
Does not reopen Direction Freeze v1.1. Amends the Proof Slice and
roster notes where independent review found remaining design issues.

Parent: [`DRAGON_ALPHA_PROOF_SLICE.md`](./DRAGON_ALPHA_PROOF_SLICE.md).
Law: [`DIRECTION_FREEZE_V1_1.md`](./DIRECTION_FREEZE_V1_1.md).

---

## 0.1 Hatchling pacing

Preserve:

> The player must experience dragon mystery and danger before receiving a dragon.

Add:

> The signature hatchling must become part of the player's early-game
> identity. It must not be hidden behind multi-day progression merely to
> satisfy "late enough." Under accelerated/certification pacing, a fresh
> player must be able to reach the hatchling within one coherent
> first-session progression journey.

**Early acquisition** is not **late combat maturity**.

The baby remains militarily weak for a long time. Home Guard is the
Alpha operational role. Escort marches are cut (cut ladder item 7).

Acquisition gate for Alpha: survive the **real Scar encounter**, then
discover the abandoned clutch. Marcher Keep may be founded in the same
session; it is not a second multi-day lock in front of naming.

---

## 0.2 Pact is the Alpha route

Do not ship:

`PACT → cool mechanics` versus `SLAY → wait longer and receive worse Brinehold`

as fake agency.

**PACT is the canonical implemented route.**

The Slayer alternative remains later design until it has a genuinely
competitive strategic identity. Do not build a second Brinehold branch
in Alpha.

---

## 0.3 Major-dragon instancing

### Signature dragon

One persistent individual belonging to the player's account/realm
identity. Player names it.

### Ordinary domain dragons

Instantiate persistent **local individuals** from an archetype/species.

Do **not** give every player the same globally unique Mirecrown.

Alpha:

- Species/archetype: **Fen Wyrm** (`fen_wyrm`)
- `Mirecrown` remains a provisional design/campaign title
- Each pact creates a persistent local individual associated with that
  player's Brinehold domain
- The player does not rename it as property
- Do not overbuild procedural naming (a stable epithet is enough)

### Realm-scale dragons

Old Karth may eventually be a truly realm-shared unique individual.
**Do not implement Old Karth now.**

---

## 0.4 World-verb contract (mandatory)

Every world verb must specify the fields in
[`DRAGON_WORLD_VERB_CONTRACT.md`](./DRAGON_WORLD_VERB_CONTRACT.md).

Alpha Ford/Blockade is **conservative**:

- Eligible target: one river crossing associated with the player's
  Brinehold domain / locally controlled territory
- No arbitrary global river griefing
- Server authoritative
- Exact numbers are implementation decisions

---

## 0.5 Presence is not a living dragon

Do **not** stretch `DragonPresence` into the persistent creature model.

```text
DragonPresence
    kingdom/world awareness/readiness projection
    (DORMANT → STIRRING → AWAKENED → charter earned → …)

DragonIndividual
    identity, archetype, life stage, physical state,
    home/location, wounds, temperament, history

DragonRelationship
    wild / observed / tolerated / bonded / pacted / hostile
```

> A living dragon must not merely become additional values in the old
> Presence enum.

Player-facing copy must not call a charter a bond.

---

## 0.6 Organic research evidence

Preserve RUMORED → OBSERVED → SUPPORTED → PROVEN and
OBSERVE → HYPOTHESIZE → TEST → CODIFY.

Knowledge must not become another disguised quest checklist.

Evidence accumulates from scouting, battles, roost behavior, reports,
and exploration. Explicit controlled tests exist only where choosing
to test is interesting.

Defeat-as-evidence is **cut** from this Alpha (cut ladder item 2).
Extension point remains in [`DRAGON_RESEARCH_SYSTEM.md`](./DRAGON_RESEARCH_SYSTEM.md).

---

## 0.7 Proof split (implementation phases)

One Alpha closure target, two implementation phases:

**Proof A — This is my dragon**
Scar encounter, named hatchling, roost, growth, Chronicle, Vane
Reading, Home Guard harness, wounds, persistence.

**Proof B — Dragons built my empire**
Local Fen Wyrm individual, pact, Brinehold transformation, troop
doctrine, Ford/Blockade, scoutable absence.

These are not new product directions.

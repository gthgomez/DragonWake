# Dragon Discovery and Growth

Status: **CANON — FROZEN** pattern library and anti-template rule.
**CANON — PROVISIONAL** which dragon uses which mix.

Related: [`DRAGON_ROSTER_ARCHITECTURE.md`](./DRAGON_ROSTER_ARCHITECTURE.md),
[`DRAGON_RESEARCH_SYSTEM.md`](./DRAGON_RESEARCH_SYSTEM.md).

---

## Anti-template law

Do not implement a universal:

```text
collect three clues → fight boss → press Bond
```

Current Alpha readiness (bestiary + dragon_studies L2 + 3 materials +
2 camp levels + Dragon Watch L2) is a **human expedition gate**. Keep
it as that. Do not extend it as the acquisition template for every
major dragon.

Each major dragon uses a **different combination** from the library
below.

---

## Pattern library

### Raising

Find or hatch a young dragon. Long emotional progression. Player names
it. Growth stages matter.

Used by: **Wake-clutch Vale Drake** (only planned raising loop).

### Tracking

Follow evidence across terrain. The dragon is a place-problem, not a
menu.

Used by: Pale Passage (flyways), Ironspine (adits), named wilds.

### Disaster

The dragon appears because something went wrong: raid, flood, collapse,
wake.

Used by: Wake-clutch (abandoned after a raid), Mirecrown (flood),
Old Karth (wake).

### Pursuit

The player cannot catch it with a normal march. They must predict
movement.

Used by: **Pale Passage**.

### Negotiation

An ancient or territorial adult cannot realistically be subdued. The
player bargains in space, tribute-of-land, or compact.

Used by: **Mirecrown**, **Old Karth**.

### Rescue

The player helps an injured or captive dragon. Creates obligation, not
ownership.

Reserved for a future open slot. Do not also slap it on the hatchling.

### Rivalry

The dragon repeatedly interacts before allegiance is possible.

Used by: **Mirecrown** (repeat floods / denied fords).

### Realm crisis

Alliance-scale creature or event. Personal fetch-quest is the wrong
shape.

Used by: **Old Karth**.

---

## Assigned combinations

| Dragon | Combination | What the player actually does |
| --- | --- | --- |
| Wake-clutch | Raising + Disaster | Survive the Scar, found Marcher Keep, search the abandoned clutch, name and raise |
| Mirecrown | Negotiation + Rivalry (+ Disaster first contact) | Survive a flood, map coils, choose pact vs slayer-delay |
| Pale Passage | Pursuit + Tracking | Chart thermals, miss it, wait, offer roost-rights without a stall |
| Ironspine | Tracking + mine relationship | Follow collapses, coexist with the vein, optionally rescue from a sapper-caused cave-in |
| Old Karth | Realm crisis + Negotiation | Survive a wake, compact for rare Breach, provision recovery |
| Named wilds | mix, never Raising-as-ownership | observe, hunt, drive off, or fail |

---

## Signature growth model

Not Level 1 → 90.

Stages: **Hatchling → Wyrmling → Juvenile → Broadwing → Mature → Veteran**

Growth spends a mix of:

- time (slow baseline; cannot skip stages alone)
- major experiences (first flight, first march, first refusal honored)
- research (Husbandry / Anatomy)
- bond (naming, roost quality, commander pairing)
- journeys
- injuries (can delay a stage or add a scar-variant)
- training (harness role, not a grind bar)
- player decisions (tool vs partner)

**Avoid punitive daily feeding.** The roost has a state the player
checks; neglect can sour temperament; it is not a hunger-death chore
loop.

Alpha only needs Hatchling → first meaningful development (Wyrmling or
early Juvenile), plus Home / Away / Wounded.

---

## Domain progression is not the same axis

Adult domain dragons do **not** grow through hatchling stages.

Their progression axes:

| Dragon | Axis | Not this |
| --- | --- | --- |
| Mirecrown | Pact depth: tolerated → fords on request → blockade in war | XP bar |
| Pale Passage | Flyway trust: roost-rights → intercept on call → longer recon | speed stat stacking |
| Ironspine | Vein coexistence: present → entrench nearby wilds → joint-braced field march (short) | crystal rarity |
| Old Karth | Compact honor: sleep → one Breach → longer recovery politics | weekly raid currency |

If a domain dragon is "level 40 adult," the design has failed.

---

## Wounds, scars, history

A wound is not `Unavailable: 04:17:09`.

Minimum injury types (reusable):

| Injury | Immediate | Recovery choices | Scar possibility |
| --- | --- | --- | --- |
| Cracked wing / vane | no long flight; home defense reduced | rest vs rare treatment vs risky emergency sortie | yes — flight ceiling drops |
| Joint crack (plated wyrms) | cannot entrench far; slow | rest in vein vs brace-craft | yes — permanent limp, still a fortress at home |
| Dry-crack (Fen Wyrm) | silt-pack fails; must reach water | flood a channel vs wait for rain | hide weaker when dry |
| Exhaustion (Titan) | see provisioning table | cannot be skipped with Chronite | political scar: holdings remember the wake |
| Temperament break | refusals increase | honor rest, change commander, or push and make it worse | Chronicle refusal entries |

No pay-to-skip of core injury. Convenience currency may speed *travel
home* or *resource hauling for treatment*, not delete the wound.

---

## Home / away / wounded

Required visible states for every major dragon:

- **Home** — in its domain or roost. Map verb may be local.
- **Away** — on a march or at a ford/flyway/breach. Holding is weaker;
  scouts can learn this when intel is good enough.
- **Wounded / recovering** — not a grey timer only. Treatment choice
  is visible in Castle; Realm may show a reduced silhouette.

Alpha must ship these three for the signature dragon, and at least
Home/Away (scoutable) for Mirecrown.

Intended PvP line:

> Ironspine has left Stonekeel.

That creates raid windows, counterattack, alliance warning. Dragons
are not giant troop stacks; they are commitments.

---

## Player choice hierarchy

1. **Major canonical relationship** — primary progression route for
   domain dragons that would otherwise multiply into four campaigns.
2. **Meaningful alternatives** — persistent consequences without a
   second holding.

Alpha authored alternative: **Mirecrown pact vs slayer-delay**.

Not authored as full branches: killing the hatchling (allowed as a
dark failure with Chronicle and no signature dragon — Extreme cost,
LATER), or a unique city for every Pale Passage outcome.

---

## Commander pairing (lightweight)

Repeated commander + dragon pairings create:

- a rapport tag
- tactical familiarity (small, not a second skill tree)
- named battle history on the Chronicle

Do not build an RPG affection sim. Alpha: one tag on the signature
dragon after N shared marches is enough.

---

## Production cost

| Piece | Class | Burden |
| --- | --- | --- |
| Pattern library as design law | **ALPHA REQUIRED** | LOW (docs) |
| Hatchling raising through first development | **ALPHA REQUIRED** | HIGH |
| Mirecrown negotiation loop | **ALPHA REQUIRED** | HIGH |
| Real encounter (replace expedition stage-4 placeholder) | **ALPHA REQUIRED** | HIGH |
| Home/away/wounded + scoutable absence | **ALPHA REQUIRED** | MEDIUM |
| Chronicle v1 | **ALPHA REQUIRED** | MEDIUM |
| Pale Passage pursuit | **BETA REQUIRED** | HIGH |
| Ironspine mine loop | **BETA REQUIRED** | HIGH |
| Old Karth realm crisis | **LATER** | EXTREME |
| Per-dragon unique UI | **REJECT** | EXTREME |
| Personality simulation | **REJECT** | EXTREME |

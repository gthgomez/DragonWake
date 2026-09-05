# Canon authority

Status: **FROZEN** — Phase 0 of the domain-preserving migration, amended
by the Dragon-Driven Empire design canon (Direction Freeze v1.1).

This file exists so future agents cannot treat the old Dragons of Atlantis
research folder, the current aquatic/elemental leftovers, a historical
mechanic, or a superseded campaign report as Dragon Wake canon merely
because it already exists or is more detailed.

Current-state index for agents:
[`../CURRENT_STATE.md`](../CURRENT_STATE.md).

## Authority is domain-specific

Do **not** use a flat "latest document wins" rule across history, product
mechanics, lore and implementation. Different artifacts are authoritative for
different questions.

| Authority | Authoritative about | Not authoritative about |
| --- | --- | --- |
| [`DIRECTION_FREEZE_V1_1.md`](./DIRECTION_FREEZE_V1_1.md) | Current product-direction law, including v1.0 protections it preserves and the dragon-driven empire amendments | Exact balance numbers, unresolved lore names, historical DoA facts |
| [`DIRECTION_FREEZE_V1.md`](./DIRECTION_FREEZE_V1.md) | Original freeze text. Historical where v1.1 amends it; still binding where v1.1 is silent | Overriding v1.1; exact future dragon roster |
| [`DRAGON_DRIVEN_EMPIRE_CANON.md`](./DRAGON_DRIVEN_EMPIRE_CANON.md) | Current approved product design: hierarchy, loop, settlement relationship, long-term game | Reopening frozen Direction rules; claiming implementation already matches |
| Dragon design specs (identity contract, roster, holdings matrix, research, discovery, harness, engagement, alpha proof slice) | Bounded design contracts future implementation must satisfy | Inventing six playable dragons; numeric balance |
| `PRODUCT_BIBLE_V1.md` once approved | Current approved Dragon Wake progression/system model | Reopening frozen Direction rules without an explicit decision |
| `LORE_BIBLE_V1.md` once approved | Starting-region canon, cultures, ecology, institutions, narrative | Reopening frozen Direction rules; historical DoA behavior |
| Approved system specs + decision records | Exact bounded mechanics and why they were chosen | Unrelated product/lore domains |
| Current implementation | What the software currently does where higher authority is silent | Desired design when contradicted by an approved authority |
| [`DOA_REFERENCE_MODEL.md`](./DOA_REFERENCE_MODEL.md) | Evidence-backed answer to **what historical DoA did** | Dragon Wake lore, names, exact future mechanics |
| [`DOA_PARITY_MATRIX.md`](./DOA_PARITY_MATRIX.md) | Translation workspace from DoA mechanism purpose to Dragon Wake disposition | Canon unless a row is separately frozen by higher authority |
| [`PROGRESSION_GRAPH_V1.md`](./PROGRESSION_GRAPH_V1.md) | Research-backed dependency topology/invariants for the current design investigation | Numeric balance or permission to copy DoA fiction |
| Delivery reports (`delivery/*`, R3 reports, critic files, closed-mockup final reports) | Historical evidence of what a campaign shipped | Current product intent |

If two documents conflict **inside the same authority domain**, the higher
approved authority wins. If they answer different domains, do not force a fake
conflict: translate between them explicitly.

## Historical DoA evidence model

Historical DoA is no longer "non-authoritative" in the sense of being casually
dismissible. The repository now distinguishes two questions:

1. **What did DoA actually do?**
   [`DOA_REFERENCE_MODEL.md`](./DOA_REFERENCE_MODEL.md) is the historical
   authority to the extent its claims are supported and labeled.
2. **What should Dragon Wake do?**
   Direction Freeze v1.1, the Dragon-Driven Empire Canon, approved
   Product/Lore Bibles, system specs and decision records decide that.

This prevents both failure modes:

- an agent cannot rebuild aquatic/elemental fiction because "DoA did it";
- an agent also cannot erase a proven progression mechanism because historical
  research was labeled globally non-authoritative.

## What each layer is allowed to decide

| Layer | May decide | May not casually change |
| --- | --- | --- |
| Direction Freeze v1.1 | Current product-direction law (includes preserved v1.0 rules plus dragon-driven empire amendments) | Itself, without an explicit reopen |
| Direction Freeze v1.0 | Original freeze text; binding where v1.1 is silent | Overriding v1.1 |
| Dragon-Driven Empire Canon + design specs | Hierarchy, identity contract, roster architecture, holdings matrix, research/discovery/harness/engagement contracts, alpha proof slice | Frozen direction rules; a six-dragon implementation |
| Product Bible v1 | Approved progression topology, core economy, expansion structure, system contracts | Frozen direction rules |
| Lore Bible v1 | Starting region, cultures, creatures, institutions, ecology, narrative | Frozen direction rules |
| System specs / decisions | Bounded mechanics, equations, schemas, acceptance criteria | Unrelated authorities |
| Implementation | Schema, APIs, queues, persistence and current behavior | Reintroducing rejected fantasy or silently severing approved progression invariants |
| DoA Reference Model | Historical mechanisms, source confidence, era/contamination notes | Dragon Wake faction identities, aquatic aesthetic, elemental taxonomy, True Dragon treatment |
| DoA Parity Matrix | Preserve/modernize/expand/reinterpret/reject recommendations | Automatic canonization |

## Historical research path

The README previously pointed to:

```text
C:\Workspace\research\dragons-of-atlantis\pre-implementation\
```

That external folder remains **historical reference material**, but it is not a
current Dragon Wake design authority. Claims imported from it must be normalized
into the repository evidence model before an agent treats them as established
history.

The in-repo reference baseline is now:

- [`DOA_REFERENCE_MODEL.md`](./DOA_REFERENCE_MODEL.md)
- [`DOA_PARITY_MATRIX.md`](./DOA_PARITY_MATRIX.md)
- [`PROGRESSION_GRAPH_V1.md`](./PROGRESSION_GRAPH_V1.md)
- [`progression-graph.v1.yaml`](./progression-graph.v1.yaml)

## Canon layers inside lore documents

Treat future lore decisions according to four authority levels (Freeze §29):

| Level | Meaning |
| --- | --- |
| **CANON — FROZEN** | Cannot casually change. Direction Freeze v1.1, including preserved v1.0 rules. |
| **CANON — PROVISIONAL** | Use until contradicted by deeper lore design. Names, kingdom structures, species names. |
| **LEGEND** | Stories believed by people in the world, not necessarily objectively true. Especially useful for dragon origins. |
| **UNKNOWN** | Questions intentionally unanswered. The setting must retain mystery. |

## Product test

From Direction Freeze v1.0 §30 (preserved) and v1.1:

> Does this feature make Dragon Wake feel more like a believable medieval civilization shaped by dragons?

> Does this dragon, holding, or research change what the player can *do* in the world — or is it a reskin, a percentage, or a collectible?

If the first test fails, reject it.
If the second test fails, reject it even when the first is arguable.

## Do not build unless the direction is reopened

From Direction Freeze §27:

- elemental color factions
- thousands of dragons per army
- dragon gacha
- ubiquitous spellcasting
- generic fire / ice / earth / wind dragon taxonomy
- conventional RPG hero spam
- dragons treated as cosmetic mounts
- Power Score as the main strategy mechanic
- magical technology replacing medieval technology
- one-click dragon battles with no preparation
- factions distinguished primarily by percentage bonuses

## Related documents

Current direction and product design:

- [`../CURRENT_STATE.md`](../CURRENT_STATE.md) — agent entry: direction vs implemented vs next campaign
- [`DIRECTION_FREEZE_V1_1.md`](./DIRECTION_FREEZE_V1_1.md) — current freeze law
- [`DIRECTION_FREEZE_V1.md`](./DIRECTION_FREEZE_V1.md) — original freeze text
- [`DRAGON_DRIVEN_EMPIRE_CANON.md`](./DRAGON_DRIVEN_EMPIRE_CANON.md)
- [`DRAGON_IDENTITY_CONTRACT.md`](./DRAGON_IDENTITY_CONTRACT.md)
- [`DRAGON_ROSTER_ARCHITECTURE.md`](./DRAGON_ROSTER_ARCHITECTURE.md)
- [`DRAGON_DOMAIN_HOLDINGS_MATRIX.md`](./DRAGON_DOMAIN_HOLDINGS_MATRIX.md)
- [`DRAGON_RESEARCH_SYSTEM.md`](./DRAGON_RESEARCH_SYSTEM.md)
- [`DRAGON_DISCOVERY_AND_GROWTH.md`](./DRAGON_DISCOVERY_AND_GROWTH.md)
- [`DRAGON_HARNESS_PHILOSOPHY.md`](./DRAGON_HARNESS_PHILOSOPHY.md)
- [`DRAGON_ENGAGEMENT_MODEL.md`](./DRAGON_ENGAGEMENT_MODEL.md)
- [`DRAGON_ALPHA_PROOF_SLICE.md`](./DRAGON_ALPHA_PROOF_SLICE.md)

Still required, not replaced:

- [`LORE_BIBLE_V1_BRIEF.md`](./LORE_BIBLE_V1_BRIEF.md) — scope only; not canon yet
- [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md) — Phase 0–7 sequence (next *implementation* campaign is the Alpha Proof Slice)
- [`DOA_REFERENCE_MODEL.md`](./DOA_REFERENCE_MODEL.md) — historical evidence baseline
- [`DOA_PARITY_MATRIX.md`](./DOA_PARITY_MATRIX.md) — mechanism translation workspace
- [`PROGRESSION_GRAPH_V1.md`](./PROGRESSION_GRAPH_V1.md) — progression invariants
- [`progression-graph.v1.yaml`](./progression-graph.v1.yaml) — machine-readable graph

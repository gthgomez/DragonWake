# Canon authority

Status: **FROZEN** — Phase 0 of the domain-preserving migration.

This file exists so future agents cannot treat the old Dragons of Atlantis
research folder, the current aquatic/elemental implementation, or a historical
mechanic as TideForge canon merely because it already exists.

## Authority is domain-specific

Do **not** use a flat "latest document wins" rule across history, product
mechanics, lore and implementation. Different artifacts are authoritative for
different questions.

| Authority | Authoritative about | Not authoritative about |
| --- | --- | --- |
| [`DIRECTION_FREEZE_V1.md`](./DIRECTION_FREEZE_V1.md) | Product fantasy, tone, dragon rarity, medieval grounding, rejected genres, macro loop, PvP philosophy | Exact balance numbers, unresolved lore names, historical DoA facts |
| `PRODUCT_BIBLE_V1.md` once approved | Current approved TideForge progression/system model | Reopening frozen Direction rules without an explicit decision |
| `LORE_BIBLE_V1.md` once approved | Starting-region canon, cultures, ecology, institutions, narrative | Reopening frozen Direction rules; historical DoA behavior |
| Approved system specs + decision records | Exact bounded mechanics and why they were chosen | Unrelated product/lore domains |
| Current implementation | What the software currently does where higher authority is silent | Desired design when contradicted by an approved authority |
| [`DOA_REFERENCE_MODEL.md`](./DOA_REFERENCE_MODEL.md) | Evidence-backed answer to **what historical DoA did** | TideForge lore, names, exact future mechanics |
| [`DOA_PARITY_MATRIX.md`](./DOA_PARITY_MATRIX.md) | Translation workspace from DoA mechanism purpose to TideForge disposition | Canon unless a row is separately frozen by higher authority |
| [`PROGRESSION_GRAPH_V1.md`](./PROGRESSION_GRAPH_V1.md) | Research-backed dependency topology/invariants for the current design investigation | Numeric balance or permission to copy DoA fiction |

If two documents conflict **inside the same authority domain**, the higher
approved authority wins. If they answer different domains, do not force a fake
conflict: translate between them explicitly.

## Historical DoA evidence model

Historical DoA is no longer "non-authoritative" in the sense of being casually
dismissible. The repository now distinguishes two questions:

1. **What did DoA actually do?**
   [`DOA_REFERENCE_MODEL.md`](./DOA_REFERENCE_MODEL.md) is the historical
   authority to the extent its claims are supported and labeled.
2. **What should TideForge do?**
   Direction Freeze, approved Product/Lore Bibles, system specs and decision
   records decide that.

This prevents both failure modes:

- an agent cannot rebuild aquatic/elemental fiction because "DoA did it";
- an agent also cannot erase a proven progression mechanism because historical
  research was labeled globally non-authoritative.

## What each layer is allowed to decide

| Layer | May decide | May not casually change |
| --- | --- | --- |
| Direction Freeze v1.0 | Tone, dragon rarity, medieval grounding, rejected genres, player fantasy, PvP philosophy | Itself, without an explicit reopen |
| Product Bible v1 | Approved progression topology, core economy, expansion structure, system contracts | Frozen direction rules |
| Lore Bible v1 | Starting region, cultures, creatures, institutions, ecology, narrative | Frozen direction rules |
| System specs / decisions | Bounded mechanics, equations, schemas, acceptance criteria | Unrelated authorities |
| Implementation | Schema, APIs, queues, persistence and current behavior | Reintroducing rejected fantasy or silently severing approved progression invariants |
| DoA Reference Model | Historical mechanisms, source confidence, era/contamination notes | TideForge faction identities, aquatic aesthetic, elemental taxonomy, True Dragon treatment |
| DoA Parity Matrix | Preserve/modernize/expand/reinterpret/reject recommendations | Automatic canonization |

## Historical research path

The README previously pointed to:

```text
C:\Workspace\research\dragons-of-atlantis\pre-implementation\
```

That external folder remains **historical reference material**, but it is not a
current TideForge design authority. Claims imported from it must be normalized
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
| **CANON — FROZEN** | Cannot casually change. Everything locked in Direction Freeze v1.0. |
| **CANON — PROVISIONAL** | Use until contradicted by deeper lore design. Names, kingdom structures, species names. |
| **LEGEND** | Stories believed by people in the world, not necessarily objectively true. Especially useful for dragon origins. |
| **UNKNOWN** | Questions intentionally unanswered. The setting must retain mystery. |

## Product test

From Direction Freeze §30:

> Does this feature make TideForge feel more like a believable medieval civilization shaped by dragons?

If yes, investigate it.
If it mainly makes TideForge feel like a generic fantasy game, reject it.

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

- [`DIRECTION_FREEZE_V1.md`](./DIRECTION_FREEZE_V1.md)
- [`LORE_BIBLE_V1_BRIEF.md`](./LORE_BIBLE_V1_BRIEF.md) — scope only; not canon yet
- [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md) — Phase 0–7 sequence
- [`DOA_REFERENCE_MODEL.md`](./DOA_REFERENCE_MODEL.md) — historical evidence baseline
- [`DOA_PARITY_MATRIX.md`](./DOA_PARITY_MATRIX.md) — mechanism translation workspace
- [`PROGRESSION_GRAPH_V1.md`](./PROGRESSION_GRAPH_V1.md) — progression invariants
- [`progression-graph.v1.yaml`](./progression-graph.v1.yaml) — machine-readable graph

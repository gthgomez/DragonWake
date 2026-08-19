# Canon authority

Status: **FROZEN** — Phase 0 of the domain-preserving migration.

This file exists so future agents cannot treat the old Dragons of Atlantis
research folder, or the current aquatic/elemental implementation, as the
product direction.

## Current authority order

1. [`DIRECTION_FREEZE_V1.md`](./DIRECTION_FREEZE_V1.md) — product + lore direction. Cannot casually change.
2. [`LORE_BIBLE_V1.md`](./LORE_BIBLE_V1.md) — once written and approved. Does not exist yet. Scope is in [`LORE_BIBLE_V1_BRIEF.md`](./LORE_BIBLE_V1_BRIEF.md).
3. Current implementation — authoritative **only** where not contradicted by (1) or (2).
4. Historical DoA / pre-implementation research — **reference only, NON-AUTHORITATIVE.**

If a later document conflicts with a higher layer, the higher layer wins.

## What each layer is allowed to decide

| Layer | May decide | May not casually change |
| --- | --- | --- |
| Direction Freeze v1.0 | Tone, dragon rarity, medieval grounding, rejected genres, player fantasy, PvP philosophy | Itself, without an explicit reopen |
| Lore Bible v1 | Starting region, 3–4 cultures, 4–6 local creatures, one Slayer institution, ecology, adaptations, early narrative | Frozen direction rules |
| Implementation | Schema, APIs, combat numbers, queues, persistence | Reintroducing rejected fantasy because the code still says kelp / Brinecant / Harbinger |
| Historical DoA research | Proven MMORTS loop patterns, combat-resolver ideas, queue/march lessons | Faction identities, aquatic aesthetic, sovereign-as-dragon, elemental taxonomy |

## Historical research path (non-authoritative)

The README previously stated:

```text
C:\Workspace\research\dragons-of-atlantis\pre-implementation\
```

That folder, and any `POST_MVP_ITERATION.md` inside it, is **historical
reference**. It must not be cited as current design authority.

Useful remnants from that research (the MMORTS loop, deterministic combat,
persistence, reports) survive only because Direction Freeze §28 explicitly
preserves them.

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

# Specialist Role Prompts

Status: **CURRENT AUTHORITY** — canonical reusable prompts for the
[`COMPETITIVE_PRODUCT_LAB.md`](../COMPETITIVE_PRODUCT_LAB.md) roles.

These files are the durable copies. ZCode subagent/custom-agent
configuration is user-scoped and lossy; paste from here at launch. See
[`../ZCODE_CAPABILITY_MATRIX.md`](../ZCODE_CAPABILITY_MATRIX.md) for how to
launch each role with the currently installed tooling.

| File | Role | Reads the repository? |
| --- | --- | --- |
| [`blind-player-playtest.md`](blind-player-playtest.md) | Blind Player / UX Critic | **NO — hard rule** |
| [`competitor-archaeologist.md`](competitor-archaeologist.md) | Competitor Archaeologist | Only DragonWake design authorities for disposition context |
| [`dragonwake-repo-archaeologist.md`](dragonwake-repo-archaeologist.md) | DragonWake Archaeologist | Yes — read-only investigation |
| [`product-synthesizer.md`](product-synthesizer.md) | Product Synthesizer | Yes — after both evidence passes |
| [`post-implementation-verifier.md`](post-implementation-verifier.md) | Verification / Playtest Agent | Only after its own replay is recorded |

Update prompts by editing these files — never keep the only copy in chat
history or user-scoped tool config.

Reusable run forms live in
[`../templates/`](../templates/): the per-run provenance manifest
(`PLAYTEST_RUN_MANIFEST.md`) and the human-participant handoff
(`HUMAN_PLAYTEST_HANDOFF.md`).

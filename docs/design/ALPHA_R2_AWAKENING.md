# Alpha R2 — The Awakening

## Scope delivered

Alpha R2 makes the dragon a visible, server-backed part of the first kingdom
session. The existing persisted `dragon_progress`, Bestiary, inventory,
building, settlement, and march records are the source of truth. A lifecycle
projection is exposed as `DORMANT → STIRRING → AWAKENED → BONDED →
BATTLE_READY` and is recalculated on every readiness request, so a browser
refresh cannot claim progress that the server has not confirmed.

The Castle presents Dragon Presence immediately. Its next milestone is derived
from authoritative facts: first evidence and Dragon Watch, expedition
readiness, expedition completion, and later dragon-focused settlement
ownership. Existing Marcher Keep and S1 citadel routes remain compatible and
retain their differentiated starter units and research gates.

## State contract

| State | Server evidence | Player meaning |
|---|---|---|
| DORMANT | no dragon-related progress | a sleeping presence is beneath the kingdom |
| STIRRING | evidence, research, watch, scouting, or camp progress | the realm is producing credible signs |
| AWAKENED | expedition is active | the dragon scar has answered |
| BONDED | expedition charter is earned | the kingdom has a living bond with the frontier |
| BATTLE_READY | dragon-focused holding exists | dragon knowledge shapes war preparation |

This projection intentionally does not add or rename database identifiers.
Production art remains temporary; see `ALPHA_R2_ART_REQUIREMENTS.md`.

# Dragon Presence architecture

Dragon Presence is a read model, not client-owned state. `World.dragonPresence`
derives the lifecycle from persisted gameplay facts and
`GET /api/v1/dragon/readiness` returns it alongside the readiness requirements.
The Castle reads that response and renders the current state plus the next
server-defined milestone.

The derivation is monotonic for a normal campaign: evidence moves a dormant
dragon to stirring, an active expedition awakens it, a completed expedition
creates the bond, and a dragon-focused holding enables battle readiness. No
button or local storage value can advance the lifecycle.

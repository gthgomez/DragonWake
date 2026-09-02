# Alpha R2 progression and balance evidence

## Observed progression ladder

The server exposes Dragon objectives in this order: presence, evidence,
Dragon Watch, multi-level camps, wilderness, expedition, Marcher Keep, and a
specialized holding. The ladder is read-only to the client; completion is
derived from world state.

## Balance sanity notes

- Camps are seeded at levels 1–10 with increasing approximate defensive power
  from 50 to 40,000 and bounded composition variants.
- Wilderness production scales by node level: forest 30, fertile land 40,
  quarry 25, and iron hills 15 per level per hour.
- Crossroads reduce march duration by 3% per held level, capped at 30%.
- Watch hills add one scouting-depth level per held node level, so they improve
  intelligence without directly increasing combat power.
- The first three successful camp victories guarantee distinct onboarding
  evidence subject to the daily clue cap; later drops return to seeded rarity.

These are lightweight sanity bounds, not a complete economy simulation. A full
campaign pass should still measure time-to-charter and loss rates under normal
and `DEV_FAST_TIME` settings before production launch.

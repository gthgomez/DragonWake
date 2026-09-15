# AGENTS.md — DragonWake

Startup: read [`README.md`](README.md), then
[`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) (direction vs implemented
vs next), then [`docs/design/CANON_AUTHORITY.md`](docs/design/CANON_AUTHORITY.md)
(authority stack).

## Player-facing work requires the Competitive Product Lab

For player-facing gameplay, UX, visual, progression, competitor-parity, or
product-quality work, read
[`docs/product/COMPETITIVE_PRODUCT_LAB.md`](docs/product/COMPETITIVE_PRODUCT_LAB.md)
first.

**Rendered player experience is an independent source of truth.**
Implementation alone cannot certify product completeness: passing tests,
existing APIs, and reachable routes do not make a system discoverable,
understandable, rewarding, or finished for a player. Black-box (blind)
playtests precede implementation-aware diagnosis; player-facing changes are
replayed and verified in the running game before being called done.

## Hard boundaries

- Design law is frozen: do not reopen Direction Freeze, canon, or content
  IDs. The Lab governs process, not product direction.
- Blind playtests run with no repository/design knowledge — keep them
  isolated (see `docs/product/prompts/`).
- Competitor evidence carries provenance and confidence labels; never
  invent historical mechanics; no bulk copyrighted asset commits.

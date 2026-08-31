# CLOSED_MOCKUP_V1 — Presentation Contract

Status: **ACTIVE** — campaign design authority for the closed vertical slice.
Binds to: [DIRECTION_FREEZE_V1.md](./DIRECTION_FREEZE_V1.md) (product/lore authority),
[MIGRATION_PLAN.md](./MIGRATION_PLAN.md) (migration method),
[CANON_AUTHORITY.md](./CANON_AUTHORITY.md) (authority order).

## 1. Purpose

Make the existing MMORTS machinery disappear behind a coherent medieval-strategy
experience. This campaign closes the player journey:

> Enter kingdom → settlement → build → construction completes → upgrade →
> visual state change → Lands production → research → train mixed army →
> Realm → inspect target → scout → intelligence → compose army → commander →
> travel time → launch → follow march → polished report → wilderness benefit →
> dragon clue/Bestiary progress → Dragon Readiness → charter → Marcher Keep →
> differentiated second settlement → next objective.

Every step uses real, server-backed actions. No fake success states.

**Out of scope:** new resource types, troop families, factions, dragon species,
alliance warfare, diplomacy, marketplace, monetization, mobile native,
rendering-engine rewrites, lore canon creation.

## 2. Presentation principles

1. **World first, controls second.** The settlement/world dominates each
   surface. Panels support the world; they do not replace it. On Castle the
   city scene is the first content element on the page.
2. **No implementation language.** Player-visible copy never mentions APIs,
   endpoints, servers, validation, internal IDs, raw codes, or test concepts.
   Internal codes stay in console logs / dev diagnostics.
3. **Every important action has visible state.** See the state machine below.
4. **No decorative fake functionality.** A button implies a real action, or it
   explains why it is unavailable, or it is visibly marked as decorative.
5. **Progression answers three questions at every major point:**
   What changed? · Why does it matter? · What should I do next?

### Action state machine

Every primary action renders one of these states, visually distinct, not
color-only:

| State | Meaning | Presentation |
|---|---|---|
| `available` | affordable + requirements met | enabled, cost + time visible |
| `unaffordable` | requirements met, resources short | disabled, missing costs highlighted |
| `locked` | requirement unmet (research/building/charter) | disabled, requirement named with progress |
| `in-progress` | queued, authoritative job exists | progress bar + countdown |
| `complete` | finished this session | confirmation + state change highlighted |
| `failed` | server rejected | translated reason, preserved internal code in console |
| `capped` | at max level / daily cap / slot cap | disabled, cap named |
| `busy` | dependency occupied (e.g. commander marching) | disabled, who/what occupies it named |

## 3. Terminology inventory

Player-facing language authority. IDs never change (persistence); only labels.

### 3.1 Remove entirely (prototype seams)

| Current | Player-facing | Disposition |
|---|---|---|
| `API: http://localhost:3001` on login | *(removed)* | REMOVE |
| "over-selecting is blocked client-side and server-side (NO_TROOPS)" | "You can only march the troops you have." | REMOVE |
| Raw unit ids as labels (`levy`, `bowman`) | `units.json` display names ("Levy Spearman", "Bowman") | MIGRATE |
| Raw UUID slice as chat author | player display name (server provides) | MIGRATE |
| `({city.kind})` raw enum | "Capital Keep" / settlement display names | MIGRATE |
| Commander `[available]/[wounded]` raw states | "Ready" / "Recovering — returns in …" | MIGRATE |
| Raw march intents `scout → 12,8` | "Scouting party → Forest Hollow" + coords secondary | MIGRATE |
| "empty stack" | "No troops selected" | REMOVE |
| Scribe's Formulas raw tuning dump | collapsed "Scribe's Table" advanced panel | RELOCATE |

### 3.2 Building display names (content `domain_catalog.json` is authority)

| ID (stable) | Old label | Player-facing label |
|---|---|---|
| `habitation` | Habitation | Homes |
| `archive_spire` | Archive Spire | Scriptorium |
| `rally_quay` | Rally Quay | Muster Yard |
| `command_gallery` | Command Gallery | Commanders' Hall |
| `lookout` | Lookout | Watchtower |
| `skyreost` | Skyreost | Dragon Watch |
| `rivetworks` | Rivetworks | Roadworks |
| `gearfoundry` | Gearfoundry | Smithy |
| `saltvault` | Saltvault | Storehouse |
| `seawall` | Seawall | Walls |
| `sovereign_cradle` | Sovereign Cradle | *(not exposed — INTERNAL_COMPAT)* |

### 3.3 Legacy items

| Item | Disposition | Rationale |
|---|---|---|
| Sovereign / Harbinger / harness | **INTERNAL_COMPAT** | Backend + persistence remain; no player-facing surface. Full deletion exists as separate unmerged work (M4); out of this campaign's authority. |
| Saltvault, Brinehold ids | label-level MIGRATE only | ids stable in saves |
| Chronite | **KEEP** (shop credit, neutral label) | monetization freeze is a separate deliverable |
| Defense posture values `harbor/partial/full` | labels "Withdraw / Garrison / Full defense" | id-level rename deferred (schema CHECK) |
| "Tideband" alliance label | "Alliance (Tideband)" transitional | lore decision pending |
| Wilderness `crossroads`/`watch_hill` no-op bonuses | displayed as strategic positions, bonus row "— (strategic position)" | no new bonus system |

## 4. Surface contracts

### Castle
- City scene first: isometric board fills the upper content area; resources
  live in the persistent top HUD on every tab.
- Click empty plot → build selection cards (name, purpose line, cost, time,
  requirement/locked state, tier preview).
- Click occupied plot → building panel: level, tier, current effect, next-level
  effect, upgrade cost/time, max-level handling, construction state.
- Construction renders on the plot (scaffold overlay + countdown); queue panel
  stays authoritative.
- Buildings visibly differentiate at tiers: L1–3 stone, L4–6 reinforced
  (banner/buttress), L7+ lordly (gold trim, height). Level label secondary.
- Building set consistent with frozen medieval direction; legacy labels
  migrated per §3.2. `sovereign_cradle` never offered.
- Founding a second settlement is a charter-driven objective card, not a raw
  button row. Dev unlock buttons move to a dev-only surface.

### Lands
- Estate scene: a grid of plots showing type, level pips, and production
  glyph; empty plots shown as staked foundations.
- Click plot → detail: type, level, current production, next-level production,
  upgrade cost/time, effect on kingdom economy, wilderness relationship.
- Upgrade applies authoritative server rules (cost 50×level food+timber,
  max L5) with full state machine.

### Realm
- Map navigation: drag/touch panning plus click selection; "Center on keep";
  coordinate jump is a secondary advanced control. Quadrant buttons removed
  as primary nav.
- Target panel per object type:
  - **Camp** — type name, level/threat, expected challenge, scout, attack.
  - **Wilderness** — type, level, economic bonus, ownership, scout, occupy.
  - **City** — lord name, settlement kind, protection, valid actions only.
- No raw coordinates as primary interaction; coordinates secondary.

### Army composer (march)
- Composer panel: target summary, commander picker (ready commanders with
  state), troop roster with owned/selected counts, max/clear controls, total
  power (lossy estimate), army size, march time, carry capacity, warnings.
- Launch requires explicit confirmation. All validation is server-authoritative;
  client checks are convenience only.

### War
- Report cards keep existing strength; add march linkage ("view location"
  jumps the Realm map to the target), scout reports visually distinct from
  battle reports, unread state obvious.

### Wilderness value
- Claim list on Castle/Lands: what is held, bonus per claim, where it applies,
  production effect. No new bonus system; surface what `ownedWildernessBonus`
  already applies.

### Knowledge (dragons)
- Dragon Readiness: each requirement as a progress row (current/target, what
  advances it), charter reward named.
- Bestiary entries: discovery state, observation progress to next threshold,
  clues found, encounters, next useful step. Internal math stays behind the
  Scribe's Table (collapsed).
- Dragon presence: original silhouettes/plates, clue cards, atmospheric copy.
  No ownership, no leaked future canon.

### Tutorial → Objectives
- Objective-driven: server verifies each objective against authoritative
  player state; no client-only "Next step" proof. The panel presents current
  objective + progress; completed objectives auto-advance.

### Marcher Keep founding
- Requirements visible (expedition charter), unmet states explained, server
  performs founding, meaningful transition on success, city selector updates,
  Marcher Keep is visually and contextually differentiated.

## 5. Server authority invariants

Presentation changes must not weaken: authoritative costs, troop ownership,
slot validation, queue caps, research requirements, march capacity, commander
requirements, settlement ownership, combat resolution, wilderness ownership,
charter requirements. Client validation is convenience only. The building
upgrade path introduces the smallest deterministic cost/time extension
(per-building cost + level scaling, mirroring the existing plot/research
models) and is documented in the server code.

## 6. Assets

Original SVG/CSS composition only. Manifest-style mapping: building id →
tier → state (normal/construction) → glyph, with graceful fallback to the
generic glyph when unmapped. No copyrighted/ripped assets.

## 7. Responsive & accessibility

Certify 1440×900, 1024×768, 390×844. Tap targets ≥ 40px, no horizontal
overflow (deliberate map pan excluded), semantic buttons with accessible
names, visible focus, labels on all inputs, information never conveyed by
color alone. Game presentation is preserved; generic enterprise semantics
are not forced.

## 8. Acceptance mapping

| Gate | Proof |
|---|---|
| G0 | isolated worktree `feat/tideforge-closed-mockup-v1` from `origin/main` |
| G1 | combat + server suites, typechecks, web build green; skips disclosed |
| G2 | §3.1 seams gone from default flow |
| G3–G5 | §4 Castle/Lands/Realm contracts + Playwright journey |
| G6–G7 | composer + scout→report loop in journey |
| G8 | claims/bonus surfacing |
| G9 | readiness/bestiary presentation |
| G10 | objectives server-verified |
| G11 | charter-driven founding + switch |
| G12–G14 | screenshot pass at three widths, V0/V1 closed |
| G15 | adversarial source + screenshot review |
| G16 | README/status boards synchronized |

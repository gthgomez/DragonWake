# DRAGONWAKE NORTH STAR V2 — Castle Visual Convergence

Status: **CURRENT AUTHORITY for the Castle presentation** as of
2026-09-19. This contract *interprets and tightens*
[`ALPHA_VISUAL_CONTRACT_V1.md`](ALPHA_VISUAL_CONTRACT_V1.md) for the
settlement view. It does not reopen
[`DIRECTION_FREEZE_V1_1.md`](DIRECTION_FREEZE_V1_1.md), alter canon, change
content IDs, or touch the authoritative city simulation.

The single source of truth for this contract is the **rendered default
player experience** — not tests, not an asset folder, not a preview
harness, not a feature flag.

## 1. The problem this contract solves

The Castle previously read as a **rotated board of square plots with
building pictures on them**. The renderer — not the art — was the primary
cause: `CityGrid` mapped each logical slot to a cell in a
`rotateX(55) rotateZ(45)` CSS grid and independently composited a sprite
onto that cell. Even good sprites read as isolated cards.

Logical plots remain discrete. **Visually exposed square plots do not
need to remain discrete.**

## 2. Frozen presentation rules

### Camera

- Three-quarter medieval strategy view.
- Approximately 30° elevation, approximately 45° horizontal world
  orientation.
- One common projection for every settlement asset; no visibly conflicting
  building perspectives.

### World

- One continuous settlement ground plane.
- Structures are connected by roads, foundations, walls, plazas, paths,
  terrain and props.
- No checkerboard/grid as the dominant visual structure.
- Hidden interaction regions are allowed only where they clearly
  correspond to a visible world structure.

### Landmark hierarchy

1. Capital Keep / Forge-Heart
2. Dragon Watch / roost
3. Walls, gates, major military and civic structures
4. Secondary buildings
5. Environmental filler

A new viewer must identify the Keep and the Dragon Watch before reading
labels.

### Light

- Common warm upper-left key.
- Cool/soft lower-right contact shadow.
- One atmosphere.
- No asset with contradictory baked lighting.

### Materials

Weathered stone, dark timber, iron, cloth, parchment, mud/earth, muted
vegetation, ochre/firelight highlights, restrained faction accent.

Rejected: neon fantasy, candy saturation, mobile-city-builder plastic
gloss, Warcraft proportions, anime silhouettes, sterile dashboard
presentation, isolated asset-card composition, generic SaaS panels
dominating the world.

### Dragon

- The dragon is a rare physical inhabitant and strategic presence.
- It is anchored to an actual roost or landscape.
- It is not card artwork pasted beside the settlement.

## 3. Scene architecture (implementation rule)

The Castle presentation is split so composition is inspectable and
authored in one place:

```text
CityGrid                      (state, selection, build/upgrade logic)
  -> CastleScene              (world compositor)
       -> SceneTerrain        (authored ground plane, roads, walls, props)
       -> sceneAnchorForSlot  (castleSceneLayout.ts — the only place a
                               logical slot gets a world position)
  -> building detail surface  (screen-aligned, subordinate to the world)
```

- `castleSceneLayout.ts` owns every slot's world anchor, depth key, scale
  and terrain elevation. No ad-hoc offsets live in JSX.
- `castleSceneAssets.ts` owns runtime art metadata: derivative path, tier,
  normalized ground anchor, footprint, scene scale.
- Scene layers, conceptually: distant environment → terrain → walls/roads
  → buildings → props → dragon/living elements → state overlays →
  screen-aligned UI.

## 4. Assets

- World scale and ground anchors are normalized, not silhouettes.
- Tier progression must change **architecture**, not merely image scale:
  stone (modest), reinforced (added mass), lordly (height, detail,
  controlled gold). Width multipliers alone are explicitly rejected.
- Runtime derivatives live under `apps/web/public/art/alpha/castle/` with
  a provenance record (`atlas.json`). Masters are preserved under
  `art/alpha/imagine-explorations/`. Asset governance status is recorded
  in the campaign audit; candidate art is never silently relabeled.

## 5. Interaction integrity

Every occupied structure remains directly inspectable; every empty
logical plot remains discoverable and buildable. Click/tap selects the
real building; build goes to the authoritative queue; construction and
upgrade visibly change the world object; locked/unaffordable/capped
states stay understandable; keyboard focus stays visible; accessible
names stay meaningful. Screen-aligned overlays (level, selection,
progress, locked) remain visually subordinate to the settlement.

## 6. Responsive rule

The world stays the interaction surface. Desktop 1440×900 is the
certification viewport; 390×844 is mandatory. On narrow screens the scene
may pan rather than shrink until touch targets fall below the repository
accessibility contract. The mobile Castle is not replaced with generic
cards.

## 7. Terminal condition

A fresh 1440×900 screenshot of the **default running game** must read as a
living fortified medieval kingdom shaped by dragons before the viewer
reads any UI text. Building progression visibly changes architecture; the
dragon inhabits the world when present; the scene remains fully
interactive through the existing authoritative city mechanics. If the
screenshot still primarily reads as a grid with prettier sprites, this
contract is not met.

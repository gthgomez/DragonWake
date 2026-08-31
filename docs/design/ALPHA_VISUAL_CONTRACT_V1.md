# ALPHA_VISUAL_CONTRACT_V1 — The Living Kingdom

Status: active for the Alpha R1 campaign. This contract supersedes the
`CLOSED_MOCKUP_V1` SVG/CSS-only restriction for future original art while
preserving the frozen Dragon Wake direction in `DIRECTION_FREEZE_V1.md`.

## Visual promise

Dragon Wake is a grounded late-medieval browser strategy game: weathered stone,
timber, iron, cloth, parchment, mud, fields, forests, and practical
fortifications. Dragons are biologically extraordinary animals observed at a
distance, not colorful elemental mascots. The first session should feel like a
kingdom becoming alert to a dangerous living ecology.

Reject generic mobile-city-builder gloss, neon high fantasy, Warcraft-like or
anime proportions, photorealism that fights gameplay readability, copied
Dragons of Atlantis/Reign compositions, and illegible AI detail.

## Frozen rendering rules

- Camera: readable three-quarter isometric view, approximately 30° elevation
  and 45° horizontal rotation; every building has a stable footprint and a
  screen-aligned interaction target.
- Scale: one city plot is the canonical footprint; buildings occupy 72–94% of
  that footprint with a visible base, shadow, and one dominant silhouette.
  Realm tiles remain square and map coordinates stay legible at 390px wide.
- Lighting: warm light from the upper-left; cool, soft contact shadows cast
  lower-right. No per-asset lighting direction changes.
- Outlines: no cartoon black outline. Use restrained dark occlusion edges and
  a single warm rim only for selection, readiness, and active marches.
- Palette: earth, charcoal, iron blue, muted moss, ochre, parchment, and one
  restrained faction accent. Saturation is reserved for danger, ownership,
  and actionable state.
- Terrain: plains, forest, rock/hills, mountain, water/coast, farmland, and
  wilderness must differ by silhouette and texture, not color alone.
- UI: modern hierarchy over a medieval world; parchment and stone ornament
  frame actions without turning the game into detached SaaS cards.
- State language: empty, available, locked, building, complete, selected,
  upgradeable, and maxed are communicated by silhouette, ornament, label, and
  accessible state—not color alone.
- Responsive rules: preserve the world as the interaction surface. At desktop
  the settlement dominates the Castle view; at tablet the detail rail stacks;
  at mobile the map remains touch-pannable and controls stay above 44px.

## Asset governance

Original raster/vector assets may be used in `apps/web/public/art/alpha/`.
Source masters and optimized runtime derivatives are separate. Generated
assets may enter canonical paths only through AGES quarantine, evaluation,
promotion, and rollback. Every promoted generated asset must retain its AGES
provenance record with asset ID, prompts, art-context hash, provider/model,
generation parameters, candidate/canonical hashes, evaluation, decision, and
timestamp.

The current local AGES installation is documented in
`delivery/ALPHA_R1_ASSET_LEDGER.md`. No provider fallback is permitted.

# Map-node candidates — 2026-10-03

Isolated wilderness nodes for DragonWake, original to this pass. Not Dragons of Atlantis marble, temples, or elemental dragons, and not copies of the castle poster or the settlement UI screenshot. Both references were passed to every `image_edit` so the nodes keep the weathered stone, dark timber, iron, mud, muted moss, and ochre firelight, in a three-quarter isometric around 30° with warm light from the upper left.

Nothing here was written under `apps/web/public` and nothing was committed.

## Key

Pillow and numpy only (no rembg).

- Sample the plate from the four corners.
- For the five near-magenta plates, alpha comes from magenta excess `min(R,B) - G`. Subject interiors sat below about 8. Plate and the long cast shadow sat about 70–230. Soft band roughly 16–42, then a 1 px blur, then pixels still above the band forced transparent.
- `ore-outcrop` never landed on pure magenta. First plate and the retry are rose, about `(165, 53, 107)`. A distance-to-`#FF00FF` key removes nothing. It was keyed to the sampled corner (chroma ratio 0.30–0.46, plus a rose-excess gate above ~32). Charcoal was protected by keeping low-luminance pixels far from the plate. The rock was not eaten.
- `grain-plot` plate is dark magenta, about `(198, 23, 196)`, and used the same excess band as the purer plates.
- Feather pixels that still had both R and B above G were despilled (shared excess removed). After that, edge magenta-excess p90 is 0 on every PNG. Corners and the canvas border are alpha 0.
- Specks under 0.05% of the frame, and disconnected blobs farther than ~3% of the width from the main mass, were dropped.
- Each subject bounding box is centered on a 1024×1024 canvas. The long shadow on the plate was removed. Contact shading inside the mud footprint remains.

Purple-gray stone did not need a looser tolerance. Quarry and watch stone stayed opaque.

## Retries

- `ore-outcrop`: first tool read as a blade, and the plate was rose. One retry produced a readable pickaxe. The plate stayed rose (noted above). No second retry.
- `grain-plot`: first pass was standing grain rows. One retry replaced them with tied shocks. No city, UI, or text on either pass, so the mandated “delete everything else” retry was not required for the other four.

## Files

- `raw/<name>.jpg` — generator output, plate still in frame
- `png/<name>.png` — RGBA, 1024×1024, centered
- `manifest.json` — per-asset prompt summary and defects

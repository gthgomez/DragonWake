# Dragon candidates, 2026-10-03

Original DragonWake studies. Chained with image edits from `docs/design/reference-art/DragonWake-AlphaDesign.png`, then from the adult perch, not from a fresh generation. The north-star frame `apps/web/e2e/artifacts/north-star-v2/after_dragon_scene_desktop.png` was the camera reference for the roost token only. Canonical art under `public/art` and `imagine-explorations` was not modified.

Canon check against `SPECIES.md`: four-legged, gold-family torn membranes, amber eyes, late-medieval paint. Not a fire/ice/water roster and not a neon breath. The only Dragons-of-Atlantis echo is bulk: an animal you would station on a roost and march. No elemental recolor.

Keyed in Pillow and numpy from the painted magenta field (about rgb 140–161, 43–48, 88–108, not literal `#FF00FF`). Border-connected background and enclosed magenta pockets were removed, speck holes under 160 px were filled, the largest component was kept, the fringe was unmixed, and a dark rose edge within 12 px of transparency was cleared. Canvases are square powers of two. Corners are transparent.

## Identity

The adult matches the reference animal in hide (olive scales, antique-gold belly and membranes), amber eyes, swept horns, and ragged wing membranes. It does not match the reference pose. AlphaDesign’s wyrm is a long-necked profile crouched on a tower. These studies sit more frontal and stockier, with both wings spread, on a small stone pad. Membranes read more uniformly gold than the reference’s greener gold.

## Defects

- `adult-perch`: moss and a grass fringe plus a soft contact shadow are baked around the pad. A few rose pixels remain under the belly. Empty transparent margin is large because the winged crop does not fit a 1024 square, so the canvas is 2048.
- `adult-wounded`: same pose and face as the perch. Near foreleg is linen-wrapped, with a loose cloth end. Extra tears are in the far wing. No blood. Grass fringe remains. One rose pixel remains under the body.
- `hatchling`: the first edit stayed adult. The second went mascot (oversized glossy eyes, ear flaps, a smile). The shipped frame is a third edit of that calf: longer reptile snout, closed mouth, shorter horns, same hide. It still has ear flaps, large eyes, and adult-wide wings rather than stubby calf wings, so it drifts toward a cute mascot. A rose contact fringe remains under the chest and along the right flank and tail. Grass fringe remains.
- `scene-token`: high three-quarter camera and a round cobble roost, no city and no UI. One wing is folded along the back and the other stays raised, so the silhouette is taller and less compact than the north-star roost dragon. It reads as a settlement token, not a tiny map pawn. A small magenta nick on the raised wing was keyed out. A faint rose speck can remain on the front lip of the pad.

No file here is approved canon.

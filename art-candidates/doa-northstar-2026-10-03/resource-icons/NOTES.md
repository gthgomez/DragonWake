# DragonWake resource icons

Candidate HUD/inventory icons for food, wood, stone, ore, and crownmark. Original objects in the north-star material range (ochre cloth, timber, limestone, dark iron, wax). Not Dragons of Atlantis icon shapes, Greek ornament, or UI chrome. No lettering on the sheet.

## Files

- `food.png`, `wood.png`, `stone.png`, `ore.png`, `crownmark.png` — RGBA, one shared 512×512 canvas, native sheet scale, centered, transparent corners.
- `preview-64/` — Pillow `thumbnail` contain, centered on 64×64 transparent.
- `manifest.json` — source sheet, key thresholds, bboxes, hashes.

## 32px legibility

The five silhouettes stay distinct at 32px: tied sack, horizontal log bundle, upright block, dark lump, small scalloped disc. That is enough to tell the five resources apart on a dark or parchment HUD.

Detail that does not survive 32px: wheat ears on the sack, the strap on the timber, the chisel hatching on the stone, and the dragon-head stamp on the seal. The stamp is clear on the full icon and only a smudge at 32px, so crownmark reads as a seal/coin until it is shown larger (the 64px preview keeps a hint of the emblem).

## Defects

- Visual weight is not equal. Content spans about 279×174 (wood) down to 146×149 (crownmark) on the same 512 canvas, so the seal sits smaller in the cell.
- Crownmark is a warm wax disc. It does not read as wax pressed on lead; there is no lead-gray metal.
- Wood is a strapped bundle of round billets with split ends, not a clearly cleft plank stack.
- Light is soft and slightly from above, not a hard upper-left sun. The renders are cleaner and more studio-like than the painted settlement.
- No text, no touching neighbors, no sheet-edge clipping, and no leftover magenta rim after the key.

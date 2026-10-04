# Troop tokens — levy, porter, scout, bowman

Candidates only. Not promoted, not copied into `apps/web/public`.

Sheet: `sheets/lineup.jpg` (1280×720). One edit from the north-star scene and AlphaDesign palette references. The first pass stood the four men almost front-on with floor ovals; this sheet turns them screen-right and leaves the field magenta. Key sampled from the corner is about rgb(219, 15, 238), not pure 255,0,255, because the sheet is JPEG.

Tokens: `png/levy.png`, `png/porter.png`, `png/scout.png`, `png/bowman.png`. Each is RGBA 1024×1024. Solid soles sit on y=991; the 1px fringe sits on y=992. Corners and canvas edges are alpha 0 with RGB cleared. Order on the sheet, left to right, is levy, porter, scout, bowman.

## Checks

| Check | Result |
|---|---|
| Count is four | Pass. Four bodies. Specks under 30 px dropped. One 693 px bow-limb fragment overlapped the bowman and was merged back. |
| Facing screen-right | Pass. Noses, chests, and lead feet point to the right. Porter and scout are nearer profile than a deep three-quarter. |
| Adult humans | Pass. Four adult soldiers. No minors. |
| No cartoon black outline | Pass. Occlusion is material shading, not an ink contour. |
| No text | Pass. Small dragon badges on the tunics are marks, not letters. |
| No copied Atlantis costume | Pass. Wool, leather, dull iron kettle helm, round shield, pack, hood, staff, longbow. No minotaur, elemental beast, or Atlantis plate. |

## Defects

- The render is photographic studio kit, not the simplified painted company-token read of the north-star settlement. At map size the faces and toggles will soften.
- Shared square power-of-two jumped from 512 to 1024, so most of each canvas is empty headroom above figures about 540 px tall.
- Light is soft and mostly frontal. It is not a strong warm upper-left key.
- The bowman's upper bow limb was split by the magenta-spill reject and reattached by the fragment merge. On the gray composite it reads as one bow.
- Contact shadows were removed on purpose so the alpha stays clean. A faint sole fringe remains.

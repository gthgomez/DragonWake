# Troops tier 2 — candidate notes

Original company tokens for pikeman, man-at-arms, longbowman, and light cavalry.
Not Dragons of Atlantis armor, minotaurs, or elemental beasts. Not promoted
into `apps/web/public`. Not committed.

Sheet was one 16:9 image_edit from the north-star capture and the alpha
design painting, then keyed off flat magenta (sampled rgb 156, 52, 101) with
Pillow and numpy. Four components, left to right, on a shared 1024×1024 RGBA
canvas, native scale, feet on one baseline. Corners are transparent.

## Defects

- Infantry are mostly frontal, not a clear three-quarter march toward
  screen-right. The horse faces screen-right; the rider stays nearly frontal.
- Read is studio semi-realism. Silhouettes are clean, but the detail is denser
  than a small map token and will mush at march size.
- Faint warm-pink spill remains on some edges after unmix and despill. No
  fully saturated magenta pixels.
- Longbowman and light cavalry source boxes were about 35px apart. They did
  not touch. No retry: the sheet had no castle, UI, text, or ground line.
- Four similar bearded adult faces.
- Muted green sits mainly on the pikeman’s gambeson. The others are brown wool
  and dull iron.
- The pike is long, but not a formation pike of several body-lengths.
- The man-at-arms has a drawn one-hand sword and a second sheathed sidearm.

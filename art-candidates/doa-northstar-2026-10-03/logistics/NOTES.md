# Logistics and siege tokens

Candidate only. Not promoted, not in `apps/web/public`, not committed.

Original DragonWake march tokens. Genre echo of supply wagons, bolt-throwers, and heavier companies. No Atlantis marble, minotaurs, or elemental creatures. Materials follow the north-star settlement and the alpha kingdom plate: weathered timber, iron, wool, muted steel, moss cloth. Warm upper-left light. No cartoon black outline.

## Generation

Both references were passed to one `image_edit` (16:9). The first lineup was discarded: the wagon, bolt-thrower, and knight were about two pixels apart, the wagon had four wheels and a walking leader, and the bolt-thrower was carried like a large crossbow.

The second lineup is `lineup.jpg`. Four adults, screen-right three-quarter views, on a flat field. Measured key is RGB 178, 44, 124 (rose magenta), not pure #FF00FF. No castle, UI, text, or ground line. The wagon tongue is drawn into the ballista bed, so those two subjects touch.

## Segmentation

Pillow and numpy only. Foreground is color-distance greater than 80 from the corner key. A square erosion of radius 6 made four body seeds (wagon, ballista, knight, sapper). A watershed on the hard mask split the tongue. Detached pennon and mallet pixels were given back to the nearest seed. Edge colors were bled inward from the opaque interior, and remaining key-colored specks plus a pink puddle under the ballista bed were cleared.

Each token is RGBA, 512×512, centered, with transparent corners and a zero-alpha border. Centering is used instead of a shared foot line because the set mixes a cart, an engine, a horse, and a man on foot.

## Defects

- Sapper carries a wooden maul, not a pick. Timber shield and rope coil are present.
- Supply wagon shows two large wheels and a seated driver, but a third wheel is partly visible under the tongue, so it is not a strict one-axle cart. A few magenta pixels remain by the axle. The tongue is long because it was cut where it met the ballista.
- Ballista is a timber-and-iron engine with one adult at the windlass. A small pink contact tint may remain under the bed after the puddle was cleared.
- Knight is muted steel on a cloth-barded horse with a moss-green swallowtail pennon. The pennon is broader than a small ribbon. The caparison hem keeps a thin warm magenta rim.
- Rope-coil gaps on the sapper still hold a little key color.
- Finish is illustrated and realistic, closer to the alpha painting than to the simplified settlement capture.
- Sheet background is flat and keyable but not pure magenta.

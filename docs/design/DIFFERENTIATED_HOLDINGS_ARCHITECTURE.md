# Differentiated holdings architecture

Holdings remain rows in the existing `cities` model and are identified by the
stable `kind` values in `citadels.json`. Each content definition supplies its
own prerequisite chain, starter roster, exclusive units, and craft material.
The generic server founding path enforces ownership uniqueness, prerequisites,
unlock research, open-map placement, and initializes the settlement from
content. The Castle settlement picker and settlement banner make the strategic
identity visible after switching.

Marcher Keep is the first frontier expansion in the Alpha R1/R2 journey.
Forest Citadel and the dragon-focused Galeari route are the next differentiated
holdings; their exclusive ranger, warhound, dragon-slayer, and ballista rosters
are already content-validated and covered by server tests. Further player
unlock UX is intentionally a follow-on slice rather than an admin grant being
misrepresented as ordinary campaign progress.

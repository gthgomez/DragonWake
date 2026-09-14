/** Alpha test dragon stills from AlphaDesign.png (Imagine edit-chain).
 *
 *  Stills only — the animated Vale Drake runtime sprite lives in
 *  `useDragonSprite` / `AnimatedSprite`. Wild-ecology studies map to
 *  existing Bestiary entry ids only; no new content ids are invented.
 *  The certified Vale Drake production art is left untouched.
 */

export const ALPHA_DRAGON_BASE = "/art/alpha/imagine-explorations/dragons";
export const ALPHA_PLATE_BASE = "/art/alpha/imagine-explorations/plates";

/** Bestiary entry id -> wild-ecology study stem. Canon ids only. */
export const SPECIES_STUDY_STEM: Record<string, string> = {
  ridgeback_wyvern: "ridgeback-wyvern",
  ironback_wyrm: "ironback-wyrm",
  ash_drake: "ash-drake",
};

/** Roost signature study stem, keyed by physical state. */
export const ROOST_STUDY_STEM: Record<string, string> = {
  healthy: "wyrm-roost-perch",
  wounded: "wyrm-roost-wounded",
};

export const ALPHA_HATCHLING_ART = `${ALPHA_DRAGON_BASE}/wakeclutch-hatchling.png`;
export const ALPHA_ROOST_PRESENCE_PLATE = `${ALPHA_PLATE_BASE}/roost-presence.png`;

/** Wild-ecology study for a recorded Bestiary entry, if one exists. */
export function speciesArtSrc(entryId: string): string | undefined {
  const stem = SPECIES_STUDY_STEM[entryId];
  return stem ? `${ALPHA_DRAGON_BASE}/${stem}.png` : undefined;
}

/** Roost signature study for a physical state (`healthy` is the default). */
export function roostArtSrc(physicalState = "healthy"): string {
  const stem = ROOST_STUDY_STEM[physicalState] ?? ROOST_STUDY_STEM.healthy;
  return `${ALPHA_DRAGON_BASE}/${stem}.png`;
}

/** Study still matching the living signature dragon's stage and state. */
export function signatureStudySrc(
  lifeStage?: string,
  physicalState?: string,
): string {
  if (lifeStage === "hatchling") return ALPHA_HATCHLING_ART;
  return roostArtSrc(physicalState);
}

/** One entry in the dev-only still gallery. */
export type AlphaStill = {
  id: string;
  label: string;
  src: string;
};

/** Dragon studies and plates surfaced by the isolated preview harness. */
export const ALPHA_DRAGON_STILLS: AlphaStill[] = [
  {
    id: "wakeclutch-hatchling",
    label: "Wake-clutch hatchling",
    src: ALPHA_HATCHLING_ART,
  },
  {
    id: "roost-presence",
    label: "Roost presence plate (16:9)",
    src: ALPHA_ROOST_PRESENCE_PLATE,
  },
  ...Object.entries(ROOST_STUDY_STEM).map(([state, stem]) => ({
    id: `roost-${state}`,
    label: `Roost wyrm study (${state})`,
    src: `${ALPHA_DRAGON_BASE}/${stem}.png`,
  })),
  ...Object.entries(SPECIES_STUDY_STEM).map(([entryId, stem]) => ({
    id: entryId,
    label: `${entryId.replace(/_/g, " ")} study`,
    src: `${ALPHA_DRAGON_BASE}/${stem}.png`,
  })),
];

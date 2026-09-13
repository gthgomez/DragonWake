/** Alpha test raster buildings from AlphaDesign.png (Imagine edit-chain).
 *  Visual growth uses CLOSED_MOCKUP_V1 tiers: L1–3 stone, L4–6 bronze,
 *  L7+ gold. CityGrid falls back to SVG glyphs if a file is missing.
 */

export type ArtTier = "stone" | "bronze" | "gold";

const BASE = "/art/alpha/imagine-explorations/buildings";

/** Stem under BASE, without tier suffix. Stone = `{stem}.png`. */
const BUILDING_STEM: Record<string, string> = {
  forge_heart: "bld-keep",
  habitation: "bld-homes",
  barracks: "bld-barracks",
  archive_spire: "bld-scriptorium",
  rally_quay: "bld-muster-yard",
  command_gallery: "bld-commanders-hall",
  lookout: "bld-watchtower",
  skyreost: "bld-dragon-watch",
  saltvault: "bld-storehouse",
  seawall: "bld-walls",
  training_camp: "bld-training-camp",
  gearfoundry: "bld-forge",
};

/** Tiers that exist on disk for each stem. Stone is always the base file. */
export const BUILDING_TIERS: Record<string, ArtTier[]> = {
  "bld-keep": ["stone", "bronze", "gold"],
  "bld-homes": ["stone", "bronze", "gold"],
  "bld-barracks": ["stone", "bronze", "gold"],
  "bld-watchtower": ["stone", "bronze", "gold"],
  "bld-dragon-watch": ["stone", "bronze", "gold"],
  "bld-forge": ["stone", "bronze", "gold"],
  "bld-scriptorium": ["stone", "bronze", "gold"],
  "bld-storehouse": ["stone", "bronze", "gold"],
  "bld-commanders-hall": ["stone", "bronze", "gold"],
  "bld-muster-yard": ["stone", "bronze", "gold"],
  "bld-training-camp": ["stone", "bronze", "gold"],
  "bld-walls": ["stone", "bronze", "gold"],
};

export const ALPHA_BUILDING_ART: Record<string, string> = Object.fromEntries(
  Object.entries(BUILDING_STEM).map(([id, stem]) => [id, fileFor(stem, "stone")]),
);

export function artTierOf(level: number): ArtTier {
  if (level >= 7) return "gold";
  if (level >= 4) return "bronze";
  return "stone";
}

function fileFor(stem: string, tier: ArtTier): string {
  if (tier === "stone") return `${BASE}/${stem}.png`;
  return `${BASE}/${stem}-${tier}.png`;
}

export function alphaBuildingSrc(type: string, level = 1): string | undefined {
  const stem = BUILDING_STEM[type];
  if (!stem) return undefined;
  const available = BUILDING_TIERS[stem] ?? ["stone"];
  let tier = artTierOf(level);
  if (!available.includes(tier)) {
    if (tier === "gold" && available.includes("bronze")) tier = "bronze";
    else tier = "stone";
  }
  return fileFor(stem, tier);
}

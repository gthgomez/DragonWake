/**
 * Castle scene art metadata — North Star V2.
 *
 * The Castle no longer maps a building id straight to a file. Each structure
 * exposes explicit runtime art metadata so the settlement scene can place it
 * on a shared ground plane: normalized ground anchor, footprint, scene scale
 * and tier derivation.
 *
 * Sources are candidate-derived runtime derivatives under
 * `/art/alpha/castle/buildings/` (see `atlas.json` for master provenance).
 * They are NOT formally promoted production assets: the repository's
 * governance rule (`ALPHA_VISUAL_CONTRACT_V1.md`) requires AGES promotion,
 * and the local AGES provider is `BLOCKED_EXTERNAL`. They are used as the
 * interim default under documented owner campaign authority; promotion and
 * rollback verification remain an external prerequisite.
 *
 * The quarantined imagine-explorations candidates remain accessible through
 * `alphaBuildings.ts` for before/after evidence.
 */
import atlas from "./castleSceneAtlas.json";

export type ArtTier = "stone" | "bronze" | "gold";

type AtlasEntry = { src: string; w: number; h: number; anchor: [number, number] };

const RAW = atlas as unknown as {
  assets: Record<string, { src: string; w: number; h: number; anchor: number[] }>;
};
const ATLAS: Record<string, AtlasEntry> = Object.fromEntries(
  Object.entries(RAW.assets).map(([k, v]) => [
    k,
    { src: v.src, w: v.w, h: v.h, anchor: [v.anchor[0] ?? 0.5, v.anchor[1] ?? 1] },
  ]),
);

/** Logical building id -> derivative stem. */
export const CASTLE_BUILDING_STEM: Record<string, string> = {
  forge_heart: "bld-keep",
  habitation: "bld-homes",
  barracks: "bld-barracks",
  archive_spire: "bld-scriptorium",
  rally_quay: "bld-muster-yard",
  command_gallery: "bld-commanders-hall",
  lookout: "bld-watchtower",
  skyreost: "bld-dragon-watch",
  saltvault: "bld-storehouse",
  training_camp: "bld-training-camp",
  seawall: "bld-walls",
  gearfoundry: "bld-forge",
};

/** Requested width of the sprite box as a % of the scene width, by stem. */
const BASE_WIDTH: Record<string, number> = {
  "bld-keep": 25,
  "bld-homes": 20,
  "bld-barracks": 18,
  "bld-scriptorium": 17,
  "bld-muster-yard": 19,
  "bld-commanders-hall": 18,
  "bld-watchtower": 12,
  "bld-dragon-watch": 17,
  "bld-storehouse": 18,
  "bld-training-camp": 19,
  "bld-walls": 40,
  "bld-forge": 18,
};

export type SceneArt = {
  src: string;
  tier: ArtTier;
  /** Ground contact point in image space (0..1). */
  anchor: [number, number];
  /** Sprite box width as a % of the scene width. */
  widthPct: number;
  /** width / height of the source image. */
  aspect: number;
  /** Multiplier applied by the caller for per-anchor composition. */
  scale: number;
};

export function artTierOf(level: number): ArtTier {
  if (level >= 7) return "gold";
  if (level >= 4) return "bronze";
  return "stone";
}

function fileFor(stem: string, tier: ArtTier): AtlasEntry | undefined {
  const name = tier === "stone" ? `${stem}.png` : `${stem}-${tier}.png`;
  return ATLAS[name];
}

/**
 * Resolve a building type + level to scene art metadata. Falls back safely:
 * a missing tier degrades to a lower tier, then to no art (glyph fallback).
 */
export function castleBuildingArt(
  type: string,
  level = 1,
  scale = 1,
): SceneArt | undefined {
  const stem = CASTLE_BUILDING_STEM[type];
  if (!stem) return undefined;
  let tier = artTierOf(level);
  let entry = fileFor(stem, tier);
  if (!entry && tier === "gold") {
    tier = "bronze";
    entry = fileFor(stem, "bronze");
  }
  if (!entry) {
    tier = "stone";
    entry = fileFor(stem, "stone");
  }
  if (!entry) return undefined;
  return {
    src: entry.src,
    tier,
    anchor: entry.anchor,
    widthPct: BASE_WIDTH[stem] ?? 24,
    aspect: entry.w / entry.h,
    scale,
  };
}

/** Tier available for a stem/level — used by tests and the detail rail. */
export function castleArtAvailable(type: string, level = 1): boolean {
  return castleBuildingArt(type, level) !== undefined;
}

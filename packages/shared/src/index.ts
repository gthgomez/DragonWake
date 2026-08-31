/** Shared DTOs and constants for Dragon Wake MVP. */

export const API_VERSION = "v1" as const;

export const FACTIONS = [
  "northern_kingdom",
  "mountain_realm",
  "forest_people",
  "coastal_lords",
] as const;

export type Faction = (typeof FACTIONS)[number];

export type HealthResponse = {
  ok: true;
  service: "dragonwake-server";
  version: string;
  time: string;
  db?: string;
};

export type ResourceBag = {
  food: number;
  timber: number;
  stone: number;
  iron: number;
  coin: number;
};

/** Canonical resource order (M2 medieval set). */
export const RESOURCES = ["food", "timber", "stone", "iron", "coin"] as const;

export type ResourceId = (typeof RESOURCES)[number];

/** Legacy aquatic resource ids → medieval successors (M2 transition window). */
export const LEGACY_RESOURCE_ALIASES = {
  kelp: "food",
  driftwood: "timber",
  basalt: "stone",
  slagiron: "iron",
  tidegilt: "coin",
} as const satisfies Record<string, ResourceId>;

export type DefensePosture = "withdraw" | "garrison" | "full";

export type MarchIntent =
  | "scout"
  | "attack"
  | "occupy"
  | "reinforce"
  | "haul";

/** Capital + MVP Brinehold + S1 ladder citadels (see PRODUCT_FREEZE_S1). */
export type CityKind =
  | "capital"
  | "marcher_keep"
  | "brinehold"
  | "stonekeel"
  | "cinderreach"
  | "galeari"
  | "mnemolith"
  | "citadel_other";

export const S1_CITADEL_ORDER = [
  "marcher_keep",
  "brinehold",
  "stonekeel",
  "cinderreach",
  "galeari",
  "mnemolith",
] as const;

export type S1CitadelKind = (typeof S1_CITADEL_ORDER)[number];

export type PlayerPublic = {
  id: string;
  displayName: string;
  faction: Faction;
  chronite: number;
  playerLevel: number;
  protectionUntil: string | null;
};

export type CityPublic = {
  id: string;
  playerId: string;
  kind: CityKind;
  name: string;
  mapX: number;
  mapY: number;
  resources: ResourceBag;
  defensePosture: DefensePosture;
  buildings: { slotIndex: number; buildingType: string; level: number }[];
  plots: { slotIndex: number; plotType: string | null; level: number }[];
  stacks: Record<string, number>;
  research: Record<string, number>;
};

export const SALTVAULT_PROTECT_RATIO = 0.5; // 50% of non-coin protected at L1 baseline
export const NEW_PLAYER_PROTECTION_MS = 72 * 60 * 60 * 1000;
export const MAP_W = 40;
export const MAP_H = 40;
export const DEV_FAST_MULTIPLIER = 60;

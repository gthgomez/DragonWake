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
  wood: number;
  stone: number;
  ore: number;
  crownmark: number;
};

/** Canonical resource order for the final Dragon Wake domain. */
export const RESOURCES = ["food", "wood", "stone", "ore", "crownmark"] as const;

export type ResourceId = (typeof RESOURCES)[number];

/** All historical resource ids → final canonical ids. */
export const LEGACY_RESOURCE_ALIASES = {
  kelp: "food",
  driftwood: "wood",
  timber: "wood",
  basalt: "stone",
  slagiron: "ore",
  iron: "ore",
  tidegilt: "crownmark",
  coin: "crownmark",
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

export type WildernessBenefitPublic = {
  kind: "production" | "logistics" | "scouting" | "dragon_evidence";
  label: string;
  description: string;
  amount: number;
};

export const SALTVAULT_PROTECT_RATIO = 0.5; // 50% of non-currency resources protected at L1 baseline
export const NEW_PLAYER_PROTECTION_MS = 72 * 60 * 60 * 1000;
export const MAP_W = 40;
export const MAP_H = 40;
export const DEV_FAST_MULTIPLIER = 60;

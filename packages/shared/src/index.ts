/** Shared DTOs and constants for Tideforge Empires MVP. */

export const API_VERSION = "v1" as const;

export const FACTIONS = [
  "brinecant",
  "ashcoil",
  "skyshear",
  "mossvault",
] as const;

export type Faction = (typeof FACTIONS)[number];

export type HealthResponse = {
  ok: true;
  service: "tideforge-server";
  version: string;
  time: string;
  db?: string;
};

export type ResourceBag = {
  kelp: number;
  driftwood: number;
  basalt: number;
  slagiron: number;
  tidegilt: number;
};

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
  | "brinehold"
  | "stonekeel"
  | "cinderreach"
  | "galeari"
  | "mnemolith"
  | "citadel_other";

export const S1_CITADEL_ORDER = [
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

export const SALTVAULT_PROTECT_RATIO = 0.5; // 50% of non-tidegilt protected at L1 baseline
export const NEW_PLAYER_PROTECTION_MS = 72 * 60 * 60 * 1000;
export const MAP_W = 40;
export const MAP_H = 40;
export const DEV_FAST_MULTIPLIER = 60;

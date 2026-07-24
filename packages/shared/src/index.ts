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
};

export type ResourceBag = {
  kelp: number;
  driftwood: number;
  basalt: number;
  slagiron: number;
  tidegilt: number;
};

export type DefensePosture = "harbor" | "partial" | "full";

export type MarchIntent =
  | "scout"
  | "attack"
  | "occupy"
  | "reinforce"
  | "haul";

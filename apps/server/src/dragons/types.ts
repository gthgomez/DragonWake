/** Living dragon domain — separate from DragonPresence awareness. */

export const SIGNATURE_ARCHETYPE = "vale_drake";
export const FEN_WYRM_ARCHETYPE = "fen_wyrm";

export type DragonKind = "signature" | "domain";
export type LifeStage =
  | "hatchling"
  | "wyrmling"
  | "juvenile"
  | "broadwing"
  | "mature"
  | "veteran";
export type LocationKind =
  | "roost"
  | "approaches"
  | "home_waters"
  | "ford"
  | "recovering";
export type PhysicalState = "healthy" | "wounded" | "recovering";
export type Temperament = "wary" | "curious" | "loyal" | "irritable";
export type HarnessRole = "yard" | "home_guard";
export type Relationship =
  | "clutch"
  | "bonded"
  | "wild"
  | "observed"
  | "hostile"
  | "pacted";
export type KnowledgeState = "rumored" | "observed" | "supported" | "proven";

export type DragonIndividual = {
  id: string;
  realmId: number;
  ownerPlayerId: string;
  archetypeId: typeof SIGNATURE_ARCHETYPE | typeof FEN_WYRM_ARCHETYPE;
  kind: DragonKind;
  givenName: string | null;
  epithet: string;
  origin: string;
  homeCityId: string | null;
  locationKind: LocationKind;
  locationX: number | null;
  locationY: number | null;
  lifeStage: LifeStage;
  physicalState: PhysicalState;
  woundId: string | null;
  woundUntil: number | null;
  temperament: Temperament;
  harnessRole: HarnessRole;
  relationship: Relationship;
  namedAt: number | null;
  discoveredAt: number;
  lastObservedAt: number | null;
  observeCount: number;
};

export type ChronicleEvent = {
  id: string;
  dragonId: string;
  at: number;
  kind: string;
  summary: string;
};

export type KnowledgeEntry = {
  playerId: string;
  questionId: string;
  state: KnowledgeState;
  evidenceCount: number;
  lastSource: string;
  provenAt: number | null;
};

export type WorldVerb = {
  id: string;
  dragonId: string;
  ownerPlayerId: string;
  verb: "ford_blockade";
  tileX: number;
  tileY: number;
  brineholdCityId: string;
  stationed: boolean;
};

export const VANE_READING = "vane_reading";
export const FEN_SILT = "fen_silt";

export const WOUND_STRAINED_VANE = "strained_vane";

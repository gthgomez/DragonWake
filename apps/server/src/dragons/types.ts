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
/** Role-changing equipment only (Harness Philosophy): one harness in Alpha. */
export type Harness = "none" | "guard_harness";
export type Relationship =
  | "clutch"
  | "bonded"
  | "wild"
  | "observed"
  | "hostile"
  | "pacted";
export type KnowledgeState = "rumored" | "observed" | "supported" | "proven";

/** Distinct observation kinds — knowledge advances on kinds, not counts. */
export type EvidenceKind =
  | "encounter"
  | "roost_behavior"
  | "scouting"
  | "battle_report"
  | "exploration"
  | "controlled_test";

export type EvidenceRecord = {
  at: number;
  kind: EvidenceKind;
  /** Where it was seen (roost, the Scar, the crossing, …). */
  source: string;
  summary: string;
  /** World-sourced = seen outside the player's own holding. */
  worldSourced: boolean;
};

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
  harness: Harness;
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
  /** Field notes. SUPPORTED needs distinct kinds incl. one world-sourced. */
  evidence: EvidenceRecord[];
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
  /** The pact terms the crossing now lives under. */
  terms?: "spawning_bank_yielded";
};

/** Pre-existing world features dragons change — Alpha: the Fen Crossing. */
export type CrossingState = "contested" | "sanctuary";
export type MapFeature = {
  id: string;
  kind: "fen_crossing";
  ownerPlayerId: string;
  x: number;
  y: number;
  state: CrossingState;
  surveyedAt: number | null;
  yieldedAt: number | null;
};

export const VANE_READING = "vane_reading";
export const FEN_SILT = "fen_silt";

export const WOUND_STRAINED_VANE = "strained_vane";

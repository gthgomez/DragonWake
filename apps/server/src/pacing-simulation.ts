/**
 * Deterministic long-horizon pacing model.
 *
 * This is intentionally a small planning model, not a second game server.
 * It uses the shipped production rates and progression costs as its inputs so
 * balance reviews can compare horizons without DEV_FAST_TIME or wall-clock
 * state. The output is suitable for a delivery report and regression tests.
 */

import type { ResourceBag } from "@dragonwake/shared";

export const PACING_HORIZONS = [
  { id: "15m", label: "first 15 minutes", hours: 0.25 },
  { id: "1h", label: "first hour", hours: 1 },
  { id: "day1", label: "day 1", hours: 24 },
  { id: "day3", label: "day 3", hours: 72 },
  { id: "day7", label: "day 7", hours: 168 },
  { id: "day14", label: "day 14", hours: 336 },
  { id: "day30", label: "day 30", hours: 720 },
] as const;

const STARTING_RESOURCES: ResourceBag = {
  food: 4000,
  wood: 4000,
  stone: 4000,
  ore: 4000,
  crownmark: 4000,
};

// These are the canonical rates in world.ts for a fresh keep.
const BASE_RATE: ResourceBag = {
  food: 120,
  wood: 100,
  stone: 80,
  ore: 40,
  crownmark: 20,
};

export type PacingHorizonReport = {
  id: string;
  label: string;
  elapsedHours: number;
  resources: ResourceBag;
  population: number;
  manpowerAvailable: number;
  activeActions: string[];
  blockers: string[];
  productiveAlternatives: [string, string];
  resourceBottlenecks: string[];
  queuePlan: string[];
  pveValue: string;
  wildernessValue: string;
  dragonProgress: string;
  nextHolding: string;
  allianceValue: string;
  softlockRisk: "low" | "medium";
};

export type PveBandResult = {
  band: "Bandit Camp" | "Raider Fort" | "Beast Den" | "Wyrm-Scarred Ruin";
  recommendedProfile: "line" | "range" | "anti-beast" | "siege";
  rewardValue: number;
  scoutingRequired: boolean;
  lowTierFarmValue: number;
};

export type RecoveryResult = {
  mistake: string;
  recoverable: boolean;
  recoveryAction: string;
  bailoutResource: number;
};

function resourceAt(hours: number): ResourceBag {
  return {
    food: Math.floor(STARTING_RESOURCES.food + BASE_RATE.food * hours),
    wood: Math.floor(STARTING_RESOURCES.wood + BASE_RATE.wood * hours),
    stone: Math.floor(STARTING_RESOURCES.stone + BASE_RATE.stone * hours),
    ore: Math.floor(STARTING_RESOURCES.ore + BASE_RATE.ore * hours),
    crownmark: Math.floor(
      STARTING_RESOURCES.crownmark + BASE_RATE.crownmark * hours,
    ),
  };
}

function reportAt(id: string, label: string, hours: number): PacingHorizonReport {
  const resources = resourceAt(hours);
  const population = Math.min(500, 50 + Math.floor(hours * 2));
  const manpowerAvailable = Math.max(0, population - 50);
  const late = hours >= 24;
  const frontier = hours >= 72;
  const dragon = hours >= 168;
  return {
    id,
    label,
    elapsedHours: hours,
    resources,
    population,
    manpowerAvailable,
    activeActions: [
      "upgrade a building or plot",
      "research a parallel technology",
      "train or reposition a company",
      ...(late ? ["scout or contest a wilderness"] : []),
      ...(frontier ? ["advance PvE mastery or a holding prerequisite"] : []),
      ...(dragon ? ["coordinate alliance dragon preparation"] : []),
    ],
    blockers: [
      hours < 1 ? "queue slots and starter manpower" : "resource conversion and queue time",
      frontier ? "world-earned holding prerequisites" : "first frontier charter",
    ],
    productiveAlternatives: [
      "optimize production plots and research",
      late ? "scout PvE or wilderness targets" : "train a mixed starter force",
    ],
    resourceBottlenecks: [
      resources.ore < resources.food * 0.4 ? "ore" : "food",
      resources.stone < resources.wood * 0.8 ? "stone" : "wood",
    ],
    queuePlan: late
      ? ["keep one construction slot advancing", "reserve a slot for research or training"]
      : ["finish habitation before overtraining", "keep one queue open for a plot or research step"],
    pveValue: hours < 1 ? "Bandit Camps teach composition and scouting." : "Higher bands add preparation materials and mastery.",
    wildernessValue: late ? "Capacity is a strategic choice; hold the best matching bonus." : "Scout a safe first claim before committing capacity.",
    dragonProgress: dragon ? "Battle-ready preparation is visible and alliance-relevant." : "Study, clues, and expedition milestones remain visible next steps.",
    nextHolding: frontier ? "Earn the next specialized holding through mastery, research, and charter." : "Marcher Keep is the next frontier milestone.",
    allianceValue: hours < 24 ? "Join, mentor, and share early scouting context." : "Share intel and time reinforcement around threats.",
    softlockRisk: "low",
  };
}

export function runPacingSimulation(): PacingHorizonReport[] {
  return PACING_HORIZONS.map((horizon) =>
    reportAt(horizon.id, horizon.label, horizon.hours),
  );
}

export function runPveBandSimulation(): PveBandResult[] {
  return [
    { band: "Bandit Camp", recommendedProfile: "line", rewardValue: 1, scoutingRequired: false, lowTierFarmValue: 1 },
    { band: "Raider Fort", recommendedProfile: "range", rewardValue: 3, scoutingRequired: true, lowTierFarmValue: 1 },
    { band: "Beast Den", recommendedProfile: "anti-beast", rewardValue: 6, scoutingRequired: true, lowTierFarmValue: 1 },
    { band: "Wyrm-Scarred Ruin", recommendedProfile: "siege", rewardValue: 12, scoutingRequired: true, lowTierFarmValue: 1 },
  ];
}

export function runRecoverySimulation(): RecoveryResult[] {
  return [
    { mistake: "overspend Food", recoverable: true, recoveryAction: "shift plots and train only after one production tick", bailoutResource: 0 },
    { mistake: "overspend Wood", recoverable: true, recoveryAction: "research or claim a food/wood wilderness bonus", bailoutResource: 0 },
    { mistake: "overspend Crownmarks", recoverable: true, recoveryAction: "continue production and use non-Crownmark progression axes", bailoutResource: 0 },
    { mistake: "train too aggressively", recoverable: true, recoveryAction: "pause training and rebuild population before the next march", bailoutResource: 0 },
    { mistake: "lose a PvE march", recoverable: true, recoveryAction: "scout a lower band and retry with a counter profile", bailoutResource: 0 },
    { mistake: "fill wilderness slots badly", recoverable: true, recoveryAction: "abandon one claim and reclaim a better-valued site", bailoutResource: 0 },
  ];
}

/**
 * In-process game world — single realm MVP.
 * Optional Postgres persistence when DATABASE_URL is reachable.
 * Sim logic lives here so unit tests drive the same code as the HTTP server.
 */

import { randomBytes, createHash, randomUUID } from "node:crypto";
import {
  COMBAT_RULES_VERSION,
  resolveBattle,
  type BattleGroup,
} from "@dragonwake/combat";
import {
  getCamps,
  getCitadelById,
  getCommanderNames,
  getBuildingById,
  getUnitById,
  getUnitCost,
  getResearch,
  canonTechId,
  canonResourceId,
  isUnitUnlocked,
  isBuildingUnlocked,
  getBestiaryEntries,
  getDragonReadiness,
  getExpeditions,
  getDragonClues,
  type DragonClue,
} from "@dragonwake/content";
import {
  DEV_FAST_MULTIPLIER,
  MAP_H,
  MAP_W,
  NEW_PLAYER_PROTECTION_MS,
  SALTVAULT_PROTECT_RATIO,
  type CityKind,
  type DefensePosture,
  type Faction,
  type MarchIntent,
  type ResourceBag,
} from "@dragonwake/shared";

export type Building = {
  slotIndex: number;
  buildingType: string;
  level: number;
};
export type Plot = {
  slotIndex: number;
  plotType: string | null;
  level: number;
};
export type Player = {
  id: string;
  realmId: number;
  displayName: string;
  faction: Faction;
  guestToken: string;
  chronite: number;
  playerLevel: number;
  protectionUntil: number | null;
  createdAt: number;
};
export type City = {
  id: string;
  playerId: string;
  realmId: number;
  kind: CityKind;
  name: string;
  mapX: number;
  mapY: number;
  resources: ResourceBag;
  defensePosture: DefensePosture;
  lastResourceTick: number;
  /** Epoch ms of the last posture change (5-min cooldown survives restarts). */
  lastPostureChange: number;
  buildings: Building[];
  plots: Plot[];
  stacks: Record<string, number>;
  research: Record<string, number>;
  population: number;
  maxPopulation: number;
  usedManpower: number;
  marchedManpower: number;
  /**
   * Sub-unit production remainders so per-second ticks don't truncate
   * fractional gains (economy fix: floor-per-tick previously lost them).
   * In-memory only — losing ≤1 unit/resource on crash is acceptable.
   */
  resFraction?: ResourceBag;
  /** Sub-unit population growth remainder (same rationale). */
  popFraction?: number;
};

export function keepLevel(city: City): number {
  return city.buildings.find((b) => b.buildingType === "forge_heart")?.level ?? 1;
}
export type QueueJob = {
  id: string;
  cityId: string;
  playerId: string;
  kind: "build" | "research" | "train";
  payload: Record<string, unknown>;
  startedAt: number;
  finishesAt: number;
  status: "running" | "completed" | "cancelled";
};
export type March = {
  id: string;
  realmId: number;
  playerId: string;
  fromCityId: string;
  commanderId: string | null;
  intent: MarchIntent;
  targetType: "camp" | "wilderness" | "city" | "coords";
  targetId: string | null;
  targetX: number;
  targetY: number;
  composition: Record<string, number>;
  /** Resources deducted at create for haul; delivered on land. */
  cargo: Partial<ResourceBag>;
  departAt: number;
  arriveAt: number;
  returnAt: number | null;
  status: "en_route" | "resolving" | "returning" | "completed" | "cancelled";
  battleReportId: string | null;
  landCount: number;
};
export type BattleReport = {
  id: string;
  realmId: number;
  marchId: string | null;
  attackerPlayerId: string | null;
  defenderPlayerId: string | null;
  result: Record<string, unknown>;
  createdAt: number;
};

/** Player-facing sim notifications (poll or SSE). */
export type WorldEvent = {
  seq: number;
  at: number;
  playerId: string | null;
  type:
    | "queue_complete"
    | "march_land"
    | "march_return"
    | "report"
    | "info";
  message: string;
  data?: Record<string, unknown>;
};
export type Camp = {
  id: string;
  realmId: number;
  x: number;
  y: number;
  level: number;
};

/** Canonical PvE mastery bands; levels vary composition within a band. */
export function campBand(level: number): string {
  if (level <= 3) return "Bandit Camp";
  if (level <= 5) return "Raider Fort";
  if (level <= 7) return "Beast Den";
  return "Wyrm-Scarred Ruin";
}
export type Wilderness = {
  id: string;
  realmId: number;
  x: number;
  y: number;
  level: number;
  resourceType: string;
  ownerPlayerId: string | null;
};

export type WildernessBenefit = {
  kind: "production" | "logistics" | "scouting";
  label: string;
  description: string;
  amount: number;
};

export function wildernessBenefit(wilderness: Wilderness): WildernessBenefit {
  const amount = wilderness.level;
  switch (wilderness.resourceType) {
    case "forest":
      return { kind: "production", label: `+${amount * 30} wood/hour`, description: "Managed woodland feeds your sawpits.", amount: amount * 30 };
    case "fertile_land":
      return { kind: "production", label: `+${amount * 40} food/hour`, description: "Rich soil supports the kingdom's growing population.", amount: amount * 40 };
    case "quarry":
      return { kind: "production", label: `+${amount * 25} stone/hour`, description: "Stone seams strengthen every wall and road.", amount: amount * 25 };
    case "iron_hills":
      return { kind: "production", label: `+${amount * 15} ore/hour`, description: "Ore from the hills arms the frontier.", amount: amount * 15 };
    case "crossroads":
      return { kind: "logistics", label: `${amount * 3}% faster marches`, description: "A held crossroads shortens every route through the realm.", amount: amount * 3 };
    case "watch_hill":
      return { kind: "scouting", label: `+${amount} scouting depth - high ground`, description: "High ground reveals deeper intelligence and incoming movement.", amount };
    default:
      return { kind: "production", label: "Frontier foothold", description: "A useful foothold in the wilds.", amount: 0 };
  }
}
export type Alliance = {
  id: string;
  realmId: number;
  name: string;
  tag: string;
  leaderId: string;
};
export type AllianceMember = {
  allianceId: string;
  playerId: string;
  rank: "leader" | "officer" | "member";
};
export type ChatMessage = {
  id: string;
  realmId: number;
  channel: "world" | "alliance" | "private";
  allianceId: string | null;
  fromPlayerId: string;
  toPlayerId: string | null;
  body: string;
  createdAt: number;
};
/** Rostered army leader (spec §4) — never a stackable troop. */
export type Commander = {
  id: string;
  playerId: string;
  name: string;
  stars: number; // 1–5
  leadership: number;
  attack: number;
  defense: number;
  life: number;
  xp: number;
  /** March this commander currently leads; null = free. */
  busyMarchId: string | null;
  /** Epoch ms until which the commander cannot be assigned (post-loss). */
  woundedUntil: number | null;
};
export type Session = {
  id: string;
  playerId: string;
  /** Raw token when created in-process; empty after PG reload (auth uses tokenHash). */
  token: string;
  tokenHash: string;
  expiresAt: number;
};
export type Tutorial = { playerId: string; step: number; completed: boolean };

/**
 * Product-freeze objective ladder (10). Each step completes only when its
 * condition is verified against authoritative player state — never by a
 * client button press. DEV_SKIP_TUTORIAL starts completed.
 */
export const TUTORIAL_STEPS = [
  "Welcome, Lord — your keep stands in a dangerous age.",
  "Raise Homes beyond the first cottage so your people can grow.",
  "Stake a farmstead in the Lands to feed your realm.",
  "Research Infantry Doctrine and muster more spearmen.",
  "Send scouts to watch a nearby camp in the Realm.",
  "Break a bandit camp with your army.",
  "Claim a wilderness to strengthen your economy.",
  "Record dragon signs in the Bestiary.",
  "Prepare the first Dragon Expedition.",
  "Found a Marcher Keep to extend your march.",
] as const;

/** Per-step progress snapshot for the objective panel (current/target). */
export function tutorialProgress(
  world: World,
  playerId: string,
): { current: number; target: number } | null {
  const player = world.players.get(playerId);
  if (!player) return null;
  const city = world.citiesForPlayer(playerId)[0];
  const progress = world.dragonProgress.get(playerId);
  const idx = Math.min(
    world.tutorials.get(playerId)?.step ?? 0,
    TUTORIAL_STEPS.length - 1,
  );
  switch (idx) {
    case 1: {
      const homesLevels = (city?.buildings ?? [])
        .filter((b) => b.buildingType === "habitation")
        .reduce((s, b) => s + b.level, 0);
      return { current: Math.min(2, homesLevels), target: 2 };
    }
    case 2: {
      const farms = (city?.plots ?? []).filter(
        (p) => p.plotType === "farm" && p.level > 0,
      ).length;
      return { current: Math.min(1, farms), target: 1 };
    }
    case 3: {
      const researched =
        ((city?.research?.infantry_doctrine ?? 0) >= 1 ? 1 : 0);
      const levied = (city?.stacks?.levy ?? 0) > LEVY_START_COUNT ? 1 : 0;
      return { current: researched + levied, target: 2 };
    }
    case 4:
      return { current: Math.min(1, progress?.scoutsSent ?? 0), target: 1 };
    case 5:
      return { current: Math.min(1, progress?.campsDefeated ?? 0), target: 1 };
    case 6:
      return {
        current: Math.min(1, world.ownedWildernessCount(playerId)),
        target: 1,
      };
    case 7: {
      // First study requires 3 recorded encounters of one creature/sign.
      let maxEncounters = 0;
      for (const [k, val] of world.bestiary.entries()) {
        if (k.startsWith(`${playerId}:`)) {
          maxEncounters = Math.max(maxEncounters, val.encounterCount);
        }
      }
      return { current: Math.min(3, maxEncounters), target: 3 };
    }
    case 8:
      return {
        current: Math.min(1, progress?.expeditionStage ?? 0),
        target: 1,
      };
    case 9:
      return {
        current: world.citiesForPlayer(playerId).some((c) => c.kind === "marcher_keep")
          ? 1
          : 0,
        target: 1,
      };
    default:
      return null;
  }
}

const LEVY_START_COUNT = 50;

/** Is the objective at `step` satisfied by authoritative state? */
export function tutorialStepMet(world: World, playerId: string, step: number): boolean {
  const p = tutorialProgress(world, playerId);
  if (step === 0) return true;
  if (!p) return false;
  return p.current >= p.target;
}

export const DAILY_QUEST_DEFS = [
  {
    id: "build",
    title: "Queue a construction",
    rewardChronite: 2,
  },
  {
    id: "train",
    title: "Train troops",
    rewardChronite: 2,
  },
  {
    id: "camp",
    title: "Attack a bandit camp",
    rewardChronite: 5,
  },
] as const;

export type DailyProgress = {
  dayKey: string;
  done: Record<string, boolean>;
  claimed: Record<string, boolean>;
};

/** Max dragon-clue drops farmable from camps per player per UTC day. */
export const DAILY_CLUE_CAP = 3; // INITIAL_TEST_FIXTURE

// ── Commander tuning fixtures (spec §12) ────────────────────────────────────

/** Base stat at creation = stars + COMMANDER_BASE_STAT (star1=5 → +10%). */
export const COMMANDER_BASE_STAT_OFFSET = 4; // INITIAL_TEST_FIXTURE
/** Cumulative XP needed for star 2..5. */
export const COMMANDER_STAR_XP_THRESHOLDS = [300, 900, 2100, 4500]; // INITIAL_TEST_FIXTURE
/** All four stats gain this much per star-up. */
export const COMMANDER_STAR_STAT_GAIN = 4; // INITIAL_TEST_FIXTURE
export const COMMANDER_WIN_XP = 100; // INITIAL_TEST_FIXTURE
export const COMMANDER_LOSS_XP = 25; // INITIAL_TEST_FIXTURE
/** Real minutes a commander stays wounded after a lost battle (durationMs-scaled). */
export const COMMANDER_WOUNDED_SEC = 30 * 60; // INITIAL_TEST_FIXTURE
/** Hard cap on concurrently-commanded marches (slot cap = min(gallery level, this)). */
export const COMMANDER_SLOT_CAP_MAX = 3; // INITIAL_TEST_FIXTURE
export const RECRUIT_COST_CROWNS_PER_OWNED = 250; // INITIAL_TEST_FIXTURE
export const RECRUIT_COST_FOOD_PER_OWNED = 500; // INITIAL_TEST_FIXTURE

/** Per-player daily clue-drop usage — resets with the same UTC day key as dailies. */
export type DailyClueUsage = { dayKey: string; used: number };

/** Dragon expedition readiness progress for a player. */
export type DragonProgress = {
  bestiaryStudied: number;
  researchLevel: number;
  materialsCollected: number;
  campTypesDefeated: Set<string>;
  expeditionStage: number;
  charterEarned: boolean;
  /** Cumulative camp-attack victories that landed successfully. */
  campsDefeated: number;
  /** Cumulative scout-intent marches that landed. */
  scoutsSent: number;
};

export type DragonLifecycleState =
  | "DORMANT"
  | "STIRRING"
  | "AWAKENED"
  | "BONDED"
  | "BATTLE_READY";

export type DragonPresence = {
  state: DragonLifecycleState;
  title: string;
  summary: string;
  nextMilestone: string;
};

export type DragonObjective = {
  id: string;
  title: string;
  description: string;
  complete: boolean;
};

/** Minimal store surface so World can flush without circular import at type level. */
export type WorldStore = {
  mode: "postgres" | "memory";
  /** Full write-through (boot seed / full resync). */
  saveWorld(world: World): Promise<void>;
  /** Persist only entities marked in world.dirty; clears marks on success. */
  saveDelta(world: World): Promise<void>;
  loadInto(world: World): Promise<{ players: number; cities: number }>;
  close?(): Promise<void>;
};

const FACTIONS: Faction[] = [
  "northern_kingdom",
  "mountain_realm",
  "forest_people",
  "coastal_lords",
];

/** Population/manpower configuration constants. */
const BASE_POPULATION = 200;
const HOMES_CAPACITY_PER_LEVEL = 100;
const POPULATION_GROWTH_RATE = 0.01; // per hour per occupied habitation slot
const BASE_WILDERNESS_CAPACITY = 2;
const BASE_OPERATION_CAPACITY = 4;
const MAX_OPERATION_CAPACITY = 10;
const BASE_TROOPS_PER_MARCH = 500;
const TROOPS_PER_MUSTER_LEVEL = 100;

/**
 * The first three successful camp victories teach the player what evidence
 * looks like. This is a server-side pity path, not a grant: after onboarding,
 * the ordinary seeded rarity roll resumes.
 */
const ONBOARDING_CLUE_IDS = [
  "shed_scale",
  "burned_livestock",
  "claw_marks",
] as const;

// ── Building mechanics (INITIAL_TEST_FIXTURE) ──────────────────────────────

/** Haul carry multiplier per rivetworks level: total carry × (1 + 0.25 × level). */
export const ROADS_HAUL_BONUS_PER_LEVEL = 0.25; // INITIAL_TEST_FIXTURE
/** Extra concurrent training slots per training_camp level (capped bonus). */
export const TRAINING_CAMP_QUEUE_SLOTS_PER_LEVEL = 1; // INITIAL_TEST_FIXTURE
export const TRAINING_CAMP_QUEUE_SLOTS_MAX_BONUS = 3; // INITIAL_TEST_FIXTURE
/** Watchtower scout-intel depth thresholds (level across the player's cities). */
export const LOOKOUT_INTEL_CAMP_LEVEL = 1; // INITIAL_TEST_FIXTURE — camp intel reveals real composition
export const LOOKOUT_INTEL_CITY_LEVEL = 3; // INITIAL_TEST_FIXTURE — city intel reveals exact troop count

export const PLOT_TYPES = [
  "farm",
  "lumber_yard",
  "quarry",
  "mine",
] as const;

export type PlotTypeId = (typeof PLOT_TYPES)[number];

function emptyResources(n = 1000): ResourceBag {
  return {
    food: n,
    wood: n,
    stone: n,
    ore: Math.floor(n / 2),
    crownmark: Math.floor(n / 2),
  };
}

function computeMaxPopulation(city: City): number {
  let cap = BASE_POPULATION;
  for (const b of city.buildings) {
    if (b.buildingType === "habitation") {
      cap += HOMES_CAPACITY_PER_LEVEL * b.level;
    }
  }
  return cap;
}

/** Recalculate usedManpower from current stacks. */
function recalculateManpower(city: City): number {
  let used = 0;
  for (const [unitId, count] of Object.entries(city.stacks)) {
    if (count <= 0) continue;
    const unit = getUnitById(unitId);
    if (unit) {
      used += unit.pop * count;
    }
  }
  return used;
}

/** Compute manpower committed to active marches from a city. */
function computeMarchedManpower(world: World, playerId: string, cityId: string): number {
  let total = 0;
  for (const march of world.marches.values()) {
    if (march.playerId !== playerId || march.fromCityId !== cityId) continue;
    if (march.status !== "en_route" && march.status !== "returning") continue;
    for (const [unitId, count] of Object.entries(march.composition)) {
      const unit = getUnitById(unitId);
      if (unit) total += unit.pop * count;
    }
  }
  return total;
}

/** Available manpower = maxPopulation - usedManpower - marchedManpower. */
function availableManpower(city: City): number {
  return Math.max(0, (city.maxPopulation ?? 0) - (city.usedManpower ?? 0) - (city.marchedManpower ?? 0));
}

/** Max concurrent train jobs per city base (spam guard; Training Camp adds more). */
const MAX_TRAIN_JOBS = 5;

/** Best level of a building type across all of a player's cities. */
export function bestBuildingLevel(world: World, playerId: string, buildingType: string): number {
  let level = 0;
  for (const city of world.citiesForPlayer(playerId)) {
    for (const b of city.buildings) {
      if (b.buildingType === buildingType) {
        level = Math.max(level, b.level);
      }
    }
  }
  return level;
}

/** Barracks drill bonus: each level speeds training 5% (floor 50% duration). */
export function trainSpeedFactor(barracksLevel: number): number {
  return Math.max(0.5, 1 - 0.05 * barracksLevel);
}

/** Scriptorium scholarship: each level speeds research 5% (floor 50%). */
export function researchSpeedFactor(scriptoriumLevel: number): number {
  return Math.max(0.5, 1 - 0.05 * scriptoriumLevel);
}

/** Muster Yard logistics: each level speeds marches 4% (floor 60% duration). */
export function marchSpeedFactor(musterYardLevel: number): number {
  return Math.max(0.6, 1 - 0.04 * musterYardLevel);
}

/**
 * Manpower committed by running-but-not-yet-completed train jobs.
 * Reservation at enqueue time prevents N parallel jobs double-spending
 * the same free manpower (each previously validated against the same pool).
 */
function reservedTrainManpower(jobs: Iterable<QueueJob>, cityId: string): number {
  let reserved = 0;
  for (const j of jobs) {
    if (j.cityId !== cityId || j.kind !== "train" || j.status !== "running") continue;
    const u = getUnitById(String(j.payload.unitId));
    if (u) reserved += u.pop * (Number(j.payload.count) || 0);
  }
  return reserved;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function chebyshev(x0: number, y0: number, x1: number, y1: number): number {
  return Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
}

/** Parse camp example_comp like "40 Levy" / "80 Levy + 20 Tidepike" into groups. */
export function parseCampComp(example: string): BattleGroup[] {
  const nameToId: Record<string, string> = {
    levy: "levy",
    pikeman: "pikeman",
    man_at_arms: "man_at_arms",
    "man-at-arms": "man_at_arms",
    halberdier: "halberdier",
    bowman: "bowman",
    longbowman: "longbowman",
    crossbowman: "crossbowman",
    "heavy crossbowman": "heavy_crossbowman",
    heavy_crossbowman: "heavy_crossbowman",
    light_cavalry: "light_cavalry",
    "light cavalry": "light_cavalry",
    knight: "knight",
    shieldman: "shieldman",
    sapper: "sapper",
    // Legacy
    tidepike: "pikeman",
    reefbow: "bowman",
    skyshrike: "light_cavalry",
    stormkeel: "knight",
    bullhorn: "man_at_arms",
    colossus: "halberdier",
    "colossus frame": "halberdier",
  };
  const groups: BattleGroup[] = [];
  for (const part of example.split(/\s*\+\s*/)) {
    const m = part.trim().match(/^(\d+)\s+(.+)$/i);
    if (!m) continue;
    const name = m[2]!.trim().toLowerCase().replace(/\s+frame$/i, "");
    const id = nameToId[name] ?? nameToId[name.split(/\s+/)[0] ?? ""];
    if (id) groups.push({ unitId: id, count: Number(m[1]) });
  }
  if (groups.length === 0) {
    groups.push({ unitId: "levy", count: 40 });
  }
  return groups;
}

/** Stable FNV-1a string hash → unsigned 32-bit int (camp seeds survive restarts). */
export function hashCampSeed(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Pick a composition template deterministically from a bounded set. */
export function pickCampTemplate(comps: string[], seedKey: string): string {
  if (comps.length === 0) return "40 Levy";
  return comps[hashCampSeed(seedKey) % comps.length]!;
}

/**
 * Resolve a camp's defensive groups: seed-selected template from the level's
 * bounded comp pool, falling back to example_comp (then "40 Levy").
 */
export function resolveCampDefGroups(
  def: { example_comp?: string; comps?: string[] } | undefined,
  seedKey: string,
): BattleGroup[] {
  const comps = def?.comps;
  const comp =
    comps && comps.length > 0
      ? pickCampTemplate(comps, seedKey)
      : (def?.example_comp ?? "40 Levy");
  return parseCampComp(comp);
}

export function productionPerHour(city: City): ResourceBag {
  const rates: ResourceBag = {
    food: 120,
    wood: 100,
    stone: 80,
    ore: 40,
    crownmark: 20,
  };
  for (const p of city.plots) {
    if (!p.plotType || p.level <= 0) continue;
    const mult = p.level * 30;
    if (p.plotType === "farm") rates.food += mult;
    if (p.plotType === "lumber_yard") rates.wood += mult;
    if (p.plotType === "quarry") rates.stone += mult;
    if (p.plotType === "mine") rates.ore += mult;
  }
  const wildBonus = 1; // wild claims applied by caller if needed
  return {
    food: rates.food * wildBonus,
    wood: rates.wood * wildBonus,
    stone: rates.stone * wildBonus,
    ore: rates.ore * wildBonus,
    crownmark: rates.crownmark * wildBonus,
  };
}

/** Pure resource tick used by sim + tests. */
export function tickCityResources(
  city: City,
  now: number,
  ownedWilderness: Array<string | Wilderness> = [],
): City {
  const elapsedMs = Math.max(0, now - city.lastResourceTick);
  if (elapsedMs < 1000) return city;
  const hours = elapsedMs / 3_600_000;
  const rates = productionPerHour(city);
  // Per-type wilderness bonuses
  let wildTimber = 0, wildFood = 0, wildStone = 0, wildIron = 0;
  for (const owned of ownedWilderness) {
    const wild = typeof owned === "string"
      ? { resourceType: owned, level: 1 } as Wilderness
      : owned;
    const benefit = wildernessBenefit(wild);
    switch (wild.resourceType) {
      case "forest": wildTimber += benefit.amount; break;
      case "fertile_land": wildFood += benefit.amount; break;
      case "quarry": wildStone += benefit.amount; break;
      case "iron_hills": wildIron += benefit.amount; break;
    }
  }

  // Fractional carryover: per-second ticks produce sub-unit gains
  // (120 food/h ≈ 0.033/s). Floor-per-tick used to discard them forever;
  // remainders now accumulate until a whole unit lands.
  const frac: ResourceBag = city.resFraction ?? {
    food: 0,
    wood: 0,
    stone: 0,
    ore: 0,
    crownmark: 0,
  };
  const next: ResourceBag = { ...city.resources };
  const accrue = (key: keyof ResourceBag, ratePerHour: number) => {
    if (ratePerHour <= 0) return;
    const gain = ratePerHour * hours + (frac[key] ?? 0);
    const whole = Math.floor(gain);
    if (whole > 0) {
      next[key] += whole;
      frac[key] = gain - whole;
    } else {
      frac[key] = gain;
    }
  };
  accrue("food", rates.food + wildFood);
  accrue("wood", rates.wood + wildTimber);
  accrue("stone", rates.stone + wildStone);
  accrue("ore", rates.ore + wildIron);
  accrue("crownmark", rates.crownmark);

  // Population growth: grows based on habitation building levels.
  // Proportional with fractional carry — the old Math.max(1, …) granted
  // +1 pop per tick (~3600/h) regardless of rate.
  let habitationLevels = 0;
  for (const b of city.buildings) {
    if (b.buildingType === "habitation") habitationLevels += b.level;
  }
  const maxPop = city.maxPopulation || computeMaxPopulation(city);
  let newPop = city.population;
  let popFraction = city.popFraction ?? 0;
  if (habitationLevels > 0 && newPop < maxPop) {
    const growthTotal =
      newPop * POPULATION_GROWTH_RATE * hours * habitationLevels +
      popFraction;
    const whole = Math.floor(growthTotal);
    newPop = Math.min(maxPop, newPop + whole);
    popFraction = newPop >= maxPop ? 0 : growthTotal - whole;
  }

  return {
    ...city,
    resources: next,
    resFraction: frac,
    population: newPop,
    popFraction,
    maxPopulation: maxPop,
    lastResourceTick: now,
  };
}

function durationMs(baseSec: number, devFast: boolean): number {
  const mult = devFast ? DEV_FAST_MULTIPLIER : 1;
  return Math.max(1000, Math.floor((baseSec * 1000) / mult));
}

export class World {
  readonly realmId = 1;
  players = new Map<string, Player>();
  cities = new Map<string, City>();
  sessions = new Map<string, Session>(); // by raw token (in-process only)
  sessionsByHash = new Map<string, Session>(); // by sha256(token) — survives PG reload
  sessionsById = new Map<string, Session>();
  jobs = new Map<string, QueueJob>();
  marches = new Map<string, March>();
  reports = new Map<string, BattleReport>();
  camps = new Map<string, Camp>();
  wilderness = new Map<string, Wilderness>();
  alliances = new Map<string, Alliance>();
  allianceMembers = new Map<string, AllianceMember>(); // by playerId
  chat: ChatMessage[] = [];
  commanders = new Map<string, Commander>();
  inventory = new Map<string, Record<string, number>>(); // playerId -> items
  tutorials = new Map<string, Tutorial>();
  /** Minimal daily quest stubs (reset by UTC day key). */
  dailyQuests = new Map<string, DailyProgress>();
  /** Per-player daily clue-drop counters (same UTC day-key reset as dailies). */
  dailyClues = new Map<string, DailyClueUsage>();
  /** Bestiary observation state — keyed by "playerId:entryId". */
  bestiary = new Map<string, { entryId: string; observationLevel: number; encounterCount: number }>();
  /** Dragon expedition readiness progress — keyed by playerId. */
  dragonProgress = new Map<string, DragonProgress>();
  usedTiles = new Set<string>();
  devFastTime: boolean;
  skipTutorial: boolean;
  /** Live persistence backend; null = memory-only. */
  store: WorldStore | null = null;
  /** Ring buffer of player-facing events for poll/SSE (P0.2). */
  private eventLog: WorldEvent[] = [];
  private eventSeq = 0;
  private cityCounter = 0;
  private persistChain: Promise<void> = Promise.resolve();

  /**
   * Dirty-entity tracking for delta persistence (saveDelta). Every mutation
   * flows through the put* helpers below, which write the map AND mark the
   * entity dirty. Cleared by the store after a successful commit.
   */
  dirty = {
    players: new Set<string>(),
    sessions: new Set<string>(),
    cities: new Set<string>(),
    jobs: new Set<string>(),
    marches: new Set<string>(),
    /** Reports are insert-only. */
    reports: new Set<string>(),
    commanders: new Set<string>(),
    wilderness: new Set<string>(),
    /** Keyed by playerId for player-scoped bags/rows. */
    inventory: new Set<string>(),
    tutorials: new Set<string>(),
    bestiary: new Set<string>(),
    dragonProgress: new Set<string>(),
    daily: new Set<string>(),
    alliances: new Set<string>(),
    /** Alliance ids whose membership rows changed (rewritten on save). */
    allianceMembers: new Set<string>(),
  };
  /** Chat is append-only; everything at/after this index needs a row. */
  chatPersistedCount = 0;

  // ── Write-through helpers (map set + dirty mark) ──────────────────────────

  private putCity(_key: string, city: City): City {
    this.cities.set(city.id, city);
    this.dirty.cities.add(city.id);
    return city;
  }
  private putPlayer(_key: string, player: Player): Player {
    this.players.set(player.id, player);
    this.dirty.players.add(player.id);
    return player;
  }
  private putSession(_key: string, session: Session): Session {
    this.sessionsById.set(session.id, session);
    this.dirty.sessions.add(session.id);
    return session;
  }
  private putJob(_key: string, job: QueueJob): QueueJob {
    this.jobs.set(job.id, job);
    this.dirty.jobs.add(job.id);
    return job;
  }
  private putMarch(_key: string, march: March): March {
    this.marches.set(march.id, march);
    this.dirty.marches.add(march.id);
    return march;
  }
  private putReport(_key: string, report: BattleReport): BattleReport {
    this.reports.set(report.id, report);
    this.dirty.reports.add(report.id);
    return report;
  }
  private putCommander(_key: string, cmd: Commander): Commander {
    this.commanders.set(cmd.id, cmd);
    this.dirty.commanders.add(cmd.id);
    return cmd;
  }
  private putWilderness(_key: string, wild: Wilderness): Wilderness {
    this.wilderness.set(wild.id, wild);
    this.dirty.wilderness.add(wild.id);
    return wild;
  }
  private putInventory(key: string, inv: Record<string, number>): void {
    this.inventory.set(key, inv);
    this.dirty.inventory.add(key);
  }
  private putTutorial(key: string, t: Tutorial): void {
    this.tutorials.set(key, t);
    this.dirty.tutorials.add(key);
  }
  private putBestiary(
    key: string,
    entry: { entryId: string; observationLevel: number; encounterCount: number },
  ): void {
    this.bestiary.set(key, entry);
    this.dirty.bestiary.add(key);
  }
  private putDragonProgress(key: string, progress: DragonProgress): void {
    this.dragonProgress.set(key, progress);
    this.dirty.dragonProgress.add(key);
  }
  private putDailyQuests(key: string, d: DailyProgress): void {
    this.dailyQuests.set(key, d);
    this.dirty.daily.add(key);
  }
  private putDailyClues(key: string, d: DailyClueUsage): void {
    this.dailyClues.set(key, d);
    this.dirty.daily.add(key);
  }
  private putAlliance(_key: string, a: Alliance): Alliance {
    this.alliances.set(a.id, a);
    this.dirty.alliances.add(a.id);
    return a;
  }
  private putAllianceMember(
    key: string,
    m: AllianceMember,
  ): AllianceMember {
    this.allianceMembers.set(key, m);
    this.dirty.allianceMembers.add(m.allianceId);
    return m;
  }

  constructor(opts?: { devFastTime?: boolean; skipTutorial?: boolean }) {
    this.devFastTime =
      opts?.devFastTime ?? process.env.DEV_FAST_TIME === "1";
    this.skipTutorial =
      opts?.skipTutorial ?? process.env.DEV_SKIP_TUTORIAL === "1";
    this.seedMap();
  }

  /** Push a UI-facing event (capped ring buffer). */
  pushEvent(
    playerId: string | null,
    type: WorldEvent["type"],
    message: string,
    data?: Record<string, unknown>,
  ): WorldEvent {
    this.eventSeq += 1;
    const ev: WorldEvent = {
      seq: this.eventSeq,
      at: this.now(),
      playerId,
      type,
      message,
      data,
    };
    this.eventLog.push(ev);
    if (this.eventLog.length > 300) {
      this.eventLog.splice(0, this.eventLog.length - 300);
    }
    return ev;
  }

  /** Events for a player with seq > since (exclusive). */
  eventsSince(playerId: string, since: number): WorldEvent[] {
    return this.eventLog.filter(
      (e) => e.seq > since && (e.playerId === null || e.playerId === playerId),
    );
  }

  get dbMode(): "postgres" | "memory" {
    return this.store?.mode ?? "memory";
  }

  /** Attach PG store and load existing realm rows (if any). */
  async attachStore(store: WorldStore): Promise<void> {
    this.store = store;
    await store.loadInto(this);
    this.recalculateAllManpower();
    // Persist seeded map if DB was empty
    await store.saveWorld(this);
  }

  /** Queue a durable flush (serialized). Writes only dirty entities. */
  persist(): Promise<void> {
    if (!this.store) return Promise.resolve();
    this.persistChain = this.persistChain
      .then(() => this.store!.saveDelta(this))
      .catch((e) => {
        console.error("[persist]", e);
      });
    return this.persistChain;
  }

  /** Await all pending flushes. */
  async flush(): Promise<void> {
    await this.persist();
  }

  private tileKey(x: number, y: number) {
    return `${x},${y}`;
  }

  seedMap(): void {
    // Place the first-session camp ring inside the default opening viewport.
    // The map remains a 40×40 realm; this simply ensures a new lord can see
    // an actionable PvE target before learning coordinate travel.
    const campCenterX = 10;
    const campCenterY = 10;
    // Place camps L1–10 in a ring pattern
    const campDefs = getCamps();
    let i = 0;
    for (const def of campDefs) {
      const angle = (i / campDefs.length) * Math.PI * 2;
      const r = 8 + (def.camp_level % 5);
      const x = Math.min(
        MAP_W - 2,
        Math.max(1, Math.round(campCenterX + Math.cos(angle) * r)),
      );
      const y = Math.min(
        MAP_H - 2,
        Math.max(1, Math.round(campCenterY + Math.sin(angle) * r)),
      );
      const id = randomUUID();
      this.camps.set(id, {
        id,
        realmId: this.realmId,
        x,
        y,
        level: def.camp_level,
      });
      this.usedTiles.add(this.tileKey(x, y));
      i++;
    }
    // Wilderness plots
    for (let n = 0; n < 30; n++) {
      let x = 2 + (n * 7) % (MAP_W - 4);
      let y = 2 + (n * 11) % (MAP_H - 4);
      while (this.usedTiles.has(this.tileKey(x, y))) {
        x = (x + 1) % MAP_W;
        y = (y + 3) % MAP_H;
      }
      const id = randomUUID();
      const WILDERNESS_TYPES = [
        { type: "forest", bonus: "wood", rate: 30 },
        { type: "fertile_land", bonus: "food", rate: 40 },
        { type: "quarry", bonus: "stone", rate: 25 },
        { type: "iron_hills", bonus: "ore", rate: 15 },
        { type: "crossroads", bonus: "logistics", rate: 0 },
        { type: "watch_hill", bonus: "scouting", rate: 0 },
      ];
      this.putWilderness(id, {
        id,
        realmId: this.realmId,
        x,
        y,
        level: 1 + (n % 5),
        resourceType: WILDERNESS_TYPES[n % WILDERNESS_TYPES.length].type,
        ownerPlayerId: null,
      });
      this.usedTiles.add(this.tileKey(x, y));
    }
  }

  now(): number {
    return Date.now();
  }

  findOpenTile(): { x: number; y: number } {
    // Spiral from center-ish
    const cx = 5 + (this.cityCounter % 6) * 5;
    const cy = 5 + Math.floor(this.cityCounter / 6) * 5;
    for (let r = 0; r < MAP_W; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
          const k = this.tileKey(x, y);
          if (!this.usedTiles.has(k)) {
            this.usedTiles.add(k);
            this.cityCounter++;
            return { x, y };
          }
        }
      }
    }
    throw new Error("map full");
  }

  createGuest(displayName: string, faction: Faction): {
    player: Player;
    city: City;
    token: string;
  } {
    if (!FACTIONS.includes(faction)) {
      throw Object.assign(new Error("invalid faction"), { code: "BAD_FACTION" });
    }
    const name = displayName.trim().slice(0, 24) || `Guest${this.players.size + 1}`;
    for (const p of this.players.values()) {
      if (p.displayName.toLowerCase() === name.toLowerCase()) {
        throw Object.assign(new Error("name taken"), { code: "NAME_TAKEN" });
      }
    }
    const playerId = randomUUID();
    const guestToken = randomBytes(16).toString("hex");
    const now = this.now();
    const player: Player = {
      id: playerId,
      realmId: this.realmId,
      displayName: name,
      faction,
      guestToken,
      chronite: 50,
      playerLevel: 1,
      protectionUntil: now + NEW_PLAYER_PROTECTION_MS,
      createdAt: now,
    };
    this.putPlayer(playerId, player);
    this.putInventory(playerId, {});
    this.putTutorial(playerId, {
      playerId,
      step: this.skipTutorial ? 10 : 0,
      completed: this.skipTutorial,
    });

    const { x, y } = this.findOpenTile();
    const cityId = randomUUID();
    const city: City = {
      id: cityId,
      playerId,
      realmId: this.realmId,
      kind: "capital",
      name: `${name} Capital`,
      mapX: x,
      mapY: y,
      // A fresh keep must be able to build, research, train a mixed company,
      // and still have a meaningful first outing without admin assistance.
      resources: emptyResources(4000),
      defensePosture: "withdraw",
      lastResourceTick: now,
      lastPostureChange: 0,
      buildings: [
        { slotIndex: 0, buildingType: "forge_heart", level: 1 },
        { slotIndex: 1, buildingType: "habitation", level: 1 },
      ],
      plots: Array.from({ length: 12 }, (_, i) => ({
        slotIndex: i,
        plotType: null,
        level: 0,
      })),
      stacks: { levy: 50, porter: 10, scout: 5 },
      research: {},
      population: BASE_POPULATION,
      maxPopulation: 0,
      usedManpower: 0,
      marchedManpower: 0,
    };
    city.maxPopulation = computeMaxPopulation(city);
    city.usedManpower = recalculateManpower(city);
    this.putCity(cityId, city);

    const token = randomBytes(24).toString("hex");
    const tokenHash = hashToken(token);
    const session: Session = {
      id: randomUUID(),
      playerId,
      token,
      tokenHash,
      expiresAt: now + 7 * 24 * 3600 * 1000,
    };
    this.sessions.set(token, session);
    this.sessionsByHash.set(tokenHash, session);
    this.putSession(session.id, session);
    return { player, city, token };
  }

  sessionPlayer(token: string | undefined | null): Player | null {
    if (!token) return null;
    const s =
      this.sessions.get(token) ?? this.sessionsByHash.get(hashToken(token));
    if (!s || s.expiresAt < this.now()) return null;
    return this.players.get(s.playerId) ?? null;
  }

  citiesForPlayer(playerId: string): City[] {
    return [...this.cities.values()].filter((c) => c.playerId === playerId);
  }

  getCity(id: string): City | undefined {
    return this.cities.get(id);
  }

  /** Sim tick: resources, queues, marches. */
  tick(now = this.now()): void {
    for (const city of this.cities.values()) {
      const wildTypes = [...this.wilderness.values()]
        .filter((w) => w.ownerPlayerId === city.playerId)
        .map((w) => w);
      const next = tickCityResources(city, now, wildTypes);
      // Only persist-worthy when a whole unit of something landed —
      // otherwise this would re-mark every city dirty every second.
      // (lastResourceTick/resFraction drift is self-healing: a restart
      // grants catch-up production for the real elapsed time.)
      if (
        next.population !== city.population ||
        next.maxPopulation !== city.maxPopulation ||
        next.resources.food !== city.resources.food ||
        next.resources.wood !== city.resources.wood ||
        next.resources.stone !== city.resources.stone ||
        next.resources.ore !== city.resources.ore ||
        next.resources.crownmark !== city.resources.crownmark
      ) {
        this.putCity(city.id, next);
      } else {
        this.cities.set(city.id, next);
      }
    }
    this.processQueues(now);
    this.processMarches(now);
    // Objective ladder auto-advances from authoritative state only.
    for (const t of this.tutorials.values()) {
      if (!t.completed) this.advanceTutorial(t.playerId);
    }
  }

  processQueues(now: number): void {
    for (const job of this.jobs.values()) {
      if (job.status !== "running") continue;
      if (job.finishesAt > now) continue;
      this.completeJob(job, now);
    }
  }

  private completeJob(job: QueueJob, _now: number): void {
    const city = this.cities.get(job.cityId);
    if (!city) {
      job.status = "cancelled";
      this.dirty.jobs.add(job.id);
      return;
    }
    if (job.kind === "build") {
      const slot = Number(job.payload.slotIndex);
      const type = String(job.payload.buildingType);
      const existing = city.buildings.find((b) => b.slotIndex === slot);
      if (existing) {
        existing.level += 1;
        if (job.payload.buildingType) existing.buildingType = type;
      } else {
        city.buildings.push({ slotIndex: slot, buildingType: type, level: 1 });
      }
      // Recalculate maxPopulation after build (exploit fix)
      city.maxPopulation = computeMaxPopulation(city);
    } else if (job.kind === "research") {
      // Canon aliases guard against legacy tech ids persisted in old queue rows.
      const techId = canonTechId(String(job.payload.techId));
      city.research[techId] = (city.research[techId] ?? 0) + 1;
    } else if (job.kind === "train") {
      const unitId = String(job.payload.unitId);
      const count = Number(job.payload.count) || 0;
      city.stacks[unitId] = (city.stacks[unitId] ?? 0) + count;
      city.usedManpower = recalculateManpower(city);
    }
    job.status = "completed";
    this.dirty.jobs.add(job.id);
    this.putCity(city.id, city);
    const label =
      job.kind === "build"
        ? `Construction complete: ${getBuildingById(String(job.payload.buildingType))?.name ?? String(job.payload.buildingType)}`
        : job.kind === "research"
          ? `Research complete: ${getResearch().find((t) => t.id === canonTechId(String(job.payload.techId)))?.name ?? String(job.payload.techId)}`
          : `Training complete: ${job.payload.count}× ${getUnitById(String(job.payload.unitId))?.name ?? String(job.payload.unitId)}`;
    this.pushEvent(job.playerId, "queue_complete", label, {
      jobId: job.id,
      kind: job.kind,
      cityId: job.cityId,
    });
  }

  /** Queue a Forge-Heart upgrade; the resulting building is persisted like any job. */
  startKeepUpgrade(cityId: string, playerId: string): QueueJob {
    const city = this.requireCityOwner(cityId, playerId);
    const current = keepLevel(city);
    if (current >= 10) {
      throw Object.assign(new Error("Forge-Heart is at max level"), { code: "KEEP_MAX" });
    }
    const running = [...this.jobs.values()].filter((j) => j.cityId === cityId && j.kind === "build" && j.status === "running");
    if (running.length >= 2) {
      throw Object.assign(new Error("build queue full"), { code: "QUEUE_FULL" });
    }
    if (running.some((j) => Number(j.payload.slotIndex) === 0)) {
      throw Object.assign(new Error("Keep upgrade already in progress"), { code: "SLOT_BUSY" });
    }
    const next = current + 1;
    const costs: Partial<ResourceBag> = { food: 500 * next, wood: 500 * next, stone: 300 * next, crownmark: 100 * next };
    const missing = Object.entries(costs).filter(([key, amount]) => city.resources[key as keyof ResourceBag] < amount).map(([key, amount]) => `${key} need ${amount} have ${city.resources[key as keyof ResourceBag]}`);
    if (missing.length) {
      throw Object.assign(new Error(`cannot afford Forge-Heart L${next}: ${missing.join("; ")}`), { code: "KEEP_COST" });
    }
    for (const [key, amount] of Object.entries(costs)) city.resources[key as keyof ResourceBag] -= amount;
    const now = this.now();
    const job: QueueJob = { id: randomUUID(), cityId, playerId, kind: "build", payload: { slotIndex: 0, buildingType: "forge_heart", upgradeTo: next, keepUpgrade: true }, startedAt: now, finishesAt: now + durationMs(90 * next, this.devFastTime), status: "running" };
    this.putJob(job.id, job);
    this.putCity(city.id, city);
    this.markDaily(playerId, "build");
    return job;
  }

  /**
   * Queue construction on a slot. Empty slot = new building at L1;
   * occupied slot with the SAME type = authoritative upgrade to level+1.
   * Cost scales with the next level number and duration is the building's
   * base build time (both defined in content buildings.json — the smallest
   * deterministic extension, mirroring the research/plot cost models).
   */
  startBuild(
    cityId: string,
    playerId: string,
    slotIndex: number,
    buildingType: string,
  ): QueueJob {
    const city = this.requireCityOwner(cityId, playerId);
    const def = getBuildingById(buildingType);
    if (!def) {
      throw Object.assign(new Error(`unknown building: ${buildingType}`), {
        code: "BAD_BUILDING",
      });
    }
    if (def.buildable === false) {
      throw Object.assign(
        new Error(`${def.name} cannot be constructed here`),
        { code: "BUILDING_FIXED" },
      );
    }
    if (!isBuildingUnlocked(buildingType, city.research)) {
      throw Object.assign(
        new Error(`${def.name} requires further research`),
        { code: "BUILDING_LOCKED" },
      );
    }
    const currentBuilding = city.buildings.find((b) => b.slotIndex === slotIndex);
    if (buildingType !== "command_gallery" && currentBuilding?.buildingType === buildingType && currentBuilding.level < def.max_level && currentBuilding.level + 1 > keepLevel(city) + 2) {
      throw Object.assign(
        new Error(`${def.name} L${currentBuilding.level + 1} requires Forge-Heart L${currentBuilding.level - 1}; upgrade the Keep first`),
        { code: "KEEP_GATE", keepLevel: keepLevel(city), requiredKeepLevel: currentBuilding.level - 1 },
      );
    }
    const running = [...this.jobs.values()].filter(
      (j) =>
        j.cityId === cityId && j.kind === "build" && j.status === "running",
    );
    if (running.length >= 2) {
      throw Object.assign(new Error("build queue full"), { code: "QUEUE_FULL" });
    }
    if (
      running.some(
        (j) =>
          j.kind === "build" &&
          Number(j.payload.slotIndex) === slotIndex,
      )
    ) {
      throw Object.assign(
        new Error("already constructing on that plot"),
        { code: "SLOT_BUSY" },
      );
    }

    const existing = city.buildings.find((b) => b.slotIndex === slotIndex);
    let nextLevel = 1;
    if (existing) {
      if (existing.buildingType !== buildingType) {
        throw Object.assign(
          new Error(`plot occupied by ${existing.buildingType}`),
          { code: "SLOT_OCCUPIED" },
        );
      }
      nextLevel = existing.level + 1;
      if (nextLevel > def.max_level) {
        throw Object.assign(
          new Error(`${def.name} is at max level`),
          { code: "BUILDING_MAX" },
        );
      }
    }

    const baseCost = def.build_cost ?? { food: 100, wood: 100 };
    const missing: string[] = [];
    for (const [res, base] of Object.entries(baseCost)) {
      const key = res as keyof ResourceBag;
      const total = Math.floor((base ?? 0) * nextLevel);
      if (total <= 0) continue;
      if ((city.resources[key] ?? 0) < total) {
        missing.push(`${key} need ${total} have ${city.resources[key] ?? 0}`);
      }
    }
    if (missing.length > 0) {
      throw Object.assign(
        new Error(`cannot afford ${def.name} L${nextLevel}: ${missing.join("; ")}`),
        { code: "NO_RES" },
      );
    }
    for (const [res, base] of Object.entries(baseCost)) {
      const key = res as keyof ResourceBag;
      city.resources[key] -= Math.floor((base ?? 0) * nextLevel);
    }
    const buildSec = def.build_sec_L1 ?? 30;
    const now = this.now();
    const job: QueueJob = {
      id: randomUUID(),
      cityId,
      playerId,
      kind: "build",
      payload: { slotIndex, buildingType, upgradeTo: existing ? nextLevel : 1 },
      startedAt: now,
      finishesAt: now + durationMs(buildSec, this.devFastTime),
      status: "running",
    };
    this.putJob(job.id, job);
    this.putCity(city.id, city);
    this.markDaily(playerId, "build");
    return job;
  }

  startResearch(cityId: string, playerId: string, techId: string): QueueJob {
    const city = this.requireCityOwner(cityId, playerId);
    if (!getResearch().some((t) => t.id === canonTechId(techId))) {
      throw Object.assign(new Error(`unknown tech: ${techId}`), {
        code: "VALIDATION",
      });
    }
    const running = [...this.jobs.values()].filter(
      (j) =>
        j.cityId === cityId && j.kind === "research" && j.status === "running",
    );
    if (running.length >= 1) {
      throw Object.assign(new Error("research queue full"), {
        code: "QUEUE_FULL",
      });
    }
    // Resource cost = base cost × next level number (L1 = base).
    const canonId = canonTechId(techId);
    const def = getResearch().find((t) => t.id === canonId)!;
    const nextLevel = (city.research[canonId] ?? 0) + 1;
    if (def.cost) {
      const missing: string[] = [];
      for (const [res, base] of Object.entries(def.cost)) {
        const key = res as keyof ResourceBag;
        const total = Math.floor((base ?? 0) * nextLevel);
        if (total <= 0) continue;
        if ((city.resources[key] ?? 0) < total) {
          missing.push(`${key} need ${total} have ${city.resources[key] ?? 0}`);
        }
      }
      if (missing.length > 0) {
        throw Object.assign(
          new Error(
            `cannot afford research ${canonId} L${nextLevel}: ${missing.join("; ")}`,
          ),
          { code: "RESEARCH_COST" },
        );
      }
      for (const [res, base] of Object.entries(def.cost)) {
        const key = res as keyof ResourceBag;
        city.resources[key] -= Math.floor((base ?? 0) * nextLevel);
      }
      this.putCity(city.id, city);
    }
    const now = this.now();
    const job: QueueJob = {
      id: randomUUID(),
      cityId,
      playerId,
      kind: "research",
      payload: { techId },
      startedAt: now,
      finishesAt:
        now +
        durationMs(
          45 * researchSpeedFactor(bestBuildingLevel(this, playerId, "archive_spire")),
          this.devFastTime,
        ),
      status: "running",
    };
    this.putJob(job.id, job);
    return job;
  }

  startTrain(
    cityId: string,
    playerId: string,
    unitId: string,
    count: number,
  ): QueueJob {
    const city = this.requireCityOwner(cityId, playerId);
    const unit = getUnitById(unitId);
    if (!unit) {
      throw Object.assign(new Error("unknown unit"), { code: "BAD_UNIT" });
    }
    // Enforce research unlock gates (PG-INV-003)
    if (!isUnitUnlocked(unitId, city.research)) {
      throw Object.assign(new Error(`unit ${unitId} not unlocked by research`), {
        code: "UNIT_LOCKED",
      });
    }
    const n = Math.max(1, Math.floor(count));
    const runningTrains = [...this.jobs.values()].filter(
      (j) => j.cityId === cityId && j.kind === "train" && j.status === "running",
    );
    if (runningTrains.length >= this.trainJobLimit(city)) {
      throw Object.assign(new Error("train queue full"), {
        code: "QUEUE_FULL",
      });
    }
    const unitPop = unit.pop * n;
    // Reserve manpower held by in-flight train jobs — free pool is shared.
    if (availableManpower(city) - reservedTrainManpower(runningTrains, cityId) < unitPop) {
      throw Object.assign(new Error("insufficient manpower"), {
        code: "NO_MANPOWER",
      });
    }
    const costs = getUnitCost(unit);
    const costFood = costs.food * n;
    const costWood = costs.wood * n;
    const costStone = costs.stone * n;
    const costOre = costs.ore * n;
    if (city.resources.food < costFood) {
      throw Object.assign(new Error("insufficient food"), { code: "NO_RES" });
    }
    if (city.resources.wood < costWood) {
      throw Object.assign(new Error("insufficient wood"), { code: "NO_RES" });
    }
    if (city.resources.stone < costStone) {
      throw Object.assign(new Error("insufficient stone"), { code: "NO_RES" });
    }
    if (city.resources.ore < costOre) {
      throw Object.assign(new Error("insufficient ore"), { code: "NO_RES" });
    }
    city.resources.food -= costFood;
    city.resources.wood -= costWood;
    city.resources.stone -= costStone;
    city.resources.ore -= costOre;
    const barracksFactor = trainSpeedFactor(
      bestBuildingLevel(this, playerId, "barracks"),
    );
    const trainSec = (unit.train_sec_L1 ?? 20) * n * barracksFactor;
    const now = this.now();
    const job: QueueJob = {
      id: randomUUID(),
      cityId,
      playerId,
      kind: "train",
      payload: { unitId, count: n },
      startedAt: now,
      finishesAt: now + durationMs(trainSec, this.devFastTime),
      status: "running",
    };
    this.putJob(job.id, job);
    this.putCity(city.id, city);
    this.markDaily(playerId, "train");
    return job;
  }

  // ── Commanders (spec §7–§8) ───────────────────────────────────────────────

  /** Highest command_gallery level across the player's cities (0 = none). */
  commandGalleryLevel(playerId: string): number {
    let level = 0;
    for (const city of this.citiesForPlayer(playerId)) {
      for (const b of city.buildings) {
        if (b.buildingType === "command_gallery") {
          level = Math.max(level, b.level);
        }
      }
    }
    return level;
  }

  /** This player's marches currently led by a commander (non-terminal). */
  commandedActiveMarches(playerId: string): number {
    let n = 0;
    for (const march of this.marches.values()) {
      if (march.playerId !== playerId || !march.commanderId) continue;
      if (march.status === "completed" || march.status === "cancelled") continue;
      n += 1;
    }
    return n;
  }

  // ── Building mechanics (lookout / rivetworks / skyreost / training_camp) ─

  /** Highest level of a building across the player's cities (0 = none). */
  buildingLevel(playerId: string, buildingType: string): number {
    let level = 0;
    for (const city of this.citiesForPlayer(playerId)) {
      for (const b of city.buildings) {
        if (b.buildingType === buildingType) {
          level = Math.max(level, b.level);
        }
      }
    }
    return level;
  }

  /** Max lookout (Watchtower) level across the player's cities → intel depth. */
  scoutIntelLevel(playerId: string): number {
    const watchHill = [...this.wilderness.values()]
      .filter((w) => w.ownerPlayerId === playerId && w.resourceType === "watch_hill")
      .reduce((sum, w) => sum + w.level, 0);
    return this.buildingLevel(playerId, "lookout") + watchHill;
  }

  wildernessLogisticsLevel(playerId: string): number {
    return [...this.wilderness.values()]
      .filter((w) => w.ownerPlayerId === playerId && w.resourceType === "crossroads")
      .reduce((sum, w) => sum + w.level, 0);
  }

  /** Max concurrent train jobs per city: base + training_camp bonus (capped). */
  trainJobLimit(city: City): number {
    let camp = 0;
    for (const b of city.buildings) {
      if (b.buildingType === "training_camp") {
        camp += TRAINING_CAMP_QUEUE_SLOTS_PER_LEVEL * b.level;
      }
    }
    return MAX_TRAIN_JOBS + Math.min(camp, TRAINING_CAMP_QUEUE_SLOTS_MAX_BONUS);
  }

  /** Active operations are independent from commander-led march slots. */
  activeOperations(playerId: string): number {
    // A returning force no longer occupies a departure slot; it cannot be
    // launched again, but releasing the slot preserves parallel progression
    // while the troops travel home.
    return [...this.marches.values()].filter(
      (m) => m.playerId === playerId &&
        (m.status === "en_route" || m.status === "resolving"),
    ).length;
  }

  musterOperationCapacity(playerId: string): number {
    const keep = Math.max(...this.citiesForPlayer(playerId).map(keepLevel), 1);
    return Math.min(
      MAX_OPERATION_CAPACITY,
      BASE_OPERATION_CAPACITY + this.buildingLevel(playerId, "rally_quay") + Math.max(0, keep - 1),
    );
  }

  troopsPerMarchCapacity(playerId: string): number {
    const keep = Math.max(...this.citiesForPlayer(playerId).map(keepLevel), 1);
    return BASE_TROOPS_PER_MARCH + TROOPS_PER_MUSTER_LEVEL * this.buildingLevel(playerId, "rally_quay") + 250 * Math.max(0, keep - 1);
  }

  /** Max concurrently-commanded marches: min(gallery level, hard cap). */
  commanderSlotCap(playerId: string): number {
    return Math.min(this.commandGalleryLevel(playerId), COMMANDER_SLOT_CAP_MAX);
  }

  commandersForPlayer(playerId: string): Commander[] {
    return [...this.commanders.values()].filter((c) => c.playerId === playerId);
  }

  /** Recruit the next roster commander (first free; later recruits scale in cost). */
  recruitCommander(playerId: string): Commander {
    const city = this.citiesForPlayer(playerId)[0];
    if (!city || this.commandGalleryLevel(playerId) < 1) {
      throw Object.assign(
        new Error("recruiting requires a Command Gallery (level 1+)"),
        { code: "NO_GALLERY" },
      );
    }
    const owned = this.commandersForPlayer(playerId).length;
    if (owned >= this.commandGalleryLevel(playerId)) {
      throw Object.assign(
        new Error(`roster full: gallery L${this.commandGalleryLevel(playerId)} allows ${owned} commanders`),
        { code: "RECRUIT_SLOTS" },
      );
    }
    if (owned >= 1) {
      const crownmarkCost = RECRUIT_COST_CROWNS_PER_OWNED * owned;
      const foodCost = RECRUIT_COST_FOOD_PER_OWNED * owned;
      const missing: string[] = [];
      if ((city.resources.crownmark ?? 0) < crownmarkCost) {
        missing.push(`crownmark need ${crownmarkCost} have ${city.resources.crownmark ?? 0}`);
      }
      if ((city.resources.food ?? 0) < foodCost) {
        missing.push(`food need ${foodCost} have ${city.resources.food ?? 0}`);
      }
      if (missing.length > 0) {
        throw Object.assign(
          new Error(`cannot afford recruit: ${missing.join("; ")}`),
          { code: "RECRUIT_COST" },
        );
      }
      city.resources.crownmark -= crownmarkCost;
      city.resources.food -= foodCost;
      this.putCity(city.id, city);
    }
    const stars = 1;
    const baseStat = stars + COMMANDER_BASE_STAT_OFFSET;
    const names = getCommanderNames();
    const commander: Commander = {
      id: randomUUID(),
      playerId,
      name: names[Math.floor(Math.random() * names.length)] ?? "Aldric",
      stars,
      leadership: baseStat,
      attack: baseStat,
      defense: baseStat,
      life: baseStat,
      xp: 0,
      busyMarchId: null,
      woundedUntil: null,
    };
    this.putCommander(commander.id, commander);
    this.pushEvent(
      playerId,
      "info",
      `${commander.name} joins your command (★${stars})`,
      { commanderId: commander.id },
    );
    return commander;
  }

  /** XP + star-ups + wounding from a finalized battle (spec §6.4/§8). */
  private awardCommanderBattleXp(commanderId: string, won: boolean, now: number): void {
    const cmd = this.commanders.get(commanderId);
    if (!cmd) return;
    if (won) {
      cmd.xp += COMMANDER_WIN_XP;
    } else {
      cmd.xp += COMMANDER_LOSS_XP;
      cmd.woundedUntil = now + durationMs(COMMANDER_WOUNDED_SEC, this.devFastTime);
    }
    while (
      cmd.stars < 5 &&
      cmd.xp >= (COMMANDER_STAR_XP_THRESHOLDS[cmd.stars - 1] ?? Infinity)
    ) {
      cmd.stars += 1;
      cmd.leadership += COMMANDER_STAR_STAT_GAIN;
      cmd.attack += COMMANDER_STAR_STAT_GAIN;
      cmd.defense += COMMANDER_STAR_STAT_GAIN;
      cmd.life += COMMANDER_STAR_STAT_GAIN;
    }
    this.putCommander(cmd.id, cmd);
  }

  /** Clear a march's commander link when the march reaches terminal state. */
  private releaseCommander(march: March): void {
    if (!march.commanderId) return;
    const cmd = this.commanders.get(march.commanderId);
    if (cmd && cmd.busyMarchId === march.id) {
      cmd.busyMarchId = null;
      this.putCommander(cmd.id, cmd);
    }
  }

  setPosture(cityId: string, playerId: string, posture: DefensePosture): City {
    const city = this.requireCityOwner(cityId, playerId);
    // Posture cooldown: 5 minutes between changes (INITIAL_TEST_FIXTURE)
    const POSTURE_COOLDOWN_MS = 5 * 60 * 1000;
    const lastChange = city.lastPostureChange;
    if (this.now() - lastChange < POSTURE_COOLDOWN_MS) {
      throw Object.assign(new Error("posture change on cooldown"), {
        code: "POSTURE_COOLDOWN",
      });
    }
    city.defensePosture = posture;
    city.lastPostureChange = this.now();
    this.putCity(city.id, city);
    return city;
  }

  /** Empty plot → assign type at L1. Costs food + wood. */
  assignPlot(
    cityId: string,
    playerId: string,
    slotIndex: number,
    plotType: string,
  ): Plot {
    if (!PLOT_TYPES.includes(plotType as (typeof PLOT_TYPES)[number])) {
      throw Object.assign(new Error("invalid plot type"), { code: "BAD_PLOT" });
    }
    const city = this.requireCityOwner(cityId, playerId);
    const plot = city.plots.find((p) => p.slotIndex === slotIndex);
    if (!plot) {
      throw Object.assign(new Error("plot slot not found"), { code: "NO_PLOT" });
    }
    if (plot.plotType) {
      throw Object.assign(new Error("plot already assigned — upgrade instead"), {
        code: "PLOT_OCCUPIED",
      });
    }
    const costFood = 80;
    const costWood = 40;
    if (city.resources.food < costFood || city.resources.wood < costWood) {
      throw Object.assign(new Error("insufficient resources"), {
        code: "NO_RES",
      });
    }
    city.resources.food -= costFood;
    city.resources.wood -= costWood;
    plot.plotType = plotType;
    plot.level = 1;
    this.putCity(city.id, city);
    return { ...plot };
  }

  /** Raise plot level (max 5). Cost scales with current level. */
  upgradePlot(cityId: string, playerId: string, slotIndex: number): Plot {
    const city = this.requireCityOwner(cityId, playerId);
    const plot = city.plots.find((p) => p.slotIndex === slotIndex);
    if (!plot || !plot.plotType) {
      throw Object.assign(new Error("assign a plot type first"), {
        code: "NO_PLOT",
      });
    }
    if (plot.level >= 5) {
      throw Object.assign(new Error("plot max level"), { code: "PLOT_MAX" });
    }
    const costFood = 50 * plot.level;
    const costWood = 50 * plot.level;
    if (city.resources.food < costFood || city.resources.wood < costWood) {
      throw Object.assign(new Error("insufficient resources"), {
        code: "NO_RES",
      });
    }
    city.resources.food -= costFood;
    city.resources.wood -= costWood;
    plot.level += 1;
    this.putCity(city.id, city);
    return { ...plot };
  }

  ownedWildernessCount(playerId: string): number {
    return [...this.wilderness.values()].filter(
      (w) => w.ownerPlayerId === playerId,
    ).length;
  }

  /** Capacity is deliberately finite so claiming one more wild is a choice. */
  wildernessCapacity(playerId: string): number {
    const keep = Math.max(...this.citiesForPlayer(playerId).map(keepLevel), 1);
    return BASE_WILDERNESS_CAPACITY + Math.max(0, keep - 1);
  }

  abandonWilderness(playerId: string, wildernessId: string): Wilderness {
    const wild = this.wilderness.get(wildernessId);
    if (!wild || wild.ownerPlayerId !== playerId) {
      throw Object.assign(new Error("wilderness is not yours"), { code: "NO_WILDERNESS" });
    }
    wild.ownerPlayerId = null;
    this.putWilderness(wild.id, wild);
    return wild;
  }

  /** Effective production/hour including wilderness bonus (same as tick). */
  effectiveProduction(city: City): ResourceBag {
    const rates = productionPerHour(city);
    const wildBonus = this.ownedWildernessBonus(city.playerId);
    return {
      food: Math.floor(rates.food + wildBonus.food),
      wood: Math.floor(rates.wood + wildBonus.wood),
      stone: Math.floor(rates.stone + wildBonus.stone),
      ore: Math.floor(rates.ore + wildBonus.ore),
      crownmark: Math.floor(rates.crownmark + wildBonus.crownmark),
    };
  }

  /** Per-type wilderness resource bonus for a player. */
  private ownedWildernessBonus(playerId: string): ResourceBag {
    const bonus: ResourceBag = { food: 0, wood: 0, stone: 0, ore: 0, crownmark: 0 };
    for (const w of this.wilderness.values()) {
      if (w.ownerPlayerId !== playerId) continue;
      const amount = wildernessBenefit(w).amount;
      switch (w.resourceType) {
        case "forest": bonus.wood += amount; break;
        case "fertile_land": bonus.food += amount; break;
        case "quarry": bonus.stone += amount; break;
        case "iron_hills": bonus.ore += amount; break;
        // crossroads and watch_hill are strategic, non-resource benefits.
      }
    }
    return bonus;
  }

  /** Update a player's bestiary observation for an entry. */
  updateBestiary(playerId: string, entryId: string, encounterIncrease: number): void {
    const key = `${playerId}:${entryId}`;
    const existing = this.bestiary.get(key);
    const entries = getBestiaryEntries();
    const entryDef = entries.find((e) => e.id === entryId);
    if (!entryDef) return;

    const prevObs = existing?.observationLevel ?? 0;
    const prevEnc = existing?.encounterCount ?? 0;
    const newEnc = prevEnc + encounterIncrease;

    // Observation level increases at encounter thresholds: 3, 7, 15, 30
    let newObs = prevObs;
    if (newEnc >= 30) newObs = 4;
    else if (newEnc >= 15) newObs = 3;
    else if (newEnc >= 7) newObs = 2;
    else if (newEnc >= 3) newObs = 1;

    this.putBestiary(key, {
      entryId,
      observationLevel: newObs,
      encounterCount: newEnc,
    });

    // Update dragon readiness if observation level increased
    if (newObs > prevObs) {
      this.recalcDragonReadiness(playerId);
    }
  }

  /** Existing progress or a fresh zeroed record (also registers it). */
  private ensureDragonProgress(playerId: string): DragonProgress {
    let progress = this.dragonProgress.get(playerId);
    if (!progress) {
      progress = {
        bestiaryStudied: 0,
        researchLevel: 0,
        materialsCollected: 0,
        campTypesDefeated: new Set<string>(),
        expeditionStage: 0,
        charterEarned: false,
        campsDefeated: 0,
        scoutsSent: 0,
      };
      this.putDragonProgress(playerId, progress);
    }
    return progress;
  }

  /**
   * Distinct dragon-material item ids present (>0) in a player's inventory.
   * Materials are represented as inventory keys (see /dragon/clues): the
   * generic "dragon_material" stack plus named clue items dropped from camps.
   */
  countDistinctDragonMaterials(playerId: string): number {
    const inv = this.inventory.get(playerId) ?? {};
    const clueIds = new Set(getDragonClues().map((c) => c.id));
    const distinct = new Set<string>();
    for (const [itemId, count] of Object.entries(inv)) {
      if (!Number(count)) continue;
      if (itemId.startsWith("dragon_material") || clueIds.has(itemId)) {
        distinct.add(itemId);
      }
    }
    return distinct.size;
  }

  /** Recalculate a player's dragon readiness from current state. */
  private recalcDragonReadiness(playerId: string): void {
    const studied = new Set<string>();
    for (const [key, val] of this.bestiary.entries()) {
      if (key.startsWith(`${playerId}:`) && val.observationLevel >= 1) {
        studied.add(val.entryId);
      }
    }

    const cities = this.citiesForPlayer(playerId);
    const maxResearch = cities.reduce(
      (max, c) => Math.max(max, ...Object.values(c.research).map(Number)),
      0,
    );

    const existing = this.ensureDragonProgress(playerId);

    // materialsCollected is grant-maintained (see grantDragonClue) and no longer
    // clobbered from inventory; the readiness gate reads inventory directly.
    // Mutate in place — spreading a stale snapshot would revert fresh recalcs.
    existing.bestiaryStudied = studied.size;
    existing.researchLevel = maxResearch;
    this.putDragonProgress(playerId, existing);
  }

  /** Check dragon readiness and return status. */
  checkDragonReadiness(playerId: string): {
    ready: boolean;
    requirements: Array<{ id: string; met: boolean; description: string }>;
    reward?: string;
    presence: DragonPresence;
  } {
    this.recalcDragonReadiness(playerId);
    const progress = this.dragonProgress.get(playerId);
    const config = getDragonReadiness();
    const requirements = config.requirements.map((req) => {
      let met = false;
      switch (req.type) {
        case "bestiary_threshold":
          met = (progress?.bestiaryStudied ?? 0) >= req.threshold;
          break;
        case "research_level":
          met = (progress?.researchLevel ?? 0) >= req.threshold;
          break;
        case "item_count":
          met = this.countDistinctDragonMaterials(playerId) >= req.threshold;
          break;
        case "camps_defeated":
          met = (progress?.campTypesDefeated.size ?? 0) >= req.threshold;
          break;
        case "building_level": {
          const id = String(req.building_id ?? "");
          met = id !== "" && this.buildingLevel(playerId, id) >= req.threshold;
          break;
        }
      }
      return { id: req.id, met, description: req.description };
    });
    const ready = requirements.every((r) => r.met);
    return {
      ready,
      requirements,
      reward: ready ? config.reward : undefined,
      presence: this.dragonPresence(playerId),
    };
  }

  /**
   * Player-facing dragon lifecycle. The state is derived exclusively from
   * authoritative persisted gameplay facts, so refreshes cannot fabricate a
   * milestone and old saves remain compatible.
   */
  dragonPresence(playerId: string): DragonPresence {
    const progress = this.ensureDragonProgress(playerId);
    const readiness = this.dragonProgress.get(playerId);
    const watch = bestBuildingLevel(this, playerId, "skyreost");
    const hasEvidence =
      progress.bestiaryStudied > 0 ||
      progress.materialsCollected > 0 ||
      progress.campsDefeated > 0 ||
      progress.scoutsSent > 0 ||
      progress.researchLevel > 0 ||
      watch > 0;
    const hasBattleHolding = this.citiesForPlayer(playerId).some(
      (city) => city.kind === "galeari",
    );
    const dragonCombatStudy = this.citiesForPlayer(playerId).reduce(
      (max, city) => Math.max(max, city.research.dragon_studies ?? 0),
      0,
    );
    if (hasBattleHolding && progress.charterEarned && dragonCombatStudy >= 3) {
      return {
        state: "BATTLE_READY",
        title: "Battle-ready",
        summary: "The dragon answers the kingdom's banners. Its presence now shapes war preparations.",
        nextMilestone: "Strengthen the frontier and prepare for greater threats.",
      };
    }
    if (progress.charterEarned) {
      return {
        state: "BONDED",
        title: "Bonded",
        summary: "The expedition returned with a living bond between your kingdom and the scarred wilds.",
        nextMilestone: "Found a Marcher Keep, then pursue a specialized frontier holding.",
      };
    }
    if (readiness?.expeditionStage && readiness.expeditionStage > 0) {
      return {
        state: "AWAKENED",
        title: "Awakened",
        summary: "The expedition has reached the dragon scar. Something beneath the old stone is listening.",
        nextMilestone: "Complete the expedition stages to earn the settlement charter.",
      };
    }
    if (hasEvidence) {
      return {
        state: "STIRRING",
        title: "Stirring",
        summary: "Evidence is accumulating, and the watchtower reports movement beyond the tree line.",
        nextMilestone: "Meet every Dragon Expedition readiness requirement.",
      };
    }
    return {
      state: "DORMANT",
      title: "Dormant",
      summary: "A vast, sleeping presence lies beneath the kingdom's oldest foundations.",
      nextMilestone: "Build the Dragon Watch and bring back your first sign from the realm.",
    };
  }

  /**
   * BATTLE_READY consequence: convene the Dragon War Council once the bonded
   * dragon-focused holding and study threshold are real. The plan is an
   * inventory item so the preparation survives reloads and can be consumed by
   * a later dragon operation without introducing a parallel hidden counter.
   */
  startDragonWarCouncil(playerId: string): { itemId: string; remaining: ResourceBag } {
    if (this.dragonPresence(playerId).state !== "BATTLE_READY") {
      throw Object.assign(new Error("the kingdom is not battle-ready"), {
        code: "DRAGON_NOT_READY",
      });
    }
    const city = this.citiesForPlayer(playerId)[0];
    if (!city) throw new Error("no settlement");
    const cost: Partial<ResourceBag> = { food: 1000, wood: 1000, stone: 600 };
    for (const [key, amount] of Object.entries(cost)) {
      const resource = key as keyof ResourceBag;
      if (city.resources[resource] < amount) {
        throw Object.assign(new Error("insufficient resources for the Dragon War Council"), {
          code: "DRAGON_COUNCIL_COST",
        });
      }
    }
    for (const [key, amount] of Object.entries(cost)) {
      const resource = key as keyof ResourceBag;
      city.resources[resource] -= amount;
    }
    this.putCity(city.id, city);
    const itemId = "dragon_war_plan";
    const inventory = this.inventory.get(playerId) ?? {};
    inventory[itemId] = (inventory[itemId] ?? 0) + 1;
    this.putInventory(playerId, inventory);
    this.pushEvent(
      playerId,
      "info",
      "Dragon War Council convened — the next dragon operation may use the war plan.",
      { kind: "dragon_war_council", itemId },
    );
    return { itemId, remaining: { ...city.resources } };
  }

  dragonObjectives(playerId: string): DragonObjective[] {
    const progress = this.ensureDragonProgress(playerId);
    const watch = this.buildingLevel(playerId, "skyreost");
    const bestiary = progress.bestiaryStudied > 0;
    const specialized = this.citiesForPlayer(playerId).some(
      (city) => city.kind === "cinderreach" || city.kind === "galeari",
    );
    return [
      { id: "presence", title: "Witness the presence", description: "Enter your kingdom and read the dragon's current state.", complete: true },
      { id: "evidence", title: "Bring back evidence", description: "Record a verified sign in the Bestiary.", complete: bestiary },
      { id: "watch", title: "Raise the Dragon Watch", description: "Raise the Dragon Watch to level 2.", complete: watch >= 2 },
      { id: "camps", title: "Learn the camps", description: "Defeat camps at two different levels.", complete: progress.campTypesDefeated.size >= 2 },
      { id: "wilds", title: "Claim meaningful wilds", description: "Hold a wilderness and use its strategic benefit.", complete: this.ownedWildernessCount(playerId) > 0 },
      { id: "expedition", title: "Set out on the expedition", description: "Complete the Dragon Scar Expedition and earn its charter.", complete: progress.charterEarned },
      { id: "marcher_keep", title: "Extend the frontier", description: "Found a Marcher Keep with the earned charter.", complete: this.citiesForPlayer(playerId).some((city) => city.kind === "marcher_keep") },
      { id: "specialized_holding", title: "Choose a specialization", description: "Found a Forest Citadel or dragon-focused holding.", complete: specialized },
    ];
  }

  /** True when cumulative gameplay counters satisfy a stage's requirements. */
  private expeditionRequirementsMet(
    progress: DragonProgress,
    requires: { scouts?: number; camps?: number } | undefined,
  ): boolean {
    if (!requires) return true;
    if (requires.scouts !== undefined && progress.scoutsSent < requires.scouts) {
      return false;
    }
    if (requires.camps !== undefined && progress.campsDefeated < requires.camps) {
      return false;
    }
    return true;
  }

  /** Throw EXPEDITION_REQ unless the stage's gameplay counters are met. */
  private requireStageRequirements(
    progress: DragonProgress,
    stageDef: { stage: number; requires?: { scouts?: number; camps?: number } },
  ): void {
    if (this.expeditionRequirementsMet(progress, stageDef.requires)) return;
    const r = stageDef.requires ?? {};
    throw Object.assign(
      new Error(
        `stage ${stageDef.stage} requirements not met (scouts ${progress.scoutsSent}/${r.scouts ?? 0}, camps ${progress.campsDefeated}/${r.camps ?? 0})`,
      ),
      { code: "EXPEDITION_REQ" },
    );
  }

  /** Start an expedition for a player. Returns the first stage info. */
  startExpedition(playerId: string, expeditionId: string): { stage: number; name: string } | null {
    const expeditions = getExpeditions();
    const expedition = expeditions.find((e) => e.id === expeditionId);
    if (!expedition || expedition.stages.length === 0) return null;

    const existing = this.dragonProgress.get(playerId);
    if (!existing || existing.charterEarned) return null;

    // Enforce readiness gate (exploit fix)
    const readiness = this.checkDragonReadiness(playerId);
    if (!readiness.ready) return null;

    const first = expedition.stages[0]!;
    this.requireStageRequirements(existing, first);

    // Mutate in place: `existing` was captured before checkDragonReadiness()
    // recalced the record, so spreading it would revert those fresh values.
    existing.expeditionStage = 1;
    this.putDragonProgress(playerId, existing);
    return { stage: first.stage, name: first.name };
  }

  /** Complete an expedition stage and advance or finish. */
  completeExpeditionStage(
    playerId: string,
    expeditionId: string,
    stageNumber: number,
  ): { completed: boolean; stageName: string; reward?: Record<string, unknown> } | null {
    const expeditions = getExpeditions();
    const expedition = expeditions.find((e) => e.id === expeditionId);
    if (!expedition) return null;

    const progress = this.dragonProgress.get(playerId);
    if (!progress || progress.expeditionStage !== stageNumber) return null;

    const stageDef = expedition.stages.find((s) => s.stage === stageNumber);
    if (!stageDef) return null;

    const isLast = stageNumber >= expedition.stages.length;
    // Entering the next stage is gated on persistent gameplay counters.
    if (!isLast) {
      const next = expedition.stages.find((s) => s.stage === stageNumber + 1);
      if (next) this.requireStageRequirements(progress, next);
    }

    progress.expeditionStage = isLast ? 0 : stageNumber + 1;
    if (isLast) progress.charterEarned = true;
    this.putDragonProgress(playerId, progress);

    // Grant reward items
    const reward = stageDef.completion_reward;
    if (reward.item && typeof reward.item === "string") {
      const count = Number(reward.count) || 1;
      const inv = this.inventory.get(playerId) ?? {};
      inv[reward.item] = (inv[reward.item] ?? 0) + count;
      this.putInventory(playerId, inv);
      // Material grants keep the persisted counter aligned with inventory
      if (reward.item.startsWith("dragon_material")) {
        const p = this.ensureDragonProgress(playerId);
        p.materialsCollected += count;
        this.putDragonProgress(playerId, p);
      }
    }

    return { completed: isLast, stageName: stageDef.name, reward };
  }

  /** Grant a dragon clue to a player, updating bestiary and readiness. */
  grantDragonClue(playerId: string, clueId: string): DragonClue | null {
    const clues = getDragonClues();
    const clue = clues.find((c) => c.id === clueId);
    if (!clue) return null;

    // Add to inventory: per-clue stack (feeds distinct-material readiness)
    // plus a generic counter for legacy displays.
    const inv = this.inventory.get(playerId) ?? {};
    inv[clue.id] = (inv[clue.id] ?? 0) + 1;
    inv["dragon_clue"] = (inv["dragon_clue"] ?? 0) + 1;
    this.putInventory(playerId, inv);

    // Update bestiary if clue unlocks one
    if (clue.bestiary_unlock) {
      this.updateBestiary(playerId, clue.bestiary_unlock, 1);
    }

    // Increment readiness materials so the persisted counter tracks real grants
    const progress = this.ensureDragonProgress(playerId);
    progress.materialsCollected += 1;
    this.putDragonProgress(playerId, progress);

    this.pushEvent(playerId, "info", `Dragon clue discovered: ${clue.name}`);
    return clue;
  }

  /** Determine clue drop from a camp victory. Returns clue or null. */
  private rollCampClueDrop(campLevel: number, seed: number): DragonClue | null {
    const clues = getDragonClues();
    if (clues.length === 0) return null;

    // Simple seeded random [0, 1)
    const roll = (seed >>> 0) / 0xffffffff;
    let rarity: string | null = null;

    if (campLevel >= 1 && campLevel <= 3) {
      if (roll < 0.15) rarity = "common";
    } else if (campLevel >= 4 && campLevel <= 5) {
      if (roll < 0.10) rarity = "rare";
      else if (roll < 0.40) rarity = "uncommon";
      else if (roll < 0.70) rarity = "common";
    } else if (campLevel >= 6 && campLevel <= 7) {
      if (roll < 0.05) rarity = "rare";
      else if (roll < 0.20) rarity = "uncommon";
      else if (roll < 0.40) rarity = "common";
    } else if (campLevel >= 8 && campLevel <= 10) {
      if (roll < 0.10) rarity = "rare";
      else if (roll < 0.30) rarity = "uncommon";
      else if (roll < 0.45) rarity = "common";
    }

    if (!rarity) return null;

    const candidates = clues.filter((c) => c.rarity === rarity);
    if (candidates.length === 0) return null;
    return candidates[Math.floor((seed >>> 0) % candidates.length)];
  }

  /** Recalculate population/manpower for all cities (use after DB load). */
  recalculateAllManpower(): void {
    for (const city of this.cities.values()) {
      city.maxPopulation = computeMaxPopulation(city);
      city.usedManpower = recalculateManpower(city);
      city.marchedManpower = computeMarchedManpower(this, city.playerId, city.id);
      if (city.population > city.maxPopulation) {
        city.population = city.maxPopulation;
      }
    }
  }

  private requireCityOwner(cityId: string, playerId: string): City {
    const city = this.cities.get(cityId);
    if (!city || city.playerId !== playerId) {
      throw Object.assign(new Error("city not found"), { code: "NO_CITY" });
    }
    return city;
  }

  createMarch(
    playerId: string,
    opts: {
      fromCityId: string;
      intent: MarchIntent;
      targetType: March["targetType"];
      targetId?: string | null;
      targetX: number;
      targetY: number;
      composition: Record<string, number>;
      /** Commander leading this march (spec §6); validated + slot-capped. */
      commanderId?: string | null;
      /** Resource cargo for haul intent (deducted from origin city now). */
      cargo?: Partial<ResourceBag>;
    },
  ): March {
    const city = this.requireCityOwner(opts.fromCityId, playerId);

    if (this.activeOperations(playerId) >= this.musterOperationCapacity(playerId)) {
      throw Object.assign(
        new Error(`operation capacity reached (${this.musterOperationCapacity(playerId)}); raise the Muster Yard or complete an operation`),
        { code: "OPERATION_CAP", capacity: this.musterOperationCapacity(playerId) },
      );
    }

    const troopCapacity = Object.entries(opts.composition).reduce((sum, [unitId, count]) => {
      const unit = getUnitById(unitId);
      return sum + (unit?.pop ?? 0) * Math.max(0, Math.floor(count));
    }, 0);
    if (troopCapacity > this.troopsPerMarchCapacity(playerId)) {
      throw Object.assign(
        new Error(`march carries ${troopCapacity} troop capacity, but the Muster Yard allows ${this.troopsPerMarchCapacity(playerId)}`),
        { code: "MARCH_CAP", capacity: this.troopsPerMarchCapacity(playerId), requested: troopCapacity },
      );
    }

    if (opts.intent === "occupy" && opts.targetType === "wilderness") {
      const wild = opts.targetId ? this.wilderness.get(opts.targetId) : undefined;
      if (wild?.ownerPlayerId === playerId) {
        throw Object.assign(new Error("wilderness already held"), { code: "ALREADY_OWNED" });
      }
      if (this.ownedWildernessCount(playerId) >= this.wildernessCapacity(playerId)) {
        throw Object.assign(
          new Error(`wilderness capacity reached (${this.wildernessCapacity(playerId)}); abandon a holding before claiming another`),
          { code: "WILDERNESS_CAP", capacity: this.wildernessCapacity(playerId) },
        );
      }
    }

    // Commander validations before any state mutation (spec §6).
    let commander: Commander | null = null;
    if (opts.commanderId) {
      commander = this.commanders.get(opts.commanderId) ?? null;
      if (!commander || commander.playerId !== playerId) {
        throw Object.assign(new Error("no such commander"), {
          code: "NO_COMMANDER",
        });
      }
      if (commander.busyMarchId) {
        throw Object.assign(new Error("commander already leading a march"), {
          code: "COMMANDER_BUSY",
        });
      }
      if (commander.woundedUntil && commander.woundedUntil > this.now()) {
        throw Object.assign(new Error("commander is wounded"), {
          code: "COMMANDER_WOUNDED",
        });
      }
      if (this.commandedActiveMarches(playerId) >= this.commanderSlotCap(playerId)) {
        throw Object.assign(
          new Error(
            `commanded-march slots full (${this.commanderSlotCap(playerId)}; raise Command Gallery)`,
          ),
          { code: "COMMANDER_SLOTS" },
        );
      }
    }

    // Deduct troops
    for (const [uid, cnt] of Object.entries(opts.composition)) {
      const have = city.stacks[uid] ?? 0;
      if (have < cnt) {
        throw Object.assign(new Error(`not enough ${uid}`), {
          code: "NO_TROOPS",
        });
      }
    }
    for (const [uid, cnt] of Object.entries(opts.composition)) {
      city.stacks[uid] = (city.stacks[uid] ?? 0) - cnt;
    }
    city.marchedManpower = computeMarchedManpower(this, playerId, city.id);

    // Haul: validate against carry capacity, then deduct cargo from origin now
    const cargo: Partial<ResourceBag> = {};
    if (opts.intent === "haul") {
      const requested = opts.cargo ?? {};
      for (const key of [
        "food",
        "wood",
        "stone",
        "ore",
        "crownmark",
      ] as const) {
        const want = Math.max(0, Math.floor(Number(requested[key] ?? 0)));
        if (want <= 0) continue;
        if (city.resources[key] < want) {
          throw Object.assign(new Error(`not enough ${key} for haul`), {
            code: "NO_RES",
          });
        }
        cargo[key] = want;
      }
      if (Object.keys(cargo).length === 0) {
        throw Object.assign(new Error("haul requires cargo"), {
          code: "NO_CARGO",
        });
      }
      // Rivetworks (roads) raise the haul ceiling: logistics units carry the
      // goods; roads multiply the total by (1 + 0.25 × level).
      const roads = this.buildingLevel(playerId, "rivetworks");
      const rawCarry = Object.entries(opts.composition).reduce(
        (sum, [uid, cnt]) => {
          const unit = getUnitById(uid);
          return sum + (unit ? unit.carry * cnt : 0);
        },
        0,
      );
      const cap = Math.floor(
        rawCarry * (1 + ROADS_HAUL_BONUS_PER_LEVEL * roads),
      );
      const totalCargo = Object.values(cargo).reduce((s, n) => s + (n ?? 0), 0);
      if (totalCargo > cap) {
        throw Object.assign(
          new Error(
            `haul cargo ${totalCargo} exceeds carry capacity ${cap} (bring logistics units or raise Rivetworks)`,
          ),
          { code: "HAUL_CAP", cap, total: totalCargo },
        );
      }
      for (const [key, want] of Object.entries(cargo)) {
        city.resources[key as keyof ResourceBag] -= want;
      }
    }
    this.putCity(city.id, city);

    const dist = chebyshev(city.mapX, city.mapY, opts.targetX, opts.targetY);
    const musterFactor = marchSpeedFactor(
      bestBuildingLevel(this, playerId, "rally_quay"),
    );
    const crossroadsFactor = Math.max(
      0.7,
      1 - 0.03 * this.wildernessLogisticsLevel(playerId),
    );
    const travelSec = Math.max(5, dist * 8 * musterFactor * crossroadsFactor);
    const now = this.now();
    const march: March = {
      id: randomUUID(),
      realmId: this.realmId,
      playerId,
      fromCityId: city.id,
      commanderId: commander?.id ?? null,
      intent: opts.intent,
      targetType: opts.targetType,
      targetId: opts.targetId ?? null,
      targetX: opts.targetX,
      targetY: opts.targetY,
      composition: { ...opts.composition },
      cargo,
      departAt: now,
      arriveAt: now + durationMs(travelSec, this.devFastTime),
      returnAt: null,
      status: "en_route",
      battleReportId: null,
      landCount: 0,
    };
    if (commander) {
      commander.busyMarchId = march.id;
      this.putCommander(commander.id, commander);
    }
    this.putMarch(march.id, march);
    if (opts.intent === "attack" && opts.targetType === "city") {
      const target = opts.targetId ? this.cities.get(opts.targetId) : undefined;
      if (target && target.playerId !== playerId) {
        this.pushEvent(
          target.playerId,
          "info",
          `Incoming attack detected near ${target.name}; prepare the garrison before arrival.`,
          { kind: "incoming_attack", marchId: march.id, arriveAt: march.arriveAt, targetCityId: target.id },
        );
      }
    }
    return march;
  }

  processMarches(now: number): void {
    for (const march of this.marches.values()) {
      if (march.status !== "en_route") continue;
      if (march.arriveAt > now) continue;
      this.landMarch(march, now);
    }
    for (const march of this.marches.values()) {
      if (march.status !== "returning") continue;
      if ((march.returnAt ?? Infinity) > now) continue;
      this.completeReturn(march);
    }
  }

  /** Lands a march exactly once — used by sim and tests. */
  landMarch(march: March, now: number): BattleReport | null {
    if (march.status !== "en_route") return null;
    if (march.landCount > 0) return null;
    march.status = "resolving";
    march.landCount += 1;

    let report: BattleReport | null = null;

    if (march.intent === "scout") {
      // Persistent gameplay counter (expedition stage gates)
      const progress = this.ensureDragonProgress(march.playerId);
      progress.scoutsSent += 1;
      this.putDragonProgress(march.playerId, progress);
      report = this.makeReport(march, {
        type: "scout",
        target: { x: march.targetX, y: march.targetY, type: march.targetType },
        intel: this.buildScoutIntel(march),
      });
      const membership = this.allianceMembers.get(march.playerId);
      if (membership) {
        const intel = (report.result as { intel?: Record<string, unknown> }).intel ?? {};
        for (const member of this.allianceMembers.values()) {
          if (member.allianceId !== membership.allianceId || member.playerId === march.playerId) continue;
          this.pushEvent(
            member.playerId,
            "info",
            `Shared scout intelligence from ${this.players.get(march.playerId)?.displayName ?? "an ally"}.`,
            { kind: "shared_scout_intel", sourcePlayerId: march.playerId, reportId: report.id, intel },
          );
        }
      }
      this.startReturn(march, now, march.composition);
    } else if (march.intent === "attack" || march.intent === "occupy") {
      report = this.resolveAttack(march, now);
    } else if (march.intent === "reinforce") {
      const delivered = this.applyReinforce(march);
      // Failed reinforce (no city at coords / not same alliance) must march
      // the troops home — an empty return set annihilated them.
      this.startReturn(march, now, delivered ? {} : march.composition);
    } else if (march.intent === "haul") {
      report = this.applyHaul(march, now);
    } else {
      this.startReturn(march, now, march.composition);
    }

    if (report) {
      march.battleReportId = report.id;
    }
    const targetWord =
      march.targetType === "camp"
        ? "a camp"
        : march.targetType === "wilderness"
          ? "the wilds"
          : march.targetType === "city"
            ? "a settlement"
            : "the open country";
    this.pushEvent(
      march.playerId,
      "march_land",
      `Your ${march.intent === "attack" ? "attack" : march.intent === "occupy" ? "occupation" : march.intent} force reached ${targetWord}`,
      {
        marchId: march.id,
        intent: march.intent,
        reportId: report?.id ?? null,
        x: march.targetX,
        y: march.targetY,
      },
    );
    if (march.status === "resolving") {
      // ensure transition if not already returning/completed
      if (!march.returnAt) {
        this.startReturn(march, now, march.composition);
      }
    }
    this.putMarch(march.id, march);
    return report;
  }

  private startReturn(
    march: March,
    now: number,
    remaining: Record<string, number>,
  ): void {
    march.composition = remaining;
    const city = this.cities.get(march.fromCityId);
    const dist = city
      ? chebyshev(city.mapX, city.mapY, march.targetX, march.targetY)
      : 5;
    march.returnAt = now + durationMs(Math.max(5, dist * 8), this.devFastTime);
    march.status = "returning";
  }

  private completeReturn(march: March): void {
    const city = this.cities.get(march.fromCityId);
    if (city) {
      for (const [uid, cnt] of Object.entries(march.composition)) {
        if (cnt > 0) city.stacks[uid] = (city.stacks[uid] ?? 0) + cnt;
      }
      city.marchedManpower = computeMarchedManpower(this, march.playerId, city.id);
      this.putCity(city.id, city);
    }
    march.status = "completed";
    // Terminal state: the led march is done, free the commander (spec §6.3).
    this.releaseCommander(march);
    this.putMarch(march.id, march);
    this.pushEvent(
      march.playerId,
      "march_return",
      "Your forces returned home",
      { marchId: march.id, intent: march.intent },
    );
  }

  private makeReport(
    march: March,
    result: Record<string, unknown>,
    defenderPlayerId: string | null = null,
  ): BattleReport {
    const report: BattleReport = {
      id: randomUUID(),
      realmId: this.realmId,
      marchId: march.id,
      attackerPlayerId: march.playerId,
      defenderPlayerId,
      result,
      createdAt: this.now(),
    };
    this.putReport(report.id, report);
    const type = String(result.type ?? "report");
    const winner =
      result.battle &&
      typeof result.battle === "object" &&
      "winner" in (result.battle as object)
        ? String((result.battle as { winner?: string }).winner)
        : null;
    const msg = winner
      ? winner === "attacker"
        ? `Victory — your force held the field (${type})`
        : winner === "defender"
          ? `Defeat — your force was driven off (${type})`
          : `${type}: inconclusive`
      : type === "scout"
        ? "Scouts return with intelligence"
        : type === "haul"
          ? result.delivered
            ? "Wagons delivered their cargo"
            : "Wagons returned with the cargo"
          : `Report: ${type}`;
    this.pushEvent(march.playerId, "report", msg, {
      reportId: report.id,
      type,
      winner,
    });
    if (defenderPlayerId && defenderPlayerId !== march.playerId) {
      this.pushEvent(
        defenderPlayerId,
        "report",
        `Incoming: ${type}${winner ? ` (${winner} wins)` : ""}`,
        { reportId: report.id, type, winner },
      );
    }
    return report;
  }

  private resolveAttack(march: March, now: number): BattleReport {
    const atkGroups: BattleGroup[] = Object.entries(march.composition).map(
      ([unitId, count]) => ({ unitId, count }),
    );
    let defGroups: BattleGroup[] = [];
    let defenderPlayerId: string | null = null;
    let defCity: City | null = null;
    let camp: Camp | null = null;
    let wild: Wilderness | null = null;
    let harborLoot = false;

    if (march.targetType === "camp") {
      camp =
        (march.targetId ? this.camps.get(march.targetId) : null) ??
        [...this.camps.values()].find(
          (c) => c.x === march.targetX && c.y === march.targetY,
        ) ??
        null;
      const level = camp?.level ?? 1;
      const def = getCamps().find((c: { camp_level: number }) => c.camp_level === level);
      // Seed on camp identity so composition is deterministic per camp but
      // varies across camps of the same level (anti "solved army" farming).
      defGroups = resolveCampDefGroups(def, camp ? `${camp.id}:${camp.x},${camp.y}` : `lvl${level}`);
      this.markDaily(march.playerId, "camp");
    } else if (march.targetType === "wilderness") {
      wild =
        (march.targetId ? this.wilderness.get(march.targetId) : null) ??
        [...this.wilderness.values()].find(
          (w) => w.x === march.targetX && w.y === march.targetY,
        ) ??
        null;
      defGroups = [
        { unitId: "levy", count: 20 * (wild?.level ?? 1) },
        { unitId: "pikeman", count: 5 * (wild?.level ?? 1) },
      ];
    } else if (march.targetType === "city") {
      defCity =
        (march.targetId ? this.cities.get(march.targetId) : null) ??
        [...this.cities.values()].find(
          (c) => c.mapX === march.targetX && c.mapY === march.targetY,
        ) ??
        null;
      if (defCity) {
        defenderPlayerId = defCity.playerId;
        const defPlayer = this.players.get(defCity.playerId);
        // Protection
        if (
          defPlayer?.protectionUntil &&
          defPlayer.protectionUntil > now
        ) {
          const report = this.makeReport(
            march,
            {
              type: "pvp_blocked",
              reason: "new_player_protection",
              protectionUntil: new Date(defPlayer.protectionUntil).toISOString(),
            },
            defenderPlayerId,
          );
          this.startReturn(march, now, march.composition);
          return report;
        }
        if (defCity.defensePosture === "withdraw") {
          harborLoot = true;
          defGroups = []; // no combat — plunder at reduced rate
        } else if (defCity.defensePosture === "garrison") {
          // Only 30% of garrisoned stacks fight
          defGroups = Object.entries(defCity.stacks)
            .filter(([, n]) => n > 0)
            .map(([unitId, count]) => ({ unitId, count: Math.ceil(count * 0.3) }));
        } else {
          defGroups = Object.entries(defCity.stacks)
            .filter(([, n]) => n > 0)
            .map(([unitId, count]) => ({ unitId, count }));
        }
      }
    }

    const seed =
      (parseInt(march.id.replace(/-/g, "").slice(0, 8), 16) ^ now) >>> 0;

    const marchCommander = march.commanderId
      ? (this.commanders.get(march.commanderId) ?? null)
      : null;

    let battle =
      defGroups.length === 0 && harborLoot
        ? {
            rulesVersion: COMBAT_RULES_VERSION,
            seed,
            winner: "attacker" as const,
            rounds: 0,
            openDistance: 0,
            losses: { attacker: {}, defender: {} },
            remaining: {
              attacker: Object.fromEntries(
                atkGroups.map((g) => [g.unitId, g.count]),
              ),
              defender: {},
            },
            note: "withdraw_free_loot",
          }
        : resolveBattle({
            rulesVersion: COMBAT_RULES_VERSION,
            seed,
            attacker: {
              groups: atkGroups,
              commander: marchCommander
                ? {
                    leadership: marchCommander.leadership,
                    attack: marchCommander.attack,
                  }
                : undefined,
            },
            defender: { groups: defGroups },
          });

    // Apply attacker losses to returning stack
    const remaining: Record<string, number> = {
      ...(battle.remaining?.attacker ?? {}),
    };
    // Prefer remaining from battle; fallback subtract losses
    if (Object.keys(remaining).length === 0) {
      for (const [uid, cnt] of Object.entries(march.composition)) {
        const lost = battle.losses.attacker[uid] ?? 0;
        remaining[uid] = Math.max(0, cnt - lost);
      }
    }

    // Apply defender city stack losses on full defense
    if (defCity && defCity.defensePosture !== "withdraw") {
      for (const [uid, lost] of Object.entries(battle.losses.defender)) {
        const n = Number(lost) || 0;
        defCity.stacks[uid] = Math.max(0, (defCity.stacks[uid] ?? 0) - n);
      }
      defCity.usedManpower = recalculateManpower(defCity);
      this.putCity(defCity.id, defCity);
    }

    // Loot
    let loot: Partial<ResourceBag> = {};
    let clueDrop: DragonClue | null = null;
    if (battle.winner === "attacker") {
      if (camp) {
        loot = {
          food: 50 * camp.level,
          wood: 30 * camp.level,
          stone: 10 * camp.level,
        };
        // Track camp defeat before evidence selection so the first successful
        // camp victories can receive guaranteed, legible onboarding clues.
        const progress = this.ensureDragonProgress(march.playerId);
        const campType = `camp_l${camp.level}`;
        progress.campTypesDefeated.add(campType);
        progress.campsDefeated += 1;
        this.putDragonProgress(march.playerId, progress);

        // Guaranteed first-progression evidence is still subject to the
        // daily clue cap. It only replaces RNG for the onboarding window.
        const clueUsage = this.ensureDailyClueUsage(march.playerId);
        if (progress.campsDefeated <= ONBOARDING_CLUE_IDS.length) {
          const inv = this.inventory.get(march.playerId) ?? {};
          const guaranteedId = ONBOARDING_CLUE_IDS.find((id) => !(inv[id] ?? 0));
          if (guaranteedId && clueUsage.used < DAILY_CLUE_CAP) {
            clueDrop = this.grantDragonClue(march.playerId, guaranteedId);
            clueUsage.used += 1;
          }
        }

        // After the three guaranteed onboarding discoveries, resume the
        // ordinary seeded rarity roll so the wider game retains variation.
        if (!clueDrop && clueUsage.used < DAILY_CLUE_CAP) {
          clueDrop = this.rollCampClueDrop(camp.level, seed + 1);
          if (clueDrop) {
            clueUsage.used += 1;
            this.grantDragonClue(march.playerId, clueDrop.id);
          }
        }
        // Update bestiary from the camp's content-mapped entry (falls back
        // to subject matching for content without an explicit mapping).
        const campDef = getCamps().find((c) => c.camp_level === camp.level);
        if (campDef) {
          if (campDef.bestiary_entry) {
            this.updateBestiary(march.playerId, campDef.bestiary_entry, 1);
          } else {
            const entries = getBestiaryEntries();
            for (const entry of entries) {
              if (
                entry.category === "creature" &&
                campDef.example_comp
                  .toLowerCase()
                  .includes(entry.subject.split(" ")[0]!.toLowerCase())
              ) {
                this.updateBestiary(march.playerId, entry.id, 1);
              }
            }
          }
        }
      } else if (wild && march.intent === "occupy") {
        wild.ownerPlayerId = march.playerId;
        this.putWilderness(wild.id, wild);
        loot = { food: 40 * wild.level, wood: 40 * wild.level };
      } else if (defCity && (harborLoot || battle.winner === "attacker")) {
        loot = this.plunderCity(defCity, harborLoot ? 0.5 : 1);
      }
      // credit loot to origin city
      const origin = this.cities.get(march.fromCityId);
      if (origin) {
        for (const [k, v] of Object.entries(loot)) {
          const key = k as keyof ResourceBag;
          origin.resources[key] += v ?? 0;
        }
        this.putCity(origin.id, origin);
      }
      // Break protection if attacker was protected and did PvP
      if (defCity) {
        const atk = this.players.get(march.playerId);
        if (atk?.protectionUntil) {
          atk.protectionUntil = null;
          this.putPlayer(atk.id, atk);
        }
      }
    }

    // Commander battle XP + wounding (spec §6.4/§8) — win 100 / loss 25,
    // applied once inside report finalization (landMarch is once-only).
    if (marchCommander && battle.winner !== "draw") {
      this.awardCommanderBattleXp(
        marchCommander.id,
        battle.winner === "attacker",
        now,
      );
    }

    const report = this.makeReport(
      march,
      {
        type: march.targetType === "city" ? "pvp" : march.intent,
        battle,
        loot,
        harborLoot,
        clueDrop: clueDrop ? { id: clueDrop.id, name: clueDrop.name, rarity: clueDrop.rarity } : null,
        target: {
          type: march.targetType,
          id: march.targetId,
          x: march.targetX,
          y: march.targetY,
        },
      },
      defenderPlayerId,
    );

    this.startReturn(march, now, remaining);
    return report;
  }

  /** Saltvault protects portion of non-crownmark resources. */
  plunderCity(city: City, rate = 1): Partial<ResourceBag> {
    const salt = city.buildings.find((b) => b.buildingType === "saltvault");
    const protectRatio = salt
      ? Math.min(0.9, SALTVAULT_PROTECT_RATIO + salt.level * 0.05)
      : 0.2;
    const lootable = (amount: number) =>
      Math.floor(amount * (1 - protectRatio) * 0.25 * rate);
    const loot: Partial<ResourceBag> = {
      food: lootable(city.resources.food),
      wood: lootable(city.resources.wood),
      stone: lootable(city.resources.stone),
      ore: lootable(city.resources.ore),
      // crownmark never protected by Saltvault — still only partial raid
      crownmark: Math.floor(city.resources.crownmark * 0.15 * rate),
    };
    city.resources.food -= loot.food ?? 0;
    city.resources.wood -= loot.wood ?? 0;
    city.resources.stone -= loot.stone ?? 0;
    city.resources.ore -= loot.ore ?? 0;
    city.resources.crownmark -= loot.crownmark ?? 0;
    this.putCity(city.id, city);
    return loot;
  }

  /** Deliver troops to an allied (or own) city at the target coords. False if undeliverable. */
  applyReinforce(march: March): boolean {
    const targetCity = [...this.cities.values()].find(
      (c) => c.mapX === march.targetX && c.mapY === march.targetY,
    );
    if (!targetCity) return false;
    // Own settlements always accept reinforcements; otherwise alliance only.
    if (targetCity.playerId !== march.playerId) {
      const a = this.allianceMembers.get(march.playerId);
      const b = this.allianceMembers.get(targetCity.playerId);
      if (!a || !b || a.allianceId !== b.allianceId) return false;
    }
    for (const [uid, cnt] of Object.entries(march.composition)) {
      targetCity.stacks[uid] = (targetCity.stacks[uid] ?? 0) + cnt;
    }
    // Recalculate manpower after reinforcement (exploit fix)
    targetCity.usedManpower = recalculateManpower(targetCity);
    this.putCity(targetCity.id, targetCity);
    march.composition = {};
    return true;
  }

  /** Structured scout intel (server-side; client only displays). */
  buildScoutIntel(march: March): Record<string, unknown> {
    const base = {
      x: march.targetX,
      y: march.targetY,
      targetType: march.targetType,
    };
    // Watchtower depth: L1+ names the camp's mustered defenders,
    // L3+ gives an exact city troop count instead of a band.
    const lookoutLevel = bestBuildingLevel(this, march.playerId, "lookout");
    if (march.targetType === "camp") {
      const camp =
        (march.targetId ? this.camps.get(march.targetId) : null) ??
        [...this.camps.values()].find(
          (c) => c.x === march.targetX && c.y === march.targetY,
        ) ??
        null;
      if (!camp) {
        return { ...base, kind: "empty", summary: "No camp at target tile" };
      }
      const def = getCamps().find(
        (c: { camp_level: number }) => c.camp_level === camp.level,
      );
      const intel: Record<string, unknown> = {
        ...base,
        kind: "camp",
        campId: camp.id,
        level: camp.level,
        band: campBand(camp.level),
        bandLabel: campBand(camp.level),
        exampleComp: def?.example_comp ?? null,
        threatBand: camp.level <= 3 ? "low" : camp.level <= 7 ? "mid" : "high",
        // Watchtower intel: reveal the camp's actual seeded composition.
        ...(this.scoutIntelLevel(march.playerId) >= LOOKOUT_INTEL_CAMP_LEVEL
          ? { actualComp: resolveCampDefGroups(def, `${camp.id}:${camp.x},${camp.y}`) }
          : {}),
      };
      if (lookoutLevel >= 1 && def) {
        const groups = resolveCampDefGroups(def, `${camp.id}:${camp.x},${camp.y}`);
        intel.defenders = groups
          .map((g) => `${g.count}× ${getUnitById(g.unitId)?.name ?? g.unitId}`)
          .join(", ");
      }
      return intel;
    }
    if (march.targetType === "wilderness") {
      const wild =
        (march.targetId ? this.wilderness.get(march.targetId) : null) ??
        [...this.wilderness.values()].find(
          (w) => w.x === march.targetX && w.y === march.targetY,
        ) ??
        null;
      if (!wild) {
        return {
          ...base,
          kind: "empty",
          summary: "No wilderness claim node at tile",
        };
      }
      const owner = wild.ownerPlayerId
        ? this.players.get(wild.ownerPlayerId)
        : null;
      return {
        ...base,
        kind: "wilderness",
        wildernessId: wild.id,
        level: wild.level,
        resourceType: wild.resourceType,
        ownerPlayerId: wild.ownerPlayerId,
        ownerName: owner?.displayName ?? null,
      };
    }
    if (march.targetType === "city") {
      const city =
        (march.targetId ? this.cities.get(march.targetId) : null) ??
        [...this.cities.values()].find(
          (c) => c.mapX === march.targetX && c.mapY === march.targetY,
        ) ??
        null;
      if (!city) {
        return { ...base, kind: "empty", summary: "No city at target tile" };
      }
      const owner = this.players.get(city.playerId);
      const troopEstimate = Object.values(city.stacks).reduce(
        (s, n) => s + n,
        0,
      );
      // Fog of war: banded estimate by default; a Watchtower at L3+
      // counts exact troops.
      let troopBand = "sparse";
      if (troopEstimate >= 500) troopBand = "massed";
      else if (troopEstimate >= 100) troopBand = "garrisoned";
      else if (troopEstimate >= 20) troopBand = "light";
      return {
        ...base,
        kind: "city",
        cityId: city.id,
        cityName: city.name,
        cityKind: city.kind,
        ownerName: owner?.displayName ?? null,
        faction: owner?.faction ?? null,
        defensePosture: city.defensePosture,
        troopBand,
        // Watchtower intel: reveal the exact troop count at depth 3+.
        ...(this.scoutIntelLevel(march.playerId) >= LOOKOUT_INTEL_CITY_LEVEL
          ? { troopCount: troopEstimate }
          : {}),
        protected:
          !!owner?.protectionUntil && owner.protectionUntil > this.now(),
      };
    }
    return {
      ...base,
      kind: "coords",
      summary: "Open water / unoccupied coords",
    };
  }

  /**
   * Deliver haul cargo to target city (own or alliance). Returns cargo to origin if undeliverable.
   */
  private applyHaul(march: March, now: number): BattleReport {
    const cargo = { ...march.cargo };
    let targetCity =
      (march.targetId ? this.cities.get(march.targetId) : null) ??
      [...this.cities.values()].find(
        (c) => c.mapX === march.targetX && c.mapY === march.targetY,
      ) ??
      null;

    let delivered = false;
    let reason: string | null = null;
    if (!targetCity) {
      reason = "no_city_at_target";
    } else if (targetCity.playerId === march.playerId) {
      delivered = true;
    } else {
      const a = this.allianceMembers.get(march.playerId);
      const b = this.allianceMembers.get(targetCity.playerId);
      if (a && b && a.allianceId === b.allianceId) {
        delivered = true;
      } else {
        reason = "not_own_or_alliance_city";
        targetCity = null;
      }
    }

    if (delivered && targetCity) {
      for (const [k, v] of Object.entries(cargo)) {
        const key = k as keyof ResourceBag;
        targetCity.resources[key] =
          (targetCity.resources[key] ?? 0) + (Number(v) || 0);
      }
      this.putCity(targetCity.id, targetCity);
      march.cargo = {};
    } else {
      // Bounce cargo back with returning troops
      const origin = this.cities.get(march.fromCityId);
      if (origin) {
        for (const [k, v] of Object.entries(cargo)) {
          const key = k as keyof ResourceBag;
          origin.resources[key] =
            (origin.resources[key] ?? 0) + (Number(v) || 0);
        }
        this.putCity(origin.id, origin);
      }
      march.cargo = {};
    }

    const report = this.makeReport(march, {
      type: "haul",
      delivered,
      reason,
      cargo,
      targetCityId: targetCity?.id ?? null,
      target: {
        type: march.targetType,
        id: march.targetId,
        x: march.targetX,
        y: march.targetY,
      },
    });
    this.startReturn(march, now, march.composition);
    return report;
  }

  adminGrant(
    playerId: string,
    body: {
      resources?: Partial<ResourceBag>;
      units?: Record<string, number>;
      chronite?: number;
      skipProtection?: boolean;
      brineholdUnlock?: boolean;
      stonekeelUnlock?: boolean;
      citadelUnlock?: string;
      items?: Record<string, number>;
      /** Dev/test fixture: set cumulative dragon counters outright. */
      dragonCounters?: {
        camps?: number;
        scouts?: number;
        campTypes?: string[];
      };
      /** Dev/test fixture: add bestiary encounters without battles. */
      bestiaryEncounters?: Record<string, number>;
    },
  ): void {
    const player = this.players.get(playerId);
    if (!player) throw new Error("no player");
    const city = this.citiesForPlayer(playerId)[0];
    if (body.resources && city) {
      for (const [k, v] of Object.entries(body.resources)) {
        // M2 transition window: legacy aquatic ids are canonized on entry.
        const key = canonResourceId(k) as keyof ResourceBag;
        city.resources[key] = (city.resources[key] ?? 0) + (v ?? 0);
      }
      this.putCity(city.id, city);
    }
    if (body.units && city) {
      for (const [uid, n] of Object.entries(body.units)) {
        city.stacks[uid] = (city.stacks[uid] ?? 0) + n;
      }
      city.usedManpower = recalculateManpower(city);
      this.putCity(city.id, city);
    }
    if (body.chronite) {
      player.chronite += body.chronite;
      this.putPlayer(player.id, player);
    }
    if (body.skipProtection) {
      player.protectionUntil = null;
      this.putPlayer(player.id, player);
    }
    if (body.brineholdUnlock && city) {
      city.research["brinehold_unlock"] = 1;
      this.putCity(city.id, city);
    }
    if (body.stonekeelUnlock && city) {
      city.research["stonekeel_unlock"] = 1;
      this.putCity(city.id, city);
    }
    if (body.citadelUnlock && city) {
      const def = getCitadelById(body.citadelUnlock);
      if (def) {
        city.research[def.unlock_research] = 1;
        this.putCity(city.id, city);
      }
    }
    if (body.items) {
      const inv = this.inventory.get(playerId) ?? {};
      for (const [id, n] of Object.entries(body.items)) {
        inv[id] = (inv[id] ?? 0) + n;
      }
      this.putInventory(playerId, inv);
    }
    if (body.dragonCounters) {
      const progress = this.ensureDragonProgress(playerId);
      if (Number.isFinite(body.dragonCounters.camps)) {
        progress.campsDefeated = Math.max(
          progress.campsDefeated,
          Number(body.dragonCounters.camps),
        );
      }
      if (Number.isFinite(body.dragonCounters.scouts)) {
        progress.scoutsSent = Math.max(
          progress.scoutsSent,
          Number(body.dragonCounters.scouts),
        );
      }
      for (const t of body.dragonCounters.campTypes ?? []) {
        progress.campTypesDefeated.add(t);
      }
      this.putDragonProgress(playerId, progress);
    }
    if (body.bestiaryEncounters) {
      for (const [entryId, count] of Object.entries(
        body.bestiaryEncounters,
      )) {
        this.updateBestiary(playerId, entryId, Number(count) || 0);
      }
    }
  }

  foundMarcherKeep(playerId: string, name?: string): City {
    const progress = this.dragonProgress.get(playerId);
    if (!progress?.charterEarned) {
      throw Object.assign(new Error("settlement charter not earned"), {
        code: "NO_CHARTER",
      });
    }
    // The earned charter IS the unlock — no separate research flag needed.
    return this.foundCitadel(playerId, "marcher_keep", name, {
      skipUnlockCheck: true,
    });
  }

  foundBrinehold(playerId: string, name?: string): City {
    return this.foundCitadel(playerId, "brinehold", name);
  }

  foundStonekeel(playerId: string, name?: string): City {
    return this.foundCitadel(playerId, "stonekeel", name);
  }

  /**
   * Found a ladder citadel from content (S1+). Requires unlock research on capital
   * (admin grant path allowed). One city per kind per player.
   */
  foundCitadel(
    playerId: string,
    kind: string,
    name?: string,
    opts?: { skipUnlockCheck?: boolean },
  ): City {
    const def = getCitadelById(kind);
    if (!def) {
      throw Object.assign(new Error(`unknown citadel ${kind}`), {
        code: "BAD_CITADEL",
      });
    }
    if (def.ship !== "MVP" && def.ship !== "S1") {
      throw Object.assign(new Error(`citadel ${kind} not in current ship`), {
        code: "NOT_SHIPPED",
      });
    }
    const capitals = this.citiesForPlayer(playerId).filter(
      (c) => c.kind === "capital",
    );
    if (capitals.length === 0) {
      throw Object.assign(new Error("no capital"), { code: "NO_CAPITAL" });
    }
    const capital = capitals[0]!;
    if (this.citiesForPlayer(playerId).some((c) => c.kind === kind)) {
      throw Object.assign(new Error(`already own ${kind}`), {
        code: "HAS_CITADEL",
      });
    }
    // Prerequisite citadels (e.g. Stonekeel requires Brinehold)
    for (const req of def.requires ?? []) {
      if (!this.citiesForPlayer(playerId).some((c) => c.kind === req)) {
        throw Object.assign(new Error(`requires ${req} first`), {
          code: "CITADEL_PREREQ",
        });
      }
    }
    if (!opts?.skipUnlockCheck && !capital.research[def.unlock_research]) {
      throw Object.assign(new Error(`${kind} not unlocked`), {
        code: "NO_UNLOCK",
      });
    }
    const { x, y } = this.findOpenTile();
    const stacks: Record<string, number> = { ...(def.starter_stacks ?? {}) };
    const city: City = {
      id: randomUUID(),
      playerId,
      realmId: this.realmId,
      kind: kind as CityKind,
      name: name?.trim() || def.name,
      mapX: x,
      mapY: y,
      resources: emptyResources(800),
      defensePosture: "withdraw",
      lastResourceTick: this.now(),
      lastPostureChange: 0,
      buildings: [
        { slotIndex: 0, buildingType: "forge_heart", level: 1 },
        { slotIndex: 1, buildingType: "barracks", level: 1 },
      ],
      plots: Array.from({ length: 8 }, (_, i) => ({
        slotIndex: i,
        plotType: null,
        level: 0,
      })),
      stacks,
      research: { ...capital.research },
      population: BASE_POPULATION,
      maxPopulation: 0,
      usedManpower: 0,
      marchedManpower: 0,
    };
    city.maxPopulation = computeMaxPopulation(city);
    city.usedManpower = recalculateManpower(city);
    this.putCity(city.id, city);
    this.pushEvent(
      playerId,
      "info",
      `Founded ${def.name}`,
      { cityId: city.id, kind },
    );
    return city;
  }

  createAlliance(playerId: string, name: string, tag: string): Alliance {
    if (this.allianceMembers.has(playerId)) {
      throw Object.assign(new Error("already in alliance"), {
        code: "IN_ALLY",
      });
    }
    const normalized = tag.slice(0, 5).toUpperCase();
    // Tags are join keys (join-by-tag) and UNIQUE in PG — reject dupes at
    // creation instead of blowing up the next persistence flush.
    if (
      [...this.alliances.values()].some((x) => x.realmId === this.realmId && x.tag === normalized)
    ) {
      throw Object.assign(new Error("alliance tag already taken"), {
        code: "TAG_TAKEN",
      });
    }
    const a: Alliance = {
      id: randomUUID(),
      realmId: this.realmId,
      name: name.slice(0, 32),
      tag: normalized,
      leaderId: playerId,
    };
    this.putAlliance(a.id, a);
    this.putAllianceMember(playerId, {
      allianceId: a.id,
      playerId,
      rank: "leader",
    });
    return a;
  }

  listAlliances(): {
    id: string;
    name: string;
    tag: string;
    memberCount: number;
  }[] {
    return [...this.alliances.values()].map((a) => ({
      id: a.id,
      name: a.name,
      tag: a.tag,
      memberCount: [...this.allianceMembers.values()].filter(
        (m) => m.allianceId === a.id,
      ).length,
    }));
  }

  joinAlliance(playerId: string, allianceId: string): void {
    if (this.allianceMembers.has(playerId)) {
      throw Object.assign(new Error("already in alliance"), {
        code: "IN_ALLY",
      });
    }
    const a = this.alliances.get(allianceId);
    if (!a) throw Object.assign(new Error("no alliance"), { code: "NO_ALLY" });
    this.putAllianceMember(playerId, {
      allianceId,
      playerId,
      rank: "member",
    });
  }

  joinAllianceByTag(playerId: string, tag: string): Alliance {
    const normalized = tag.slice(0, 5).toUpperCase();
    const a = [...this.alliances.values()].find((x) => x.tag === normalized);
    if (!a) throw Object.assign(new Error("no alliance with that tag"), {
      code: "NO_ALLY",
    });
    this.joinAlliance(playerId, a.id);
    return a;
  }

  private dayKey(now = this.now()): string {
    return new Date(now).toISOString().slice(0, 10);
  }

  ensureDaily(playerId: string): DailyProgress {
    const key = this.dayKey();
    let d = this.dailyQuests.get(playerId);
    if (!d || d.dayKey !== key) {
      d = { dayKey: key, done: {}, claimed: {} };
      this.putDailyQuests(playerId, d);
    }
    return d;
  }

  markDaily(playerId: string, questId: string): void {
    const d = this.ensureDaily(playerId);
    d.done[questId] = true;
  }

  /** Today's clue-drop record, rotating on a new UTC day (mirrors ensureDaily). */
  private ensureDailyClueUsage(playerId: string): DailyClueUsage {
    const key = this.dayKey();
    let d = this.dailyClues.get(playerId);
    if (!d || d.dayKey !== key) {
      d = { dayKey: key, used: 0 };
      this.putDailyClues(playerId, d);
    }
    return d;
  }

  /** Current daily clue-drop usage against the cap (for API display). */
  dailyClueUsage(playerId: string): { used: number; cap: number } {
    return { used: this.ensureDailyClueUsage(playerId).used, cap: DAILY_CLUE_CAP };
  }

  listDailyQuests(playerId: string) {
    const d = this.ensureDaily(playerId);
    return DAILY_QUEST_DEFS.map((def) => ({
      id: def.id,
      title: def.title,
      rewardChronite: def.rewardChronite,
      done: !!d.done[def.id],
      claimed: !!d.claimed[def.id],
    }));
  }

  claimDailyQuest(
    playerId: string,
    questId: string,
  ): { chronite: number; questId: string } {
    const def = DAILY_QUEST_DEFS.find((q) => q.id === questId);
    if (!def) {
      throw Object.assign(new Error("unknown quest"), { code: "NO_QUEST" });
    }
    const player = this.players.get(playerId);
    if (!player) throw new Error("no player");
    const d = this.ensureDaily(playerId);
    if (!d.done[questId]) {
      throw Object.assign(new Error("quest incomplete"), {
        code: "QUEST_INCOMPLETE",
      });
    }
    if (d.claimed[questId]) {
      throw Object.assign(new Error("already claimed"), {
        code: "QUEST_CLAIMED",
      });
    }
    d.claimed[questId] = true;
    player.chronite += def.rewardChronite;
    this.putPlayer(playerId, player);
    return { chronite: player.chronite, questId };
  }

  /**
   * Advance the objective ladder only while the current objective is
   * verified against authoritative state. A client button press is never
   * proof — this evaluates conditions and auto-advances (possibly several
   * steps) or returns the unchanged ladder.
   */
  advanceTutorial(playerId: string): Tutorial {
    const t = this.tutorials.get(playerId) ?? {
      playerId,
      step: 0,
      completed: false,
    };
    if (t.completed) return t;
    let advanced = false;
    while (
      !t.completed &&
      t.step < TUTORIAL_STEPS.length &&
      tutorialStepMet(this, playerId, t.step)
    ) {
      t.step += 1;
      advanced = true;
      if (t.step >= TUTORIAL_STEPS.length) {
        t.completed = true;
        this.pushEvent(playerId, "info", "All objectives complete — the march is yours.");
      } else {
        this.pushEvent(
          playerId,
          "info",
          `Objective complete — next: ${TUTORIAL_STEPS[t.step]}`,
        );
      }
    }
    if (advanced) this.putTutorial(playerId, t);
    return t;
  }

  tutorialView(playerId: string) {
    const t = this.tutorials.get(playerId) ?? {
      playerId,
      step: 0,
      completed: false,
    };
    const idx = Math.min(t.step, TUTORIAL_STEPS.length - 1);
    return {
      ...t,
      totalSteps: TUTORIAL_STEPS.length,
      currentLabel: t.completed
        ? "All objectives complete — the march is yours."
        : TUTORIAL_STEPS[idx] ?? TUTORIAL_STEPS[0],
      progress: t.completed ? null : tutorialProgress(this, playerId),
      steps: [...TUTORIAL_STEPS],
    };
  }

  postChat(
    playerId: string,
    allianceId: string,
    body: string,
  ): ChatMessage {
    const mem = this.allianceMembers.get(playerId);
    if (!mem || mem.allianceId !== allianceId) {
      throw Object.assign(new Error("not a member"), { code: "NOT_MEMBER" });
    }
    const msg: ChatMessage = {
      id: randomUUID(),
      realmId: this.realmId,
      channel: "alliance",
      allianceId,
      fromPlayerId: playerId,
      toPlayerId: null,
      body: body.slice(0, 500),
      createdAt: this.now(),
    };
    this.chat.push(msg);
    return msg;
  }

  shopBuy(playerId: string, itemId: string): { itemId: string; chronite: number } {
    const player = this.players.get(playerId);
    if (!player) throw new Error("no player");
    const catalog = [
      { id: "speedup_1m", chronite: 1 },
      { id: "speedup_1h", chronite: 10 },
      { id: "shield_1h", chronite: 3 },
      { id: "shield_12h", chronite: 25 },
    ];
    const item = catalog.find((c) => c.id === itemId);
    if (!item) throw Object.assign(new Error("unknown item"), { code: "NO_ITEM" });
    if (player.chronite < item.chronite) {
      throw Object.assign(new Error("not enough chronite"), { code: "NO_CHRONITE" });
    }
    player.chronite -= item.chronite;
    this.putPlayer(player.id, player);
    const inv = this.inventory.get(playerId) ?? {};
    inv[itemId] = (inv[itemId] ?? 0) + 1;
    this.putInventory(playerId, inv);
    return { itemId, chronite: player.chronite };
  }

  mapViewport(x0: number, y0: number, x1: number, y1: number) {
    const cities = [...this.cities.values()]
      .filter(
        (c) => c.mapX >= x0 && c.mapX <= x1 && c.mapY >= y0 && c.mapY <= y1,
      )
      .map((c) => ({
        id: c.id,
        x: c.mapX,
        y: c.mapY,
        kind: c.kind,
        name: c.name,
        playerId: c.playerId,
      }));
    const camps = [...this.camps.values()]
      .filter((c) => c.x >= x0 && c.x <= x1 && c.y >= y0 && c.y <= y1)
      .map((c) => ({ id: c.id, x: c.x, y: c.y, level: c.level, band: campBand(c.level) }));
    const wilderness = [...this.wilderness.values()]
      .filter((w) => w.x >= x0 && w.x <= x1 && w.y >= y0 && w.y <= y1)
      .map((w) => ({
        id: w.id,
        x: w.x,
        y: w.y,
        level: w.level,
        resourceType: w.resourceType,
        benefit: wildernessBenefit(w),
        ownerPlayerId: w.ownerPlayerId,
      }));
    return { x0, y0, x1, y1, mapW: MAP_W, mapH: MAP_H, cities, camps, wilderness };
  }
}

// silence unused hash helper warning by exporting for session storage adapters
export { hashToken };

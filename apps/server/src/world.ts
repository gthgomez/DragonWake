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
} from "@tideforge/combat";
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
} from "@tideforge/content";
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
} from "@tideforge/shared";

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
  sovereignId: string | null;
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
export type Wilderness = {
  id: string;
  realmId: number;
  x: number;
  y: number;
  level: number;
  resourceType: string;
  ownerPlayerId: string | null;
};
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
export type Sovereign = {
  id: string;
  playerId: string;
  sovereignType: string;
  level: number;
  woundedUntil: number | null;
  harnessCrown: boolean;
  harnessHeart: boolean;
  harnessGrasp: boolean;
  harnessKeel: boolean;
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
  const bestiaryStudied = [...world.bestiary.keys()].filter(
    (k) => k.startsWith(`${playerId}:`) && world.bestiary.get(k)!.observationLevel >= 1,
  ).length;
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
    case 7:
      return { current: Math.min(1, bestiaryStudied), target: 1 };
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
export const RECRUIT_COST_COIN_PER_OWNED = 250; // INITIAL_TEST_FIXTURE
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
    timber: n,
    stone: n,
    iron: Math.floor(n / 2),
    coin: Math.floor(n / 2),
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
/** Extra concurrent train queues per Training Camp level (capped). */
const TRAIN_SLOTS_PER_CAMP_LEVEL = 1;
const TRAIN_SLOT_CAMP_BONUS_CAP = 3;

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
    timber: 100,
    stone: 80,
    iron: 40,
    coin: 20,
  };
  for (const p of city.plots) {
    if (!p.plotType || p.level <= 0) continue;
    const mult = p.level * 30;
    if (p.plotType === "farm") rates.food += mult;
    if (p.plotType === "lumber_yard") rates.timber += mult;
    if (p.plotType === "quarry") rates.stone += mult;
    if (p.plotType === "mine") rates.iron += mult;
  }
  const wildBonus = 1; // wild claims applied by caller if needed
  return {
    food: rates.food * wildBonus,
    timber: rates.timber * wildBonus,
    stone: rates.stone * wildBonus,
    iron: rates.iron * wildBonus,
    coin: rates.coin * wildBonus,
  };
}

/** Pure resource tick used by sim + tests. */
export function tickCityResources(
  city: City,
  now: number,
  ownedWilderness: string[] = [],
): City {
  const elapsedMs = Math.max(0, now - city.lastResourceTick);
  if (elapsedMs < 1000) return city;
  const hours = elapsedMs / 3_600_000;
  const rates = productionPerHour(city);
  // Per-type wilderness bonuses
  let wildTimber = 0, wildFood = 0, wildStone = 0, wildIron = 0;
  for (const wt of ownedWilderness) {
    switch (wt) {
      case "forest": wildTimber += 30; break;
      case "fertile_land": wildFood += 40; break;
      case "quarry": wildStone += 25; break;
      case "iron_hills": wildIron += 15; break;
    }
  }

  // Fractional carryover: per-second ticks produce sub-unit gains
  // (120 food/h ≈ 0.033/s). Floor-per-tick used to discard them forever;
  // remainders now accumulate until a whole unit lands.
  const frac: ResourceBag = city.resFraction ?? {
    food: 0,
    timber: 0,
    stone: 0,
    iron: 0,
    coin: 0,
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
  accrue("timber", rates.timber + wildTimber);
  accrue("stone", rates.stone + wildStone);
  accrue("iron", rates.iron + wildIron);
  accrue("coin", rates.coin);

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
  sovereigns = new Map<string, Sovereign>();
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
    sovereigns: new Set<string>(),
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
  private putSovereign(_key: string, sov: Sovereign): Sovereign {
    this.sovereigns.set(sov.id, sov);
    this.dirty.sovereigns.add(sov.id);
    return sov;
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
    // Place camps L1–10 in a ring pattern
    const campDefs = getCamps();
    let i = 0;
    for (const def of campDefs) {
      const angle = (i / campDefs.length) * Math.PI * 2;
      const r = 8 + (def.camp_level % 5);
      const x = Math.min(
        MAP_W - 2,
        Math.max(1, Math.round(MAP_W / 2 + Math.cos(angle) * r)),
      );
      const y = Math.min(
        MAP_H - 2,
        Math.max(1, Math.round(MAP_H / 2 + Math.sin(angle) * r)),
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
        { type: "forest", bonus: "timber", rate: 30 },
        { type: "fertile_land", bonus: "food", rate: 40 },
        { type: "quarry", bonus: "stone", rate: 25 },
        { type: "iron_hills", bonus: "iron", rate: 15 },
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
      resources: emptyResources(1500),
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

    // Default commanderless; create Harbinger stub not yet deployable
    const sovId = randomUUID();
    this.putSovereign(sovId, {
      id: sovId,
      playerId,
      sovereignType: "harbinger",
      level: 1,
      woundedUntil: null,
      harnessCrown: false,
      harnessHeart: false,
      harnessGrasp: false,
      harnessKeel: false,
    });

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
        .map((w) => w.resourceType);
      const next = tickCityResources(city, now, wildTypes);
      // Only persist-worthy when a whole unit of something landed —
      // otherwise this would re-mark every city dirty every second.
      // (lastResourceTick/resFraction drift is self-healing: a restart
      // grants catch-up production for the real elapsed time.)
      if (
        next.population !== city.population ||
        next.maxPopulation !== city.maxPopulation ||
        next.resources.food !== city.resources.food ||
        next.resources.timber !== city.resources.timber ||
        next.resources.stone !== city.resources.stone ||
        next.resources.iron !== city.resources.iron ||
        next.resources.coin !== city.resources.coin
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
          Number(j.payload.slotIndex) === slotIndex &&
          String(j.payload.buildingType) === buildingType,
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

    const baseCost = def.build_cost ?? { food: 100, timber: 100 };
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
    const campBonus = Math.min(
      TRAIN_SLOT_CAMP_BONUS_CAP,
      bestBuildingLevel(this, playerId, "training_camp") * TRAIN_SLOTS_PER_CAMP_LEVEL,
    );
    if (runningTrains.length >= MAX_TRAIN_JOBS + campBonus) {
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
    const costK = costs.food * n;
    const costD = costs.timber * n;
    const costB = costs.stone * n;
    const costS = costs.iron * n;
    if (city.resources.food < costK) {
      throw Object.assign(new Error("insufficient food"), { code: "NO_RES" });
    }
    if (city.resources.timber < costD) {
      throw Object.assign(new Error("insufficient timber"), { code: "NO_RES" });
    }
    if (city.resources.stone < costB) {
      throw Object.assign(new Error("insufficient stone"), { code: "NO_RES" });
    }
    if (city.resources.iron < costS) {
      throw Object.assign(new Error("insufficient iron"), { code: "NO_RES" });
    }
    city.resources.food -= costK;
    city.resources.timber -= costD;
    city.resources.stone -= costB;
    city.resources.iron -= costS;
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
      const coinCost = RECRUIT_COST_COIN_PER_OWNED * owned;
      const foodCost = RECRUIT_COST_FOOD_PER_OWNED * owned;
      const missing: string[] = [];
      if ((city.resources.coin ?? 0) < coinCost) {
        missing.push(`coin need ${coinCost} have ${city.resources.coin ?? 0}`);
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
      city.resources.coin -= coinCost;
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

  /** Empty plot → assign type at L1. Costs food + timber. */
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
    const costKelp = 80;
    const costDrift = 40;
    if (city.resources.food < costKelp || city.resources.timber < costDrift) {
      throw Object.assign(new Error("insufficient resources"), {
        code: "NO_RES",
      });
    }
    city.resources.food -= costKelp;
    city.resources.timber -= costDrift;
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
    const costKelp = 50 * plot.level;
    const costDrift = 50 * plot.level;
    if (city.resources.food < costKelp || city.resources.timber < costDrift) {
      throw Object.assign(new Error("insufficient resources"), {
        code: "NO_RES",
      });
    }
    city.resources.food -= costKelp;
    city.resources.timber -= costDrift;
    plot.level += 1;
    this.putCity(city.id, city);
    return { ...plot };
  }

  ownedWildernessCount(playerId: string): number {
    return [...this.wilderness.values()].filter(
      (w) => w.ownerPlayerId === playerId,
    ).length;
  }

  /** Effective production/hour including wilderness bonus (same as tick). */
  effectiveProduction(city: City): ResourceBag {
    const rates = productionPerHour(city);
    const wildBonus = this.ownedWildernessBonus(city.playerId);
    return {
      food: Math.floor(rates.food + wildBonus.food),
      timber: Math.floor(rates.timber + wildBonus.timber),
      stone: Math.floor(rates.stone + wildBonus.stone),
      iron: Math.floor(rates.iron + wildBonus.iron),
      coin: Math.floor(rates.coin + wildBonus.coin),
    };
  }

  /** Per-type wilderness resource bonus for a player. */
  private ownedWildernessBonus(playerId: string): ResourceBag {
    const bonus: ResourceBag = { food: 0, timber: 0, stone: 0, iron: 0, coin: 0 };
    for (const w of this.wilderness.values()) {
      if (w.ownerPlayerId !== playerId) continue;
      switch (w.resourceType) {
        case "forest": bonus.timber += 30; break;
        case "fertile_land": bonus.food += 40; break;
        case "quarry": bonus.stone += 25; break;
        case "iron_hills": bonus.iron += 15; break;
        // crossroads, watch_hill: non-resource bonuses (TODO)
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
      }
      return { id: req.id, met, description: req.description };
    });
    const ready = requirements.every((r) => r.met);
    return { ready, requirements, reward: ready ? config.reward : undefined };
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

    // Add to inventory
    const inv = this.inventory.get(playerId) ?? {};
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
      sovereignId?: string | null;
      /** Commander leading this march (spec §6); validated + slot-capped. */
      commanderId?: string | null;
      /** Resource cargo for haul intent (deducted from origin city now). */
      cargo?: Partial<ResourceBag>;
    },
  ): March {
    const city = this.requireCityOwner(opts.fromCityId, playerId);

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

    // Haul: deduct cargo from origin now; deliver on land
    const cargo: Partial<ResourceBag> = {};
    if (opts.intent === "haul") {
      const requested = opts.cargo ?? {};
      for (const key of [
        "food",
        "timber",
        "stone",
        "iron",
        "coin",
      ] as const) {
        const want = Math.max(0, Math.floor(Number(requested[key] ?? 0)));
        if (want <= 0) continue;
        if (city.resources[key] < want) {
          throw Object.assign(new Error(`not enough ${key} for haul`), {
            code: "NO_RES",
          });
        }
        city.resources[key] -= want;
        cargo[key] = want;
      }
      if (Object.keys(cargo).length === 0) {
        throw Object.assign(new Error("haul requires cargo"), {
          code: "NO_CARGO",
        });
      }
    }
    this.putCity(city.id, city);

    if (opts.sovereignId) {
      const sov = this.sovereigns.get(opts.sovereignId);
      if (!sov || sov.playerId !== playerId) {
        throw Object.assign(new Error("bad sovereign"), { code: "NO_SOV" });
      }
      if (!this.harnessComplete(sov)) {
        throw Object.assign(new Error("harness incomplete"), {
          code: "NO_HARNESS",
        });
      }
    }

    const dist = chebyshev(city.mapX, city.mapY, opts.targetX, opts.targetY);
    const musterFactor = marchSpeedFactor(
      bestBuildingLevel(this, playerId, "rally_quay"),
    );
    const travelSec = Math.max(5, dist * 8 * musterFactor);
    const now = this.now();
    const march: March = {
      id: randomUUID(),
      realmId: this.realmId,
      playerId,
      fromCityId: city.id,
      commanderId: commander?.id ?? null,
      sovereignId: opts.sovereignId ?? null,
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
              sovereign: march.sovereignId
                ? {
                    sovereignId:
                      this.sovereigns.get(march.sovereignId)?.sovereignType ??
                      "harbinger",
                    level: this.sovereigns.get(march.sovereignId)?.level ?? 1,
                  }
                : undefined,
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
          timber: 30 * camp.level,
          stone: 10 * camp.level,
        };
        // Roll for dragon clue drop — capped per UTC day (silent skip at cap)
        const clueUsage = this.ensureDailyClueUsage(march.playerId);
        if (clueUsage.used < DAILY_CLUE_CAP) {
          clueDrop = this.rollCampClueDrop(camp.level, seed + 1);
          if (clueDrop) {
            clueUsage.used += 1;
            this.grantDragonClue(march.playerId, clueDrop.id);
          }
        }
        // Track camp defeat: bestiary readiness type set + expedition counter
        const progress = this.ensureDragonProgress(march.playerId);
        progress.campTypesDefeated.add(`camp_l${camp.level}`);
        progress.campsDefeated += 1;
        this.putDragonProgress(march.playerId, progress);
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
        loot = { food: 40, timber: 40 };
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

  /** Saltvault protects portion of non-coin resources. */
  plunderCity(city: City, rate = 1): Partial<ResourceBag> {
    const salt = city.buildings.find((b) => b.buildingType === "saltvault");
    const protectRatio = salt
      ? Math.min(0.9, SALTVAULT_PROTECT_RATIO + salt.level * 0.05)
      : 0.2;
    const lootable = (amount: number) =>
      Math.floor(amount * (1 - protectRatio) * 0.25 * rate);
    const loot: Partial<ResourceBag> = {
      food: lootable(city.resources.food),
      timber: lootable(city.resources.timber),
      stone: lootable(city.resources.stone),
      iron: lootable(city.resources.iron),
      // coin never protected by Saltvault — still only partial raid
      coin: Math.floor(city.resources.coin * 0.15 * rate),
    };
    city.resources.food -= loot.food ?? 0;
    city.resources.timber -= loot.timber ?? 0;
    city.resources.stone -= loot.stone ?? 0;
    city.resources.iron -= loot.iron ?? 0;
    city.resources.coin -= loot.coin ?? 0;
    this.putCity(city.id, city);
    return loot;
  }

  /** Deliver troops to an allied city at the target coords. False if undeliverable. */
  private applyReinforce(march: March): boolean {
    const targetCity = [...this.cities.values()].find(
      (c) => c.mapX === march.targetX && c.mapY === march.targetY,
    );
    if (!targetCity) return false;
    // Same alliance only
    const a = this.allianceMembers.get(march.playerId);
    const b = this.allianceMembers.get(targetCity.playerId);
    if (!a || !b || a.allianceId !== b.allianceId) return false;
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
        exampleComp: def?.example_comp ?? null,
        threatBand: camp.level <= 3 ? "low" : camp.level <= 7 ? "mid" : "high",
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
        ...(lookoutLevel >= 3 ? { troopCount: troopEstimate } : {}),
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

  harnessComplete(sov: Sovereign): boolean {
    return (
      sov.harnessCrown &&
      sov.harnessHeart &&
      sov.harnessGrasp &&
      sov.harnessKeel
    );
  }

  adminGrant(
    playerId: string,
    body: {
      resources?: Partial<ResourceBag>;
      units?: Record<string, number>;
      harness?: boolean;
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
    if (body.harness) {
      for (const sov of this.sovereigns.values()) {
        if (sov.playerId !== playerId) continue;
        sov.harnessCrown = true;
        sov.harnessHeart = true;
        sov.harnessGrasp = true;
        sov.harnessKeel = true;
        this.putSovereign(sov.id, sov);
      }
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
      .map((c) => ({ id: c.id, x: c.x, y: c.y, level: c.level }));
    const wilderness = [...this.wilderness.values()]
      .filter((w) => w.x >= x0 && w.x <= x1 && w.y >= y0 && w.y <= y1)
      .map((w) => ({
        id: w.id,
        x: w.x,
        y: w.y,
        level: w.level,
        resourceType: w.resourceType,
        ownerPlayerId: w.ownerPlayerId,
      }));
    return { x0, y0, x1, y1, mapW: MAP_W, mapH: MAP_H, cities, camps, wilderness };
  }
}

// silence unused hash helper warning by exporting for session storage adapters
export { hashToken };

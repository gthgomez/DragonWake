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
  getUnitById,
  getUnitCost,
  isUnitUnlocked,
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
  buildings: Building[];
  plots: Plot[];
  stacks: Record<string, number>;
  research: Record<string, number>;
  population: number;
  maxPopulation: number;
  usedManpower: number;
  marchedManpower: number;
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
export type Session = {
  id: string;
  playerId: string;
  /** Raw token when created in-process; empty after PG reload (auth uses tokenHash). */
  token: string;
  tokenHash: string;
  expiresAt: number;
};
export type Tutorial = { playerId: string; step: number; completed: boolean };

/** Product-freeze tutorial steps (10). DEV_SKIP_TUTORIAL starts completed. */
export const TUTORIAL_STEPS = [
  "Welcome, Lord — your keep stands in a dangerous age.",
  "Open Castle and review your Food, Timber, and other supplies.",
  "Build Homes to grow your population and manpower.",
  "Assign farmland in the Lands to raise food production.",
  "Research Infantry Doctrine and train Levy Spearman.",
  "Open Realm, scout a Bandit Camp, and send your army.",
  "Capture wilderness to boost your resource production.",
  "Study the Bestiary — dragon signs are appearing.",
  "Complete the Dragon Expedition readiness requirements.",
  "Found a Marcher Keep to expand your kingdom.",
] as const;

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

/** Minimal store surface so World can flush without circular import at type level. */
export type WorldStore = {
  mode: "postgres" | "memory";
  saveWorld(world: World): Promise<void>;
  loadInto(world: World): Promise<{ players: number; cities: number }>;
  close?(): Promise<void>;
};

const FACTIONS: Faction[] = ["brinecant", "ashcoil", "skyshear", "mossvault"];

/** Population/manpower configuration constants. */
const BASE_POPULATION = 200;
const HOMES_CAPACITY_PER_LEVEL = 100;
const POPULATION_GROWTH_RATE = 0.01; // per hour per occupied habitation slot

export const PLOT_TYPES = [
  "kelp_farm",
  "drift_dock",
  "basalt_cut",
  "slag_pit",
] as const;

export type PlotTypeId = (typeof PLOT_TYPES)[number];

function emptyResources(n = 1000): ResourceBag {
  return {
    kelp: n,
    driftwood: n,
    basalt: n,
    slagiron: Math.floor(n / 2),
    tidegilt: Math.floor(n / 2),
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

export function productionPerHour(city: City): ResourceBag {
  const rates: ResourceBag = {
    kelp: 120,
    driftwood: 100,
    basalt: 80,
    slagiron: 40,
    tidegilt: 20,
  };
  for (const p of city.plots) {
    if (!p.plotType || p.level <= 0) continue;
    const mult = p.level * 30;
    if (p.plotType === "kelp_farm") rates.kelp += mult;
    if (p.plotType === "drift_dock") rates.driftwood += mult;
    if (p.plotType === "basalt_cut") rates.basalt += mult;
    if (p.plotType === "slag_pit") rates.slagiron += mult;
  }
  const wildBonus = 1; // wild claims applied by caller if needed
  return {
    kelp: rates.kelp * wildBonus,
    driftwood: rates.driftwood * wildBonus,
    basalt: rates.basalt * wildBonus,
    slagiron: rates.slagiron * wildBonus,
    tidegilt: rates.tidegilt * wildBonus,
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
  const next: ResourceBag = {
    kelp: Math.floor(city.resources.kelp + (rates.kelp + wildFood) * hours),
    driftwood: Math.floor(
      city.resources.driftwood + (rates.driftwood + wildTimber) * hours,
    ),
    basalt: Math.floor(city.resources.basalt + (rates.basalt + wildStone) * hours),
    slagiron: Math.floor(
      city.resources.slagiron + (rates.slagiron + wildIron) * hours,
    ),
    tidegilt: Math.floor(
      city.resources.tidegilt + rates.tidegilt * hours,
    ),
  };

  // Population growth: grows based on habitation building levels
  let habitationLevels = 0;
  for (const b of city.buildings) {
    if (b.buildingType === "habitation") habitationLevels += b.level;
  }
  const maxPop = city.maxPopulation || computeMaxPopulation(city);
  let newPop = city.population;
  if (habitationLevels > 0 && newPop < maxPop) {
    const growth = Math.floor(
      newPop * POPULATION_GROWTH_RATE * hours * habitationLevels,
    );
    newPop = Math.min(maxPop, newPop + Math.max(1, growth));
  }

  return {
    ...city,
    resources: next,
    population: newPop,
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
  inventory = new Map<string, Record<string, number>>(); // playerId -> items
  tutorials = new Map<string, Tutorial>();
  /** Minimal daily quest stubs (reset by UTC day key). */
  dailyQuests = new Map<string, DailyProgress>();
  /** Bestiary observation state — keyed by "playerId:entryId". */
  bestiary = new Map<string, { entryId: string; observationLevel: number; encounterCount: number }>();
  /** Dragon expedition readiness progress — keyed by playerId. */
  dragonProgress = new Map<string, {
    bestiaryStudied: number;
    researchLevel: number;
    materialsCollected: number;
    campTypesDefeated: Set<string>;
    expeditionStage: number;
    charterEarned: boolean;
  }>();
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

  /** Queue a durable flush (serialized). */
  persist(): Promise<void> {
    if (!this.store) return Promise.resolve();
    this.persistChain = this.persistChain
      .then(() => this.store!.saveWorld(this))
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
      this.wilderness.set(id, {
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
    this.players.set(playerId, player);
    this.inventory.set(playerId, {});
    this.tutorials.set(playerId, {
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
    this.cities.set(cityId, city);

    // Default commanderless; create Harbinger stub not yet deployable
    const sovId = randomUUID();
    this.sovereigns.set(sovId, {
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
    this.sessionsById.set(session.id, session);
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
      this.cities.set(city.id, next);
    }
    this.processQueues(now);
    this.processMarches(now);
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
      const techId = String(job.payload.techId);
      city.research[techId] = (city.research[techId] ?? 0) + 1;
    } else if (job.kind === "train") {
      const unitId = String(job.payload.unitId);
      const count = Number(job.payload.count) || 0;
      city.stacks[unitId] = (city.stacks[unitId] ?? 0) + count;
      city.usedManpower = recalculateManpower(city);
    }
    job.status = "completed";
    this.cities.set(city.id, city);
    const label =
      job.kind === "build"
        ? `Build complete: ${String(job.payload.buildingType)}`
        : job.kind === "research"
          ? `Research complete: ${String(job.payload.techId)}`
          : `Train complete: ${job.payload.count}× ${String(job.payload.unitId)}`;
    this.pushEvent(job.playerId, "queue_complete", label, {
      jobId: job.id,
      kind: job.kind,
      cityId: job.cityId,
    });
  }

  startBuild(
    cityId: string,
    playerId: string,
    slotIndex: number,
    buildingType: string,
  ): QueueJob {
    const city = this.requireCityOwner(cityId, playerId);
    const running = [...this.jobs.values()].filter(
      (j) =>
        j.cityId === cityId && j.kind === "build" && j.status === "running",
    );
    if (running.length >= 2) {
      throw Object.assign(new Error("build queue full"), { code: "QUEUE_FULL" });
    }
    const cost = 100;
    if (city.resources.kelp < cost || city.resources.driftwood < cost) {
      throw Object.assign(new Error("insufficient resources"), {
        code: "NO_RES",
      });
    }
    city.resources.kelp -= cost;
    city.resources.driftwood -= cost;
    const now = this.now();
    const job: QueueJob = {
      id: randomUUID(),
      cityId,
      playerId,
      kind: "build",
      payload: { slotIndex, buildingType },
      startedAt: now,
      finishesAt: now + durationMs(30, this.devFastTime),
      status: "running",
    };
    this.jobs.set(job.id, job);
    this.cities.set(city.id, city);
    this.markDaily(playerId, "build");
    return job;
  }

  startResearch(cityId: string, playerId: string, techId: string): QueueJob {
    this.requireCityOwner(cityId, playerId);
    const running = [...this.jobs.values()].filter(
      (j) =>
        j.cityId === cityId && j.kind === "research" && j.status === "running",
    );
    if (running.length >= 1) {
      throw Object.assign(new Error("research queue full"), {
        code: "QUEUE_FULL",
      });
    }
    const now = this.now();
    const job: QueueJob = {
      id: randomUUID(),
      cityId,
      playerId,
      kind: "research",
      payload: { techId },
      startedAt: now,
      finishesAt: now + durationMs(45, this.devFastTime),
      status: "running",
    };
    this.jobs.set(job.id, job);
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
    const unitPop = unit.pop * n;
    if (availableManpower(city) < unitPop) {
      throw Object.assign(new Error("insufficient manpower"), {
        code: "NO_MANPOWER",
      });
    }
    const costs = getUnitCost(unit);
    const costK = costs.food * n;
    const costD = costs.timber * n;
    const costB = costs.stone * n;
    const costS = costs.iron * n;
    if (city.resources.kelp < costK) {
      throw Object.assign(new Error("insufficient food"), { code: "NO_RES" });
    }
    if (city.resources.driftwood < costD) {
      throw Object.assign(new Error("insufficient timber"), { code: "NO_RES" });
    }
    if (city.resources.basalt < costB) {
      throw Object.assign(new Error("insufficient stone"), { code: "NO_RES" });
    }
    if (city.resources.slagiron < costS) {
      throw Object.assign(new Error("insufficient iron"), { code: "NO_RES" });
    }
    city.resources.kelp -= costK;
    city.resources.driftwood -= costD;
    city.resources.basalt -= costB;
    city.resources.slagiron -= costS;
    const trainSec = (unit.train_sec_L1 ?? 20) * n;
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
    this.jobs.set(job.id, job);
    this.cities.set(city.id, city);
    this.markDaily(playerId, "train");
    return job;
  }

  setPosture(cityId: string, playerId: string, posture: DefensePosture): City {
    const city = this.requireCityOwner(cityId, playerId);
    // Posture cooldown: 5 minutes between changes (INITIAL_TEST_FIXTURE)
    const POSTURE_COOLDOWN_MS = 5 * 60 * 1000;
    const lastChange = (city as any)._lastPostureChange ?? 0;
    if (this.now() - lastChange < POSTURE_COOLDOWN_MS) {
      throw Object.assign(new Error("posture change on cooldown"), {
        code: "POSTURE_COOLDOWN",
      });
    }
    city.defensePosture = posture;
    (city as any)._lastPostureChange = this.now();
    this.cities.set(city.id, city);
    return city;
  }

  /** Empty plot → assign type at L1. Costs kelp + driftwood. */
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
    if (city.resources.kelp < costKelp || city.resources.driftwood < costDrift) {
      throw Object.assign(new Error("insufficient resources"), {
        code: "NO_RES",
      });
    }
    city.resources.kelp -= costKelp;
    city.resources.driftwood -= costDrift;
    plot.plotType = plotType;
    plot.level = 1;
    this.cities.set(city.id, city);
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
    if (city.resources.kelp < costKelp || city.resources.driftwood < costDrift) {
      throw Object.assign(new Error("insufficient resources"), {
        code: "NO_RES",
      });
    }
    city.resources.kelp -= costKelp;
    city.resources.driftwood -= costDrift;
    plot.level += 1;
    this.cities.set(city.id, city);
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
      kelp: Math.floor(rates.kelp + wildBonus.kelp),
      driftwood: Math.floor(rates.driftwood + wildBonus.driftwood),
      basalt: Math.floor(rates.basalt + wildBonus.basalt),
      slagiron: Math.floor(rates.slagiron + wildBonus.slagiron),
      tidegilt: Math.floor(rates.tidegilt + wildBonus.tidegilt),
    };
  }

  /** Per-type wilderness resource bonus for a player. */
  private ownedWildernessBonus(playerId: string): ResourceBag {
    const bonus: ResourceBag = { kelp: 0, driftwood: 0, basalt: 0, slagiron: 0, tidegilt: 0 };
    for (const w of this.wilderness.values()) {
      if (w.ownerPlayerId !== playerId) continue;
      switch (w.resourceType) {
        case "forest": bonus.driftwood += 30; break;
        case "fertile_land": bonus.kelp += 40; break;
        case "quarry": bonus.basalt += 25; break;
        case "iron_hills": bonus.slagiron += 15; break;
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

    this.bestiary.set(key, {
      entryId,
      observationLevel: newObs,
      encounterCount: newEnc,
    });

    // Update dragon readiness if observation level increased
    if (newObs > prevObs) {
      this.recalcDragonReadiness(playerId);
    }
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

    const inv = this.inventory.get(playerId) ?? {};
    const materials = inv["dragon_material"] ?? 0;

    const existing = this.dragonProgress.get(playerId) ?? {
      bestiaryStudied: 0,
      researchLevel: 0,
      materialsCollected: 0,
      campTypesDefeated: new Set<string>(),
      expeditionStage: 0,
      charterEarned: false,
    };

    this.dragonProgress.set(playerId, {
      ...existing,
      bestiaryStudied: studied.size,
      researchLevel: maxResearch,
      materialsCollected: materials,
    });
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
          met = (progress?.materialsCollected ?? 0) >= req.threshold;
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

    this.dragonProgress.set(playerId, { ...existing, expeditionStage: 1 });
    const first = expedition.stages[0];
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
    this.dragonProgress.set(playerId, {
      ...progress,
      expeditionStage: isLast ? 0 : stageNumber + 1,
      charterEarned: isLast ? true : progress.charterEarned,
    });

    // Grant reward items
    const reward = stageDef.completion_reward;
    if (reward.item && typeof reward.item === "string") {
      const inv = this.inventory.get(playerId) ?? {};
      inv[reward.item] = (inv[reward.item] ?? 0) + (Number(reward.count) || 1);
      this.inventory.set(playerId, inv);
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
    this.inventory.set(playerId, inv);

    // Update bestiary if clue unlocks one
    if (clue.bestiary_unlock) {
      this.updateBestiary(playerId, clue.bestiary_unlock, 1);
    }

    // Increment readiness materials
    const progress = this.dragonProgress.get(playerId);
    if (progress) {
      this.dragonProgress.set(playerId, {
        ...progress,
        materialsCollected: progress.materialsCollected + 1,
      });
    }

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
      /** Resource cargo for haul intent (deducted from origin city now). */
      cargo?: Partial<ResourceBag>;
    },
  ): March {
    const city = this.requireCityOwner(opts.fromCityId, playerId);
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
        "kelp",
        "driftwood",
        "basalt",
        "slagiron",
        "tidegilt",
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
    this.cities.set(city.id, city);

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
    const travelSec = Math.max(5, dist * 8);
    const now = this.now();
    const march: March = {
      id: randomUUID(),
      realmId: this.realmId,
      playerId,
      fromCityId: city.id,
      commanderId: null,
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
    this.marches.set(march.id, march);
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
      report = this.makeReport(march, {
        type: "scout",
        target: { x: march.targetX, y: march.targetY, type: march.targetType },
        intel: this.buildScoutIntel(march),
      });
      this.startReturn(march, now, march.composition);
    } else if (march.intent === "attack" || march.intent === "occupy") {
      report = this.resolveAttack(march, now);
    } else if (march.intent === "reinforce") {
      this.applyReinforce(march);
      this.startReturn(march, now, {});
    } else if (march.intent === "haul") {
      report = this.applyHaul(march, now);
    } else {
      this.startReturn(march, now, march.composition);
    }

    if (report) {
      march.battleReportId = report.id;
    }
    this.pushEvent(
      march.playerId,
      "march_land",
      `March landed: ${march.intent} @ ${march.targetX},${march.targetY}`,
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
    this.marches.set(march.id, march);
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
      this.cities.set(city.id, city);
    }
    march.status = "completed";
    this.marches.set(march.id, march);
    this.pushEvent(
      march.playerId,
      "march_return",
      `March returned (${march.intent})`,
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
    this.reports.set(report.id, report);
    const type = String(result.type ?? "report");
    const winner =
      result.battle &&
      typeof result.battle === "object" &&
      "winner" in (result.battle as object)
        ? String((result.battle as { winner?: string }).winner)
        : null;
    const msg = winner
      ? `${type}: ${winner} wins`
      : type === "scout"
        ? "Scout report ready"
        : type === "haul"
          ? result.delivered
            ? "Haul delivered"
            : "Haul returned (undelivered)"
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
      defGroups = parseCampComp(def?.example_comp ?? "40 Levy");
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
      this.cities.set(defCity.id, defCity);
    }

    // Loot
    let loot: Partial<ResourceBag> = {};
    let clueDrop: DragonClue | null = null;
    if (battle.winner === "attacker") {
      if (camp) {
        loot = {
          kelp: 50 * camp.level,
          driftwood: 30 * camp.level,
          basalt: 10 * camp.level,
        };
        // Roll for dragon clue drop
        clueDrop = this.rollCampClueDrop(camp.level, seed + 1);
        if (clueDrop) {
          this.grantDragonClue(march.playerId, clueDrop.id);
        }
        // Track camp type defeat for readiness gate
        const progress = this.dragonProgress.get(march.playerId) ?? {
          bestiaryStudied: 0,
          researchLevel: 0,
          materialsCollected: 0,
          campTypesDefeated: new Set<string>(),
          expeditionStage: 0,
          charterEarned: false,
        };
        progress.campTypesDefeated.add(`camp_l${camp.level}`);
        this.dragonProgress.set(march.playerId, progress);
        // Update bestiary for camp creatures
        const campDef = getCamps().find((c) => c.camp_level === camp.level);
        if (campDef) {
          const entries = getBestiaryEntries();
          for (const entry of entries) {
            if (entry.category === "creature" && campDef.example_comp.toLowerCase().includes(entry.subject.split(" ")[0].toLowerCase())) {
              this.updateBestiary(march.playerId, entry.id, 1);
            }
          }
        }
      } else if (wild && march.intent === "occupy") {
        wild.ownerPlayerId = march.playerId;
        this.wilderness.set(wild.id, wild);
        loot = { kelp: 40, driftwood: 40 };
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
        this.cities.set(origin.id, origin);
      }
      // Break protection if attacker was protected and did PvP
      if (defCity) {
        const atk = this.players.get(march.playerId);
        if (atk?.protectionUntil) {
          atk.protectionUntil = null;
          this.players.set(atk.id, atk);
        }
      }
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

  /** Saltvault protects portion of non-Tidegilt resources. */
  plunderCity(city: City, rate = 1): Partial<ResourceBag> {
    const salt = city.buildings.find((b) => b.buildingType === "saltvault");
    const protectRatio = salt
      ? Math.min(0.9, SALTVAULT_PROTECT_RATIO + salt.level * 0.05)
      : 0.2;
    const lootable = (amount: number) =>
      Math.floor(amount * (1 - protectRatio) * 0.25 * rate);
    const loot: Partial<ResourceBag> = {
      kelp: lootable(city.resources.kelp),
      driftwood: lootable(city.resources.driftwood),
      basalt: lootable(city.resources.basalt),
      slagiron: lootable(city.resources.slagiron),
      // Tidegilt never protected by Saltvault — still only partial raid
      tidegilt: Math.floor(city.resources.tidegilt * 0.15 * rate),
    };
    city.resources.kelp -= loot.kelp ?? 0;
    city.resources.driftwood -= loot.driftwood ?? 0;
    city.resources.basalt -= loot.basalt ?? 0;
    city.resources.slagiron -= loot.slagiron ?? 0;
    city.resources.tidegilt -= loot.tidegilt ?? 0;
    this.cities.set(city.id, city);
    return loot;
  }

  private applyReinforce(march: March): void {
    const targetCity = [...this.cities.values()].find(
      (c) => c.mapX === march.targetX && c.mapY === march.targetY,
    );
    if (!targetCity) return;
    // Same alliance only
    const a = this.allianceMembers.get(march.playerId);
    const b = this.allianceMembers.get(targetCity.playerId);
    if (!a || !b || a.allianceId !== b.allianceId) return;
    for (const [uid, cnt] of Object.entries(march.composition)) {
      targetCity.stacks[uid] = (targetCity.stacks[uid] ?? 0) + cnt;
    }
    // Recalculate manpower after reinforcement (exploit fix)
    targetCity.usedManpower = recalculateManpower(targetCity);
    this.cities.set(targetCity.id, targetCity);
    march.composition = {};
  }

  /** Structured scout intel (server-side; client only displays). */
  buildScoutIntel(march: March): Record<string, unknown> {
    const base = {
      x: march.targetX,
      y: march.targetY,
      targetType: march.targetType,
    };
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
      return {
        ...base,
        kind: "camp",
        campId: camp.id,
        level: camp.level,
        exampleComp: def?.example_comp ?? null,
        threatBand: camp.level <= 3 ? "low" : camp.level <= 7 ? "mid" : "high",
      };
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
      // Fog of war lite: banded stack estimate, exact posture
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
      this.cities.set(targetCity.id, targetCity);
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
        this.cities.set(origin.id, origin);
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
    },
  ): void {
    const player = this.players.get(playerId);
    if (!player) throw new Error("no player");
    const city = this.citiesForPlayer(playerId)[0];
    if (body.resources && city) {
      for (const [k, v] of Object.entries(body.resources)) {
        const key = k as keyof ResourceBag;
        city.resources[key] = (city.resources[key] ?? 0) + (v ?? 0);
      }
      this.cities.set(city.id, city);
    }
    if (body.units && city) {
      for (const [uid, n] of Object.entries(body.units)) {
        city.stacks[uid] = (city.stacks[uid] ?? 0) + n;
      }
      city.usedManpower = recalculateManpower(city);
      this.cities.set(city.id, city);
    }
    if (body.chronite) {
      player.chronite += body.chronite;
      this.players.set(player.id, player);
    }
    if (body.skipProtection) {
      player.protectionUntil = null;
      this.players.set(player.id, player);
    }
    if (body.harness) {
      for (const sov of this.sovereigns.values()) {
        if (sov.playerId !== playerId) continue;
        sov.harnessCrown = true;
        sov.harnessHeart = true;
        sov.harnessGrasp = true;
        sov.harnessKeel = true;
        this.sovereigns.set(sov.id, sov);
      }
    }
    if (body.brineholdUnlock && city) {
      city.research["brinehold_unlock"] = 1;
      this.cities.set(city.id, city);
    }
    if (body.stonekeelUnlock && city) {
      city.research["stonekeel_unlock"] = 1;
      this.cities.set(city.id, city);
    }
    if (body.citadelUnlock && city) {
      const def = getCitadelById(body.citadelUnlock);
      if (def) {
        city.research[def.unlock_research] = 1;
        this.cities.set(city.id, city);
      }
    }
    if (body.items) {
      const inv = this.inventory.get(playerId) ?? {};
      for (const [id, n] of Object.entries(body.items)) {
        inv[id] = (inv[id] ?? 0) + n;
      }
      this.inventory.set(playerId, inv);
    }
  }

  foundMarcherKeep(playerId: string, name?: string): City {
    const progress = this.dragonProgress.get(playerId);
    if (!progress?.charterEarned) {
      throw Object.assign(new Error("settlement charter not earned"), {
        code: "NO_CHARTER",
      });
    }
    return this.foundCitadel(playerId, "marcher_keep", name);
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
  foundCitadel(playerId: string, kind: string, name?: string): City {
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
    if (!capital.research[def.unlock_research]) {
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
    this.cities.set(city.id, city);
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
    const a: Alliance = {
      id: randomUUID(),
      realmId: this.realmId,
      name: name.slice(0, 32),
      tag: tag.slice(0, 5).toUpperCase(),
      leaderId: playerId,
    };
    this.alliances.set(a.id, a);
    this.allianceMembers.set(playerId, {
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
    this.allianceMembers.set(playerId, {
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
      this.dailyQuests.set(playerId, d);
    }
    return d;
  }

  markDaily(playerId: string, questId: string): void {
    const d = this.ensureDaily(playerId);
    d.done[questId] = true;
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
    this.players.set(playerId, player);
    return { chronite: player.chronite, questId };
  }

  advanceTutorial(playerId: string): Tutorial {
    const t = this.tutorials.get(playerId) ?? {
      playerId,
      step: 0,
      completed: false,
    };
    t.step = Math.min(TUTORIAL_STEPS.length, t.step + 1);
    if (t.step >= TUTORIAL_STEPS.length) t.completed = true;
    this.tutorials.set(playerId, t);
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
        ? "Tutorial complete"
        : TUTORIAL_STEPS[idx] ?? TUTORIAL_STEPS[0],
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
    this.players.set(player.id, player);
    const inv = this.inventory.get(playerId) ?? {};
    inv[itemId] = (inv[itemId] ?? 0) + 1;
    this.inventory.set(playerId, inv);
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

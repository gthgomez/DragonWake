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
import { getCamps, getUnitById } from "@tideforge/content";
import {
  DEV_FAST_MULTIPLIER,
  MAP_H,
  MAP_W,
  NEW_PLAYER_PROTECTION_MS,
  SALTVAULT_PROTECT_RATIO,
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
  kind: "capital" | "brinehold" | "citadel_other";
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
  "Welcome to the realm — your capital sits on the tide map.",
  "Open City and review Kelp, Driftwood, and other stocks.",
  "Queue a building (Barracks or Habitation).",
  "Assign a Resource Grounds plot to raise production.",
  "Research Longmark and train Levy or Reefbow.",
  "Open Map, set composition, and attack a Riftborn camp.",
  "Occupy wilderness to boost production.",
  "Complete the Harbinger harness (dev grant OK for demo).",
  "Found a Brinehold citadel.",
  "Create or join a Tideband and send chat.",
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
    title: "Attack a Riftborn camp",
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
    tidepike: "tidepike",
    bullhorn: "bullhorn",
    reefbow: "reefbow",
    colossus: "colossus_frame",
    skyshrike: "skyshrike",
    stormkeel: "stormkeel",
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
  ownedWildCount = 0,
): City {
  const elapsedMs = Math.max(0, now - city.lastResourceTick);
  if (elapsedMs < 1000) return city;
  const hours = elapsedMs / 3_600_000;
  const rates = productionPerHour(city);
  const wildMul = 1 + ownedWildCount * 0.05;
  const next: ResourceBag = {
    kelp: Math.floor(city.resources.kelp + rates.kelp * hours * wildMul),
    driftwood: Math.floor(
      city.resources.driftwood + rates.driftwood * hours * wildMul,
    ),
    basalt: Math.floor(city.resources.basalt + rates.basalt * hours * wildMul),
    slagiron: Math.floor(
      city.resources.slagiron + rates.slagiron * hours * wildMul,
    ),
    tidegilt: Math.floor(
      city.resources.tidegilt + rates.tidegilt * hours * wildMul,
    ),
  };
  return { ...city, resources: next, lastResourceTick: now };
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
  usedTiles = new Set<string>();
  devFastTime: boolean;
  skipTutorial: boolean;
  /** Live persistence backend; null = memory-only. */
  store: WorldStore | null = null;
  private cityCounter = 0;
  private persistChain: Promise<void> = Promise.resolve();

  constructor(opts?: { devFastTime?: boolean; skipTutorial?: boolean }) {
    this.devFastTime =
      opts?.devFastTime ?? process.env.DEV_FAST_TIME === "1";
    this.skipTutorial =
      opts?.skipTutorial ?? process.env.DEV_SKIP_TUTORIAL === "1";
    this.seedMap();
  }

  get dbMode(): "postgres" | "memory" {
    return this.store?.mode ?? "memory";
  }

  /** Attach PG store and load existing realm rows (if any). */
  async attachStore(store: WorldStore): Promise<void> {
    this.store = store;
    await store.loadInto(this);
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
      const types = ["kelp", "driftwood", "basalt", "slagiron"];
      this.wilderness.set(id, {
        id,
        realmId: this.realmId,
        x,
        y,
        level: 1 + (n % 5),
        resourceType: types[n % types.length]!,
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
      defensePosture: "harbor",
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
      stacks: { levy: 50, bearer: 10, whisper: 5 },
      research: {},
    };
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
      const wild = [...this.wilderness.values()].filter(
        (w) => w.ownerPlayerId === city.playerId,
      ).length;
      const next = tickCityResources(city, now, wild);
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
    } else if (job.kind === "research") {
      const techId = String(job.payload.techId);
      city.research[techId] = (city.research[techId] ?? 0) + 1;
    } else if (job.kind === "train") {
      const unitId = String(job.payload.unitId);
      const count = Number(job.payload.count) || 0;
      city.stacks[unitId] = (city.stacks[unitId] ?? 0) + count;
    }
    job.status = "completed";
    this.cities.set(city.id, city);
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
    const n = Math.max(1, Math.floor(count));
    const costK = (unit.cost_kelp ?? 30) * n;
    if (city.resources.kelp < costK) {
      throw Object.assign(new Error("insufficient kelp"), { code: "NO_RES" });
    }
    city.resources.kelp -= costK;
    city.resources.driftwood = Math.max(
      0,
      city.resources.driftwood - (unit.cost_driftwood ?? 0) * n,
    );
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
    city.defensePosture = posture;
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
    const wildMul = 1 + this.ownedWildernessCount(city.playerId) * 0.05;
    return {
      kelp: Math.floor(rates.kelp * wildMul),
      driftwood: Math.floor(rates.driftwood * wildMul),
      basalt: Math.floor(rates.basalt * wildMul),
      slagiron: Math.floor(rates.slagiron * wildMul),
      tidegilt: Math.floor(rates.tidegilt * wildMul),
    };
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
        intel: "Scout report (MVP stub detail)",
      });
      this.startReturn(march, now, march.composition);
    } else if (march.intent === "attack" || march.intent === "occupy") {
      report = this.resolveAttack(march, now);
    } else if (march.intent === "reinforce") {
      this.applyReinforce(march);
      this.startReturn(march, now, {});
    } else if (march.intent === "haul") {
      this.startReturn(march, now, march.composition);
    } else {
      this.startReturn(march, now, march.composition);
    }

    if (report) {
      march.battleReportId = report.id;
    }
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
      this.cities.set(city.id, city);
    }
    march.status = "completed";
    this.marches.set(march.id, march);
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
        { unitId: "tidepike", count: 5 * (wild?.level ?? 1) },
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
        if (defCity.defensePosture === "harbor") {
          harborLoot = true;
          defGroups = []; // free loot unprotected
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
            note: "harbor_free_loot",
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
    if (defCity && defCity.defensePosture !== "harbor") {
      for (const [uid, lost] of Object.entries(battle.losses.defender)) {
        const n = Number(lost) || 0;
        defCity.stacks[uid] = Math.max(0, (defCity.stacks[uid] ?? 0) - n);
      }
      this.cities.set(defCity.id, defCity);
    }

    // Loot
    let loot: Partial<ResourceBag> = {};
    if (battle.winner === "attacker") {
      if (camp) {
        loot = {
          kelp: 50 * camp.level,
          driftwood: 30 * camp.level,
          basalt: 10 * camp.level,
        };
      } else if (wild && march.intent === "occupy") {
        wild.ownerPlayerId = march.playerId;
        this.wilderness.set(wild.id, wild);
        loot = { kelp: 40, driftwood: 40 };
      } else if (defCity && (harborLoot || battle.winner === "attacker")) {
        loot = this.plunderCity(defCity);
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
  plunderCity(city: City): Partial<ResourceBag> {
    const salt = city.buildings.find((b) => b.buildingType === "saltvault");
    const protectRatio = salt
      ? Math.min(0.9, SALTVAULT_PROTECT_RATIO + salt.level * 0.05)
      : 0.2;
    const lootable = (amount: number) =>
      Math.floor(amount * (1 - protectRatio) * 0.25);
    const loot: Partial<ResourceBag> = {
      kelp: lootable(city.resources.kelp),
      driftwood: lootable(city.resources.driftwood),
      basalt: lootable(city.resources.basalt),
      slagiron: lootable(city.resources.slagiron),
      // Tidegilt never protected by Saltvault — still only partial raid
      tidegilt: Math.floor(city.resources.tidegilt * 0.15),
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
    this.cities.set(targetCity.id, targetCity);
    march.composition = {};
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
      // mark research gate
      city.research["brinehold_unlock"] = 1;
      this.cities.set(city.id, city);
    }
    if (body.items) {
      const inv = this.inventory.get(playerId) ?? {};
      for (const [id, n] of Object.entries(body.items)) {
        inv[id] = (inv[id] ?? 0) + n;
      }
      this.inventory.set(playerId, inv);
    }
  }

  foundBrinehold(playerId: string, name?: string): City {
    const capitals = this.citiesForPlayer(playerId).filter(
      (c) => c.kind === "capital",
    );
    if (capitals.length === 0) throw new Error("no capital");
    const capital = capitals[0]!;
    // Allow if unlock flag or admin path
    if (!capital.research["brinehold_unlock"] && process.env.NODE_ENV === "production") {
      // still allow in beta with unlock research
    }
    const { x, y } = this.findOpenTile();
    const city: City = {
      id: randomUUID(),
      playerId,
      realmId: this.realmId,
      kind: "brinehold",
      name: name?.trim() || "Brinehold",
      mapX: x,
      mapY: y,
      resources: emptyResources(800),
      defensePosture: "harbor",
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
      stacks: { gulper: 10, coral_lance: 10 },
      research: { ...capital.research },
    };
    this.cities.set(city.id, city);
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

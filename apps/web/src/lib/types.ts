/*
 * DTO/entity shapes. Several duplicate types already defined in
 * @tideforge/shared — pending dedup (re-export from shared once the web app
 * gains a dependency on that package).
 */

export type Resources = {
  food: number;
  timber: number;
  stone: number;
  iron: number;
  coin: number;
};

export type City = {
  id: string;
  name: string;
  kind: string;
  mapX: number;
  mapY: number;
  resources: Resources;
  defensePosture: string;
  buildings: { slotIndex: number; buildingType: string; level: number }[];
  plots: { slotIndex: number; plotType: string | null; level: number }[];
  stacks: Record<string, number>;
  research: Record<string, number>;
  productionPerHour?: Resources;
  ownedWilderness?: number;
  population?: number;
  maxPopulation?: number;
  usedManpower?: number;
  maxManpower?: number;
};

export type Player = {
  id: string;
  displayName: string;
  faction: string;
  chronite: number;
  protectionUntil: string | null;
};

export type QueueJob = {
  id: string;
  cityId: string;
  kind: "build" | "research" | "train";
  payload: Record<string, unknown>;
  startedAt: number;
  finishesAt: number;
  status: string;
};

export type March = {
  id: string;
  fromCityId: string;
  intent: string;
  targetType: string;
  targetId: string | null;
  targetX: number;
  targetY: number;
  composition: Record<string, number>;
  departAt: number;
  arriveAt: number;
  returnAt: number | null;
  status: string;
  battleReportId: string | null;
};

export type BattleReport = {
  id: string;
  attackerPlayerId: string | null;
  defenderPlayerId: string | null;
  createdAt: number;
  result: {
    type?: string;
    reason?: string;
    note?: string;
    intel?: string | Record<string, unknown>;
    harborLoot?: boolean;
    delivered?: boolean;
    loot?: Partial<Resources>;
    battle?: {
      winner?: string;
      rounds?: number;
      note?: string;
      losses?: {
        attacker?: Record<string, number>;
        defender?: Record<string, number>;
      };
      remaining?: {
        attacker?: Record<string, number>;
        defender?: Record<string, number>;
      };
    };
    target?: { type?: string; x?: number; y?: number; id?: string | null };
  };
};

export type WorldEventDto = {
  seq: number;
  type: string;
  message: string;
  at: number;
};

export type UnitDef = {
  id: string;
  name: string;
  cost_food?: number;
  cost_timber?: number;
  cost_stone?: number;
  cost_iron?: number;
  cost_coin?: number;
  train_sec_L1?: number;
  unlock?: string;
  role?: string;
  tier?: number;
};

export type Commander = {
  id: string;
  name: string;
  stars: number;
  leadership: number;
  attack: number;
  defense: number;
  life: number;
  xp: number;
  state: "available" | "busy" | "wounded";
  woundedUntil: string | null;
  busyMarchId: string | null;
};

export type MapData = {
  mapW?: number;
  mapH?: number;
  camps: { id: string; x: number; y: number; level: number }[];
  wilderness: {
    id: string;
    x: number;
    y: number;
    level: number;
    resourceType: string;
    ownerPlayerId: string | null;
  }[];
  cities: {
    id: string;
    x: number;
    y: number;
    name: string;
    kind: string;
    playerId?: string;
  }[];
};

export type MapFocus = { x0: number; y0: number; x1: number; y1: number };

export type TutorialState = {
  step: number;
  completed: boolean;
  totalSteps: number;
  currentLabel: string;
};

export type DailyQuest = {
  id: string;
  title: string;
  rewardChronite: number;
  done: boolean;
  claimed: boolean;
};

export type Sovereign = {
  id: string;
  sovereignType: string;
  harnessComplete: boolean;
};

export type ResearchDef = { id: string; name: string; group: string };

export type AllianceInfo = { id: string; name: string; tag: string };

export type ChatMessage = {
  body: string;
  fromPlayerId: string;
  createdAt?: number;
};

export type AllianceSummary = {
  id: string;
  name: string;
  tag: string;
  memberCount: number;
};

/**
 * Game content loaders. JSON lives in ../data (copied from pre-implementation).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

function loadJson<T>(name: string): T {
  const raw = readFileSync(join(dataDir, name), "utf8");
  return JSON.parse(raw) as T;
}

export type UnitDef = {
  id: string;
  name: string;
  tier: number;
  role: string;
  life: number;
  melee_atk: number;
  ranged_atk: number;
  range: number;
  speed: number;
  defense: number;
  pop: number;
  power: number;
  carry: number;
  cost_kelp?: number;
  cost_driftwood?: number;
  cost_basalt?: number;
  cost_slagiron?: number;
  cost_tidegilt?: number;
  train_sec_L1?: number;
  unlock?: string;
  [key: string]: unknown;
};

export type ContentMeta = {
  version: string;
  source: string;
  generated: string;
};

export type StackBand = {
  count_min: number;
  count_max: number;
  efficiency: number;
  notes?: string;
};

export type Formulas = {
  rulesVersion: string;
  openDistanceFlat: number;
  rngMin: number;
  rngMax: number;
  notes?: string;
};

export type CampDef = {
  camp_level: number;
  def_power_approx: number;
  example_comp: string;
  recommended_player_power: number;
  loot_notes: string;
  harness_drop: string;
};

export type BuildingDef = {
  id: string;
  name: string;
  category: string;
  max_level: number;
};

export type ResearchDef = {
  id: string;
  name: string;
  per_level: number;
  max_level: number;
  group: string;
};

export type SovereignDef = {
  id: string;
  name: string;
  life: number;
  melee_atk: number;
  ranged_atk: number;
  range: number;
  speed: number;
  defense: number;
  power: number;
  aura_atk?: number;
  aura_def?: number;
  aura_life?: number;
  ship?: string;
};

export type ShopItem = {
  id: string;
  name: string;
  chronite: number;
  effect: { type: string; seconds?: number; [key: string]: unknown };
};

export type MatchupDef = {
  test_id: string;
  attacker: string;
  defender: string;
  expected_winner: string;
  design_intent: string;
  pass_criteria: string;
  status: string;
};

let cache: {
  units?: UnitDef[];
  rps?: Record<string, Record<string, number>>;
  stackEfficiency?: StackBand[];
  meta?: ContentMeta;
  formulas?: Formulas;
  camps?: CampDef[];
  buildings?: BuildingDef[];
  research?: ResearchDef[];
  sovereigns?: SovereignDef[];
  shop?: ShopItem[];
  matchups?: MatchupDef[];
} = {};

export function getMeta(): ContentMeta {
  return (cache.meta ??= loadJson<ContentMeta>("meta.json"));
}

export function getUnits(): UnitDef[] {
  return (cache.units ??= loadJson<UnitDef[]>("units.json"));
}

export function getUnitById(id: string): UnitDef | undefined {
  return getUnits().find((u) => u.id === id);
}

export function getUnitByName(name: string): UnitDef | undefined {
  const n = name.toLowerCase();
  return getUnits().find((u) => u.name.toLowerCase() === n || u.id === n);
}

export function getRps(): Record<string, Record<string, number>> {
  return (cache.rps ??= loadJson("rps.json"));
}

export function getStackEfficiency(): StackBand[] {
  return (cache.stackEfficiency ??= loadJson<StackBand[]>("stack_efficiency.json"));
}

export function getFormulas(): Formulas {
  return (cache.formulas ??= loadJson<Formulas>("formulas.json"));
}

export function getCamps(): CampDef[] {
  return (cache.camps ??= loadJson<CampDef[]>("camps.json"));
}

export function getBuildings(): BuildingDef[] {
  return (cache.buildings ??= loadJson<BuildingDef[]>("buildings.json"));
}

export function getResearch(): ResearchDef[] {
  return (cache.research ??= loadJson<ResearchDef[]>("research.json"));
}

export function getSovereigns(): SovereignDef[] {
  return (cache.sovereigns ??= loadJson<SovereignDef[]>("sovereigns.json"));
}

export function getSovereignById(id: string): SovereignDef | undefined {
  return getSovereigns().find((s) => s.id === id);
}

export function getShop(): ShopItem[] {
  return (cache.shop ??= loadJson<ShopItem[]>("shop.json"));
}

export function getMatchups(): MatchupDef[] {
  return (cache.matchups ??= loadJson<MatchupDef[]>("matchups.json"));
}

export function getDataPath(): string {
  return dataDir;
}

/** Clear content cache (tests). */
export function clearContentCache(): void {
  cache = {};
}

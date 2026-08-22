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
  cost_food?: number;
  cost_timber?: number;
  cost_stone?: number;
  cost_iron?: number;
  cost_coin?: number;
  train_sec_L1?: number;
  unlock?: string;
  medieval_role?: string;
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
  /** Bounded composition templates for this level; seed picks one. */
  comps?: string[];
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

/** Resource cost bag for research (subset of the canonical resource set). */
export type ResearchCost = Partial<
  Record<"food" | "timber" | "stone" | "iron" | "coin", number>
>;

export type ResearchDef = {
  id: string;
  name: string;
  per_level: number;
  max_level: number;
  group: string;
  /** Base resource cost; total scales with the next level number (L1 = base). */
  cost?: ResearchCost;
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

export type CitadelDef = {
  id: string;
  name: string;
  order: number;
  ship: string;
  exclusive_units: string[];
  starter_stacks: Record<string, number>;
  craft_mat: string;
  unlock_research: string;
  requires?: string[];
};

export type DomainCatalog = {
  version: string;
  description: string;
  resources: {
    legacy_to_target: Record<string, string>;
    target: string[];
    columns: Record<string, string>;
  };
  units: {
    legacy_to_target: Record<string, string>;
    role_adapter: Record<string, string>;
  };
  buildings: { legacy_to_target: Record<string, string> };
  research: { legacy_to_target: Record<string, string> };
  factions: { legacy_to_target: Record<string, string> };
  plot_types: { legacy_to_target: Record<string, string> };
  defense_posture: { legacy_to_target: Record<string, string> };
  citadels: { legacy_to_target: Record<string, string> };
  camp_types: Record<string, { levels: number[]; description: string }>;
  wilderness_types: Record<string, { bonus: string; description: string }>;
};

export type ResearchUnlock = {
  research_id: string;
  research_level: number;
  unlocks: string[];
  kind: "unit" | "building" | "capability";
};

export type BestiaryEntry = {
  id: string;
  subject: string;
  category: string;
  observation_level: number;
  known_traits: string[];
  unknown_traits: string[];
  habitat: string | null;
  known_attacks: string[];
  suspected_weakness: string | null;
  confirmed_weakness: string | null;
  encounter_count: number;
  source: string;
  lore_notes: string;
};

export type DragonReadinessConfig = {
  version: string;
  gate_name: string;
  requirements: Array<{
    id: string;
    type: string;
    description: string;
    threshold: number;
    research_id?: string;
    item_id?: string;
  }>;
  reward: string;
};

export type Expedition = {
  id: string;
  name: string;
  description: string;
  stages: Array<{
    stage: number;
    name: string;
    description: string;
    type: string;
    target_level: number;
    /**
     * Cumulative gameplay counters required to enter this stage
     * (scouts = scout marches landed, camps = camp victories landed).
     */
    requires?: { scouts?: number; camps?: number };
    completion_reward: Record<string, unknown>;
  }>;
};

export type DragonClue = {
  id: string;
  name: string;
  description: string;
  rarity: string;
  bestiary_unlock: string;
  readiness_value: number;
};

/** Commander name-pool entry (recruitment names). */
export type CommanderName = {
  name: string;
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
  citadels?: CitadelDef[];
  domainCatalog?: DomainCatalog;
  researchUnlocks?: ResearchUnlock[];
  bestiaryEntries?: BestiaryEntry[];
  dragonReadiness?: DragonReadinessConfig;
  expeditions?: Expedition[];
  dragonClues?: DragonClue[];
  commanderNames?: CommanderName[];
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

/** Return unit costs in the medieval resource set (M2 canonical ids). */
export function getUnitCost(unit: UnitDef): { food: number; timber: number; stone: number; iron: number; coin: number } {
  return {
    food: unit.cost_food ?? 0,
    timber: unit.cost_timber ?? 0,
    stone: unit.cost_stone ?? 0,
    iron: unit.cost_iron ?? 0,
    coin: unit.cost_coin ?? 0,
  };
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

export function getCitadels(): CitadelDef[] {
  return (cache.citadels ??= loadJson<CitadelDef[]>("citadels.json"));
}

export function getCitadelById(id: string): CitadelDef | undefined {
  return getCitadels().find((c) => c.id === id);
}

export function getDataPath(): string {
  return dataDir;
}

export function getDomainCatalog(): DomainCatalog {
  return (cache.domainCatalog ??= loadJson<DomainCatalog>("domain_catalog.json"));
}

export function getResearchUnlocks(): ResearchUnlock[] {
  return (cache.researchUnlocks ??= loadJson<ResearchUnlock[]>("research_unlocks.json"));
}

export function getBestiaryEntries(): BestiaryEntry[] {
  return (cache.bestiaryEntries ??= loadJson<BestiaryEntry[]>("bestiary_entries.json"));
}

export function getDragonReadiness(): DragonReadinessConfig {
  return (cache.dragonReadiness ??= loadJson<DragonReadinessConfig>("dragon_readiness.json"));
}

export function getExpeditions(): Expedition[] {
  return (cache.expeditions ??= loadJson<Expedition[]>("expeditions.json"));
}

export function getDragonClues(): DragonClue[] {
  return (cache.dragonClues ??= loadJson<DragonClue[]>("dragon_clues.json"));
}

export function getCommanderNames(): string[] {
  return (cache.commanderNames ??= loadJson<CommanderName[]>("commanders.json")).map(
    (c) => c.name,
  );
}

/** Check if a unit is unlocked by the city's research. */
export function isUnitUnlocked(unitId: string, cityResearch: Record<string, number>): boolean {
  const units = getUnits();
  const unit = units.find((u) => u.id === unitId);
  if (!unit) return false;
  if (!unit.unlock || unit.unlock === "start") return true;
  // Check research_unlocks.json for explicit gates
  const unlocks = getResearchUnlocks();
  const gate = unlocks.find((u) => u.kind === "unit" && u.unlocks.includes(unitId));
  if (!gate) return true; // no explicit gate = always available
  const currentLevel = cityResearch[gate.research_id] ?? 0;
  return currentLevel >= gate.research_level;
}

/** Check if a building type is unlocked by research. */
export function isBuildingUnlocked(buildingId: string, cityResearch: Record<string, number>): boolean {
  const unlocks = getResearchUnlocks();
  const gate = unlocks.find((u) => u.kind === "building" && u.unlocks.includes(buildingId));
  if (!gate) return true;
  const currentLevel = cityResearch[gate.research_id] ?? 0;
  return currentLevel >= gate.research_level;
}

/** Clear content cache (tests). */
export function clearContentCache(): void {
  cache = {};
}

/**
 * Canonicalize a tech id: maps legacy aquatic research ids to their medieval
 * successors using domain_catalog.research.legacy_to_target. Unknown ids
 * (unlock flags like brinehold_unlock) pass through unchanged.
 */
export function canonTechId(id: string): string {
  const legacy = getDomainCatalog().research?.legacy_to_target;
  return legacy?.[id] ?? id;
}

/**
 * Canonicalize a resource id: maps legacy aquatic ids (kelp…) to the medieval
 * set (food…) using domain_catalog.resources.legacy_to_target. Unknown ids
 * pass through unchanged.
 */
export function canonResourceId(id: string): string {
  const legacy = getDomainCatalog().resources?.legacy_to_target;
  return legacy?.[id] ?? id;
}

// ── Content integrity (boot-time fail-fast) ─────────────────────────────────

export type ContentIssue = {
  file: string;
  where: string;
  problem: string;
  severity: "error" | "warning";
};

/**
 * Cross-reference every gameplay-load-bearing id in the data files.
 * Errors = broken promises players can hit (phantom units granted at
 * founding, research gates pointing nowhere); warnings = descriptive
 * metadata referencing not-yet-shipped content.
 *
 * Callers should refuse to boot on any "error" issue.
 */
export function contentIntegrityIssues(): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const unitIds = new Set(getUnits().map((u) => u.id));
  const unitNames = new Set(getUnits().map((u) => u.name.toLowerCase()));
  // Research ids plus synthetic unlock flags minted by admin/dev grants
  // (e.g. brinehold_unlock, marcher_keep_charter) — citadels key off these.
  const researchIds = new Set([
    ...getResearch().map((r) => r.id),
    ...getCitadels().map((c) => c.unlock_research),
  ]);
  const buildingIds = new Set(getBuildings().map((b) => b.id));
  const citadelIds = new Set(getCitadels().map((c) => c.id));
  const err = (file: string, where: string, problem: string) =>
    issues.push({ file, where, problem, severity: "error" });
  const warn = (file: string, where: string, problem: string) =>
    issues.push({ file, where, problem, severity: "warning" });

  // Citadels: starter_stacks grant real units at founding time.
  for (const c of getCitadels()) {
    for (const [uid, count] of Object.entries(c.starter_stacks ?? {})) {
      if (!unitIds.has(uid)) {
        err("citadels.json", `${c.id}.starter_stacks.${uid}`, `unknown unit id (${count} would silently vanish)`);
      }
    }
    for (const uid of c.exclusive_units ?? []) {
      if (!unitIds.has(uid)) {
        warn(
          "citadels.json",
          `${c.id}.exclusive_units.${uid}`,
          "references a unit that does not exist yet (ok for unshipped ladder rungs)",
        );
      }
    }
    for (const req of c.requires ?? []) {
      if (!getCitadels().some((x) => x.id === req)) {
        err("citadels.json", `${c.id}.requires.${req}`, "unknown prerequisite citadel");
      }
    }
  }

  // Research unlocks: unit gates are battle-critical (error on phantom
  // targets); building/capability gates referencing unshipped structures
  // (e.g. dragon_watch) stay visible as warnings.
  for (const gate of getResearchUnlocks()) {
    if (!researchIds.has(gate.research_id)) {
      err("research_unlocks.json", `${gate.research_id}`, "gate references unknown research id");
    }
    for (const target of gate.unlocks) {
      const known =
        gate.kind === "unit"
          ? unitIds.has(target)
          : gate.kind === "building"
            ? buildingIds.has(target) || citadelIds.has(target)
            : true; // capability gates are free-form
      if (!known) {
        warn(
          "research_unlocks.json",
          `${gate.research_id}.unlocks.${target}`,
          `unknown ${gate.kind} id (ok only for unshipped content)`,
        );
      }
    }
  }

  // Units: authoritative unit gates live in research_unlocks.json (validated
  // above). The units.unlock string is display prose like "Archery 1" —
  // flag non-ids as warnings so drift stays visible without failing boot.
  for (const u of getUnits()) {
    if (u.unlock && u.unlock !== "start" && !researchIds.has(String(u.unlock))) {
      warn(
        "units.json",
        `${u.id}.unlock`,
        `"${String(u.unlock)}" is prose, not a research id (gate enforced via research_unlocks.json)`,
      );
    }
  }

  // Camps: composition strings must resolve to known units by name.
  for (const camp of getCamps()) {
    const comps = [...(camp.comps ?? []), camp.example_comp];
    for (const comp of comps) {
      for (const part of comp.split("+")) {
        const name = part.trim().replace(/^\d+\s*/, "").toLowerCase();
        if (!name || unitNames.has(name)) continue;
        warn("camps.json", `L${camp.camp_level}`, `composition mentions unknown unit name "${name}"`);
      }
    }
  }

  return issues;
}

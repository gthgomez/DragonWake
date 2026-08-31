/*
 * Player-facing language layer (CLOSED_MOCKUP_V1 §3).
 * Internal ids never reach the UI as labels; internal error codes are
 * translated here, with the raw code preserved in the console for devs.
 */

export type UnitLite = { id: string; name: string };
export type BuildingLite = {
  id: string;
  name: string;
  purpose?: string;
  buildable?: boolean;
  build_cost?: Record<string, number>;
  build_sec_L1?: number;
  max_level?: number;
};

const registry: {
  units: Record<string, string>;
  buildings: Record<string, BuildingLite>;
  research: Record<string, string>;
} = { units: {}, buildings: {}, research: {} };

export type ResearchLite = { id: string; name: string };

/** Called whenever content defs load (and again if they change). */
export function registerLabels(
  units: UnitLite[],
  buildings: BuildingLite[],
  research: ResearchLite[] = [],
) {
  for (const u of units) registry.units[u.id] = u.name;
  for (const b of buildings) registry.buildings[b.id] = b;
  for (const r of research) registry.research[r.id] = r.name;
}

export function unitName(id: string): string {
  return registry.units[id] ?? prettify(id);
}

export function buildingName(id: string): string {
  return registry.buildings[id]?.name ?? prettify(id);
}

export function buildingDef(id: string): BuildingLite | undefined {
  return registry.buildings[id];
}

export function researchName(id: string): string {
  return registry.research[id] ?? prettify(id);
}

export function prettify(id: string): string {
  return id
    .split("_")
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// ── World nouns ─────────────────────────────────────────────────────────────

export function cityKindLabel(kind: string): string {
  const map: Record<string, string> = {
    capital: "Capital Keep",
    marcher_keep: "Marcher Keep",
    brinehold: "Brinehold",
    stonekeel: "Mountain Hold",
    cinderreach: "Forest Citadel",
    galeari: "Dragon Watch",
    citadel_other: "Citadel",
  };
  return map[kind] ?? prettify(kind);
}

/** Camp type names by threat band (domain_catalog.camp_types). */
export function campLabel(level: number): string {
  if (level <= 3) return "Bandit Camp";
  if (level <= 5) return "Raider Fort";
  if (level <= 7) return "Beast Den";
  return "Wyrm-Scarred Ruin";
}

export type WildInfo = { label: string; bonusLine: string };

const WILDS: Record<string, WildInfo> = {
  forest: { label: "Deepwood", bonusLine: "+30 timber/h while held" },
  fertile_land: { label: "Rich Farmland", bonusLine: "+40 food/h while held" },
  quarry: { label: "Stone Quarry", bonusLine: "+25 stone/h while held" },
  iron_hills: { label: "Iron Hills", bonusLine: "+15 iron/h while held" },
  crossroads: { label: "Crossroads", bonusLine: "a strategic junction" },
  watch_hill: { label: "Watch Hill", bonusLine: "high ground for scouts" },
};

export function wildInfo(resourceType: string): WildInfo {
  return WILDS[resourceType] ?? { label: prettify(resourceType), bonusLine: "" };
}

export function intentLabel(intent: string): string {
  const map: Record<string, string> = {
    attack: "Attack",
    occupy: "Occupy",
    scout: "Scout",
    reinforce: "Reinforce",
    haul: "Haul",
  };
  return map[intent] ?? prettify(intent);
}

export function targetPhrase(targetType: string): string {
  const map: Record<string, string> = {
    camp: "a camp",
    wilderness: "the wilds",
    city: "a settlement",
    coords: "open country",
  };
  return map[targetType] ?? "the target";
}

export function postureLabel(posture?: string, harborLoot?: boolean): string {
  if (harborLoot) return "Withdrew — stores plundered without a fight";
  if (posture === "full") return "Full defense — every sword fought";
  if (posture === "garrison") return "Garrison — only part of the garrison fought";
  if (posture === "withdraw") return "Withdrew — no wall fight";
  return harborLoot === false ? "Fought" : "—";
}

export function commanderStateLabel(state: string, woundedUntil: string | null): string {
  if (state === "wounded") {
    const until = woundedUntil ? new Date(woundedUntil).toLocaleTimeString() : "";
    return `Recovering${until ? ` — ready again around ${until}` : ""}`;
  }
  if (state === "busy") return "Leading a march";
  return "Ready";
}

// ── Error translation ───────────────────────────────────────────────────────

const ERROR_COPY: Record<string, string> = {
  NO_TROOPS: "You do not have enough available troops for this march.",
  NO_MANPOWER: "Your settlement lacks the people to muster that force. Raise more Homes or wait for the population to grow.",
  NO_RES: "Not enough resources for that — your stores fall short.",
  RESEARCH_COST: "Not enough resources for that research — your stores fall short.",
  RECRUIT_COST: "Not enough resources to recruit that commander.",
  QUEUE_FULL: "Your stewards are already at work — wait for a queue to finish.",
  UNIT_LOCKED: "That company is not unlocked yet — further study is required.",
  BAD_UNIT: "That company is not mustered here.",
  NO_COMMANDER: "That commander is not in your service.",
  COMMANDER_BUSY: "That commander is already leading a march.",
  COMMANDER_WOUNDED: "That commander is still recovering from their last battle.",
  COMMANDER_SLOTS: "No free command slots — raise the Commanders' Hall.",
  NO_GALLERY: "Recruiting requires a Commanders' Hall.",
  RECRUIT_SLOTS: "Your commanders' roster is full — raise the Commanders' Hall.",
  SLOT_OCCUPIED: "That plot is held by another structure.",
  SLOT_BUSY: "Construction is already under way on that plot.",
  BUILDING_MAX: "That structure is already at its highest level.",
  BUILDING_FIXED: "That structure cannot be raised here.",
  BUILDING_LOCKED: "That structure requires further research first.",
  BAD_BUILDING: "That structure is unknown to your stewards.",
  PLOT_MAX: "That land is already fully worked.",
  PLOT_OCCUPIED: "That plot is already assigned — upgrade it instead.",
  NO_PLOT: "That plot of land does not exist.",
  BAD_PLOT: "That use of land is unknown.",
  NO_CHARTER: "A settlement charter is required — complete the Dragon Expedition first.",
  NO_UNLOCK: "Your keep lacks the charter or unlock required for that settlement.",
  CITADEL_PREREQ: "An earlier settlement in the ladder must be founded first.",
  HAS_CITADEL: "You already rule a settlement of that kind.",
  NOT_SHIPPED: "That settlement lies beyond the current march.",
  NO_CAPITAL: "A capital keep is required first.",
  BAD_CITADEL: "That kind of settlement is unknown.",
  NAME_TAKEN: "That name is already sworn by another lord.",
  RATE_LIMIT: "Too much, too fast — hold a moment and try again.",
  UNAUTHORIZED: "Your session has lapsed — enter the realm again.",
  FORBIDDEN: "You are not permitted to do that.",
  TAG_TAKEN: "That banner tag is already flown by another alliance.",
  IN_ALLY: "You already serve an alliance.",
  NO_ALLY: "That alliance could not be found.",
  QUEST_INCOMPLETE: "That deed is not yet done.",
  QUEST_CLAIMED: "That reward is already claimed.",
  NO_CHRONITE: "Not enough Chronite.",
  NO_ITEM: "That wares entry is unknown.",
  VALIDATION: "That request could not be understood.",
  NO_CITY: "That settlement could not be found.",
  NO_REPORT: "That report could not be found.",
  MARCH_FAIL: "The march could not be launched. Your army may have changed since you opened this panel.",
  EXPEDITION_FAIL: "The expedition cannot set out yet — every readiness requirement must be met first.",
  EXPEDITION_REQ: "The expedition is not ready for that stage yet — its requirements are not all met.",
  DEV_DISABLED: "That shortcut is disabled on this realm.",
  SLOT_BUSY_CONSTRUCTION: "Construction is already under way on that plot.",
  BUILD_FAIL: "The construction could not be queued.",
  TRAIN_FAIL: "The training could not be queued.",
  RESEARCH_FAIL: "The research could not be queued.",
  POSTURE_COOLDOWN: "Your stewards need a moment between posture changes.",
};

/**
 * Translate a server error into player language. Raw code + message go to
 * the console for diagnostics (dev surfaces may still show them).
 */
export function translateError(e: unknown): string {
  const raw =
    e instanceof Error
      ? e.message
      : typeof e === "string"
        ? e
        : String((e as { message?: string })?.message ?? e);
  const code =
    e instanceof Error
      ? ((e as { code?: string }).code ?? inferCode(raw))
      : inferCode(raw);
  console.warn(`[dragonwake] action failed (${code ?? "unknown"}): ${raw}`);
  if (code && ERROR_COPY[code]) return ERROR_COPY[code];
  if (code === "EXPEDITION_REQ") {
    // The raw message carries useful per-counter progress; keep the numbers.
    const detail = /\((.*)\)/.exec(raw)?.[1];
    return `The expedition is not ready for that stage yet${
      detail ? ` — ${detail.replace(/[()]/g, "").replace(/;/g, " · ")}` : "."
    }`;
  }
  // Cost/supply errors carry useful numbers — keep them, lightly cleaned.
  if (code === "NO_RES" || code === "RESEARCH_COST" || code === "RECRUIT_COST") {
    return raw.replace(/^cannot afford /, "").replace(/;/g, " · ") || "Not enough resources.";
  }
  return raw || "That could not be done.";
}

function inferCode(message: string): string | undefined {
  const m = /code[: ]+([A-Z_]+)/.exec(message);
  return m?.[1];
}

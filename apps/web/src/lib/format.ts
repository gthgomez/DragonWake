import type { BattleReport, QueueJob, Resources, UnitDef } from "./types";

export function fmtEta(ms: number): string {
  if (ms <= 0) return "ready";
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

export function fmtTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

/** Whole-number display with light thousands separators. */
export function fmtNum(n: number | undefined | null): string {
  const v = Math.floor(Number(n ?? 0));
  return v.toLocaleString("en-US");
}

export function canAfford(res: Resources, cost: Partial<Resources>): boolean {
  return (Object.keys(cost) as (keyof Resources)[]).every(
    (k) => (res[k] ?? 0) >= (cost[k] ?? 0),
  );
}

export function unitTrainCost(u: UnitDef, count: number): Partial<Resources> {
  return {
    food: (u.cost_food ?? 0) * count,
    timber: (u.cost_timber ?? 0) * count,
    stone: (u.cost_stone ?? 0) * count,
    iron: (u.cost_iron ?? 0) * count,
    coin: (u.cost_coin ?? 0) * count,
  };
}

export function jobLabel(job: QueueJob): string {
  if (job.kind === "build") return `Build ${String(job.payload.buildingType)}`;
  if (job.kind === "research") return `Research ${String(job.payload.techId)}`;
  if (job.kind === "train") {
    return `Train ${job.payload.count}× ${String(job.payload.unitId)}`;
  }
  return job.kind;
}

export function lossList(map?: Record<string, number>): string {
  if (!map) return "—";
  const parts = Object.entries(map)
    .filter(([, n]) => n > 0)
    .map(([k, v]) => `${v} ${k}`);
  return parts.length ? parts.join(", ") : "none";
}

export function lootList(loot?: Partial<Resources>): string {
  if (!loot) return "—";
  const parts = Object.entries(loot)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([k, v]) => `+${v} ${k}`);
  return parts.length ? parts.join(", ") : "none";
}

export function postureLabel(posture?: string, harborLoot?: boolean): string {
  if (harborLoot) return "Withdraw (free loot — no wall fight)";
  if (posture === "full") return "Full defense (stacks fought)";
  if (posture === "garrison") return "Garrison (only garrisoned troops fight)";
  if (posture === "withdraw") return "Withdraw";
  return harborLoot === false ? "Fought (not withdraw loot)" : "—";
}

export function formatIntel(intel: BattleReport["result"]["intel"]): string {
  if (!intel) return "";
  if (typeof intel === "string") return intel;
  const kind = String(intel.kind ?? "intel");
  if (kind === "camp") {
    return `Camp L${intel.level} · threat ${intel.threatBand}${
      intel.exampleComp ? ` · ~${intel.exampleComp}` : ""
    }`;
  }
  if (kind === "city") {
    return `City ${intel.cityName ?? ""} · ${intel.ownerName ?? "?"} · posture ${
      intel.defensePosture ?? "?"
    } · troops ${intel.troopBand ?? "?"}${
      intel.protected ? " · protected" : ""
    }`;
  }
  if (kind === "wilderness") {
    return `Wild ${intel.resourceType} L${intel.level}${
      intel.ownerName ? ` · owner ${intel.ownerName}` : " · unclaimed"
    }`;
  }
  return JSON.stringify(intel);
}

export function reportHeadline(r: BattleReport, youId: string): string {
  const t = r.result?.type ?? "battle";
  if (t === "pvp_blocked") return "PvP blocked (protection)";
  if (t === "scout") return "Scout report";
  if (t === "haul")
    return r.result?.delivered ? "Haul delivered" : "Haul bounced";
  if (t === "pvp") {
    return r.result?.harborLoot ? "Withdraw raid" : "Full defense PvP";
  }
  if (t === "attack") return "Camp attack";
  if (t === "occupy") return "Occupy wilderness";
  const youAtk = r.attackerPlayerId === youId;
  return youAtk ? `${t} (you attacked)` : `${t} (incoming)`;
}

export function plotLabel(id: string | null): string {
  if (!id) return "empty";
  return id
    .split("_")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}
